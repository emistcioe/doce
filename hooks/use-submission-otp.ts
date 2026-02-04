import { useCallback, useState } from "react";

type SubmissionPurpose =
  | "project_submission"
  | "research_submission"
  | "form_submission";

type OtpStatus = "idle" | "sent" | "verified";

interface RequestParams {
  email: string;
  fullName?: string;
}

interface VerifyParams {
  email: string;
  code: string;
}

export function useSubmissionOtp(purpose: SubmissionPurpose) {
  const [status, setStatus] = useState<OtpStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const requestOtp = useCallback(
    async ({ email, fullName }: RequestParams) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/submissions/otp/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, full_name: fullName, purpose }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message =
            data?.detail ||
            data?.error ||
            "Unable to send verification code";
          throw new Error(message);
        }
        setSessionId(data.session_id || data.sessionId || null);
        setStatus("sent");
        return data;
      } catch (err) {
        console.error("otp request error", err);
        setError(err instanceof Error ? err.message : "Failed to send OTP");
        setStatus("idle");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [purpose]
  );

  const verifyOtp = useCallback(
    async ({ email, code }: VerifyParams) => {
      if (!sessionId) {
        throw new Error("Request a verification code first");
      }
      setVerifying(true);
      setError(null);
      try {
        const response = await fetch("/api/submissions/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp_code: code,
            session_id: sessionId,
            purpose,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message =
            data?.detail || data?.error || "Unable to verify the OTP";
          throw new Error(message);
        }
        setStatus("verified");
        return data;
      } catch (err) {
        console.error("otp verify error", err);
        setError(err instanceof Error ? err.message : "OTP verification failed");
        setStatus("sent");
        throw err;
      } finally {
        setVerifying(false);
      }
    },
    [purpose, sessionId]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setSessionId(null);
    setError(null);
  }, []);

  return {
    status,
    sessionId,
    error,
    loading,
    verifying,
    requestOtp,
    verifyOtp,
    reset,
  };
}
