import type { UserRole } from "@galactic/shared";

export type {
  SpacefarerStatus,
  UserRole,
  Department,
  Position,
  Spacefarer,
  PublicUser,
  ListResult,
  LoginResponse,
  JwtPayload,
  CreateSpacefarerBody,
  UpdateSpacefarerBody,
} from "@galactic/shared";

export interface UserRow {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  planet: string;
}

export type User = UserRow;

export interface ListQuery {
  planet: string;
  status?: string;
  spacesuitColor?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}
