import { getApiUrl } from '../config/environment';
import { TokenService } from './TokenService';
import { CategoryDTO } from '../types/location';

export async function fetchCategories(
  tokenService: TokenService,
  onlyActive = true
): Promise<CategoryDTO[]> {
  const params = new URLSearchParams({ onlyActive: String(onlyActive) });
  const response = await fetch(`${getApiUrl()}/Category?${params}`, {
    headers: await tokenService.getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}
