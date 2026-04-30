export enum ReportType {
  LocationDoesNotExist = 0,
  MisleadingInformation = 1,
  InappropriateContent = 2,
  Duplicate = 3,
}

export interface ReportPostDTO {
  userId: number;
  locationId: number;
  type: ReportType;
}

export interface ReportResponseDTO {
  id: number;
  userId: number;
  locationId: number;
  type: ReportType;
  createdAt: string;
}
