import React, { createContext, useContext } from 'react';

export interface AuthContextType {
  userToken: string | null;
  userRole: 'customer' | 'provider' | null;
  userId: string | null;
  login: (role: 'customer' | 'provider', userId: string, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
