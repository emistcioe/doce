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
  const descriptionHtml = useMemo(
    () => (form?.description ? sanitizeHtml(form.description) : ""),
    [form?.description]
  );

  const handleValueChange = (fieldId: number, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (fieldId: number, file: File | null) => {
    setFiles((prev) => ({ ...prev, [fieldId]: file }));
  };

  const validateFields = (targetFields: RegistrationField[], replace = false) => {
    const errors: Record<string, string> = {};
    targetFields.forEach((field) => {
      if (field.fieldType === "section_break") {
        return;
      }
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
      if (field.fieldType === "section_break") {
        if (current.fields.length || current.title || current.description) {
          result.push(current);
        }
        index += 1;
        current = {
          id: `section-${index}`,
          title: field.label,
          description: field.helpText,
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
  }, [form?.uuid]);

  const totalSections = sections.length;
  const currentSection = sections[activeSectionIndex] ?? sections[0];
  const sectionFields = currentSection?.fields ?? [];

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
        if (otp.status !== "verified" || !otp.sessionId) {
          setError("Please verify your college email before submitting.");
          setSubmitting(false);
          return;
        }
      }
      const answers = fields
        .filter((field) => field.fieldType !== "section_break")
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-10">
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
            <p className="text-xs text-slate-500">
              Fields marked with <span className="font-semibold text-red-500">*</span> are required.
            </p>
          </div>
        </div>

        {requiresCollegeEmail && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
            <Label className="text-sm font-semibold text-blue-900">
              College Email Verification
            </Label>
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
                disabled={!submitterEmail || otp.status === "sending"}
                onClick={() => otp.send(submitterEmail)}
              >
                {otp.status === "sending" ? "Sending..." : "Send OTP"}
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
                  disabled={!otpCode || otp.status === "verifying"}
                  onClick={() => otp.verify(otpCode)}
                >
                  {otp.status === "verifying" ? "Verifying..." : "Verify"}
                </Button>
              </div>
            )}

            {otp.status === "verified" && (
              <p className="mt-2 text-sm text-emerald-600">Email verified successfully.</p>
            )}
            {otp.status === "error" && (
              <p className="mt-2 text-sm text-red-600">{otp.error}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {(totalSections > 1 || currentSection?.title || currentSection?.description) && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {totalSections > 1 && (
                <>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      Section {activeSectionIndex + 1} of {totalSections}
                    </p>
                    <p className="text-xs text-slate-500">
                      Progress {Math.round(((activeSectionIndex + 1) / totalSections) * 100)}%
                    </p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{ width: `${((activeSectionIndex + 1) / totalSections) * 100}%` }}
                    />
                  </div>
                </>
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
            const options = field.options ?? [];
            const ratingMax = Number(field.config?.max ?? 5);
            const placeholder = field.config?.placeholder ?? "";
            const questionImage = field.config?.question_image as string | undefined;

            return (
              <div
                key={fieldId}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {questionImage && (
                  <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      src={questionImage}
                      alt="Question illustration"
                      className="h-auto w-full object-contain"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-900">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </Label>
                  {field.helpText && (
                    <p className="text-xs text-slate-500">{field.helpText}</p>
                  )}
                </div>

                <div className="mt-3 space-y-3">
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
                      <p className="text-xs text-slate-500">
                        Rating: {value || 1} / {ratingMax}
                      </p>
                    </div>
                  )}

                  {field.fieldType === "image" && (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
                      <Label className="text-xs font-medium text-slate-700">
                        Upload image
                      </Label>
                      <Input
                        className="mt-2"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(
                            fieldId,
                            e.target.files?.[0] || null
                          )
                        }
                      />
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <p className="mt-3 text-xs text-red-500">{errorMessage}</p>
                )}
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

          {!allowAnonymous && requiresCollegeEmail && otp.status !== "verified" && (
            <p className="text-xs text-red-500">
              Please verify your college email before submitting.
            </p>
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
  );
}
