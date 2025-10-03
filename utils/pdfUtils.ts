import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import type { FormalQuotation, TenantQuotationSettings } from '../types';

/**
 * Download PDF quotation using Cloud Function
 */
export const downloadQuotationPDF = async (
  quotation: FormalQuotation,
  tenantSettings?: TenantQuotationSettings,
  filename?: string
): Promise<void> => {
  try {
    const generatePDF = httpsCallable(functions, 'generateQuotationPDF');

    // Call Cloud Function
    const result = await generatePDF({
      quotation,
      tenantSettings
    });

    const data = result.data as { success: boolean; pdfBase64: string | number[]; error?: string };

    console.log('Cloud Function response:', data);

    if (!data.success) {
      throw new Error(data.error || 'PDF generation failed');
    }

    if (!data.pdfBase64) {
      throw new Error('No PDF data received from Cloud Function');
    }

    // Handle both string and array formats
    let pdfBase64Str: string;
    if (Array.isArray(data.pdfBase64)) {
      // If it's an array of numbers, convert to Uint8Array then to base64
      const uint8Array = new Uint8Array(data.pdfBase64);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });

      // Download directly from blob
      const pdfFilename = filename
        ? `${filename}.pdf`
        : `quotation_${quotation.customerInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = pdfFilename;
      link.click();
      URL.revokeObjectURL(link.href);
      return;
    } else {
      pdfBase64Str = data.pdfBase64;
    }

    // Convert base64 to blob
    const byteCharacters = atob(pdfBase64Str);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // Download
    const pdfFilename = filename
      ? `${filename}.pdf`
      : `quotation_${quotation.customerInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = pdfFilename;
    link.click();
    URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw error;
  }
};

/**
 * Generate PDF as Blob for uploading to Firebase Storage
 */
export const generateQuotationPDFBlob = async (
  quotation: FormalQuotation,
  tenantSettings?: TenantQuotationSettings
): Promise<Blob> => {
  try {
    const generatePDF = httpsCallable(functions, 'generateQuotationPDF');

    // Call Cloud Function
    const result = await generatePDF({
      quotation,
      tenantSettings
    });

    const data = result.data as { success: boolean; pdfBase64: string | number[]; error?: string };

    if (!data.success) {
      throw new Error(data.error || 'PDF generation failed');
    }

    // Handle both string and array formats
    if (Array.isArray(data.pdfBase64)) {
      // If it's an array of numbers, convert directly to Uint8Array
      const uint8Array = new Uint8Array(data.pdfBase64);
      return new Blob([uint8Array], { type: 'application/pdf' });
    }

    // Convert base64 to blob
    const byteCharacters = atob(data.pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    return blob;

  } catch (error) {
    console.error('Failed to generate PDF blob:', error);
    throw error;
  }
};
