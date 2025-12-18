"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import type { DepartmentDetail } from "@/lib/types/department";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PROJECT_TYPES } from "./constants";
import { CheckCircle2, X, Plus, Trash2, FileText, Image, Mail, ArrowRight } from "lucide-react";

interface ProjectMemberForm {
  fullName: string;
  rollNumber: string;
  email: string;
  role: string;
  linkedinUrl: string;
  githubUrl: string;
}

interface ProjectFormValues {
  title: string;
  abstract: string;
  description: string;
  projectType: string;
  supervisorName: string;
  supervisorEmail: string;
  startDate: string;
  endDate: string;
  academicYear: string;
  githubUrl: string;
  demoUrl: string;
  technologiesUsed: string;
  submittedByName: string;
  submittedByEmail: string;
  members: ProjectMemberForm[];
}

const defaultValues: ProjectFormValues = {
  title: "",
  abstract: "",
  description: "",
  projectType: "final_year",
  supervisorName: "",
  supervisorEmail: "",
  startDate: "",
  endDate: "",
  academicYear: "",
  githubUrl: "",
  demoUrl: "",
  technologiesUsed: "",
  submittedByName: "",
  submittedByEmail: "",
  members: [
    { fullName: "", rollNumber: "", email: "", role: "Team Member", linkedinUrl: "", githubUrl: "" },
  ],
};

interface Props {
  department: DepartmentDetail;
}

