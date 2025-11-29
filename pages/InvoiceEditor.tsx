import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Download, ArrowLeft, Calculator } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { Invoice, InvoiceItem, PaidAmount } from '../types';
import { calculateRow } from '../utils/calculation';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const EmptyItem: InvoiceItem = {
  id: '',
  itemName: '',
  qty: '',
  rate: '',
  discountPercent: '',
  tp: 0,
  totalPricePerPiece: 0,
  rowTotal: 0
};

const InvoiceEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Metadata State
  const [invoiceName, setInvoiceName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Paid' | 'Pending'>('Pending');
  const [isSetup, setIsSetup] = useState(false); // If true, show table. If false, show setup modal.

  // Data State
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paidAmounts, setPaidAmounts] = useState<PaidAmount[]>([]);
  
  // Refs for navigation
  const inputsRef = useRef<(HTMLInputElement | null)[][]>([]);

  useEffect(() => {
    if (id && user) {
      const existing = storageService.getInvoiceById(id);
      if (existing && existing.userId === user.username) {
        setInvoiceName(existing.name);
        setInvoiceDate(existing.date);
        setStatus(existing.status);
        setItems(existing.items);
        setPaidAmounts(existing.paidAmounts);
        setIsSetup(true);
      } else {
        toast.error("Invoice not found");
        navigate('/dashboard');
      }
    } else {
      // New Invoice: Start with one empty row
      setItems([{ ...EmptyItem, id: uuidv4() }]);
    }
  }, [id, user, navigate]);

  // --- Calculations ---

  const grandTotal = items.reduce((sum, item) => sum + item.rowTotal, 0);
  const totalPaid = paidAmounts.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0);
  const balance = grandTotal - totalPaid;

  // --- Handlers ---

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceName || !invoiceDate) return;
    setIsSetup(true);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const currentItem = { ...newItems[index], [field]: value };
    
    // Recalculate derived fields
    const calc = calculateRow(currentItem.rate, currentItem.qty, currentItem.discountPercent);
    
    newItems[index] = { ...currentItem, ...calc };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { ...EmptyItem, id: uuidv4() }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const addPaidAmount = () => {
    setPaidAmounts([...paidAmounts, { id: uuidv4(), narration: '', amount: '' }]);
  };

  const updatePaidAmount = (index: number, field: keyof PaidAmount, value: any) => {
    const newPaid = [...paidAmounts];
    newPaid[index] = { ...newPaid[index], [field]: value };
    setPaidAmounts(newPaid);
  };

  const removePaidAmount = (index: number) => {
    setPaidAmounts(paidAmounts.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!user) return;
    if (!invoiceName) {
      toast.error("Invoice name required");
      return;
    }

    const invoice: Invoice = {
      id: id || uuidv4(),
      userId: user.username,
      name: invoiceName,
      date: invoiceDate,
      status,
      items,
      paidAmounts,
      grandTotal,
      totalPaid,
      balance,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storageService.saveInvoice(invoice);
    toast.success("Invoice Saved!");
    if (!id) navigate(`/invoice/${invoice.id}`, { replace: true });
  };

  const handleDownload = () => {
    if(!user) return;
    // Temporarily construct invoice object for PDF
    const invoice: Invoice = {
      id: id || 'temp',
      userId: user.username,
      name: invoiceName,
      date: invoiceDate,
      status,
      items,
      paidAmounts,
      grandTotal,
      totalPaid,
      balance,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    generateInvoicePDF(invoice);
  };

  // --- Keyboard Navigation & Shortcuts ---

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number, section: 'items' | 'paid') => {
    // Arrow Navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (section === 'items') {
        if (rowIndex < items.length - 1) {
           inputsRef.current[rowIndex + 1]?.[colIndex]?.focus();
        } else {
          // Add row if at bottom
          addItem();
          // Need timeout to wait for render
          setTimeout(() => inputsRef.current[rowIndex + 1]?.[colIndex]?.focus(), 0);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIndex > 0) {
        inputsRef.current[rowIndex - 1]?.[colIndex]?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      if ((e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value.length) {
         inputsRef.current[rowIndex]?.[colIndex + 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
       if ((e.target as HTMLInputElement).selectionStart === 0) {
         inputsRef.current[rowIndex]?.[colIndex - 1]?.focus();
       }
    }

    // Ctrl+D (Duplicate Row)
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      if (section === 'items') {
        const itemToCopy = items[rowIndex];
        const newItems = [...items];
        newItems.splice(rowIndex + 1, 0, { ...itemToCopy, id: uuidv4() });
        setItems(newItems);
      }
    }
  };

  // --- Render ---

  if (!isSetup) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 p-8 rounded-xl max-w-md w-full border border-slate-800">
          <h2 className="text-2xl font-bold mb-6">Create New Invoice</h2>
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Invoice Name</label>
              <input
                autoFocus
                type="text"
                value={invoiceName}
                onChange={e => setInvoiceName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                placeholder="e.g. Patient John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                required
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 px-4 py-2 bg-slate-800 rounded hover:bg-slate-700">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 font-bold">Start</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 sticky top-20 z-40 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-800 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <input 
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
              className="bg-transparent text-xl font-bold focus:outline-none focus:border-b border-blue-500"
            />
            <div className="flex gap-4 text-sm text-slate-400 mt-1">
              <input 
                type="date" 
                value={invoiceDate} 
                onChange={e => setInvoiceDate(e.target.value)}
                className="bg-transparent focus:outline-none"
              />
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as any)}
                className="bg-slate-800 rounded px-2 py-0.5 text-xs focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleSave} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-medium">
            <Save size={18} /> Save
          </button>
          <button onClick={handleDownload} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium">
            <Download size={18} /> PDF
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 min-w-[200px]">Item Name</th>
                <th className="px-4 py-3 w-24">QTY</th>
                <th className="px-4 py-3 w-28">Rate</th>
                <th className="px-4 py-3 w-24 text-center">+/- %</th>
                <th className="px-4 py-3 w-28 text-right bg-slate-900/50">T.P</th>
                <th className="px-4 py-3 w-28 text-right bg-slate-900/50">Total/Unit</th>
                <th className="px-4 py-3 w-32 text-right">Amount</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((item, index) => {
                // Initialize ref array for this row
                if (!inputsRef.current[index]) inputsRef.current[index] = [];
                
                return (
                  <tr key={item.id} className="hover:bg-slate-800/50 group">
                    <td className="px-4 py-2 text-slate-500">{index + 1}</td>
                    
                    <td className="p-2">
                      <input
                        ref={el => inputsRef.current[index][0] = el}
                        value={item.itemName}
                        onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 0, 'items')}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 focus:border-blue-500 focus:outline-none text-white placeholder-slate-600"
                        placeholder="Item Name"
                      />
                    </td>
                    
                    <td className="p-2">
                      <input
                        ref={el => inputsRef.current[index][1] = el}
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        onKeyDown={(e) => handleKeyDown(e, index, 1, 'items')}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 focus:border-blue-500 focus:outline-none text-white text-center"
                        placeholder="0"
                      />
                    </td>
                    
                    <td className="p-2">
                      <input
                        ref={el => inputsRef.current[index][2] = el}
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        onKeyDown={(e) => handleKeyDown(e, index, 2, 'items')}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 focus:border-blue-500 focus:outline-none text-white text-right"
                        placeholder="0.00"
                      />
                    </td>
                    
                    <td className="p-2">
                      <input
                        ref={el => inputsRef.current[index][3] = el}
                        type="number"
                        value={item.discountPercent}
                        onChange={(e) => updateItem(index, 'discountPercent', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        onKeyDown={(e) => handleKeyDown(e, index, 3, 'items')}
                        className={`w-full bg-slate-950 border border-slate-800 rounded p-1.5 focus:border-blue-500 focus:outline-none text-center font-medium ${
                          (item.discountPercent || 0) > 0 ? 'text-red-400' : (item.discountPercent || 0) < 0 ? 'text-green-400' : 'text-slate-400'
                        }`}
                        placeholder="0"
                      />
                    </td>
                    
                    <td className="px-4 py-2 text-right text-slate-400 bg-slate-900/30">
                      {item.tp.toFixed(2)}
                    </td>
                    
                    <td className="px-4 py-2 text-right text-slate-300 font-medium bg-slate-900/30">
                      {item.totalPricePerPiece.toFixed(2)}
                    </td>
                    
                    <td className="px-4 py-2 text-right text-blue-400 font-bold">
                      {item.rowTotal.toLocaleString()}
                    </td>
                    
                    <td className="px-2 text-center">
                      <button 
                        onClick={() => removeItem(index)}
                        className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        tabIndex={-1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button 
          onClick={addItem}
          className="w-full py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors border-t border-slate-800"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Paid Amount Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <DollarSign className="text-green-500" size={20} />
            Payment History
          </h3>
        </div>
        
        <div className="space-y-3">
          {paidAmounts.map((paid, index) => (
            <div key={paid.id} className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-slate-950 p-3 rounded border border-slate-800">
              <input
                value={paid.narration}
                onChange={(e) => updatePaidAmount(index, 'narration', e.target.value)}
                className="flex-grow bg-slate-900 border border-slate-700 rounded p-2 focus:border-green-500 focus:outline-none text-white"
                placeholder="Payment description (e.g. Advance)"
              />
              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="number"
                  value={paid.amount}
                  onChange={(e) => updatePaidAmount(index, 'amount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-32 bg-slate-900 border border-slate-700 rounded p-2 focus:border-green-500 focus:outline-none text-right text-white"
                  placeholder="Amount"
                />
                <button onClick={() => removePaidAmount(index)} className="p-2 text-slate-500 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          <button 
            onClick={addPaidAmount}
            className="text-sm text-green-500 hover:text-green-400 font-medium flex items-center gap-1"
          >
            <Plus size={14} /> Add Payment Record
          </button>
        </div>
      </div>

      {/* Footer Totals */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 shadow-2xl z-50">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
               <Calculator size={16} /> 
               <span>Items: {items.length}</span>
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <div className="text-right">
              <div className="text-xs text-slate-500">Grand Total</div>
              <div className="text-xl font-bold text-white">Rs {grandTotal.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Total Paid</div>
              <div className="text-xl font-bold text-green-500">Rs {totalPaid.toLocaleString()}</div>
            </div>
            <div className="h-10 w-px bg-slate-700 mx-2"></div>
            <div className="text-right bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              <div className="text-xs text-blue-400 font-bold uppercase tracking-wider">Balance Due</div>
              <div className="text-2xl font-bold text-white">Rs {balance.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;

function DollarSign({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}