import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage on mount
    const savedUser = sessionStorage.getItem('hk_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate backend delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const valid = storageService.validateOrRegisterUser(username, password);
    if (valid) {
      const userData = { username };
      setUser(userData);
      sessionStorage.setItem('hk_current_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('hk_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};