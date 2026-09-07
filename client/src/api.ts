import type {
  Department,
  ListResult,
  LoginResponse,
  Position,
  Spacefarer,
} from "./types";

const BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null as T;
  const data = await res.json();
  if (!res.ok)
    throw new Error((data as { error: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

export interface SpacefarersQuery {
  status?: string;
  spacesuitColor?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

export const api = {
  login: (body: { username: string; password: string }) =>
    request<LoginResponse>("POST", "/auth/login", body),

  getSpacefarers: (params: SpacefarersQuery = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString();
    return request<ListResult>("GET", `/spacefarers${qs ? `?${qs}` : ""}`);
  },

  getSpacefarer: (id: string) =>
    request<Spacefarer>("GET", `/spacefarers/${id}`),

  createSpacefarer: (
    body: Partial<Spacefarer> & {
      name: string;
      email: string;
      originPlanet: string;
    },
  ) => request<Spacefarer>("POST", "/spacefarers", body),

  updateSpacefarer: (id: string, body: Partial<Spacefarer>) =>
    request<Spacefarer>("PATCH", `/spacefarers/${id}`, body),

  deleteSpacefarer: (id: string) =>
    request<null>("DELETE", `/spacefarers/${id}`),

  retireSpacefarer: (id: string) =>
    request<Spacefarer>("PATCH", `/spacefarers/${id}/retire`),

  getDepartments: () => request<Department[]>("GET", "/departments"),
  getPositions: () => request<Position[]>("GET", "/positions"),
};
