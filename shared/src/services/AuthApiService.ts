import { getApiUrl } from '../config/environment';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../auth/Interfaces';

export const loginUserAPI = async (loginRequest: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${getApiUrl()}/User/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to login user');
  }
  return response.json();
};

export const registerUserAPI = async (registerRequest: RegisterRequest): Promise<User> => {
  const response = await fetch(`${getApiUrl()}/User/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerRequest),
  });

  if (response.status === 409) throw new Error('USER_ALREADY_EXISTS');
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to register user');
  }
  return response.json();
};
