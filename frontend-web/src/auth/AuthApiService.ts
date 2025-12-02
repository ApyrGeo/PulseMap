import { BASE_API_URL } from '../core';
import { User } from './Interfaces';

const USER_API_URL = `${BASE_API_URL}/User`;

export const loginUserAPI = async (
  email: string,
  password: string
): Promise<User> => {
  const response = await fetch(
    `${USER_API_URL}/login?email=${email}&password=${password}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to login user');
  }
  return await response.json();
};
