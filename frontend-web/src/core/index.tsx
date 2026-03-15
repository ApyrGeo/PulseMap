// Environment configuration
//const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// API URLs configuration
const API_URLS = {
  development: 'https://localhost:7215/api',
  production:
    'https://pulsemap-api-effhbufudbchh9af.italynorth-01.azurewebsites.net/api',
};

export const BASE_API_URL = isProduction
  ? API_URLS.production
  : API_URLS.development;

// Generate WebSocket URL from API URL
// https://localhost:7215/api -> wss://localhost:7215/ws
// https://pulsemap-api.azurewebsites.net/api -> wss://pulsemap-api.azurewebsites.net/ws
export const WS_URL = BASE_API_URL.replace(/^https?/, 'wss').replace(
  /\/api$/,
  '/ws'
);
