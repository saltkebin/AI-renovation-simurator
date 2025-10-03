const {setGlobalOptions} = require("firebase-functions");
const {onCall} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const axios = require("axios");
const {SecretManagerServiceClient} = require("@google-cloud/secret-manager");
const {GoogleGenAI, Modality, Type} = require("@google/genai");

admin.initializeApp();

const secretClient = new SecretManagerServiceClient();

setGlobalOptions({maxInstances: 10});

/**
 * Get Gemini API key from Secret Manager
 */
async function getGeminiApiKey() {
  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
  const secretName = `projects/${projectId}/secrets/GEMINI_API_KEY/versions/latest`;

  try {
    const [version] = await secretClient.accessSecretVersion({name: secretName});
    const apiKey = version.payload.data.toString("utf8");
    logger.info("Successfully retrieved Gemini API key from Secret Manager");
    return apiKey;
  } catch (error) {
    logger.error("Failed to retrieve Gemini API key from Secret Manager", error);
    throw new Error("Gemini APIキーの取得に失敗しました。Secret Managerの設定を確認してください。");
  }
}

/**
 * Get Gemini AI client instance
 */
async function getGeminiClient() {
  const apiKey = await getGeminiApiKey();
  return new GoogleGenAI({apiKey});
}

/**
 * Generate HTML content for PDF quotation
 */
