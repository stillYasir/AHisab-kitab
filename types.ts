export interface User {
  username: string;
  // In a real app, never store passwords in plain text. 
  // For this local-only demo, we mock it.
  password?: string; 
}

export interface InvoiceItem {
  id: string;
  itemName: string;
  qty: number | '';
  rate: number | ''; // Retail Price
  discountPercent: number | ''; // +/- %
  // Calculated fields
  tp: number; // Trade Price
  totalPricePerPiece: number;
  rowTotal: number;
}

export interface PaidAmount {
  id: string;
  narration: string;
  amount: number | '';
}

export type InvoiceStatus = 'Paid' | 'Pending';

export interface Invoice {
  id: string;
  userId: string;
  name: string;
  date: string; // ISO String or YYYY-MM-DD
  items: InvoiceItem[];
  paidAmounts: PaidAmount[];
  status: InvoiceStatus;
  
  // Aggregates
  grandTotal: number;
  totalPaid: number;
  balance: number;
  
  createdAt: number;
  updatedAt: number;
}
