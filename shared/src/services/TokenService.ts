import { StorageAdapter } from '../storage/StorageAdapter';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

export class TokenService {
  constructor(private storage: StorageAdapter) {}

  async getToken(): Promise<string | null> {
    return await this.storage.getItem(TOKEN_KEY);
  }

  async setToken(token: string): Promise<void> {
    await this.storage.setItem(TOKEN_KEY, token);
  }

  async removeToken(): Promise<void> {
    await this.storage.removeItem(TOKEN_KEY);
  }

  async getUser<T = unknown>(): Promise<T | null> {
    const userStr = await this.storage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as T;
    } catch {
      return null;
    }
  }

  async setUser(user: unknown): Promise<void> {
    await this.storage.setItem(USER_KEY, JSON.stringify(user));
  }

  async removeUser(): Promise<void> {
    await this.storage.removeItem(USER_KEY);
  }

  async getTokenExpiry(): Promise<Date | null> {
    const expiryStr = await this.storage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return null;
    return new Date(expiryStr);
  }

  async setTokenExpiry(expiresIn: string): Promise<void> {
    let expiryDate: Date;

    if (!isNaN(Number(expiresIn))) {
      expiryDate = new Date(Date.now() + Number(expiresIn) * 1000);
    } else if (expiresIn.match(/^\d+[smhd]$/)) {
      const value = parseInt(expiresIn);
      const unit = expiresIn.slice(-1);
      let milliseconds = 0;
      switch (unit) {
        case 's': milliseconds = value * 1000; break;
        case 'm': milliseconds = value * 60 * 1000; break;
        case 'h': milliseconds = value * 60 * 60 * 1000; break;
        case 'd': milliseconds = value * 24 * 60 * 60 * 1000; break;
      }
      expiryDate = new Date(Date.now() + milliseconds);
    } else {
      expiryDate = new Date(expiresIn);
      if (isNaN(expiryDate.getTime())) {
        expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    }

    await this.storage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString());
  }

  async removeTokenExpiry(): Promise<void> {
    await this.storage.removeItem(TOKEN_EXPIRY_KEY);
  }

  async isTokenExpired(): Promise<boolean> {
    const expiry = await this.getTokenExpiry();
    if (!expiry) return true;
    return new Date() >= expiry;
  }

  async clearAll(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
    await this.removeTokenExpiry();
  }

  async getAuthHeader(): Promise<Record<string, string>> {
    const token = await this.getToken();
    const expired = await this.isTokenExpired();
    if (token && !expired) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }
}
