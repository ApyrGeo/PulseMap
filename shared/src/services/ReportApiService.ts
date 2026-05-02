import { getApiUrl } from '../config/environment';
import { TokenService } from './TokenService';
import { ReportPostDTO, ReportResponseDTO } from '../types/report';

export async function reportLocation(
  tokenService: TokenService,
  dto: ReportPostDTO
): Promise<ReportResponseDTO> {
  const response = await fetch(`${getApiUrl()}/Report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await tokenService.getAuthHeader()),
    },
    body: JSON.stringify(dto),
  });
  if (response.status === 409) throw new Error('ALREADY_REPORTED');
  if (!response.ok) throw new Error(`Failed to report location: ${response.status}`);
  return response.json();
}

export async function getLocationReportCount(
  tokenService: TokenService,
  locationId: number
): Promise<number> {
  const response = await fetch(`${getApiUrl()}/Report/location/${locationId}/count`, {
    headers: await tokenService.getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch report count');
  return response.json();
}