export function ProjectSubmissionForm({ department }: Props) {
  const form = useForm<ProjectFormValues>({ defaultValues });
  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "members" });
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isVerified, setIsVerified] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    email: string;
    sessionId: string;
  } | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);

  // Check for verification completion on mount
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "true") {
      const stored = sessionStorage.getItem("verification_complete");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.purpose === "project_submission" && Date.now() - data.verifiedAt < 30 * 60 * 1000) {
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

  const onSubmit = async (values: ProjectFormValues) => {
    if (!isVerified || !verificationData?.sessionId) {
      toast({ description: "Verify your campus email before submitting", variant: "destructive" });
      return;
    }

    const members = values.members
      .map((member) => ({
        full_name: member.fullName.trim(),
        roll_number: member.rollNumber.trim(),
        email: member.email.trim() || undefined,
        role: member.role.trim() || undefined,
        linkedin_url: member.linkedinUrl.trim() || undefined,
        github_url: member.githubUrl.trim() || undefined,
      }))
      .filter((member) => member.full_name && member.roll_number);

    if (members.length === 0) {
      toast({ description: "Add at least one team member", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title.trim());
    formData.append("abstract", values.abstract.trim());
    formData.append("description", values.description.trim());
    formData.append("project_type", values.projectType);
    formData.append("supervisor_name", values.supervisorName.trim());
    if (values.supervisorEmail.trim()) formData.append("supervisor_email", values.supervisorEmail.trim());
    if (values.startDate) formData.append("start_date", values.startDate);
    if (values.endDate) formData.append("end_date", values.endDate);
    if (values.academicYear.trim()) formData.append("academic_year", values.academicYear.trim());
    if (values.githubUrl.trim()) formData.append("github_url", values.githubUrl.trim());
    if (values.demoUrl.trim()) formData.append("demo_url", values.demoUrl.trim());
    if (values.technologiesUsed.trim()) formData.append("technologies_used", values.technologiesUsed.trim());
    formData.append("submitted_by_name", values.submittedByName.trim());
    formData.append("submitted_by_email", verificationData.email);
    formData.append("department", department.uuid);
    formData.append("members", JSON.stringify(members));
    formData.append("otp_session", verificationData.sessionId);
    
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
    if (reportFile) formData.append("report_file", reportFile);

    try {
      const response = await fetch("/api/submissions/project", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.detail || data?.error || "Failed to submit project";
        throw new Error(message);
      }
      toast({ description: "Project submitted for review" });
      reset(defaultValues);
      setIsVerified(false);
      setVerificationData(null);
      setThumbnailFile(null);
      setReportFile(null);
      sessionStorage.removeItem("verification_complete");
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Failed to submit project",
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

      {/* Project Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Project title *</Label>
          <Input id="title" {...register("title", { required: "Title is required" })} />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectType">Project type</Label>
          <Select
            value={watch("projectType")}
            onValueChange={(value) => form.setValue("projectType", value)}
          >
            <SelectTrigger id="projectType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="supervisorName">Supervisor name *</Label>
          <Input
            id="supervisorName"
            {...register("supervisorName", { required: "Supervisor name is required" })}
          />
          {errors.supervisorName && (
            <p className="text-sm text-red-600">{errors.supervisorName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="supervisorEmail">Supervisor email</Label>
          <Input id="supervisorEmail" type="email" {...register("supervisorEmail")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input type="date" id="startDate" {...register("startDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input type="date" id="endDate" {...register("endDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="academicYear">Academic year</Label>
          <Input id="academicYear" placeholder="2079/2080" {...register("academicYear")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="githubUrl">GitHub URL</Label>
          <Input id="githubUrl" type="url" placeholder="https://github.com/..." {...register("githubUrl")} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="demoUrl">Demo URL</Label>
          <Input id="demoUrl" type="url" placeholder="https://" {...register("demoUrl")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="abstract">Abstract</Label>
        <Textarea id="abstract" rows={3} {...register("abstract")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Detailed description</Label>
        <Textarea id="description" rows={5} {...register("description")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="technologiesUsed">Technologies</Label>
        <Textarea
          id="technologiesUsed"
          rows={2}
          placeholder="React, Django, PostgreSQL"
          {...register("technologiesUsed")}
        />
      </div>

      {/* Attachments - Improved UI */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-slate-900">Attachments</h3>
          <p className="text-sm text-slate-500">Upload a thumbnail image and project report (optional)</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Thumbnail Upload */}
          <div className="relative">
            <input
              id="thumbnail"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            />
            {thumbnailFile ? (
              <div className="border-2 border-primary/20 bg-primary/5 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Image className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate max-w-[180px]">{thumbnailFile.name}</p>
                      <p className="text-xs text-slate-500">{(thumbnailFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setThumbnailFile(null)}
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="thumbnail"
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors"
              >
                <div className="p-3 bg-slate-100 rounded-full mb-3">
                  <Image className="h-6 w-6 text-slate-500" />
                </div>
                <p className="font-medium text-sm">Thumbnail image</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
              </label>
            )}
          </div>

          {/* Report Upload */}
          <div className="relative">
            <input
              id="reportFile"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setReportFile(e.target.files?.[0] || null)}
            />
            {reportFile ? (
              <div className="border-2 border-primary/20 bg-primary/5 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate max-w-[180px]">{reportFile.name}</p>
                      <p className="text-xs text-slate-500">{(reportFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportFile(null)}
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="reportFile"
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors"
              >
                <div className="p-3 bg-slate-100 rounded-full mb-3">
                  <FileText className="h-6 w-6 text-slate-500" />
                </div>
                <p className="font-medium text-sm">Project report</p>
                <p className="text-xs text-slate-500 mt-1">PDF up to 10MB</p>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Team Members - Improved UI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Team Members</h3>
            <p className="text-sm text-slate-500">Add all project team members</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ fullName: "", rollNumber: "", email: "", role: "Team Member", linkedinUrl: "", githubUrl: "" })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add member
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
                  Member {index + 1}
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
                  <Label className="text-xs text-slate-600">Full name *</Label>
                  <Input
                    placeholder="Enter full name"
                    className="h-9"
                    {...register(`members.${index}.fullName`, {
                      required: index === 0 ? "Name is required" : false,
                    })}
                  />
                  {errors.members?.[index]?.fullName && (
                    <p className="text-xs text-red-600">{errors.members?.[index]?.fullName?.message as string}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Roll number *</Label>
                  <Input
                    placeholder="Enter roll number"
                    className="h-9"
                    {...register(`members.${index}.rollNumber`, {
                      required: index === 0 ? "Roll number is required" : false,
                    })}
                  />
                  {errors.members?.[index]?.rollNumber && (
                    <p className="text-xs text-red-600">{errors.members?.[index]?.rollNumber?.message as string}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Email</Label>
                  <Input
                    type="email"
                    placeholder="name@tcioe.edu.np"
                    className="h-9"
                    {...register(`members.${index}.email`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Role</Label>
                  <Input
                    placeholder="Team Member"
                    className="h-9"
                    {...register(`members.${index}.role`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">LinkedIn URL</Label>
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    className="h-9"
                    {...register(`members.${index}.linkedinUrl`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">GitHub URL</Label>
                  <Input
                    type="url"
                    placeholder="https://github.com/..."
                    className="h-9"
                    {...register(`members.${index}.githubUrl`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? "Submitting..." : "Submit project"}
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
          purpose: "project_submission",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Unable to send verification code");
      }

      const sessionId = data.session_id || data.sessionId;

      // Store name for later retrieval
      sessionStorage.setItem("pending_verification_name", name.trim());

      const params = new URLSearchParams({
        email: email.trim(),
        name: name.trim(),
        type: "project",
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
          To submit a project, please verify your campus email first.
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
