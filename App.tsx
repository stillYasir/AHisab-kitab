import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InvoiceEditor from './pages/InvoiceEditor';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              Hisaab Kitaab
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-slate-400">Welcome, {user.username}</span>
              <button 
                onClick={logout}
                className="text-sm px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6">
        {children}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 p-4 mt-auto">
        <div className="container mx-auto text-center text-slate-500 text-sm">
          All Rights Reserved 2025 — Yasir
        </div>
      </footer>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155'
          },
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoice/new" 
              element={
                <ProtectedRoute>
                  <InvoiceEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoice/:id" 
              element={
                <ProtectedRoute>
                  <InvoiceEditor />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;