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
import {
  PARTICIPANT_TYPES,
  RESEARCH_STATUSES,
  RESEARCH_TYPES,
} from "./constants";
import { CheckCircle2 } from "lucide-react";

interface ParticipantForm {
  fullName: string;
  participantType: string;
  email: string;
  role: string;
  designation: string;
  organization: string;
  linkedinUrl: string;
  orcidId: string;
}

interface ResearchFormValues {
  title: string;
  abstract: string;
  description: string;
  researchType: string;
  status: string;
  principalInvestigator: string;
  piEmail: string;
  startDate: string;
  endDate: string;
  fundingAgency: string;
  fundingAmount: string;
  keywords: string;
  methodology: string;
  expectedOutcomes: string;
  publicationsUrl: string;
  projectUrl: string;
  githubUrl: string;
  submittedByName: string;
  submittedByEmail: string;
  participants: ParticipantForm[];
}

const defaultValues: ResearchFormValues = {
  title: "",
  abstract: "",
  description: "",
  researchType: "applied",
  status: "proposed",
  principalInvestigator: "",
  piEmail: "",
  startDate: "",
  endDate: "",
  fundingAgency: "",
  fundingAmount: "",
  keywords: "",
  methodology: "",
  expectedOutcomes: "",
  publicationsUrl: "",
  projectUrl: "",
  githubUrl: "",
  submittedByName: "",
  submittedByEmail: "",
  participants: [
    { fullName: "", participantType: "student", email: "", role: "Researcher", designation: "", organization: "", linkedinUrl: "", orcidId: "" },
  ],
};

interface Props {
  department: DepartmentDetail;
}

