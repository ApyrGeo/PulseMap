import { getApiUrl } from '../config/environment';
import { TokenService } from './TokenService';
import { InteractionPostDTO, InteractionResponseDTO } from '../types/interaction';

export async function recordInteraction(
  tokenService: TokenService,
  dto: InteractionPostDTO
): Promise<InteractionResponseDTO> {
  const response = await fetch(`${getApiUrl()}/Interaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await tokenService.getAuthHeader()),
    },
    body: JSON.stringify(dto),
  });
  if (!response.ok) throw new Error('Failed to record interaction');
  return response.json();
}

export async function getUserInteractions(
  tokenService: TokenService,
  userId: number
): Promise<InteractionResponseDTO[]> {
  const response = await fetch(`${getApiUrl()}/Interaction/user/${userId}`, {
    headers: await tokenService.getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch interactions');
  return response.json();
}
