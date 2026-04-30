import { BASE_API_URL } from '../../core';
import { TokenService } from '../../auth/TokenService';

const JOBS_URL = BASE_API_URL + '/Jobs';

async function triggerJob(endpoint: string): Promise<void> {
  const response = await fetch(`${JOBS_URL}/${endpoint}`, {
    method: 'POST',
    headers: { ...TokenService.getAuthHeader() },
  });
  if (!response.ok) throw new Error(`Failed to trigger job: ${endpoint}`);
}

export const triggerCheckExpiredLocations = () => triggerJob('check-expired-locations');
export const triggerCheckExpiredEvents = () => triggerJob('check-expired-events');
export const triggerExtendDurationByLikes = () => triggerJob('extend-duration-by-likes');
export const triggerCheckMergeDuplicates = () => triggerJob('check-merge-duplicate-locations');
