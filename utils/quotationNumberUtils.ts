import { db } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, runTransaction } from 'firebase/firestore';
import type { QuotationCounter } from '../types';

/**
 * Generate next quotation number for tenant and year
 * Format: YYYY-NNN (e.g., 2025-001, 2025-002)
 */
export const generateQuotationNumber = async (tenantId: string): Promise<string> => {
  const currentYear = new Date().getFullYear();

  try {
    // Use transaction to ensure atomic increment
    const quotationNumber = await runTransaction(db, async (transaction) => {
      // Query for existing counter
      const countersRef = collection(db, 'quotationCounters');
      const q = query(
        countersRef,
        where('tenantId', '==', tenantId),
        where('year', '==', currentYear)
      );

      const snapshot = await getDocs(q);

      let nextNumber: number;
      let counterDocRef;

      if (snapshot.empty) {
        // Create new counter for this year
        nextNumber = 1;
        const newCounterRef = doc(countersRef);
        transaction.set(newCounterRef, {
          tenantId,
          year: currentYear,
          lastNumber: nextNumber,
        });
      } else {
        // Increment existing counter
        const counterDoc = snapshot.docs[0];
        counterDocRef = counterDoc.ref;
        const counterData = counterDoc.data() as QuotationCounter;
        nextNumber = counterData.lastNumber + 1;

        transaction.update(counterDocRef, {
          lastNumber: nextNumber,
        });
      }

      // Format: YYYY-NNN (e.g., 2025-001)
      return `${currentYear}-${String(nextNumber).padStart(3, '0')}`;
    });

    return quotationNumber;

  } catch (error) {
    console.error('Failed to generate quotation number:', error);
    // Fallback to timestamp-based number
    const timestamp = Date.now();
    return `${currentYear}-T${timestamp}`;
  }
};

/**
 * Check if quotation number already exists
 */
export const isQuotationNumberExists = async (
  tenantId: string,
  quotationNumber: string
): Promise<boolean> => {
  try {
    const quotationsRef = collection(db, 'quotations');
    const q = query(
      quotationsRef,
      where('tenantId', '==', tenantId),
      where('quotationNumber', '==', quotationNumber)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;

  } catch (error) {
    console.error('Failed to check quotation number:', error);
    return false;
  }
};
