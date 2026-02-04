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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
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
  params: { owner: string; slug: string };
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

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/registration-forms/${params.owner}/${params.slug}`
        );
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
  }, [params.owner, params.slug]);

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
  const ownerName =
    form?.ownerName ?? (form as any)?.owner_name ?? "";

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

      const response = await fetch(
        `/api/registration-forms/${params.owner}/${params.slug}`,
        {
          method: "POST",
          body: formData,
        }
      );

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
    return <div className="p-8 text-center">Loading form...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  if (!form) {
    return <div className="p-8 text-center">Form not found.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{ownerName}</p>
          <h1 className="text-2xl font-semibold">{form.title}</h1>
          {form.description && (
            <p className="text-sm text-gray-600">{form.description}</p>
          )}
          {allowAnonymous && (
            <p className="text-xs text-gray-500">
              Anonymous mode: submitter metadata is not stored.
            </p>
          )}
        </div>

        {requiresCollegeEmail && (
          <div className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              College email verification required
            </p>
            <div className="space-y-2">
              <Label className="text-sm font-medium">College Email</Label>
              <Input
                type="email"
                value={submitterEmail}
                placeholder="name@tcioe.edu.np"
                onChange={(e) => {
                  setSubmitterEmail(e.target.value);
                  if (otp.status !== "idle") {
                    otp.reset();
                    setOtpCode("");
                  }
                }}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await otp.requestOtp({ email: submitterEmail.trim() });
                    } catch (err) {
                      // error handled in hook
                    }
                  }}
                  disabled={otp.loading || !submitterEmail}
                >
                  {otp.loading ? "Sending..." : "Send code"}
                </Button>
                <Input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter OTP"
                  className="sm:max-w-[200px]"
                />
                <Button
                  type="button"
                  onClick={async () => {
                    try {
                      await otp.verifyOtp({
                        email: submitterEmail.trim(),
                        code: otpCode.trim(),
                      });
                    } catch (err) {
                      // error handled in hook
                    }
                  }}
                  disabled={otp.verifying || otp.status !== "sent" || otpCode.length < 6}
                >
                  {otp.verifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
              {otp.status === "verified" && (
                <p className="text-xs text-green-600">Email verified</p>
              )}
              {otp.error && <p className="text-xs text-red-600">{otp.error}</p>}
            </div>
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
                            onCheckedChange={(checkedState) => {
                              const current = Array.isArray(value) ? value : [];
                              const isChecked = checkedState === true;
                              if (isChecked) {
                                handleValueChange(fieldId, [...current, option]);
                              } else {
                                handleValueChange(
                                  fieldId,
                                  current.filter((item: string) => item !== option)
                                );
                              }
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
                      min={1}
                      max={ratingMax}
                      step={1}
                      value={[Number(value) || 1]}
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
                      handleFileChange(fieldId, e.target.files?.[0] || null)
                    }
                  />
                )}

                {errorMessage && (
                  <p className="text-xs text-red-600">{errorMessage}</p>
                )}
              </div>
            );
          })}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="pt-2">
          <Button
            type="submit"
            disabled={
              submitting || (requiresCollegeEmail && otp.status !== "verified")
            }
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
