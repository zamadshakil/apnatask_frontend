import React, { createContext, useState, useContext } from 'react';

export interface AuthContextType {
  userToken: string | null;
  userRole: 'customer' | 'provider' | null;
  userId: number | null;
  login: (role: 'customer' | 'provider', userId?: number, token?: string) => void;
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
