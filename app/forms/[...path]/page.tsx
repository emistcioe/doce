"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSubmissionOtp } from "@/hooks/use-submission-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";

interface RegistrationField {
  id: number;
  label: string;
  helpText?: string;
  fieldType: string;
  required: boolean;
  options?: string[];
  config?: Record<string, any>;
}

interface RegistrationForm {
  uuid: string;
  title: string;
  description?: string;
  ownerName?: string;
  slug: string;
  ownerSlug: string;
  fields: RegistrationField[];
  allowAnonymous?: boolean;
  requireCollegeEmail?: boolean;
}

const isEmptyValue = (value: any) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

export default function RegistrationFormPage({
  params,
}: {
  params: { path: string[] };
}) {
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitterEmail, setSubmitterEmail] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const otp = useSubmissionOtp("form_submission");

  const pathParts = params?.path ?? [];
  const hasOwner = pathParts.length === 2;
  const ownerSlug = hasOwner ? pathParts[0] : undefined;
  const formSlug = hasOwner ? pathParts[1] : pathParts[0];

  useEffect(() => {
    const fetchForm = async () => {
      if (!formSlug) {
        setError("Invalid form URL");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const apiPath = ownerSlug ? `/api/forms/${ownerSlug}/${formSlug}` : `/api/forms/${formSlug}`;
        const response = await fetch(apiPath);
        if (!response.ok) {
          throw new Error("Failed to load form");
        }
        const data = await response.json();
        setForm(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formSlug, ownerSlug]);

  useEffect(() => {
    if (!form) return;
    setValues((prev) => {
      const next = { ...prev };
      form.fields.forEach((field) => {
        if (field.fieldType === "rating" && next[field.id] === undefined) {
          next[field.id] = 1;
        }
      });
      return next;
    });
  }, [form]);

  const fields = useMemo(() => form?.fields ?? [], [form]);
  const requiresCollegeEmail =
    form?.requireCollegeEmail ?? (form as any)?.require_college_email ?? false;
  const allowAnonymous =
    form?.allowAnonymous ?? (form as any)?.allow_anonymous ?? false;
  const ownerName = form?.ownerName ?? (form as any)?.owner_name ?? "";

  const handleValueChange = (fieldId: number, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (fieldId: number, file: File | null) => {
    setFiles((prev) => ({ ...prev, [fieldId]: file }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    fields.forEach((field) => {
      const value = values[field.id];
      if (field.required) {
        if (field.fieldType === "image") {
          if (!files[field.id]) {
            errors[field.id] = "This field is required.";
          }
        } else if (isEmptyValue(value)) {
          errors[field.id] = "This field is required.";
        }
      }
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formSlug) {
      setError("Invalid form URL");
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      if (requiresCollegeEmail) {
        if (!submitterEmail) {
          setError("College email is required for this form.");
          setSubmitting(false);
          return;
        }
        if (otp.status !== "verified" || !otp.sessionId) {
          setError("Please verify your college email before submitting.");
          setSubmitting(false);
          return;
        }
      }
      const answers = fields.map((field) => ({
        field: field.id,
        value: values[field.id],
      }));

      const formData = new FormData();
      formData.append("answers", JSON.stringify(answers));
      if (requiresCollegeEmail && otp.sessionId) {
        formData.append("submitter_email", submitterEmail);
        formData.append("otp_session", otp.sessionId);
      }

      fields.forEach((field) => {
        if (field.fieldType === "image") {
          const file = files[field.id];
          if (file) {
            formData.append(`field_${field.id}`, file);
          }
        }
      });

      const apiPath = ownerSlug ? `/api/forms/${ownerSlug}/${formSlug}` : `/api/forms/${formSlug}`;
      const response = await fetch(apiPath, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to submit form");
      }

      setSuccess("Response submitted successfully.");
      setValues({});
      setFiles({});
      setFieldErrors({});
      if (requiresCollegeEmail) {
        setSubmitterEmail("");
        setOtpCode("");
        otp.reset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-center text-gray-500">Loading form...</p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">{form.title}</h1>
          {form.description && (
            <p className="text-sm text-gray-600">{form.description}</p>
          )}
          {ownerName && (
            <p className="text-xs text-gray-500">Owned by {ownerName}</p>
          )}
        </div>

        {requiresCollegeEmail && (
          <div className="mt-6 space-y-3 rounded-md border border-blue-100 bg-blue-50 p-4">
            <Label className="text-sm font-medium text-gray-700">
              College Email Verification
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
                placeholder="name@tcioe.edu.np"
                type="email"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!submitterEmail || otp.status === "sending"}
                onClick={() => otp.send(submitterEmail)}
              >
                {otp.status === "sending" ? "Sending..." : "Send OTP"}
              </Button>
            </div>

            {otp.status === "sent" && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter OTP"
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!otpCode || otp.status === "verifying"}
                  onClick={() => otp.verify(otpCode)}
                >
                  {otp.status === "verifying" ? "Verifying..." : "Verify"}
                </Button>
              </div>
            )}

            {otp.status === "verified" && (
              <p className="text-sm text-green-600">Email verified successfully.</p>
            )}
            {otp.status === "error" && (
              <p className="text-sm text-red-600">{otp.error}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {fields.map((field) => {
            const fieldId = field.id;
            const value = values[fieldId];
            const errorMessage = fieldErrors[fieldId];
            const options = field.options ?? [];
            const ratingMax = Number(field.config?.max ?? 5);
            const placeholder = field.config?.placeholder ?? "";

            return (
              <div key={fieldId} className="space-y-2">
                <Label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </Label>
                {field.helpText && (
                  <p className="text-xs text-gray-500">{field.helpText}</p>
                )}

                {field.fieldType === "short_text" && (
                  <Input
                    value={value || ""}
                    placeholder={placeholder}
                    onChange={(e) => handleValueChange(fieldId, e.target.value)}
                  />
                )}

                {field.fieldType === "paragraph" && (
                  <Textarea
                    value={value || ""}
                    placeholder={placeholder}
                    rows={4}
                    onChange={(e) => handleValueChange(fieldId, e.target.value)}
                  />
                )}

                {field.fieldType === "number" && (
                  <Input
                    type="number"
                    value={value || ""}
                    placeholder={placeholder}
                    onChange={(e) => handleValueChange(fieldId, e.target.value)}
                  />
                )}

                {field.fieldType === "email" && (
                  <Input
                    type="email"
                    value={value || ""}
                    placeholder={placeholder}
                    onChange={(e) => handleValueChange(fieldId, e.target.value)}
                  />
                )}

                {field.fieldType === "phone" && (
                  <Input
                    type="tel"
                    value={value || ""}
                    placeholder={placeholder}
                    onChange={(e) => handleValueChange(fieldId, e.target.value)}
                  />
                )}

                {field.fieldType === "date" && (
                  <Input
                    type="date"
                    value={value || ""}
                    onChange={(e) => handleValueChange(fieldId, e.target.value)}
                  />
                )}

                {field.fieldType === "time" && (
                  <Input
                    type="time"
                    value={value || ""}
                    onChange={(e) => handleValueChange(fieldId, e.target.value)}
                  />
                )}

                {field.fieldType === "select" && (
                  <Select
                    value={value || ""}
                    onValueChange={(val) => handleValueChange(fieldId, val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.fieldType === "radio" && (
                  <RadioGroup
                    value={value || ""}
                    onValueChange={(val) => handleValueChange(fieldId, val)}
                  >
                    {options.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${fieldId}-${option}`} />
                        <Label htmlFor={`${fieldId}-${option}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {(field.fieldType === "multi_select" ||
                  field.fieldType === "checkbox") && (
                  <div className="space-y-2">
                    {options.map((option) => {
                      const checked = Array.isArray(value)
                        ? value.includes(option)
                        : false;
                      return (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(checkedValue) => {
                              let next = Array.isArray(value) ? [...value] : [];
                              if (checkedValue) {
                                next.push(option);
                              } else {
                                next = next.filter((item) => item !== option);
                              }
                              handleValueChange(fieldId, next);
                            }}
                          />
                          <Label>{option}</Label>
                        </div>
                      );
                    })}
                  </div>
                )}

                {field.fieldType === "rating" && (
                  <div className="space-y-2">
                    <Slider
                      value={[value || 1]}
                      min={1}
                      max={ratingMax}
                      step={1}
                      onValueChange={(val) => handleValueChange(fieldId, val[0])}
                    />
                    <p className="text-xs text-gray-500">
                      Rating: {value || 1} / {ratingMax}
                    </p>
                  </div>
                )}

                {field.fieldType === "image" && (
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(
                        fieldId,
                        e.target.files?.[0] || null
                      )
                    }
                  />
                )}

                {errorMessage && (
                  <p className="text-xs text-red-500">{errorMessage}</p>
                )}
              </div>
            );
          })}

          {!allowAnonymous && requiresCollegeEmail && otp.status !== "verified" && (
            <p className="text-xs text-red-500">
              Please verify your college email before submitting.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : "Submit Response"}
          </Button>
        </form>
      </div>
    </div>
  );
}
