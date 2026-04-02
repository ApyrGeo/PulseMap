export interface Location {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  creator: SimplifiedUser;
  category: string;
  description?: string;
  messages: Message[];
  expiresAt: Date;
  isExpired: boolean;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  requiresReview: boolean;
  owner?: SimplifiedUser;
  event?: SimplifiedEvent;
  eventAssignmentConfidence?: number;
  imageUrls?: string[];
}

export enum LocationCategory {
  NotSet = 'Not Set',
  Music = 'Music',
  Sport = 'Sport',
  Food = 'Food',
  Entertainment = 'Entertainment',
  Education = 'Education',
  Health = 'Health',
  Technology = 'Technology',
  Travel = 'Travel',
  Art = 'Art',
  Business = 'Business',
}

export interface Message {
  id: number;
  content: string;
  sentAt: Date;
  sender: SimplifiedUser;
  locationId: number;
  responses?: ResponseMessage[];
}

export interface ResponseMessage {
  id: number;
  sender: SimplifiedUser;
  content: string;
  sentAt: Date;
  locationId: number;
  parentMessageId: number;
}

export interface LocationLikesSummaryDTO {
  id: number;
  likesCount: number;
  toggledByUserId?: number | null;
  isNowLiked: boolean;
}

export interface LocationPostDTO {
  latitude: number;
  longitude: number;
  name: string;
  description?: string;
  creatorId: number;
  category: string;
  duration: string;
  ownerId?: number;
  imageUrls?: string[];
}

export interface LocationPutDTO {
  name: string;
  description?: string;
  category: string;
  imageUrls?: string[];
}

export interface MessagePostDTO {
  content: string;
  senderId: number;
  locationId: number;
}

export interface ResponseMessagePostDTO {
  content: string;
  senderId: number;
  messageId: number;
}

export interface CategoryDTO {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
}

export interface LocationRecommendationDTO {
  id: number;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  likesCount: number;
  score: number;
  reason: string;
}

export interface SimplifiedUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

export interface SimplifiedEvent {
  id: number;
  name: string;
  requiresReview: boolean;
  confidenceScore: number;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
