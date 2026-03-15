import { BASE_API_URL } from '../core';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from './Interfaces';

const USER_API_URL = `${BASE_API_URL}/User`;

export const loginUserAPI = async (
  loginRequest: LoginRequest
): Promise<LoginResponse> => {
  const response = await fetch(`${USER_API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loginRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to login user');
  }
  return await response.json();
};

export const registerUserAPI = async (
  registerRequest: RegisterRequest
): Promise<User> => {
  const response = await fetch(`${USER_API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registerRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to register user');
  }
  return await response.json();
};
