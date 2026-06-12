const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

export const TokenService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser(): unknown {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  setUser(user: unknown): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  },

  getTokenExpiry(): Date | null {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return null;
    return new Date(expiryStr);
  },

  setTokenExpiry(expiresIn: string): void {
    let expiryDate: Date;

    if (!isNaN(Number(expiresIn))) {
      expiryDate = new Date(Date.now() + Number(expiresIn) * 1000);
    } else if (expiresIn.match(/^\d+[smhd]$/)) {
      const value = parseInt(expiresIn);
      const unit = expiresIn.slice(-1);
      let milliseconds = 0;

      switch (unit) {
        case 's':
          milliseconds = value * 1000;
          break;
        case 'm':
          milliseconds = value * 60 * 1000;
          break;
        case 'h':
          milliseconds = value * 60 * 60 * 1000;
          break;
        case 'd':
          milliseconds = value * 24 * 60 * 60 * 1000;
          break;
      }

      expiryDate = new Date(Date.now() + milliseconds);
    } else {
      expiryDate = new Date(expiresIn);

      if (isNaN(expiryDate.getTime())) {
        console.warn('Failed to parse expiresIn, defaulting to 24 hours');
        expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    }

    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString());
  },

  removeTokenExpiry(): void {
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },

  isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    return new Date() >= expiry;
  },

  clearAll(): void {
    this.removeToken();
    this.removeUser();
    this.removeTokenExpiry();
  },

  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    if (token && !this.isTokenExpired()) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  },
};
