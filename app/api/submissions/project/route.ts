import { NextRequest, NextResponse } from "next/server";

import { API_BASE } from "@/lib/env";

const API_BASE_URL = API_BASE || "https://cdn.tcioe.edu.np";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    // Handle FormData (with file uploads)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      
      // Forward the FormData directly to the backend
      const response = await fetch(
        `${API_BASE_URL}/api/v1/public/project-mod/projects/submit/`,
        {
          method: "POST",
          body: formData,
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    }
    
    // Handle JSON (backward compatibility)
    const payload = await request.json();
    const response = await fetch(
      `${API_BASE_URL}/api/v1/public/project-mod/projects/submit/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("project submission failed", error);
    return NextResponse.json(
      { error: "Unable to submit project" },
      { status: 500 }
    );
  }
}
