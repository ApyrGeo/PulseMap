import { BASE_API_URL } from '../../../core';
import { TokenService } from '../../../auth/TokenService';
import { CategoryDTO, CategoryPostDTO } from '../Interfaces';

const CATEGORIES_URL = BASE_API_URL + '/Category';

export async function fetchCategories(
  onlyActive = true
): Promise<CategoryDTO[]> {
  const params = new URLSearchParams({ onlyActive: String(onlyActive) });

  const response = await fetch(`${CATEGORIES_URL}?${params}`, {
    headers: { ...TokenService.getAuthHeader() },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
}

export async function addCategory(
  payload: CategoryPostDTO
): Promise<CategoryDTO> {
  const response = await fetch(CATEGORIES_URL, {
    method: 'POST',
    headers: {
      ...TokenService.getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to add category');
  }

  return response.json();
}
