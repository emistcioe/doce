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
import { CheckCircle2, Plus, Trash2, Mail, ArrowRight } from "lucide-react";

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
            if (data.name) form.setValue("submittedByName", data.name);
            toast({ description: "Email verified successfully!" });
          }
        } catch (e) {
          console.error("Failed to parse verification data", e);
        }
      }
    }
  }, [searchParams, form, toast]);

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

      {/* Research Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Research title *</Label>
          <Input id="title" {...register("title", { required: "Title is required" })} />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
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
        <div className="space-y-2">
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
        <div className="space-y-2">
          <Label htmlFor="principalInvestigator">Principal investigator *</Label>
          <Input
            id="principalInvestigator"
            {...register("principalInvestigator", { required: "Required" })}
          />
          {errors.principalInvestigator && (
            <p className="text-sm text-red-600">{errors.principalInvestigator.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="piEmail">PI email *</Label>
          <Input id="piEmail" type="email" {...register("piEmail", { required: "Required" })} />
          {errors.piEmail && <p className="text-sm text-red-600">{errors.piEmail.message}</p>}
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
          <Label htmlFor="fundingAgency">Funding agency</Label>
          <Input id="fundingAgency" {...register("fundingAgency")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fundingAmount">Funding amount (NRs)</Label>
          <Input id="fundingAmount" type="number" step="0.01" {...register("fundingAmount")} />
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords</Label>
          <Input id="keywords" placeholder="AI, renewable energy" {...register("keywords")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expectedOutcomes">Expected outcomes</Label>
          <Input id="expectedOutcomes" {...register("expectedOutcomes")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="methodology">Methodology</Label>
          <Input id="methodology" {...register("methodology")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="publicationsUrl">Publications URL</Label>
          <Input id="publicationsUrl" type="url" {...register("publicationsUrl")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectUrl">Project URL</Label>
          <Input id="projectUrl" type="url" {...register("projectUrl")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="githubUrl">GitHub URL</Label>
          <Input id="githubUrl" type="url" {...register("githubUrl")} />
        </div>
      </div>

      {/* Participants - Improved UI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Participants</h3>
            <p className="text-sm text-slate-500">Add research team participants (optional)</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ fullName: "", participantType: "student", email: "", role: "Researcher", designation: "", organization: "", linkedinUrl: "", orcidId: "" })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add participant
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
                  Participant {index + 1}
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
                  <Label className="text-xs text-slate-600">Full name</Label>
                  <Input
                    placeholder="Enter full name"
                    className="h-9"
                    {...register(`participants.${index}.fullName`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Type</Label>
                  <Select
                    value={watch(`participants.${index}.participantType`)}
                    onValueChange={(value) => form.setValue(`participants.${index}.participantType`, value)}
                  >
                    <SelectTrigger className="h-9">
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
                  <Label className="text-xs text-slate-600">Role</Label>
                  <Input
                    placeholder="Researcher"
                    className="h-9"
                    {...register(`participants.${index}.role`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Email</Label>
                  <Input
                    type="email"
                    placeholder="name@tcioe.edu.np"
                    className="h-9"
                    {...register(`participants.${index}.email`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Designation</Label>
                  <Input
                    placeholder="e.g. Student, Professor"
                    className="h-9"
                    {...register(`participants.${index}.designation`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Organization</Label>
                  <Input
                    placeholder="e.g. Thapathali Campus"
                    className="h-9"
                    {...register(`participants.${index}.organization`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">LinkedIn URL</Label>
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    className="h-9"
                    {...register(`participants.${index}.linkedinUrl`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">ORCID ID</Label>
                  <Input
                    placeholder="0000-0000-0000-0000"
                    className="h-9"
                    {...register(`participants.${index}.orcidId`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? "Submitting..." : "Submit research"}
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
          purpose: "research_submission",
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
          To submit research, please verify your campus email first.
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
