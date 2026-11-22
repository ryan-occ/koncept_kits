import type { BuildConfig, BuildDto, BuildSummaryDto, DrawingKey, RenderAngle, UsageDto } from "../../shared/types";

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
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
  const data = await res.json().catch(() => null) as { error?: string; code?: string } | null;
  if (!res.ok) throw new ApiRequestError(data?.error ?? `Request failed (${res.status}).`, res.status, data?.code ?? "HTTP");
  return data as T;
}

export const api = {
  usage: () => request<UsageDto>("GET", "/api/usage"),
  listBuilds: () => request<BuildSummaryDto[]>("GET", "/api/builds"),
  getBuild: (id: number) => request<BuildDto>("GET", `/api/builds/${id}`),
  createBuild: (name: string, config: BuildConfig) => request<BuildDto>("POST", "/api/builds", { name, config }),
  updateBuild: (id: number, patch: { name?: string; config?: BuildConfig }) => request<BuildDto>("PATCH", `/api/builds/${id}`, patch),
  deleteBuild: (id: number) => request<void>("DELETE", `/api/builds/${id}`),
  generateDrawings: (id: number) => request<BuildDto>("POST", `/api/builds/${id}/drawings`),
  redraw: (id: number, views: DrawingKey[], notes: string) => request<BuildDto>("POST", `/api/builds/${id}/drawings/redraw`, { views, notes }),
  approve: (id: number) => request<BuildDto>("POST", `/api/builds/${id}/drawings/approve`),
  reopen: (id: number) => request<BuildDto>("POST", `/api/builds/${id}/drawings/reopen`),
  render: (id: number, angles: RenderAngle[]) => request<BuildDto>("POST", `/api/builds/${id}/renders`, { angles }),
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
