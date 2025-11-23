const hasProcessEnv =
  typeof process !== "undefined" && typeof process.env !== "undefined";

const runtimeEnv: Record<string, string | undefined> = hasProcessEnv
  ? process.env
  : {};

export const USE_PROXY =
  (process.env.NEXT_PUBLIC_USE_PROXY || "").toLowerCase() === "true";

export const API_BASE = "https://cdn.tcioe.edu.np";
export const API_PUBLIC_PREFIX = "/api/v1/public/department-mod";
export const API_NOTICE_PUBLIC_PREFIX = "/api/v1/public/notice-mod";
export const API_WEBSITE_PUBLIC_PREFIX = "/api/v1/public/website-mod";
export const API_RESEARCH_PUBLIC_PREFIX = "/api/v1/public/research-mod";
export const API_PROJECT_PUBLIC_PREFIX = "/api/v1/public/project-mod";
export const API_JOURNAL_PUBLIC_PREFIX = "/api/v1/public/journal-mod";
export const SCHEDULE_API_BASE = "https://schedule-backend.tcioe.edu.np/api";

export const DEPARTMENT_CODE = (
  process.env.NEXT_PUBLIC_DEPARTMENT || "doece"
).toLowerCase();

// Enable verbose API URL logging by setting DEBUG_API=true or NEXT_PUBLIC_DEBUG_API=true
const PRIVATE_DEBUG_FLAG = runtimeEnv.DEBUG_API;
const PUBLIC_DEBUG_FLAG = runtimeEnv.NEXT_PUBLIC_DEBUG_API;
export const DEBUG_API =
  (PRIVATE_DEBUG_FLAG || PUBLIC_DEBUG_FLAG || "").toLowerCase() === "true";

export function getPublicApiUrl(path: string) {
  // When using Next.js route proxy, prepend /api/proxy
  if (USE_PROXY) return `/api/proxy${path.startsWith("/") ? "" : "/"}${path}`;
  const base = API_BASE.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${suffix}`;
  if (DEBUG_API) {
    try {
    } catch (e) {
      /* ignore */
    }
  }
  return `${base}${suffix}`;
}
