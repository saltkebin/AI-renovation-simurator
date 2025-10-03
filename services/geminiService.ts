
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { QuotationResult, RegisteredProduct } from '../types';


if (!import.meta.env.VITE_GEMINI_API_KEY) {
  console.error("VITE_GEMINI_API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

interface RenovationResult {
  image: string | null;
  text: string | null;
  mimeType: string | null;
}

export const generateRenovationImage = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  aspectRatio: string,
  requestDescription: boolean = false
): Promise<RenovationResult> => {
  try {
    let finalPrompt = `提供された画像の構図、画角、アスペクト比（約 ${aspectRatio}）を完全に維持したまま、画像全体を以下の指示に従って編集してください。画像の一部だけを切り取ったり、部分的に変更したりすることは絶対に避けてください。編集後の画像のみを返してください。テキストによる返答は一切不要です。指示： ${prompt}`;
    
    if (requestDescription) {
        finalPrompt = `提供された画像の構図、画角、アスペクト比（約 ${aspectRatio}）を完全に維持したまま、画像全体を以下の指示に従って編集してください。画像の一部だけを切り取ったり、部分的に変更したりすることは絶対に避けてください。そして、どのようなコンセプトでリノベーションしたのか、その理由やポイントを150文字程度の短い日本語で説明してください。編集後の画像と、説明文の両方を返してください。指示： ${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      const blockReason = response.promptFeedback?.blockReason;
      if (blockReason) {
        throw new Error(`リクエストが安全上の理由でブロックされました (${blockReason})。プロンプトや画像を変更して再度お試しください。`);
      }
      throw new Error("APIから有効な応答がありませんでした。");
    }

    const candidate = response.candidates[0];

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`画像の生成が完了しませんでした。理由: ${candidate.finishReason}`);
    }

    const result: RenovationResult = { image: null, text: null, mimeType: null };

    if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
              result.image = part.inlineData.data;
              result.mimeType = part.inlineData.mimeType;
            } else if (part.text) {
              result.text = part.text;
            }
        }
    }
    
    if (!result.image) {
        const refusalText = result.text 
            ? `AIの応答: 「${result.text}」` 
            : "応答に画像データが含まれていませんでした。";
        throw new Error(`画像が生成されませんでした。${refusalText} プロンプトをより具体的に変更すると解決する場合があります。`);
    }

    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`予期せぬエラーが発生しました: ${String(error)}`);
  }
};

/**
 * Processes a product image to fit within target dimensions while maintaining aspect ratio.
 * The image is centered on a transparent canvas of the target size.
 * @param productSrc The source of the product image (data URL).
 * @param targetWidth The width of the target canvas.
 * @param targetHeight The height of the target canvas.
 * @returns A promise that resolves with the base64 data and mime type of the processed image.
 */
const processProductImage = async (
    productSrc: string,
    targetWidth: number,
    targetHeight: number
): Promise<{ data: string, mimeType: string }> => {
    console.log("Processing product image:", productSrc);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Enable CORS for Firebase Storage

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    throw new Error('Failed to get canvas context');
                }

                // Clear canvas with transparent background
                ctx.clearRect(0, 0, targetWidth, targetHeight);

                // Calculate scaling to fit image within target dimensions while maintaining aspect ratio
                const imgAspectRatio = img.naturalWidth / img.naturalHeight;
                const targetAspectRatio = targetWidth / targetHeight;

                let drawWidth, drawHeight, offsetX, offsetY;

                if (imgAspectRatio > targetAspectRatio) {
                    // Image is wider than target - fit by width
                    drawWidth = targetWidth;
                    drawHeight = targetWidth / imgAspectRatio;
                    offsetX = 0;
                    offsetY = (targetHeight - drawHeight) / 2;
                } else {
                    // Image is taller than target - fit by height
                    drawHeight = targetHeight;
                    drawWidth = targetHeight * imgAspectRatio;
                    offsetX = (targetWidth - drawWidth) / 2;
                    offsetY = 0;
                }

                // Draw the image centered on the canvas
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

                const dataUrl = canvas.toDataURL('image/png');
                const mimeType = 'image/png';
                const data = dataUrl.split(',')[1];

                console.log("Successfully processed product image");
                resolve({ data: data!, mimeType });
            } catch (error) {
                console.error("Error processing image on canvas:", error);
                reject(error);
            }
        };

        img.onerror = (error) => {
            console.error("Failed to load product image:", error);
            reject(new Error(`Failed to load product image: ${productSrc}`));
        };

        img.src = productSrc;
    });
};

export const generateRenovationWithProducts = async (
  base64ImageData: string,
  mimeType: string,
  products: RegisteredProduct[],
  prompt: string,
  aspectRatio: string,
): Promise<RenovationResult> => {
    try {
        // Build paint product information if available
        let paintProductInfo = '';
        products.forEach((product: any, index) => {
            if (product.manufacturer || product.productName || product.color || product.colorCode) {
                paintProductInfo += `\n\n【商品${index + 1}の詳細情報】`;
                if (product.manufacturer) paintProductInfo += `\nメーカー: ${product.manufacturer}`;
                if (product.productName) paintProductInfo += `\n商品名: ${product.productName}`;
                if (product.color) paintProductInfo += `\n色名: ${product.color}`;
                if (product.colorCode) paintProductInfo += `\nカラーコード: ${product.colorCode}`;
                if (product.grade) {
                    const gradeNames: Record<string, string> = {
                        silicon: 'シリコン塗料',
                        fluorine: 'フッ素塗料',
                        inorganic: '無機塗料',
                        heat_shield: '遮熱塗料',
                        other: 'その他塗料'
                    };
                    paintProductInfo += `\n塗料グレード: ${gradeNames[product.grade] || product.grade}`;
                }
                if (product.description) paintProductInfo += `\n説明: ${product.description}`;
            }
        });

        const finalPrompt = `**最重要指示：** 生成する画像のサイズとアスペクト比は、必ず**1枚目の入力画像（部屋の画像）**と完全に一致させてください。1枚目の画像のアスペクト比は約${aspectRatio}です。2枚目以降の画像（商品の画像）の寸法は、出力画像の寸法に一切影響させてはなりません。このルールは、他のいかなる指示よりも優先されます。

あなたはプロのインテリアデザイナーです。
1枚目の「部屋の画像」を、2枚目以降の「商品の画像」と、以下の「テキスト指示」を使って編集してください。

【守るべきこと】
- 部屋の基本的な構造（壁、窓、天井など）、構図、画角は変更しないでください。
- 編集後の画像のみを返してください。テキストによる返答は一切不要です。
${paintProductInfo}

【テキスト指示】
${prompt}`;

        // Get dimensions of the original room image
        const roomImage = new Image();
        const loadImagePromise = new Promise<void>((resolve, reject) => {
            roomImage.onload = () => resolve();
            roomImage.onerror = reject;
            roomImage.src = `data:${mimeType};base64,${base64ImageData}`;
        });
        await loadImagePromise;
        const targetWidth = roomImage.naturalWidth;
        const targetHeight = roomImage.naturalHeight;

        // Process all product images to match the room image's aspect ratio
        console.log(`Processing ${products.length} product images...`);
        const processedProductParts = await Promise.all(
            products.map(async (product, index) => {
                console.log(`Processing product ${index + 1}/${products.length}:`, product.src);
                const processed = await processProductImage(product.src, targetWidth, targetHeight);
                console.log(`Product ${index + 1} processed successfully`);
                return {
                    inlineData: {
                        data: processed.data,
                        mimeType: processed.mimeType,
                    }
                };
            })
        );
        console.log("All product images processed, calling Gemini API...");

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    ...processedProductParts,
                    {
                        text: finalPrompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        console.log("Gemini API response received:", {
            hasCandidates: !!response.candidates,
            candidatesLength: response.candidates?.length || 0,
            promptFeedback: response.promptFeedback
        });

        if (!response.candidates || response.candidates.length === 0) {
            const blockReason = response.promptFeedback?.blockReason;
            console.error("No candidates in response. Block reason:", blockReason);
            if (blockReason) {
                throw new Error(`リクエストが安全上の理由でブロックされました (${blockReason})。プロンプトや画像を変更して再度お試しください。`);
            }
            throw new Error("APIから有効な応答がありませんでした。");
        }

        const candidate = response.candidates[0];

        console.log("Candidate details:", {
            finishReason: candidate.finishReason,
            hasContent: !!candidate.content,
            partsLength: candidate.content?.parts?.length || 0
        });

        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            console.error("Generation did not complete. Finish reason:", candidate.finishReason);
            throw new Error(`画像の生成が完了しませんでした。理由: ${candidate.finishReason}`);
        }

        const result: RenovationResult = { image: null, text: null, mimeType: null };

        if (candidate.content && candidate.content.parts) {
            console.log("Processing candidate parts...");
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    console.log("Found image data in response");
                    result.image = part.inlineData.data;
                    result.mimeType = part.inlineData.mimeType;
                } else if (part.text) {
                    console.log("Found text in response:", part.text);
                    result.text = part.text;
                }
            }
        } else {
            console.error("No content or parts in candidate");
        }
        
        if (!result.image) {
            const refusalText = result.text 
                ? `AIの応答: 「${result.text}」` 
                : "応答に画像データが含まれていませんでした。";
            throw new Error(`画像が生成されませんでした。${refusalText} プロンプトをより具体的に変更すると解決する場合があります。`);
        }

        return result;

    } catch (error) {
        console.error("Error calling Gemini API with products:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`商品を使った画像生成中に予期せぬエラーが発生しました: ${String(error)}`);
    }
};

export const generateArchFromSketch = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
): Promise<RenovationResult> => {
  try {
    const finalPrompt = `これは建築デザインのスケッチ画像です。このスケッチを元に、以下の指示に従って、フォトリアルな完成予想パース画像を生成してください。スケッチに描かれている構図、画角、アングルを完全に維持し、画像全体を完成予想図にしてください。基本的な部屋の構造や家具の配置も忠実に再現してください。画像の一部だけを切り取ったり、部分的に変更したりすることは絶対に避けてください。生成するのはパース画像のみとし、テキストによる返答は一切不要です。指示： ${prompt}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    if (!response.candidates || response.candidates.length === 0) {
      const blockReason = response.promptFeedback?.blockReason;
      if (blockReason) {
        throw new Error(`リクエストが安全上の理由でブロックされました (${blockReason})。プロンプトや画像を変更して再度お試しください。`);
      }
      throw new Error("APIから有効な応答がありませんでした。");
    }

    const candidate = response.candidates[0];

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`画像の生成が完了しませんでした。理由: ${candidate.finishReason}`);
    }

    const result: RenovationResult = { image: null, text: null, mimeType: null };

    if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
              result.image = part.inlineData.data;
              result.mimeType = part.inlineData.mimeType;
            } else if (part.text) {
              result.text = part.text; // Should be rare, but handle it.
            }
        }
    }
    
    if (!result.image) {
        const refusalText = result.text 
            ? `AIの応答: 「${result.text}」` 
            : "応答に画像データが含まれていませんでした。";
        throw new Error(`画像が生成されませんでした。${refusalText} プロンプトをより具体的に変更すると解決する場合があります。`);
    }

    return result;

  } catch (error) {
    console.error("Error calling Gemini API for sketch to arch:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`スケッチからのパース生成中に予期せぬエラーが発生しました: ${String(error)}`);
  }
};

