import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from './Interfaces';

interface AuthContextType {
  user: User;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
}

const defaultUser: User = {
  id: 1,
  firstName: 'FNAME',
  lastName: 'LNAME',
  username: 'UNAME',
  email: 'a@b.c',
  password: 'Parola123!',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
