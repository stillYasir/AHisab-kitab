import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '../types';

export const generateInvoicePDF = (invoice: Invoice) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(15, 23, 42); // slate-900 equivalent
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("Hisaab Kitaab", 14, 20);
  
  doc.setFontSize(10);
  doc.text("Medical Invoice", 14, 28);
  
  doc.text(`Date: ${invoice.date}`, 195, 20, { align: 'right' });
  doc.text(`Status: ${invoice.status}`, 195, 28, { align: 'right' });

  // Invoice Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text(`Invoice: ${invoice.name}`, 14, 50);

  // Items Table
  const tableHead = [['#', 'Item Name', 'Qty', 'Rate', 'Disc %', 'T.P', 'Total/Unit', 'Amount']];
  const tableBody = invoice.items.map((item, index) => [
    index + 1,
    item.itemName,
    item.qty,
    item.rate,
    item.discountPercent || '-',
    item.tp.toFixed(2),
    item.totalPricePerPiece.toFixed(2),
    item.rowTotal.toFixed(2)
  ]);

  autoTable(doc, {
    startY: 55,
    head: tableHead,
    body: tableBody,
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { top: 55 },
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;

  // Paid Amounts Table (if exists)
  if (invoice.paidAmounts.length > 0) {
    doc.setFontSize(12);
    doc.text("Paid History", 14, finalY);
    
    const paidHead = [['Narration', 'Amount']];
    const paidBody = invoice.paidAmounts.map(p => [
      p.narration,
      p.amount.toLocaleString()
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: paidHead,
      body: paidBody,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] },
      columnStyles: { 1: { halign: 'right' } }
    });
    
    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 10;
  }

  // Summary Box
  const summaryX = 120;
  doc.setFontSize(11);
  doc.text(`Grand Total:`, summaryX, finalY);
  doc.text(`Rs ${invoice.grandTotal.toLocaleString()}`, 195, finalY, { align: 'right' });
  
  finalY += 7;
  doc.text(`Total Paid:`, summaryX, finalY);
  doc.text(`Rs ${invoice.totalPaid.toLocaleString()}`, 195, finalY, { align: 'right' });
  
  finalY += 8;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Balance Due:`, summaryX, finalY);
  doc.text(`Rs ${invoice.balance.toLocaleString()}`, 195, finalY, { align: 'right' });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text('All Rights Reserved 2025 — Yasir', 105, 290, { align: 'center' });
  }

  doc.save(`${invoice.name.replace(/\s+/g, '_')}_invoice.pdf`);
};