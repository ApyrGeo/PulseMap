export enum InteractionType {
  Confirmed = 0,
  ProximityTap = 1,
}

export interface InteractionPostDTO {
  userId: number;
  locationId: number;
  type: InteractionType;
}

export interface InteractionResponseDTO {
  id: number;
  userId: number;
  locationId: number;
  locationName: string;
  interactedAt: string;
  type: InteractionType;
}

export interface UserInteractionStatsDTO {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  totalInteractions: number;
}

export interface LocationInteractionStatsDTO {
  locationId: number;
  locationName: string;
  totalInteractions: number;
  latitude: number;
  longitude: number;
}