export function ResearchSubmissionForm({ department }: Props) {
  const form = useForm<ResearchFormValues>({ defaultValues });
  const {
    control,
    handleSubmit,
    register,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "participants" });
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
          if (data.purpose === "research_submission" && Date.now() - data.verifiedAt < 30 * 60 * 1000) {
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
          purpose: "research_submission" 
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
        type: "research",
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

  const onSubmit = async (values: ResearchFormValues) => {
    if (!isVerified || !verificationData?.sessionId) {
      toast({ description: "Verify your campus email before submitting", variant: "destructive" });
      return;
    }

    const participants = values.participants
      .map((participant) => ({
        full_name: participant.fullName.trim(),
        participant_type: participant.participantType,
        email: participant.email.trim() || undefined,
        role: participant.role.trim() || undefined,
        designation: participant.designation.trim() || undefined,
        organization: participant.organization.trim() || undefined,
        linkedin_url: participant.linkedinUrl.trim() || undefined,
        orcid_id: participant.orcidId.trim() || undefined,
        department: department.uuid,
      }))
      .filter((participant) => participant.full_name);

    const funding = Number(values.fundingAmount);
    const payload = {
      title: values.title.trim(),
      abstract: values.abstract.trim(),
      description: values.description.trim(),
      research_type: values.researchType,
      status: values.status,
      principal_investigator: values.principalInvestigator.trim(),
      pi_email: values.piEmail.trim(),
      start_date: values.startDate || undefined,
      end_date: values.endDate || undefined,
      funding_agency: values.fundingAgency.trim() || undefined,
      funding_amount: Number.isNaN(funding) ? undefined : funding,
      keywords: values.keywords.trim() || undefined,
      methodology: values.methodology.trim() || undefined,
      expected_outcomes: values.expectedOutcomes.trim() || undefined,
      publications_url: values.publicationsUrl.trim() || undefined,
      project_url: values.projectUrl.trim() || undefined,
      github_url: values.githubUrl.trim() || undefined,
      submitted_by_name: values.submittedByName.trim(),
      submitted_by_email: verificationData.email,
      department: department.uuid,
      participants,
      otp_session: verificationData.sessionId,
    };

    try {
      const response = await fetch("/api/submissions/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.detail || data?.error || "Failed to submit research";
        throw new Error(message);
      }
      toast({ description: "Research submitted for departmental review" });
      reset(defaultValues);
      setIsVerified(false);
      setVerificationData(null);
      sessionStorage.removeItem("verification_complete");
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Failed to submit research",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="title">Research title</Label>
          <Input id="title" {...register("title", { required: "Title is required" })} />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="researchType">Type</Label>
          <Select
            value={watch("researchType")}
            onValueChange={(value) => form.setValue("researchType", value)}
          >
            <SelectTrigger id="researchType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {RESEARCH_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <Select value={watch("status")} onValueChange={(value) => form.setValue("status", value)}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {RESEARCH_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="principalInvestigator">Principal investigator</Label>
          <Input
            id="principalInvestigator"
            {...register("principalInvestigator", { required: "Required" })}
          />
          {errors.principalInvestigator && (
            <p className="text-sm text-red-600">{errors.principalInvestigator.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="piEmail">PI email</Label>
          <Input id="piEmail" type="email" {...register("piEmail", { required: "Required" })} />
          {errors.piEmail && <p className="text-sm text-red-600">{errors.piEmail.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="startDate">Start date</Label>
          <Input type="date" id="startDate" {...register("startDate")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endDate">End date</Label>
          <Input type="date" id="endDate" {...register("endDate")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fundingAgency">Funding agency</Label>
          <Input id="fundingAgency" {...register("fundingAgency")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fundingAmount">Funding amount (NRs)</Label>
          <Input id="fundingAmount" type="number" step="0.01" {...register("fundingAmount")} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="abstract">Abstract</Label>
        <Textarea id="abstract" rows={3} {...register("abstract")} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Detailed description</Label>
        <Textarea id="description" rows={5} {...register("description")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="keywords">Keywords</Label>
          <Input id="keywords" placeholder="AI, renewable energy" {...register("keywords")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="expectedOutcomes">Expected outcomes</Label>
          <Input id="expectedOutcomes" {...register("expectedOutcomes")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="methodology">Methodology</Label>
          <Input id="methodology" {...register("methodology")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="publicationsUrl">Publications URL</Label>
          <Input id="publicationsUrl" type="url" {...register("publicationsUrl")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="projectUrl">Project URL</Label>
          <Input id="projectUrl" type="url" {...register("projectUrl")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="githubUrl">GitHub URL</Label>
          <Input id="githubUrl" type="url" {...register("githubUrl")} />
        </div>
      </div>

      <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
        <div>
          <h3 className="font-semibold text-slate-900">Participants</h3>
          <p className="text-sm text-slate-600">Optional but helpful for credits.</p>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Participant name</Label>
              <Input placeholder="Full name" {...register(`participants.${index}.fullName`)} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Input placeholder="Researcher" {...register(`participants.${index}.role`)} />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={watch(`participants.${index}.participantType`)}
                onValueChange={(value) => form.setValue(`participants.${index}.participantType`, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PARTICIPANT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" placeholder="name@tcioe.edu.np" {...register(`participants.${index}.email`)} />
            </div>
            <div className="space-y-1">
              <Label>Designation</Label>
              <Input placeholder="e.g. Student, Professor" {...register(`participants.${index}.designation`)} />
            </div>
            <div className="space-y-1">
              <Label>Organization</Label>
              <Input placeholder="e.g. Thapathali Campus" {...register(`participants.${index}.organization`)} />
            </div>
            <div className="space-y-1">
              <Label>LinkedIn URL</Label>
              <Input type="url" placeholder="https://linkedin.com/in/..." {...register(`participants.${index}.linkedinUrl`)} />
            </div>
            <div className="space-y-1">
              <Label>ORCID ID</Label>
              <Input placeholder="0000-0000-0000-0000" {...register(`participants.${index}.orcidId`)} />
            </div>
            {fields.length > 1 && (
              <div className="md:col-span-2 text-right">
                <Button type="button" variant="ghost" onClick={() => remove(index)}>
                  Remove participant
                </Button>
              </div>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ fullName: "", participantType: "student", email: "", role: "Researcher", designation: "", organization: "", linkedinUrl: "", orcidId: "" })
          }
        >
          Add participant
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
          {isSubmitting ? "Submitting..." : "Submit research"}
        </Button>
      </div>
    </form>
  );
}
