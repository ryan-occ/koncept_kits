import type {
  BuildConfig, BuildDto, BuildSummaryDto, DrawingKey, FavoriteVehicle, FavoriteVehicleBackup,
  FavoriteVehicleImportResult, RenderAngle, UsageDto,
} from "../../shared/types";
import type { VehicleCatalogDto, VehiclePhotoView, VehicleProfileDto, VehicleProfileEdit, VehicleRef } from "../../shared/vehicles";

export interface AccessStatus {
  enabled: boolean;
  authenticated: boolean;
}

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code: string, readonly details?: string[]) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError("Can't reach the server. Check that it is running.", 0, "NETWORK");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null) as { error?: string; code?: string; details?: string[] } | null;
  if (!res.ok) throw new ApiRequestError(data?.error ?? `Request failed (${res.status}).`, res.status, data?.code ?? "HTTP", data?.details);
  return data as T;
}

export const api = {
  accessStatus: () => request<AccessStatus>("GET", "/api/auth/status"),
  login: (code: string) => request<AccessStatus>("POST", "/api/auth/login", { code }),
  usage: () => request<UsageDto>("GET", "/api/usage"),
  listBuilds: () => request<BuildSummaryDto[]>("GET", "/api/builds"),
  listFavoriteGroups: () => request<string[]>("GET", "/api/favorite-groups"),
  createFavoriteGroup: (name: string) => request<string>("POST", "/api/favorite-groups", { name }),
  listFavoriteVehicles: () => request<FavoriteVehicle[]>("GET", "/api/favorites"),
  exportFavoriteBackup: () => request<FavoriteVehicleBackup>("GET", "/api/favorites/export"),
  importFavoriteBackup: (backup: unknown) => request<FavoriteVehicleImportResult>("POST", "/api/favorites/import", backup),
  saveFavoriteVehicle: (favorite: FavoriteVehicle) => request<FavoriteVehicle>("PUT", "/api/favorites", favorite),
  deleteFavoriteVehicle: (favorite: FavoriteVehicle) => request<void>("DELETE", "/api/favorites", favorite),
  getBuild: (id: number) => request<BuildDto>("GET", `/api/builds/${id}`),
  createBuild: (name: string, config: BuildConfig) => request<BuildDto>("POST", "/api/builds", { name, config }),
  updateBuild: (id: number, patch: { name?: string; config?: BuildConfig }) => request<BuildDto>("PATCH", `/api/builds/${id}`, patch),
  deleteBuild: (id: number) => request<void>("DELETE", `/api/builds/${id}`),
  generateDrawings: (id: number) => request<BuildDto>("POST", `/api/builds/${id}/drawings`),
  redraw: (id: number, views: DrawingKey[], notes: string) => request<BuildDto>("POST", `/api/builds/${id}/drawings/redraw`, { views, notes }),
  approve: (id: number) => request<BuildDto>("POST", `/api/builds/${id}/drawings/approve`),
  reopen: (id: number) => request<BuildDto>("POST", `/api/builds/${id}/drawings/reopen`),
  render: (id: number, angles: RenderAngle[]) => request<BuildDto>("POST", `/api/builds/${id}/renders`, { angles }),
  vehicleCatalog: () => request<VehicleCatalogDto>("GET", "/api/vehicles/catalog"),
  addVehicle: (car: VehicleRef) => request<{ car: VehicleRef; profile: VehicleProfileDto }>("POST", "/api/vehicles/catalog", car),
  checkNewModels: () => request<VehicleCatalogDto>("POST", "/api/vehicles/sync"),
  vehicleProfile: (car: VehicleRef) =>
    request<VehicleProfileDto | null>("GET", `/api/vehicles/profile?${new URLSearchParams({ make: car.make, model: car.model, year: String(car.year) })}`),
  researchVehicle: (car: VehicleRef) => request<VehicleProfileDto>("POST", "/api/vehicles/research", car),
  refreshVehicleProfile: (id: number) => request<VehicleProfileDto>("POST", `/api/vehicles/profiles/${id}/refresh`),
  editVehicleProfile: (id: number, edit: VehicleProfileEdit) => request<VehicleProfileDto>("PUT", `/api/vehicles/profiles/${id}`, edit),
  verifyVehicleProfile: (id: number) => request<VehicleProfileDto>("POST", `/api/vehicles/profiles/${id}/verify`),
  deleteVehicleProfile: (id: number) => request<void>("DELETE", `/api/vehicles/profiles/${id}`),
  deleteVehiclePhoto: (id: number) => request<void>("DELETE", `/api/vehicles/photos/${id}`),
  async addVehiclePhoto(id: number, view: VehiclePhotoView, file: File): Promise<VehicleProfileDto> {
    let res: Response;
    try {
      res = await fetch(`/api/vehicles/profiles/${id}/photos?view=${view}`, { method: "POST", headers: { "Content-Type": file.type }, body: file });
    } catch {
      throw new ApiRequestError("Can't reach the server. Check that it is running.", 0, "NETWORK");
    }
    const data = await res.json().catch(() => null) as (VehicleProfileDto & { error?: string; code?: string }) | null;
    if (!res.ok) throw new ApiRequestError(data?.error ?? `Upload failed (${res.status}).`, res.status, data?.code ?? "HTTP");
    return data!;
  },
  /** Fetches the ZIP so errors (e.g. not approved) can be shown instead of downloading a JSON file. */
  async exportZip(id: number): Promise<{ blob: Blob; filename: string }> {
    const res = await fetch(`/api/builds/${id}/export`);
    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string; code?: string } | null;
      throw new ApiRequestError(data?.error ?? `Export failed (${res.status}).`, res.status, data?.code ?? "HTTP");
    }
    const match = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "");
    return { blob: await res.blob(), filename: match?.[1] ?? `build-${id}-production.zip` };
  },
};