function generateQuotationHTML(quotation, tenantSettings) {
  const formatCurrency = (amount) => `¥${amount.toLocaleString("ja-JP")}`;
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const currentDate = formatDate(new Date());

  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          font-family: 'Yu Gothic', 'Meiryo', 'MS PGothic', sans-serif;
        }
        body {
          margin: 0;
          padding: 20px;
          font-size: 12px;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .company-info {
          text-align: right;
          font-size: 10px;
        }
        .customer-info {
          margin-bottom: 20px;
        }
        .customer-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .total-amount {
          background-color: #f0f0f0;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .total-label {
          font-size: 14px;
          font-weight: bold;
        }
        .total-value {
          font-size: 20px;
          font-weight: bold;
          color: #2563eb;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #e5e7eb;
          padding: 10px;
          text-align: center;
          border: 1px solid #d1d5db;
          font-weight: bold;
        }
        td {
          padding: 8px;
          border: 1px solid #d1d5db;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .totals-table {
          width: 50%;
          margin-left: auto;
          margin-top: 20px;
        }
        .totals-table td {
          border: none;
          padding: 5px 10px;
        }
        .totals-table .label {
          text-align: right;
          font-weight: bold;
        }
        .totals-table .value {
          text-align: right;
        }
        .grand-total {
          font-size: 16px;
          font-weight: bold;
          border-top: 2px solid #000;
        }
        .notes {
          margin-top: 30px;
          padding: 15px;
          background-color: #fef3c7;
          border-radius: 5px;
        }
        .notes-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">御見積書</div>
      </div>

      <div class="info-section">
        <div class="date">${currentDate}</div>
        ${tenantSettings ? `
          <div class="company-info">
            ${tenantSettings.companyInfo.logo ? `
              <div style="margin-bottom: 10px;">
                <img src="${tenantSettings.companyInfo.logo}" alt="Company Logo" style="height: 40px; width: auto; object-fit: contain;" />
              </div>
            ` : ""}
            <div>${tenantSettings.companyInfo.name}</div>
            <div>〒${tenantSettings.companyInfo.postalCode}</div>
            <div>${tenantSettings.companyInfo.address}</div>
            <div>TEL: ${tenantSettings.companyInfo.tel}</div>
            ${tenantSettings.companyInfo.fax ? `<div>FAX: ${tenantSettings.companyInfo.fax}</div>` : ""}
            <div>Email: ${tenantSettings.companyInfo.email}</div>
          </div>
        ` : ""}
      </div>

      <div class="customer-info">
        <div class="customer-name">${quotation.customerInfo.name} 様</div>
        ${quotation.customerInfo.address ? `<div>${quotation.customerInfo.address}</div>` : ""}
        ${quotation.customerInfo.propertyInfo ? `<div>物件情報: ${quotation.customerInfo.propertyInfo}</div>` : ""}
      </div>

      <div class="total-amount">
        <span class="total-label">御見積金額</span>
        <span class="total-value">${formatCurrency(quotation.total)}</span>
        <span style="font-size: 12px;">（消費税込）</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>項目</th>
            <th>内容</th>
            <th>数量</th>
            <th>単位</th>
            <th>単価</th>
            <th>金額</th>
          </tr>
        </thead>
        <tbody>
          ${quotation.items.map((item) => `
            <tr>
              <td class="text-center">${item.category}</td>
              <td>${item.description}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-center">${item.unit}</td>
              <td class="text-right">${formatCurrency(item.unitPrice)}</td>
              <td class="text-right">${formatCurrency(item.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <table class="totals-table">
        <tr>
          <td class="label">小計</td>
          <td class="value">${formatCurrency(quotation.subtotal)}</td>
        </tr>
        <tr>
          <td class="label">消費税</td>
          <td class="value">${formatCurrency(quotation.tax)}</td>
        </tr>
        <tr class="grand-total">
          <td class="label">合計</td>
          <td class="value">${formatCurrency(quotation.total)}</td>
        </tr>
      </table>

      ${quotation.notes ? `
        <div class="notes">
          <div class="notes-title">備考</div>
          <div>${quotation.notes}</div>
        </div>
      ` : ""}
    </body>
    </html>
  `
}

/**
 * Generate PDF from quotation data
 * Callable function that can be invoked from client
 */
exports.generateQuotationPDF = onCall({
  memory: "1GiB",
  timeoutSeconds: 60,
  cors: true,
  invoker: 'public',
}, async (request) => {
  try {
    const {quotation, tenantSettings} = request.data;

    logger.info("Generating PDF for quotation", {quotationId: quotation.id});

    // Generate HTML
    const htmlContent = generateQuotationHTML(quotation, tenantSettings);

    // Launch Puppeteer with Chromium
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set content and generate PDF
    await page.setContent(htmlContent, {waitUntil: "networkidle0"});

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    await browser.close();

    // Convert buffer to base64 string
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    logger.info("PDF generated successfully", {
      pdfSize: pdfBuffer.length,
      base64Length: pdfBase64.length,
    });

    return {
      success: true,
      pdfBase64: String(pdfBase64), // Ensure it's a string
    };
  } catch (error) {
    logger.error("Error generating PDF", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
});

/**
 * Verifies a SendGrid API key by making a test request.
 */
exports.verifySendGridApiKey = onCall({
  cors: true,
  invoker: 'public',
}, async (request) => {
  const { apiKey } = request.data;

  if (!apiKey) {
    logger.error("API Key is required for verification.");
    throw new onCall.HttpsError(
      "invalid-argument",
      "The function must be called with one argument 'apiKey'.",
    );
  }

  logger.info("Verifying SendGrid API key...");

  try {
    // Make a test request to a simple SendGrid endpoint
    await axios.get("https://api.sendgrid.com/v3/scopes", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    logger.info("SendGrid API key is valid.");
    return { success: true };
  } catch (error) {
    logger.error("SendGrid API key verification failed.", error.response?.data);
    if (error.response && error.response.status === 401) {
      return { success: false, error: "無効なAPIキーです。" };
    }
    return { success: false, error: "APIキーの検証中にエラーが発生しました。" };
  }
});

/**
 * Sends a quotation email using the tenant's specific SendGrid API key.
 */
exports.sendQuotationEmail = onCall({
  memory: "1GiB",
  cors: true,
  invoker: 'public',
}, async (request) => {
  const { tenantId, to, subject, body, attachmentUrl, quotationId } = request.data;

  logger.info(`Starting email send process for tenant: ${tenantId}`);

  if (!tenantId || !to || !subject || !body) {
    logger.error("Missing required arguments for sending email.");
    throw new onCall.HttpsError(
      "invalid-argument",
      "Missing required data for sending email.",
    );
  }

  try {
    // 1. Fetch tenant's email settings from Firestore
    const db = admin.firestore();
    const settingsQuery = await db.collection("tenantEmailSettings")
        .where("tenantId", "==", tenantId).limit(1).get();

    if (settingsQuery.empty) {
      logger.error(`No email settings found for tenant: ${tenantId}`);
      throw new Error("メール設定が見つかりません。");
    }

    const emailSettings = settingsQuery.docs[0].data();
    const { sendgridApiKey, senderEmail, senderName, isVerified } = emailSettings;

    if (!sendgridApiKey || !isVerified) {
      logger.error(`API key for tenant ${tenantId} is missing or not verified.`);
      throw new Error("SendGrid APIキーが設定されていないか、検証されていません。");
    }

    // 2. Initialize SendGrid Mail service with the tenant's API key
    sgMail.setApiKey(sendgridApiKey);

    const msg = {
      to: to,
      from: {
        email: senderEmail,
        name: senderName || "AIリノベーションシステム",
      },
      subject: subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
      attachments: [],
    };

    // 3. Fetch and add attachment if URL is provided
    if (attachmentUrl) {
      logger.info(`Fetching attachment from: ${attachmentUrl}`);
      const response = await axios.get(attachmentUrl, { responseType: 'arraybuffer' });
      const pdfBuffer = Buffer.from(response.data);
      msg.attachments.push({
        content: pdfBuffer.toString("base64"),
        filename: `quotation_${quotationId || Date.now()}.pdf`,
        type: "application/pdf",
        disposition: "attachment",
      });
      logger.info("Successfully attached PDF.");
    }

    // 4. Send the email
    await sgMail.send(msg);
    logger.info(`Email successfully sent to ${to} for tenant ${tenantId}`);

    // 5. (Optional) Update quotation status to 'sent'
    if (quotationId) {
        await db.collection("quotations").doc(quotationId).update({
            status: "sent",
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Updated quotation ${quotationId} status to 'sent'.`);
    }

    return { success: true };

  } catch (error) {
    logger.error(`Failed to send email for tenant ${tenantId}:`, error);
    const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
    throw new onCall.HttpsError("internal", errorMessage);
  }
});

/**
 * Call Gemini API for content generation (non-streaming)
 * Supports image generation, suggestions, quotations, etc.
 */
exports.callGeminiGenerate = onCall({
  memory: "1GiB",
  timeoutSeconds: 120,
  cors: true,
  invoker: 'public',
}, async (request) => {
  try {
    const {model, contents, config} = request.data;

    if (!model || !contents) {
      throw new onCall.HttpsError(
        "invalid-argument",
        "model and contents are required",
      );
    }

    logger.info("Calling Gemini API", {model, hasConfig: !!config});

    const ai = await getGeminiClient();

    const response = await ai.models.generateContent({
      model,
      contents,
      config: config || {},
    });

    logger.info("Gemini API call successful");

    // Return the full response structure
    return {
      candidates: response.candidates,
      promptFeedback: response.promptFeedback,
      text: response.text,
      usageMetadata: response.usageMetadata,
    };
  } catch (error) {
    logger.error("Gemini API call failed", error);
    const errorMessage = error.message || "Gemini APIの呼び出しに失敗しました";
    throw new onCall.HttpsError("internal", errorMessage);
  }
});

/**
 * Call Gemini API for streaming chat responses
 */
exports.callGeminiStream = onCall({
  memory: "512MiB",
  timeoutSeconds: 120,
  cors: true,
  invoker: 'public',
}, async (request) => {
  try {
    const {model, contents, config} = request.data;

    if (!model || !contents) {
      throw new onCall.HttpsError(
        "invalid-argument",
        "model and contents are required",
      );
    }

    logger.info("Calling Gemini streaming API", {model});

    const ai = await getGeminiClient();

    const response = await ai.models.generateContentStream({
      model,
      contents,
      config: config || {},
    });

    // Collect all chunks into a single response
    const chunks = [];
    for await (const chunk of response) {
      if (chunk.text) {
        chunks.push(chunk.text);
      }
    }

    const fullText = chunks.join("");
    logger.info("Gemini streaming API call successful", {
      chunkCount: chunks.length,
      textLength: fullText.length,
    });

    // Return the aggregated text
    // Note: For true streaming, client should use Server-Sent Events or WebSocket
    // This simplified version returns the complete text
    return {
      text: fullText,
      chunks: chunks,
    };
  } catch (error) {
    logger.error("Gemini streaming API call failed", error);
    const errorMessage = error.message || "Gemini APIのストリーミング呼び出しに失敗しました";
    throw new onCall.HttpsError("internal", errorMessage);
  }
});