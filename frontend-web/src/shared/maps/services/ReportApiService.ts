import { BASE_API_URL } from '../../../core';
import { TokenService } from '../../../auth/TokenService';

export enum ReportType {
  LocationDoesNotExist = 0,
  MisleadingInformation = 1,
  InappropriateContent = 2,
  Duplicate = 3,
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.LocationDoesNotExist]: 'Locația nu există',
  [ReportType.MisleadingInformation]: 'Informație înșelătoare',
  [ReportType.InappropriateContent]: 'Conținut necorespunzător',
  [ReportType.Duplicate]: 'Locație duplicată',
};

export async function reportLocation(
  userId: number,
  locationId: number,
  type: ReportType
): Promise<void> {
  const response = await fetch(`${BASE_API_URL}/Report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...TokenService.getAuthHeader(),
    },
    body: JSON.stringify({ userId, locationId, type }),
  });
  if (response.status === 409) throw new Error('ALREADY_REPORTED');
  if (!response.ok) throw new Error(`Failed to report location: ${response.status}`);
}
