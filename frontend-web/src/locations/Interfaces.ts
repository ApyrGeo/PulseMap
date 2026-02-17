export interface Location {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  creator: SimplifiedUser;
  category: LocationCategory;
  description?: string;
  messages: Message[];
  expiresAt: Date;
  isExpired: boolean;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  owner?: SimplifiedUser;
  event?: SimplifiedEvent;
  eventAssignmentConfidence?: number;
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
  category: LocationCategory;
  duration: string;
  ownerId?: number;
}

export interface LocationPutDTO {
  name: string;
  description?: string;
  category: LocationCategory;
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
