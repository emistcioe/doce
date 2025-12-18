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
import { CheckCircle2 } from "lucide-react";

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
    watch,
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
  const [sendingOtp, setSendingOtp] = useState(false);

  const submittedEmail = watch("submittedByEmail");
  const submittedName = watch("submittedByName");

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
            toast({ description: "Email verified successfully!" });
          }
        } catch (e) {
          console.error("Failed to parse verification data", e);
        }
      }
    }
  }, [searchParams, form, toast]);

  // Reset verification when email changes
  useEffect(() => {
    if (verificationData && submittedEmail !== verificationData.email) {
      setIsVerified(false);
      setVerificationData(null);
      sessionStorage.removeItem("verification_complete");
    }
  }, [submittedEmail, verificationData]);

  const handleSendVerification = async () => {
    if (!submittedEmail || !submittedName) {
      toast({ description: "Enter your name and campus email first", variant: "destructive" });
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch("/api/submissions/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: submittedEmail.trim(), 
          full_name: submittedName.trim(), 
          purpose: "journal_submission" 
        }),
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Unable to send verification code");
      }

      const sessionId = data.session_id || data.sessionId;
      
      const params = new URLSearchParams({
        email: submittedEmail.trim(),
        name: submittedName.trim(),
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
      setSendingOtp(false);
    }
  };

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="title">Article title</Label>
          <Input id="title" {...register("title", { required: "Title is required" })} />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="genre">Genre</Label>
          <Input id="genre" placeholder="Original Article" {...register("genre", { required: "Genre is required" })} />
          {errors.genre && <p className="text-sm text-red-600">{errors.genre.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="discipline">Discipline</Label>
          <Input id="discipline" placeholder="Computer Engineering" {...register("discipline")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="keywords">Keywords</Label>
          <Input id="keywords" placeholder="AI, robotics" {...register("keywords")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="year">Year</Label>
          <Input id="year" type="number" {...register("year")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="volume">Volume</Label>
          <Input id="volume" type="number" {...register("volume")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="number">Issue</Label>
          <Input id="number" type="number" {...register("number")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pages">Pages</Label>
          <Input id="pages" placeholder="12-18" {...register("pages")} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="abstract">Abstract</Label>
        <Textarea id="abstract" rows={4} {...register("abstract", { required: "Abstract is required" })} />
        {errors.abstract && <p className="text-sm text-red-600">{errors.abstract.message}</p>}
      </div>

      <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
        <div>
          <h3 className="font-semibold text-slate-900">Authors</h3>
          <p className="text-sm text-slate-600">List all contributing authors.</p>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Given name</Label>
              <Input
                placeholder="Given name"
                {...register(`authors.${index}.givenName`, { required: "Required" })}
              />
              {errors.authors?.[index]?.givenName && (
                <p className="text-sm text-red-600">
                  {errors.authors?.[index]?.givenName?.message as string}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Family name</Label>
              <Input placeholder="Family name" {...register(`authors.${index}.familyName`)} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" placeholder="name@tcioe.edu.np" {...register(`authors.${index}.email`)} />
            </div>
            <div className="space-y-1">
              <Label>Affiliation</Label>
              <Input placeholder="Department, Campus" {...register(`authors.${index}.affiliation`)} />
            </div>
            <div className="space-y-1">
              <Label>Country</Label>
              <Input placeholder="Nepal" {...register(`authors.${index}.country`)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Bio</Label>
              <Textarea placeholder="Brief author bio (optional)" rows={2} {...register(`authors.${index}.bio`)} />
            </div>
            {fields.length > 1 && (
              <div className="md:col-span-2 text-right">
                <Button type="button" variant="ghost" onClick={() => remove(index)}>
                  Remove author
                </Button>
              </div>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ givenName: "", familyName: "", email: "", affiliation: "", country: "", bio: "" })
          }
        >
          Add author
        </Button>
      </div>

      <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
        <h3 className="font-semibold">Campus email verification</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="submittedByName">Your full name</Label>
            <Input 
              id="submittedByName" 
              disabled={isVerified}
              {...register("submittedByName", { required: "Required" })} 
            />
            {errors.submittedByName && (
              <p className="text-sm text-red-600">{errors.submittedByName.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="submittedByEmail">Campus email</Label>
            <Input
              id="submittedByEmail"
              type="email"
              placeholder="name@tcioe.edu.np"
              disabled={isVerified}
              {...register("submittedByEmail", { required: "Required" })}
            />
            {errors.submittedByEmail && (
              <p className="text-sm text-red-600">{errors.submittedByEmail.message}</p>
            )}
          </div>
        </div>
        
        {isVerified ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-md">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Email verified: {verificationData?.email}</span>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleSendVerification}
            disabled={sendingOtp || !submittedEmail || !submittedName}
          >
            {sendingOtp ? "Sending..." : "Verify email"}
          </Button>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isVerified}>
          {isSubmitting ? "Submitting..." : "Submit article"}
        </Button>
      </div>
    </form>
  );
}
