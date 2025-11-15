export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  creator: SimplifiedUser;
  description?: string;
}

export interface LocationPostDto {
  latitude: number;
  longitude: number;
  name: string;
  description?: string;
  creatorId: number;
}

export interface SimplifiedUser {
  firstName: string;
  lastName: string;
  username: string;
}
