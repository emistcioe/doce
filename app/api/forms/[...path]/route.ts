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

const parseAnswers = (raw: FormDataEntryValue | null) => {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
};

const extractFormPayload = (formData: FormData) => {
  const answersRaw = formData.get("answers");
  const submitterEmail = formData.get("submitter_email");
  const otpSession = formData.get("otp_session");
  const files: Array<[string, File]> = [];
  formData.forEach((value, key) => {
    if (key.startsWith("field_") && value instanceof File) {
      files.push([key, value]);
    }
  });
  return { answersRaw, submitterEmail, otpSession, files };
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
    const { answersRaw, submitterEmail, otpSession, files } =
      extractFormPayload(formData);

    if (!answersRaw) {
      return NextResponse.json(
        { error: "Failed to submit form", details: "Missing answers payload." },
        { status: 400 }
      );
    }

    const endpoint = `${API_BASE_URL}/api/v1/public/website-mod/forms/${resolved.ownerSlug}/${resolved.formSlug}/submit`;
    const hasFiles = files.length > 0;

    if (!hasFiles) {
      const parsedAnswers = parseAnswers(answersRaw);
      if (!parsedAnswers) {
        return NextResponse.json(
          { error: "Failed to submit form", details: "Invalid answers payload." },
          { status: 400 }
        );
      }
    }

    const response = hasFiles
      ? await fetch(endpoint, {
          method: "POST",
          body: (() => {
            const forwardData = new FormData();
            forwardData.append(
              "answers",
              typeof answersRaw === "string"
                ? answersRaw
                : JSON.stringify(answersRaw)
            );
            if (submitterEmail) {
              forwardData.append("submitter_email", String(submitterEmail));
            }
            if (otpSession) {
              forwardData.append("otp_session", String(otpSession));
            }
            files.forEach(([key, file]) => forwardData.append(key, file));
            return forwardData;
          })(),
        })
      : await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: parseAnswers(answersRaw),
            ...(submitterEmail ? { submitter_email: String(submitterEmail) } : {}),
            ...(otpSession ? { otp_session: String(otpSession) } : {}),
          }),
        });

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
