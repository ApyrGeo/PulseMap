// Environment configuration
// Get API URL from environment variable or fall back to hardcoded values
export const BASE_API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://pulsemap-api-effhbufudbchh9af.italynorth-01.azurewebsites.net/api'
    : 'https://localhost:7215/api');

// Generate WebSocket URL from API URL
// https://localhost:7215/api -> wss://localhost:7215/ws
// https://pulsemap-api.azurewebsites.net/api -> wss://pulsemap-api.azurewebsites.net/ws
export const WS_URL = BASE_API_URL.replace(/^https?/, 'wss').replace(
  /\/api$/,
  '/ws'
);
