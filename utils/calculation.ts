import { InvoiceItem } from '../types';

/**
 * Calculates a single row's derived values based on Rate, Qty and Discount/Charge logic.
 */
export const calculateRow = (
  rate: number | '', 
  qty: number | '', 
  discountPercent: number | ''
): Omit<InvoiceItem, 'id' | 'itemName' | 'rate' | 'qty' | 'discountPercent'> => {
  
  const numericRate = rate === '' ? 0 : rate;
  const numericQty = qty === '' ? 0 : qty;
  const numericDisc = discountPercent === '' ? 0 : discountPercent;

  let tp: number;
  let totalPricePerPiece: number;

  // Logic from prompt:
  // If discount cell is empty (0), do NOT apply any logic except base -14.5% T.P
  if (numericDisc === 0) {
    tp = numericRate * (1 - 0.145);
    totalPricePerPiece = tp;
  } else {
    // If user enters +/-%, logic:
    // First, T.P becomes exactly Rate – 15%
    const baseTp = numericRate * (1 - 0.15);
    tp = baseTp;

    // Then apply user-entered (+/- %) on this adjusted T.P
    // Example: +5% charge -> baseTp * (1 + 0.05)
    // Example: -5% discount -> baseTp * (1 - 0.05) -> Wait, logic says apply +/-. 
    // Mathematically: Result = Base * (1 + (Value/100)). 
    // If Value is -5, it becomes Base * 0.95. If Value is +5, it becomes Base * 1.05.
    
    totalPricePerPiece = baseTp * (1 + (numericDisc / 100));
  }

  const rowTotal = totalPricePerPiece * numericQty;

  return {
    tp: Number(tp.toFixed(2)),
    totalPricePerPiece: Number(totalPricePerPiece.toFixed(2)),
    rowTotal: Number(rowTotal.toFixed(2))
  };
};

export const calculateGrandTotal = (items: InvoiceItem[]) => {
  return items.reduce((acc, item) => acc + item.rowTotal, 0);
};