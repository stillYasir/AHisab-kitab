import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Calendar, DollarSign } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { Invoice, InvoiceStatus } from '../types';

const Dashboard: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const data = storageService.getInvoices(user.username);
      // Sort by date desc
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setInvoices(data);
    }
  }, [user]);

  const handleStatusChange = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation(); // Prevent navigation
    const newStatus: InvoiceStatus = invoice.status === 'Paid' ? 'Pending' : 'Paid';
    const updatedInvoice = { ...invoice, status: newStatus, updatedAt: Date.now() };
    storageService.saveInvoice(updatedInvoice);
    
    setInvoices(prev => prev.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-slate-400">Manage your invoices</p>
        </div>
        <button
          onClick={() => navigate('/invoice/new')}
          className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-teal-900/20"
        >
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search invoices by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No invoices found. Create one to get started.</p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => navigate(`/invoice/${invoice.id}`)}
                className="bg-slate-950 border border-slate-800 rounded-lg p-5 hover:border-blue-500/50 hover:bg-slate-900/50 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <FileText size={16} className="text-blue-400" />
                    <span className="font-semibold text-lg truncate">{invoice.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleStatusChange(e, invoice)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      invoice.status === 'Paid'
                        ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20'
                    } transition-colors z-10`}
                  >
                    {invoice.status}
                  </button>
                </div>
                
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{new Date(invoice.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} />
                    <span className="text-slate-200">Balance: Rs {invoice.balance.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-xs text-slate-500">
                  <span>Grand Total: Rs {invoice.grandTotal.toLocaleString()}</span>
                  <span className="group-hover:text-blue-400 transition-colors">Click to edit →</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;