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

const sanitizeHtml = (html: string) => {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc
    .querySelectorAll("script, iframe, object, embed")
    .forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name.toLowerCase().startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
};

const resolveFieldType = (field: any) =>
  String(field?.fieldType ?? field?.field_type ?? "");

const resolveFieldLabel = (field: any) =>
  String(field?.label ?? field?.field_label ?? "");

const resolveFieldHelpText = (field: any) =>
  String(field?.helpText ?? field?.help_text ?? "");

const resolveFieldOptions = (field: any) =>
  Array.isArray(field?.options) ? field.options : [];

const resolveFieldConfig = (field: any) =>
  (field?.config && typeof field.config === "object" ? field.config : {}) as Record<
    string,
    any
  >;

const resolveQuestionImage = (field: any) => {
  const config = resolveFieldConfig(field);
  const raw =
    config?.question_image ??
    config?.questionImage ??
    field?.question_image ??
    field?.questionImage ??
    null;
  if (!raw || typeof raw !== "string") return undefined;
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://cdn.tcioe.edu.np";
  if (raw.startsWith("/")) {
    return `${base.replace(/\/$/, "")}${raw}`;
  }
  return raw;
};

const resolveFormLoadError = async (response: Response) => {
  if (response.status === 404) {
    return "This form doesn't exist or is no longer available.";
  }
  if (response.status === 400) {
    return "Invalid form link.";
  }
  const text = await response.text();
  if (text) {
    try {
      const data = JSON.parse(text);
      return data?.error || data?.detail || data?.message || "Failed to load form";
    } catch {
      return text;
    }
  }
  return "Failed to load form";
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
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
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
          const message = await resolveFormLoadError(response);
          throw new Error(message);
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
        if (resolveFieldType(field) === "rating" && next[field.id] === undefined) {
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
  const isEmailVerified = otp.status === "verified";
  const canAccessForm = !requiresCollegeEmail || isEmailVerified;
  const ownerName = form?.ownerName ?? (form as any)?.owner_name ?? "";
  const descriptionHtml = useMemo(
    () => (form?.description ? sanitizeHtml(form.description) : ""),
    [form?.description]
  );
  const questionMeta = useMemo(() => {
    const map = new Map<number, number>();
    let count = 0;
    fields.forEach((field) => {
      if (resolveFieldType(field) === "section_break") {
        return;
      }
      count += 1;
      map.set(field.id, count);
    });
    return { map, total: count };
  }, [fields]);

  const handleValueChange = (fieldId: number, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (fieldId: number, file: File | null) => {
    setFiles((prev) => ({ ...prev, [fieldId]: file }));
    setFilePreviews((prev) => {
      const key = String(fieldId);
      const existing = prev[key];
      if (existing) {
        URL.revokeObjectURL(existing);
      }
      if (!file) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: URL.createObjectURL(file) };
    });
  };

  const validateFields = (targetFields: RegistrationField[], replace = false) => {
    const errors: Record<string, string> = {};
    targetFields.forEach((field) => {
      const fieldType = resolveFieldType(field);
      if (fieldType === "section_break") {
        return;
      }
      const value = values[field.id];
      if (field.required) {
        if (fieldType === "image") {
          if (!files[field.id]) {
            errors[field.id] = "This field is required.";
          }
        } else if (isEmptyValue(value)) {
          errors[field.id] = "This field is required.";
        }
      }
    });
    if (replace) {
      setFieldErrors(errors);
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        targetFields.forEach((field) => {
          delete next[field.id];
        });
        return { ...next, ...errors };
      });
    }
    return Object.keys(errors).length === 0;
  };

  const validateAll = () => validateFields(fields, true);

  const sections = useMemo(() => {
    const result: { id: string; title?: string; description?: string; fields: RegistrationField[] }[] = [];
    let current = { id: "section-1", title: "", description: "", fields: [] as RegistrationField[] };
    let index = 1;

    fields.forEach((field) => {
      const fieldType = resolveFieldType(field);
      if (fieldType === "section_break") {
        if (current.fields.length || current.title || current.description) {
          result.push(current);
        }
        index += 1;
        current = {
          id: `section-${index}`,
          title: resolveFieldLabel(field),
          description: resolveFieldHelpText(field),
          fields: [],
        };
      } else {
        current.fields.push(field);
      }
    });

    if (current.fields.length || current.title || current.description || result.length === 0) {
      result.push(current);
    }

    return result;
  }, [fields]);

  useEffect(() => {
    setActiveSectionIndex(0);
    setFilePreviews((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      return {};
    });
  }, [form?.uuid]);

  const totalSections = sections.length;
  const currentSection = sections[activeSectionIndex] ?? sections[0];
  const sectionFields = currentSection?.fields ?? [];
  const sectionQuestionNumbers = sectionFields
    .map((field) => questionMeta.map.get(field.id))
    .filter((value): value is number => typeof value === "number");
  const sectionQuestionRange =
    sectionQuestionNumbers.length > 0
      ? {
          start: sectionQuestionNumbers[0],
          end: sectionQuestionNumbers[sectionQuestionNumbers.length - 1],
        }
      : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formSlug) {
      setError("Invalid form URL");
      return;
    }

    if (!validateAll()) {
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
        if (!canAccessForm) {
          setSubmitting(false);
          return;
        }
        if (!otp.sessionId) {
          setError("Please verify your college email before submitting.");
          setSubmitting(false);
          return;
        }
      }
      const answers = fields
        .filter((field) => resolveFieldType(field) !== "section_break")
        .map((field) => ({
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
        if (resolveFieldType(field) === "image") {
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
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2.75c-5.108 0-9.25 4.142-9.25 9.25s4.142 9.25 9.25 9.25 9.25-4.142 9.25-9.25-4.142-9.25-9.25-9.25zm0 4.5a.9.9 0 01.9.9v4.6a.9.9 0 11-1.8 0v-4.6a.9.9 0 01.9-.9zm0 9.3a1.1 1.1 0 110-2.2 1.1 1.1 0 010 2.2z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900">Form not found</h2>
              <p className="text-sm text-slate-600">{error}</p>
              <p className="text-xs text-slate-500">
                Please check the link or contact the department for a valid form URL.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" onClick={() => window.location.assign("/")}>
                  Go to homepage
                </Button>
                <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-10">

        {requiresCollegeEmail && !canAccessForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
            <div className="w-full max-w-2xl rounded-2xl border border-blue-100 bg-white p-6 shadow-xl">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-semibold text-blue-900">
                  College Email Verification
                </Label>
                <p className="text-xs text-blue-700">
                  Please verify your college email before accessing the form.
                </p>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  placeholder="name@tcioe.edu.np"
                  type="email"
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!submitterEmail || otp.loading}
                  onClick={() => otp.requestOtp({ email: submitterEmail })}
                >
                  {otp.loading ? "Sending..." : "Send OTP"}
                </Button>
              </div>

              {otp.status === "sent" && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter OTP"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!otpCode || otp.verifying}
                    onClick={() => otp.verifyOtp({ email: submitterEmail, code: otpCode })}
                  >
                    {otp.verifying ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              )}

              {otp.status === "verified" && (
                <p className="mt-2 text-sm text-emerald-600">Email verified successfully.</p>
              )}
              {otp.error && (
                <p className="mt-2 text-sm text-red-600">{otp.error}</p>
              )}
            </div>
          </div>
        )}


        
        <div className={canAccessForm ? "" : "pointer-events-none blur-sm opacity-60"}>
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                Public Form
              </span>
              {ownerName && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
                  Owned by {ownerName}
                </span>
              )}
              {requiresCollegeEmail && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                  College email verification
                </span>
              )}
              {allowAnonymous && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  Anonymous submissions
                </span>
              )}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {form.title}
            </h1>
            {descriptionHtml && (
              <div
                className="text-sm leading-relaxed text-slate-600 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-slate-200 [&_a]:text-blue-700 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                Fields marked with <span className="font-semibold text-red-500">*</span> are
                required.
              </span>
              {questionMeta.total > 0 && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                  {questionMeta.total} questions
                </span>
              )}
            </div>
          </div>
        </div>
          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
          {(totalSections > 1 || currentSection?.title || currentSection?.description) && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {totalSections > 1 && (
                <>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      Section {activeSectionIndex + 1} of {totalSections}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {sectionQuestionRange && (
                        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 shadow-sm">
                          Questions {sectionQuestionRange.start}–{sectionQuestionRange.end} of{" "}
                          {questionMeta.total}
                        </span>
                      )}
                      <span>
                        Progress {Math.round(((activeSectionIndex + 1) / totalSections) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{ width: `${((activeSectionIndex + 1) / totalSections) * 100}%` }}
                    />
                  </div>
                </>
              )}
              {totalSections === 1 && sectionQuestionRange && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 shadow-sm">
                    Questions {sectionQuestionRange.start}–{sectionQuestionRange.end} of{" "}
                    {questionMeta.total}
                  </span>
                </div>
              )}
              {(currentSection?.title || currentSection?.description) && (
                <div className="pt-2">
                  {currentSection?.title && (
                    <p className="text-base font-semibold text-slate-900">{currentSection.title}</p>
                  )}
                  {currentSection?.description && (
                    <p className="text-sm text-slate-600">{currentSection.description}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {sectionFields.map((field) => {
            const fieldId = field.id;
            const value = values[fieldId];
            const errorMessage = fieldErrors[fieldId];
            const fieldType = resolveFieldType(field);
            const label = resolveFieldLabel(field);
            const helpText = resolveFieldHelpText(field);
            const options = resolveFieldOptions(field);
            const config = resolveFieldConfig(field);
            const ratingMax = Number(config?.max ?? 5);
            const placeholder = config?.placeholder ?? "";
            const questionImage = resolveQuestionImage(field);
            const questionNumber = questionMeta.map.get(fieldId);

            return (
              <div
                key={fieldId}
                className={`rounded-2xl border p-5 shadow-sm transition-shadow ${
                  errorMessage
                    ? "border-red-200 bg-red-50/40 shadow-red-100"
                    : "border-slate-200 bg-white hover:shadow-md"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-center gap-3 sm:flex-col sm:items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow">
                      {questionNumber ?? "-"}
                    </div>
                    {field.required && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {questionImage && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <img
                          src={questionImage}
                          alt="Question illustration"
                          className="h-auto w-full max-h-64 object-contain"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      {typeof questionNumber === "number" && questionMeta.total > 0 && (
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Question {questionNumber} of {questionMeta.total}
                        </p>
                      )}
                      <Label className="text-sm font-semibold text-slate-900">
                        {label}
                        {field.required && <span className="text-red-500"> *</span>}
                      </Label>
                      {helpText && (
                        <p className="text-xs text-slate-500">{helpText}</p>
                      )}
                    </div>

                    <div className="mt-4 space-y-3">
                      {fieldType === "short_text" && (
                        <Input
                          value={value || ""}
                          placeholder={placeholder}
                          onChange={(e) => handleValueChange(fieldId, e.target.value)}
                        />
                      )}

                      {fieldType === "paragraph" && (
                        <Textarea
                          value={value || ""}
                          placeholder={placeholder}
                          rows={4}
                          onChange={(e) => handleValueChange(fieldId, e.target.value)}
                        />
                      )}

                      {fieldType === "number" && (
                        <Input
                          type="number"
                          value={value || ""}
                          placeholder={placeholder}
                          onChange={(e) => handleValueChange(fieldId, e.target.value)}
                        />
                      )}

                      {fieldType === "email" && (
                        <Input
                          type="email"
                          value={value || ""}
                          placeholder={placeholder}
                          onChange={(e) => handleValueChange(fieldId, e.target.value)}
                        />
                      )}

                      {fieldType === "phone" && (
                        <Input
                          type="tel"
                          value={value || ""}
                          placeholder={placeholder}
                          onChange={(e) => handleValueChange(fieldId, e.target.value)}
                        />
                      )}

                      {fieldType === "date" && (
                        <Input
                          type="date"
                          value={value || ""}
                          onChange={(e) => handleValueChange(fieldId, e.target.value)}
                        />
                      )}

                      {fieldType === "time" && (
                        <Input
                          type="time"
                          value={value || ""}
                          onChange={(e) => handleValueChange(fieldId, e.target.value)}
                        />
                      )}

                      {fieldType === "select" && (
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

                      {fieldType === "radio" && (
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

                      {(fieldType === "multi_select" || fieldType === "checkbox") && (
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

                      {fieldType === "rating" && (
                        <div className="space-y-2">
                          <Slider
                            value={[value || 1]}
                            min={1}
                            max={ratingMax}
                            step={1}
                            onValueChange={(val) => handleValueChange(fieldId, val[0])}
                          />
                          <p className="text-xs text-slate-500">
                            Rating: {value || 1} / {ratingMax}
                          </p>
                        </div>
                      )}

                      {fieldType === "image" && (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
                          <Label className="text-xs font-medium text-slate-700">
                            Upload image
                          </Label>
                          {filePreviews[fieldId] && (
                            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                              <img
                                src={filePreviews[fieldId]}
                                alt="Selected upload"
                                className="h-40 w-full object-contain"
                              />
                            </div>
                          )}
                          <Input
                            className="mt-2"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleFileChange(fieldId, e.target.files?.[0] || null)
                            }
                          />
                          {files[fieldId] && (
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                              <span>{files[fieldId]?.name}</span>
                              <button
                                type="button"
                                className="text-red-500 hover:underline"
                                onClick={() => handleFileChange(fieldId, null)}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {errorMessage && (
                      <p className="mt-3 text-xs font-medium text-red-600">
                        {errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {totalSections > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="secondary"
                disabled={activeSectionIndex === 0}
                onClick={() => {
                  setActiveSectionIndex((prev) => Math.max(prev - 1, 0));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Previous section
              </Button>
              {activeSectionIndex < totalSections - 1 ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (sectionFields.length && !validateFields(sectionFields)) {
                      return;
                    }
                    setActiveSectionIndex((prev) => Math.min(prev + 1, totalSections - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Next section
                </Button>
              ) : null}
            </div>
          )}


          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {activeSectionIndex === totalSections - 1 ? (
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Response"}
            </Button>
          ) : null}
        </form>
        </div>
      </div>
    </div>
  );
}
