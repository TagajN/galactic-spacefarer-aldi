// Shared types used by both server and client

export type SpacefarerStatus = "CANDIDATE" | "ACTIVE" | "RETIRED";
export type UserRole = "admin" | "viewer";

export interface Department {
  id: string;
  name: string;
  galaxy: string;
}

export interface Position {
  id: string;
  title: string;
  rank: number;
}

export interface Spacefarer {
  id: string;
  name: string;
  email: string;
  origin_planet: string;
  spacesuit_color: string;
  stardust_collection: number;
  wormhole_navigation_skill: number;
  status: SpacefarerStatus;
  launch_date: string | null;
  department_id: string | null;
  position_id: string | null;
  created_at: string;
  modified_at: string;
  department_name?: string;
  position_title?: string;
  position_rank?: number;
}

export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
  planet: string;
}

export interface ListResult<T = Spacefarer> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoginResponse {
  token: string;
  user: PublicUser;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
  planet: string;
  iat?: number;
  exp?: number;
}

export interface CreateSpacefarerBody {
  name: string;
  email: string;
  originPlanet: string;
  spacesuitColor?: string;
  stardustCollection?: number;
  wormholeNavigationSkill?: number;
  launchDate?: string;
  departmentId?: string;
  positionId?: string;
}

export interface UpdateSpacefarerBody {
  name?: string;
  email?: string;
  spacesuitColor?: string;
  stardustCollection?: number;
  wormholeNavigationSkill?: number;
  status?: SpacefarerStatus;
  launchDate?: string;
  departmentId?: string;
  positionId?: string;
}
