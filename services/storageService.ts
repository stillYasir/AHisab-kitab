import { Invoice, User } from '../types';

const USERS_KEY = 'hk_users';
const INVOICES_KEY = 'hk_invoices';

export const storageService = {
  validateOrRegisterUser: (username: string, password: string): boolean => {
    const usersStr = localStorage.getItem(USERS_KEY);
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const existingUser = users.find(u => u.username === username);
    
    if (existingUser) {
      // Validate password
      return existingUser.password === password;
    } else {
      // Register new user
      const newUser = { username, password };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    }
  },

  getInvoices: (username: string): Invoice[] => {
    const allInvoicesStr = localStorage.getItem(INVOICES_KEY);
    const allInvoices: Invoice[] = allInvoicesStr ? JSON.parse(allInvoicesStr) : [];
    return allInvoices.filter(inv => inv.userId === username);
  },

  getInvoiceById: (id: string): Invoice | undefined => {
    const allInvoicesStr = localStorage.getItem(INVOICES_KEY);
    const allInvoices: Invoice[] = allInvoicesStr ? JSON.parse(allInvoicesStr) : [];
    return allInvoices.find(inv => inv.id === id);
  },

  saveInvoice: (invoice: Invoice): void => {
    const allInvoicesStr = localStorage.getItem(INVOICES_KEY);
    let allInvoices: Invoice[] = allInvoicesStr ? JSON.parse(allInvoicesStr) : [];
    
    const index = allInvoices.findIndex(inv => inv.id === invoice.id);
    if (index >= 0) {
      allInvoices[index] = invoice;
    } else {
      allInvoices.push(invoice);
    }
    
    localStorage.setItem(INVOICES_KEY, JSON.stringify(allInvoices));
  },
  
  deleteInvoice: (id: string): void => {
    const allInvoicesStr = localStorage.getItem(INVOICES_KEY);
    let allInvoices: Invoice[] = allInvoicesStr ? JSON.parse(allInvoicesStr) : [];
    const newInvoices = allInvoices.filter(i => i.id !== id);
    localStorage.setItem(INVOICES_KEY, JSON.stringify(newInvoices));
  }
};