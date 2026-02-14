import { NextRequest } from "next/server";

import { API_BASE } from "@/lib/env";

export const dynamic = "force-dynamic";

const ALUMNI_TRACER_PATH = "/api/v1/public/website-mod/alumni-tracer";

export async function GET(request: NextRequest) {
  const target = new URL(`${API_BASE.replace(/\/$/, "")}${ALUMNI_TRACER_PATH}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  try {
    const response = await fetch(target.toString(), {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    const body = await response.text();
    const contentType =
      response.headers.get("content-type") || "application/json";

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "cache-control": "no-store",
        "content-type": contentType,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to load alumni tracer submissions",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      }
    );
  }
}
