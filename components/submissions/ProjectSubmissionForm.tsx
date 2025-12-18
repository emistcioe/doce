"use client";

import { useEffect, useMemo, useState } from "react";
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
import { CheckCircle2, Upload, X } from "lucide-react";

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
  const [sendingOtp, setSendingOtp] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);

  const submittedEmail = watch("submittedByEmail");
  const submittedName = watch("submittedByName");

  // Check for verification completion on mount and when returning from verification page
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

  const memberLabel = useMemo(() => (index: number) => `Team member ${index + 1}`, []);

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
          purpose: "project_submission" 
        }),
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Unable to send verification code");
      }

      const sessionId = data.session_id || data.sessionId;
      
      // Redirect to verification page
      const params = new URLSearchParams({
        email: submittedEmail.trim(),
        name: submittedName.trim(),
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
      setSendingOtp(false);
    }
  };

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Project title</Label>
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
          <Label htmlFor="supervisorName">Supervisor name</Label>
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
          <Input id="supervisorEmail" type="email" {...register("supervisorEmail")}/>
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
        <div className="space-y-2">
          <Label htmlFor="demoUrl">Demo URL</Label>
          <Input id="demoUrl" type="url" placeholder="https://" {...register("demoUrl")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="abstract">Abstract</Label>
        <Textarea id="abstract" rows={3} {...register("abstract")}></Textarea>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Detailed description</Label>
        <Textarea id="description" rows={5} {...register("description")}></Textarea>
      </div>
      <div className="space-y-2">
        <Label htmlFor="technologiesUsed">Technologies</Label>
        <Textarea
          id="technologiesUsed"
          rows={2}
          placeholder="React, Django, PostgreSQL"
          {...register("technologiesUsed")}
        ></Textarea>
      </div>

      <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
        <div>
          <h3 className="font-semibold text-slate-900">Attachments</h3>
          <p className="text-sm text-slate-600">Upload a thumbnail image and project report (optional).</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail image</Label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="thumbnail"
                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span className="text-sm">{thumbnailFile ? "Change" : "Choose file"}</span>
              </label>
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
              {thumbnailFile && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="truncate max-w-[150px]">{thumbnailFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setThumbnailFile(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportFile">Project report (PDF)</Label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="reportFile"
                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span className="text-sm">{reportFile ? "Change" : "Choose file"}</span>
              </label>
              <input
                id="reportFile"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setReportFile(e.target.files?.[0] || null)}
              />
              {reportFile && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="truncate max-w-[150px]">{reportFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setReportFile(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">PDF up to 10MB</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
        <div>
          <h3 className="font-semibold text-slate-900">Team members</h3>
          <p className="text-sm text-slate-600">Add at least one student.</p>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{memberLabel(index)}</Label>
                <Input
                  placeholder="Full name"
                  {...register(`members.${index}.fullName`, {
                    required: index === 0 ? "Name is required" : false,
                  })}
                />
                {errors.members?.[index]?.fullName && (
                  <p className="text-sm text-red-600">
                    {errors.members?.[index]?.fullName?.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Roll number</Label>
                <Input
                  placeholder="Roll number"
                  {...register(`members.${index}.rollNumber`, {
                    required: index === 0 ? "Roll number is required" : false,
                  })}
                />
                {errors.members?.[index]?.rollNumber && (
                  <p className="text-sm text-red-600">
                    {errors.members?.[index]?.rollNumber?.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" placeholder="name@tcioe.edu.np" {...register(`members.${index}.email`)} />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Input placeholder="Team Member" {...register(`members.${index}.role`)} />
              </div>
              <div className="space-y-1">
                <Label>LinkedIn URL</Label>
                <Input type="url" placeholder="https://linkedin.com/in/..." {...register(`members.${index}.linkedinUrl`)} />
              </div>
              <div className="space-y-1">
                <Label>GitHub URL</Label>
                <Input type="url" placeholder="https://github.com/..." {...register(`members.${index}.githubUrl`)} />
              </div>
            </div>
            {fields.length > 1 && (
              <div className="text-right">
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  Remove member
                </Button>
              </div>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ fullName: "", rollNumber: "", email: "", role: "Team Member", linkedinUrl: "", githubUrl: "" })
          }
        >
          Add another member
        </Button>
      </div>

      <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
        <h3 className="font-semibold">Campus email verification</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="submittedByName">Your full name</Label>
            <Input
              id="submittedByName"
              placeholder="Submitter name"
              disabled={isVerified}
              {...register("submittedByName", { required: "Your name is required" })}
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
              {...register("submittedByEmail", { required: "Campus email is required" })}
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
          {isSubmitting ? "Submitting..." : "Submit project"}
        </Button>
      </div>
    </form>
  );
}
