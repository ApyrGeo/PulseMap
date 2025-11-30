import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { User } from './Interfaces';
import { loginUserAPI } from './AuthApiService';

interface AuthContextType {
  user?: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  loginUser: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const isAuthenticated = useMemo(() => !!user, [user]);

  const loginUser = async (email: string, password: string) => {
    const user = await loginUserAPI(email, password);
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, loginUser }}>
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
function random() {
  throw new Error('Function not implemented.');
}