export const generateSuggestions = async (
  base64ImageData: string,
  mimeType: string,
  mode: 'initial' | 'finetune' | 'furniture' | 'person' | 'sketch' | 'sketch_person',
  options?: { style?: string; roomType?: string; }
): Promise<string[]> => {
  try {
    let prompt: string;
    switch (mode) {
      case 'sketch':
        prompt = `あなたはプロの建築家です。このスケッチ画像を見て、どのような完成予想パースを作成できるか、具体的な指示やスタイルのアイデアを3つ、簡潔な日本語の文章で提案してください。例えば、「ナチュラルモダンなスタイルで、大きな窓から光が差し込むリビングにする」「インダストリアルデザインで、コンクリートと古材を組み合わせる」などです。それぞれの提案は、ユーザーがそのまま画像生成プロンプトとして使えるようにしてください。回答は {"suggestions": ["提案1", "提案2", "提案3"]} という形式のJSONオブジェクトで返してください。`;
        break;
      case 'finetune':
        prompt = `あなたはプロのレタッチャーです。この画像を見て、品質を向上させるための具体的な修正案を3つ、簡潔な日本語の文章で作成してください。例えば、「全体をもう少し明るくする」「窓からの光を強調する」「色合いを暖色系にする」などです。それぞれの提案は、ユーザーがそのまま画像生成プロンプトとして使えるようにしてください。回答は {"suggestions": ["提案1", "提案2", "提案3"]} という形式のJSONオブジェクトで返してください。`;
        break;
      case 'furniture':
        const style = options?.style;
        const roomType = options?.roomType;
        let context = '';
        if (style && roomType) {
            context = `「${style}」スタイルで、「${roomType}」として使用することを想定し、`;
        } else if (style) {
            context = `「${style}」スタイルをテーマに、`;
        } else if (roomType) {
            context = `「${roomType}」として使用することを想定し、`;
        }
        prompt = `あなたはプロのインテリアコーディネーターです。この部屋の構造（壁、床、天井、窓など）や、既存の家具の大部分は変更しないという前提で、${context}この部屋に新しい家具を1つ追加するか、既存の家具を1つ削除する具体的なアイデアを3つ、必ず日本語で提案してください。例えば、「窓際に観葉植物を追加する」「中央のテーブルを削除する」のように、単一の追加または削除の操作にしてください。それぞれの提案は、ユーザーがそのまま画像生成プロンプトとして使えるように、簡潔な指示の文章にしてください。回答は {"suggestions": ["提案1", "提案2", "提案3"]} という形式のJSONオブジェクトで返してください。`;
        break;
      case 'person':
        prompt = `あなたはプロの空間演出家です。この部屋の画像を見て、生活感を演出するために「日本人」の人物を追加する、あるいは不要な人物を削除する具体的なアイデアを3つ、必ず日本語で提案してください。例えば、「ソファで本を読む日本人女性を追加する」「窓際に立つ男性を削除する」のように、単一の操作にしてください。それぞれの提案は、ユーザーがそのまま画像生成プロンプトとして使えるように、簡潔な指示の文章にしてください。回答は {"suggestions": ["提案1", "提案2", "提案3"]} という形式のJSONオブジェクトで返してください。`;
        break;
      case 'sketch_person':
        prompt = `あなたはプロの空間演出家です。この完成予想パース画像を見て、生活感を演出するために「日本人」の人物を追加する、あるいは不要な人物を削除する具体的なアイデアを3つ、必ず日本語で提案してください。例えば、「ソファで本を読む日本人女性を追加する」「窓際に立つ男性を削除する」のように、単一の操作にしてください。それぞれの提案は、ユーザーがそのまま画像生成プロンプトとして使えるように、簡潔な指示の文章にしてください。回答は {"suggestions": ["提案1", "提案2", "提案3"]} という形式のJSONオブジェクトで返してください。`;
        break;
      case 'initial':
      default:
        prompt = `あなたはプロのインテリアデザイナーです。この部屋の画像を見て、改善のための具体的なリノベーション提案を3つ、簡潔な日本語の文章で作成してください。それぞれの提案は、ユーザーがそのまま画像生成プロンプトとして使えるようにしてください。回答は {"suggestions": ["提案1", "提案2", "提案3"]} という形式のJSONオブジェクトで返してください。`;
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: 'A renovation suggestion prompt.'
              },
              description: 'An array of three renovation suggestions.'
            }
          },
          required: ['suggestions']
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (result && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
      return result.suggestions.slice(0, 3);
    }

    throw new Error("API did not return valid suggestions in the expected format.");

  } catch (error) {
    console.error("Error calling Gemini API for suggestions:", error);
    throw new Error(`Gemini API request failed for suggestions: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateQuotation = async (
  originalImageBase64: string,
  generatedImageBase64: string,
  mimeType: string,
  floorMaterial: string,
  wallMaterial: string,
  casingMaterial: string,
): Promise<QuotationResult> => {
    try {
        const prompt = `あなたはプロのリフォーム費用見積もり業者です。提供された「リフォーム前」と「リフォーム後」の2枚の画像を比較し、リフォームに必要な工事内容を推測してください。
さらに、ユーザーが指定した以下の素材情報を最優先で考慮に入れてください。

- 床材: ${floorMaterial || '指定なし'}
- 壁材: ${wallMaterial || '指定なし'}
- ケーシング（窓枠・ドア枠など）: ${casingMaterial || '指定なし'}

その上で、以下の項目を含む概算の見積もりをJSON形式で作成してください。

**最重要ルール:**
- 各工事項目は、必ず \`name\` と \`cost_range\` の2つのキーを持つオブジェクトにしてください。
- \`name\` キーには、**工事内容の説明のみ**を文字列として含めてください。**費用に関する情報は一切含めないでください。**
- \`cost_range\` キーには、**費用の範囲のみ**を文字列として含めてください。（例: "5万円〜8万円", "約10万円"）

【JSONの構造】
1.  construction_items: 工事項目のリスト。
    - name: string (工事内容)
    - cost_range: string (費用範囲)
2.  total_cost_range: 全体の費用の概算範囲（例：「30万円〜50万円」）。
3.  notes: 見積もりの前提条件や注意点。

上記のルールを厳守し、指定された構造のJSONオブジェクトのみを返してください。説明や前置きは一切不要です。`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: 'リフォーム前:' },
                    {
                        inlineData: {
                            data: originalImageBase64,
                            mimeType: mimeType,
                        },
                    },
                    { text: 'リフォーム後:' },
                    {
                        inlineData: {
                            data: generatedImageBase64,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        construction_items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    cost_range: { type: Type.STRING },
                                },
                                required: ['name', 'cost_range']
                            }
                        },
                        total_cost_range: { type: Type.STRING },
                        notes: { type: Type.STRING },
                    },
                    required: ['construction_items', 'total_cost_range', 'notes']
                },
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result && Array.isArray(result.construction_items) && result.total_cost_range && result.notes) {
            return result as QuotationResult;
        }

        throw new Error("API did not return a valid quotation in the expected format.");

    } catch (error) {
        console.error("Error calling Gemini API for quotation:", error);
        throw new Error(`Gemini API request failed for quotation: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const generateExteriorPaintingQuotation = async (
  originalImageBase64: string,
  generatedImageBase64: string,
  mimeType: string,
  wallArea?: string,
  paintType?: string,
  paintProduct?: any,
): Promise<QuotationResult> => {
    try {
        const areaInfo = wallArea ? `外壁面積: ${wallArea}㎡` : '外壁面積は画像から推定してください';

        let paintInfo = '';
        if (paintProduct && (paintProduct.manufacturer || paintProduct.productName || paintProduct.pricePerSqm)) {
            // Use paint product information if available
            paintInfo = '使用塗料の詳細情報:\n';
            if (paintProduct.manufacturer) paintInfo += `- メーカー: ${paintProduct.manufacturer}\n`;
            if (paintProduct.productName) paintInfo += `- 商品名: ${paintProduct.productName}\n`;
            if (paintProduct.color) paintInfo += `- 色: ${paintProduct.color}\n`;
            if (paintProduct.colorCode) paintInfo += `- カラーコード: ${paintProduct.colorCode}\n`;
            if (paintProduct.grade) {
                const gradeNames: Record<string, string> = {
                    silicon: 'シリコン塗料',
                    fluorine: 'フッ素塗料',
                    inorganic: '無機塗料',
                    heat_shield: '遮熱塗料',
                    other: 'その他塗料'
                };
                paintInfo += `- グレード: ${gradeNames[paintProduct.grade] || paintProduct.grade}\n`;
            }
            if (paintProduct.pricePerSqm) paintInfo += `- ㎡単価: ${paintProduct.pricePerSqm}円\n`;
            if (paintProduct.durability) paintInfo += `- 耐用年数: ${paintProduct.durability}年\n`;
            if (paintProduct.description) paintInfo += `- 説明: ${paintProduct.description}\n`;
            paintInfo += '\n**重要**: 上記の㎡単価と耐用年数を必ず見積もりに反映してください。';
        } else if (paintType && paintType !== 'ai_choice') {
            paintInfo = `塗料の種類: ${paintType}を使用する想定で見積もってください`;
        } else {
            paintInfo = '塗料の種類は、画像の劣化状況や予算感から最適なものを選択してください';
        }

        const prompt = `あなたはプロの外壁塗装業者です。提供された「変更前」と「変更後」の2枚の建物外観画像を比較し、外壁塗装工事に必要な工事内容を推測してください。

ユーザーが指定した情報:
- ${areaInfo}
- ${paintInfo}

その上で、以下の項目を含む概算の見積もりをJSON形式で作成してください。

**最重要ルール:**
- 各工事項目は、必ず \`name\` と \`cost_range\` の2つのキーを持つオブジェクトにしてください。
- \`name\` キーには、**工事内容の説明のみ**を文字列として含めてください。**費用に関する情報は一切含めないでください。**
- \`cost_range\` キーには、**費用の範囲のみ**を文字列として含めてください。（例: "5万円〜8万円", "約10万円"）

【工事項目の例】
1. 足場設置・養生（外周足場、メッシュシート養生）
2. 下地処理（高圧洗浄、ひび割れ補修、コーキング打ち替え）
3. 塗装工事（下塗り・中塗り・上塗り、使用塗料のグレードを考慮）
4. 付帯部塗装（雨樋、破風板、軒天等）
5. 廃材処分費・諸経費

【JSONの構造】
1. construction_items: 工事項目のリスト。
   - name: string (工事内容)
   - cost_range: string (費用範囲)
2. total_cost_range: 全体の費用の概算範囲（例：「80万円〜110万円」）。
3. notes: 見積もりの前提条件や注意点（建物の階数、外壁の劣化状況、使用塗料のグレード等を含める）。

上記のルールを厳守し、指定された構造のJSONオブジェクトのみを返してください。説明や前置きは一切不要です。`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: '変更前:' },
                    {
                        inlineData: {
                            data: originalImageBase64,
                            mimeType: mimeType,
                        },
                    },
                    { text: '変更後（塗装イメージ）:' },
                    {
                        inlineData: {
                            data: generatedImageBase64,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        construction_items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    cost_range: { type: Type.STRING },
                                },
                                required: ['name', 'cost_range']
                            }
                        },
                        total_cost_range: { type: Type.STRING },
                        notes: { type: Type.STRING },
                    },
                    required: ['construction_items', 'total_cost_range', 'notes']
                },
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (result && Array.isArray(result.construction_items) && result.total_cost_range && result.notes) {
            return result as QuotationResult;
        }

        throw new Error("API did not return a valid quotation in the expected format.");

    } catch (error) {
        console.error("Error calling Gemini API for exterior painting quotation:", error);
        throw new Error(`Gemini API request failed for exterior painting quotation: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Stream chat responses from Gemini AI
 */
export async function* streamChat(
  messages: Array<{ role: string; content: string }>,
  systemInstruction?: string
): AsyncGenerator<string, void, unknown> {
  try {
    const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const config: any = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash-exp',
      contents,
      config
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error in streamChat:", error);
    throw error;
  }
}
