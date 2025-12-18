"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import type { DepartmentDetail } from "@/lib/types/department";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Plus, Trash2, Mail, ArrowRight } from "lucide-react";

interface AuthorForm {
  givenName: string;
  familyName: string;
  email: string;
  affiliation: string;
  country: string;
  bio: string;
}

interface JournalFormValues {
  title: string;
  genre: string;
  abstract: string;
  keywords: string;
  discipline: string;
  year: string;
  volume: string;
  number: string;
  pages: string;
  submittedByName: string;
  submittedByEmail: string;
  authors: AuthorForm[];
}

const defaultValues: JournalFormValues = {
  title: "",
  genre: "",
  abstract: "",
  keywords: "",
  discipline: "",
  year: "",
  volume: "",
  number: "",
  pages: "",
  submittedByName: "",
  submittedByEmail: "",
  authors: [
    { givenName: "", familyName: "", email: "", affiliation: "", country: "", bio: "" },
  ],
};

interface Props {
  department: DepartmentDetail;
}

export function JournalSubmissionForm({ department }: Props) {
  const form = useForm<JournalFormValues>({ defaultValues });
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "authors" });
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isVerified, setIsVerified] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    email: string;
    sessionId: string;
  } | null>(null);

  // Check for verification completion
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "true") {
      const stored = sessionStorage.getItem("verification_complete");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.purpose === "journal_submission" && Date.now() - data.verifiedAt < 30 * 60 * 1000) {
            setIsVerified(true);
            setVerificationData({ email: data.email, sessionId: data.sessionId });
            form.setValue("submittedByEmail", data.email);
            if (data.name) form.setValue("submittedByName", data.name);
            toast({ description: "Email verified successfully!" });
          }
        } catch (e) {
          console.error("Failed to parse verification data", e);
        }
      }
    }
  }, [searchParams, form, toast]);

  const onSubmit = async (values: JournalFormValues) => {
    if (!isVerified || !verificationData?.sessionId) {
      toast({ description: "Verify your campus email before submitting", variant: "destructive" });
      return;
    }

    const authors = values.authors
      .map((author) => ({
        given_name: author.givenName.trim(),
        family_name: author.familyName.trim() || undefined,
        email: author.email.trim() || undefined,
        affiliation: author.affiliation.trim() || undefined,
        country: author.country.trim() || undefined,
        bio: author.bio.trim() || undefined,
      }))
      .filter((author) => author.given_name);

    if (authors.length === 0) {
      toast({ description: "Add at least one author", variant: "destructive" });
      return;
    }

    const year = Number(values.year);
    const volume = Number(values.volume);
    const number = Number(values.number);

    const payload = {
      title: values.title.trim(),
      genre: values.genre.trim(),
      abstract: values.abstract.trim(),
      keywords: values.keywords.trim() || undefined,
      discipline: values.discipline.trim() || undefined,
      year: Number.isNaN(year) ? undefined : year,
      volume: Number.isNaN(volume) ? undefined : volume,
      number: Number.isNaN(number) ? undefined : number,
      pages: values.pages.trim() || undefined,
      submitted_by_name: values.submittedByName.trim(),
      submitted_by_email: verificationData.email,
      department: department.uuid,
      authors,
      otp_session: verificationData.sessionId,
    };

    try {
      const response = await fetch("/api/submissions/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.detail || data?.error || "Failed to submit article";
        throw new Error(message);
      }
      toast({ description: "Journal article submitted" });
      reset(defaultValues);
      setIsVerified(false);
      setVerificationData(null);
      sessionStorage.removeItem("verification_complete");
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Failed to submit article",
        variant: "destructive",
      });
    }
  };

  // If not verified, show verification step first
  if (!isVerified) {
    return <VerificationStep department={department} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Verified badge */}
      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
        <CheckCircle2 className="h-5 w-5" />
        <div>
          <p className="font-medium">Email verified</p>
          <p className="text-sm text-green-600">{verificationData?.email}</p>
        </div>
      </div>

      {/* Article Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Article title *</Label>
          <Input id="title" {...register("title", { required: "Title is required" })} />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="genre">Genre *</Label>
          <Input id="genre" placeholder="Original Article" {...register("genre", { required: "Genre is required" })} />
          {errors.genre && <p className="text-sm text-red-600">{errors.genre.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="discipline">Discipline</Label>
          <Input id="discipline" placeholder="Computer Engineering" {...register("discipline")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords</Label>
          <Input id="keywords" placeholder="AI, robotics" {...register("keywords")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" type="number" {...register("year")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="volume">Volume</Label>
          <Input id="volume" type="number" {...register("volume")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="number">Issue</Label>
          <Input id="number" type="number" {...register("number")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pages">Pages</Label>
          <Input id="pages" placeholder="12-18" {...register("pages")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="abstract">Abstract *</Label>
        <Textarea id="abstract" rows={4} {...register("abstract", { required: "Abstract is required" })} />
        {errors.abstract && <p className="text-sm text-red-600">{errors.abstract.message}</p>}
      </div>

      {/* Authors - Improved UI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Authors</h3>
            <p className="text-sm text-slate-500">List all contributing authors</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ givenName: "", familyName: "", email: "", affiliation: "", country: "", bio: "" })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add author
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border rounded-lg p-4 bg-slate-50/50 relative"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-700">
                  Author {index + 1}
                </span>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Given name *</Label>
                  <Input
                    placeholder="Given name"
                    className="h-9"
                    {...register(`authors.${index}.givenName`, { required: "Required" })}
                  />
                  {errors.authors?.[index]?.givenName && (
                    <p className="text-xs text-red-600">{errors.authors?.[index]?.givenName?.message as string}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Family name</Label>
                  <Input
                    placeholder="Family name"
                    className="h-9"
                    {...register(`authors.${index}.familyName`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Email</Label>
                  <Input
                    type="email"
                    placeholder="name@tcioe.edu.np"
                    className="h-9"
                    {...register(`authors.${index}.email`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Affiliation</Label>
                  <Input
                    placeholder="Department, Campus"
                    className="h-9"
                    {...register(`authors.${index}.affiliation`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Country</Label>
                  <Input
                    placeholder="Nepal"
                    className="h-9"
                    {...register(`authors.${index}.country`)}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs text-slate-600">Bio</Label>
                  <Textarea
                    placeholder="Brief author bio (optional)"
                    rows={2}
                    className="resize-none"
                    {...register(`authors.${index}.bio`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? "Submitting..." : "Submit article"}
        </Button>
      </div>
    </form>
  );
}

// Separate verification step component
function VerificationStep({ department }: { department: DepartmentDetail }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleVerify = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ description: "Please enter your name and email", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/submissions/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          full_name: name.trim(),
          purpose: "journal_submission",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Unable to send verification code");
      }

      const sessionId = data.session_id || data.sessionId;

      sessionStorage.setItem("pending_verification_name", name.trim());

      const params = new URLSearchParams({
        email: email.trim(),
        name: name.trim(),
        type: "journal",
        session: sessionId,
      });

      router.push(`/verification?${params.toString()}`);
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to send verification code",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900">Verify your email</h2>
        <p className="text-slate-600 mt-2">
          To submit a journal article, please verify your campus email first.
        </p>
      </div>

      <div className="space-y-4 bg-slate-50 border rounded-lg p-6">
        <div className="space-y-2">
          <Label htmlFor="verifyName">Your full name</Label>
          <Input
            id="verifyName"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="verifyEmail">Campus email</Label>
          <Input
            id="verifyEmail"
            type="email"
            placeholder="name@tcioe.edu.np"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-slate-500">Use your @tcioe.edu.np email address</p>
        </div>

        <Button
          onClick={handleVerify}
          disabled={sending || !name.trim() || !email.trim()}
          className="w-full"
          size="lg"
        >
          {sending ? (
            "Sending code..."
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6">
        We&apos;ll send a 6-digit verification code to your email
      </p>
    </div>
  );
}
