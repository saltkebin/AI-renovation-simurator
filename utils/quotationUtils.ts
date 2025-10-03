/**
 * Extract maximum price from cost range string
 * Examples:
 *   "5万円〜8万円" -> 80000
 *   "約10万円" -> 100000
 *   "50,000円〜80,000円" -> 80000
 *   "100万円" -> 1000000
 */
export const extractMaxPrice = (costRange: string): number => {
  // Remove all spaces
  const cleaned = costRange.replace(/\s+/g, '');

  // Pattern 1: Range with 〜 (e.g., "5万円〜8万円", "50,000円〜80,000円")
  const rangeMatch = cleaned.match(/([0-9,]+)(?:万)?円〜([0-9,]+)(万)?円/);
  if (rangeMatch) {
    const maxValue = parseFloat(rangeMatch[2].replace(/,/g, ''));
    const isManUnit = rangeMatch[3] === '万';
    return isManUnit ? maxValue * 10000 : maxValue;
  }

  // Pattern 2: Single value with "約" (e.g., "約10万円", "約50,000円")
  const approxMatch = cleaned.match(/約([0-9,]+)(万)?円/);
  if (approxMatch) {
    const value = parseFloat(approxMatch[1].replace(/,/g, ''));
    const isManUnit = approxMatch[2] === '万';
    return isManUnit ? value * 10000 : value;
  }

  // Pattern 3: Single value without "約" (e.g., "10万円", "50,000円")
  const singleMatch = cleaned.match(/([0-9,]+)(万)?円/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1].replace(/,/g, ''));
    const isManUnit = singleMatch[2] === '万';
    return isManUnit ? value * 10000 : value;
  }

  // Default: return 0 if no pattern matches
  console.warn('Could not extract price from:', costRange);
  return 0;
};

/**
 * Parse estimated quotation items and convert to formal quotation items
 */
export const convertEstimatedToFormalItems = (
  estimatedItems: Array<{ name: string; cost_range: string }>
) => {
  return estimatedItems.map((item, index) => {
    const unitPrice = extractMaxPrice(item.cost_range);
    const quantity = 1;
    const amount = quantity * unitPrice;

    return {
      id: `estimated-${Date.now()}-${index}`,
      category: '工事項目', // Default category
      description: item.name,
      quantity,
      unit: '式',
      unitPrice,
      amount,
    };
  });
};
