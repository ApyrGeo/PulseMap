import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { LoginRequest, RegisterRequest, User } from './Interfaces';
import { loginUserAPI, registerUserAPI } from './AuthApiService';
import { TokenService } from './TokenService';

interface AuthContextType {
  user?: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (registerRequest: RegisterRequest) => Promise<void>;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize user from localStorage immediately (synchronous)
const initializeUser = (): User | null => {
  const token = TokenService.getToken();
  const storedUser = TokenService.getUser() as User | null;

  if (token && storedUser && !TokenService.isTokenExpired()) {
    return storedUser;
  } else {
    // Token expired or missing, clear everything
    TokenService.clearAll();
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(initializeUser);
  const isAuthenticated = useMemo(() => !!user, [user]);

  const loginUser = async (email: string, password: string) => {
    const loginRequest: LoginRequest = { email, password };
    const loginResponse = await loginUserAPI(loginRequest);

    // Store token and user in localStorage
    TokenService.setToken(loginResponse.token);
    TokenService.setUser(loginResponse.user);
    TokenService.setTokenExpiry(loginResponse.expiresIn);

    setUser(loginResponse.user);
  };

  const registerUser = async (registerRequest: RegisterRequest) => {
    const newUser = await registerUserAPI(registerRequest);
    // After registration, user needs to login
    // We don't automatically log them in
    return;
  };

  const logoutUser = () => {
    TokenService.clearAll();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        loginUser,
        registerUser,
        logoutUser,
      }}
    >
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
