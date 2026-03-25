interface EnvironmentConfig {
  apiUrl: string;
  wsUrl: string;
  isDevelopment: boolean;
}

let config: EnvironmentConfig = {
  apiUrl: 'https://localhost:7215/api',
  wsUrl: 'wss://localhost:7215/ws',
  isDevelopment: true,
};

export function initializeEnvironment(cfg: EnvironmentConfig): void {
  config = { ...cfg };
}

export function getApiUrl(): string {
  return config.apiUrl;
}

export function getWsUrl(): string {
  return config.wsUrl;
}

export function getIsDevelopment(): boolean {
  return config.isDevelopment;
}
