import type { QueryParams } from "@/lib/api/fetch";
import type {
  DepartmentDetail,
  DepartmentDownload,
  DepartmentEvent,
  DepartmentPlan,
  DepartmentProgram,
  DepartmentStaff,
  EventGalleryItem,
  Paginated,
} from "@/lib/types/department";

function buildQuery(params?: QueryParams) {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.set(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

function absolutize(path: string) {
  if (typeof window !== "undefined") return path;
  // Server-side: build an absolute URL for relative API routes
  if (/^https?:\/\//i.test(path)) return path;
  const vercel = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const base = site || vercel || "http://localhost:3000";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function getJson<T>(path: string, params?: QueryParams): Promise<T> {
  const url = absolutize(`${path}${buildQuery(params)}`);
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { accept: "application/json" },
    });
    try {
      const clone = res.clone();
      const text = await clone.text().catch(() => "");
      const truncated =
        text.length > 2000 ? `${text.slice(0, 2000)}... (truncated)` : text;
    } catch (e) {
      /* ignore logging errors */
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `GET ${url} failed: ${res.status} ${res.statusText} ${text}`
      );
    }
    return (await res.json()) as T;
  } catch (error) {
    // Re-throw after logging
    console.warn(`[getJson] failed for ${url}:`, error);
    throw error;
  }
}

export function getDepartment(slug: string): Promise<DepartmentDetail> {
  return getJson<DepartmentDetail>(`/api/department/${slug}`);
}

export function listDepartmentDownloads(
  slug: string,
  params?: { limit?: number; offset?: number }
): Promise<Paginated<DepartmentDownload>> {
  return getJson<Paginated<DepartmentDownload>>(
    `/api/department/${slug}/downloads`,
    params
  );
}

// Events now come from the global website endpoint; keep signature for compatibility
export function listDepartmentEvents(
  departmentUuid: string,
  params?: {
    limit?: number;
    offset?: number;
    ordering?: string;
    search?: string;
  }
): Promise<Paginated<DepartmentEvent>> {
  const { limit, offset, ordering, search } = params || {};
  const query: QueryParams = {
    department: departmentUuid,
    limit,
    offset,
    ordering,
    search,
  };

  return getJson<Paginated<DepartmentEvent>>(
    `/api/website/global-events`,
    query
  );
}

export function listDepartmentPlans(
  slug: string,
  params?: { limit?: number; offset?: number }
): Promise<Paginated<DepartmentPlan>> {
  return getJson<Paginated<DepartmentPlan>>(
    `/api/department/${slug}/plans`,
    params
  );
}

export function listDepartmentPrograms(
  slug: string,
  params?: {
    limit?: number;
    offset?: number;
    ordering?: string;
    search?: string;
  }
): Promise<Paginated<DepartmentProgram>> {
  return getJson<Paginated<DepartmentProgram>>(
    `/api/department/${slug}/programs`,
    params
  );
}

export function listDepartmentStaffs(
  slug: string,
  params?: {
    limit?: number;
    offset?: number;
    ordering?: string;
    search?: string;
  }
): Promise<Paginated<DepartmentStaff>> {
  return getJson<Paginated<DepartmentStaff>>(
    `/api/department/${slug}/staffs`,
    params
  );
}

export function listEventGallery(
  eventId: number,
  params?: { limit?: number; offset?: number }
): Promise<Paginated<EventGalleryItem>> {
  return getJson<Paginated<EventGalleryItem>>(
    `/api/department/events/${eventId}/gallery`,
    params
  );
}
