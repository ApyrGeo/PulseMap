import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { User, LoginRequest, RegisterRequest } from '../auth/Interfaces';
import { loginUserAPI, registerUserAPI } from '../services/AuthApiService';
import { TokenService } from '../services/TokenService';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (registerRequest: RegisterRequest) => Promise<void>;
  logoutUser: () => void;
  tokenService: TokenService;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  tokenService: TokenService;
}

export const AuthProvider = ({ children, tokenService }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useMemo(() => !!user, [user]);

  // Async init — load user from storage on mount
  useEffect(() => {
    const init = async () => {
      try {
        const expired = await tokenService.isTokenExpired();
        if (expired) {
          await tokenService.clearAll();
          setUser(null);
        } else {
          const storedUser = await tokenService.getUser<User>();
          setUser(storedUser);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [tokenService]);

  const loginUser = async (email: string, password: string) => {
    const loginRequest: LoginRequest = { email, password };
    const loginResponse = await loginUserAPI(loginRequest);

    await tokenService.setToken(loginResponse.token);
    await tokenService.setUser(loginResponse.user);
    await tokenService.setTokenExpiry(loginResponse.expiresIn);

    setUser(loginResponse.user);
  };

  const registerUser = async (registerRequest: RegisterRequest) => {
    await registerUserAPI(registerRequest);
  };

  const logoutUser = async () => {
    await tokenService.clearAll();
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
        tokenService,
        isLoading,
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
