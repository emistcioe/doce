import { NextRequest, NextResponse } from "next/server";
import { DEPARTMENT_CODE } from "@/lib/env";
import { departmentSlugFromCode } from "@/lib/department";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://cdn.tcioe.edu.np";

const defaultOwnerSlug = departmentSlugFromCode(DEPARTMENT_CODE) || DEPARTMENT_CODE;

const resolvePath = (parts: string[]) => {
  if (parts.length === 1) {
    return { ownerSlug: defaultOwnerSlug, formSlug: parts[0] };
  }
  if (parts.length === 2) {
    return { ownerSlug: parts[0], formSlug: parts[1] };
  }
  return null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const parts = params?.path ?? [];
    const resolved = resolvePath(parts);
    if (!resolved) {
      return NextResponse.json({ error: "Invalid form path" }, { status: 404 });
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/public/website-mod/forms/${resolved.ownerSlug}/${resolved.formSlug}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to load form", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load form",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const parts = params?.path ?? [];
    const resolved = resolvePath(parts);
    if (!resolved) {
      return NextResponse.json({ error: "Invalid form path" }, { status: 404 });
    }

    const formData = await request.formData();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/public/website-mod/forms/${resolved.ownerSlug}/${resolved.formSlug}/submit`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to submit form", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      status: 201,
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to submit form",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
