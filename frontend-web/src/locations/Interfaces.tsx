export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  creator: SimplifiedUser;
  category: LocationCategory;
  description?: string;
  messages: Message[];
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
  senderId: string;
  locationId: string;
}

export interface ResponseMessagePostDTO {
  content: string;
  senderId: string;
  messageId: string;
}

export interface Message {
  id: string;
  content: string;
  sentAt: Date;
  sender: SimplifiedUser;
  locationId: string;
  responses?: ResponseMessage[];
}

export interface ResponseMessage {
  id: string;
  sender: SimplifiedUser;
  content: string;
  sentAt: Date;
  locationId: string;
}

export interface LocationPostDTO {
  latitude: number;
  longitude: number;
  name: string;
  description?: string;
  creatorId: string;
  category: LocationCategory;
}

export interface SimplifiedUser {
  firstName: string;
  lastName: string;
  username: string;
}
