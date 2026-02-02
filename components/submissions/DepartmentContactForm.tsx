"use client";

import { useForm } from "react-hook-form";
import { Mail, Phone, Send, User, MessageSquare, Tag, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

import type { DepartmentDetail } from "@/lib/types/department";
import { CONTACT_CATEGORIES } from "./constants";
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
import { cn } from "@/lib/utils";

interface ContactFormValues {
  fullName: string;
  email: string;
  phoneNumber: string;
  category: string;
  subject: string;
  message: string;
}

const defaultValues: ContactFormValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  category: "general",
  subject: "",
  message: "",
};

interface Props {
  department: DepartmentDetail;
}

export function DepartmentContactForm({ department }: Props) {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    handleSubmit,
    register,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ defaultValues });

  const departmentSlug = department?.slug;
  const canSubmit = Boolean(departmentSlug && department?.email);
  const watchedFields = watch();

  const onSubmit = async (values: ContactFormValues) => {
    if (!departmentSlug) {
      toast({
        description: "Department information is missing. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      department: departmentSlug,
      category: values.category,
      full_name: values.fullName.trim(),
      email: values.email.trim(),
      phone_number: values.phoneNumber.trim(),
      subject: values.subject.trim(),
      message: values.message.trim(),
    };

    try {
      const response = await fetch("/api/contact/department", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          data?.detail || data?.error || "Unable to send your message.";
        throw new Error(message);
      }

      toast({ description: "Message sent to the department." });
      setIsSuccess(true);
      reset(defaultValues);
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      toast({
        description:
          error instanceof Error ? error.message : "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  // Success state UI
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Message Sent Successfully!</h3>
          <p className="text-muted-foreground max-w-sm">
            Thank you for reaching out. We have received your message and will get back to you soon.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsSuccess(false)}
          className="mt-4"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Warning banner */}
      {!canSubmit && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">Department email not configured</p>
            <p className="text-amber-700 dark:text-amber-300 mt-0.5">Please try again later or contact the office directly.</p>
          </div>
        </div>
      )}

      {/* Personal Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Your Information</span>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="fullName"
                placeholder="Enter your full name"
                className={cn(
                  "pl-10 h-11 transition-all duration-200",
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.fullName && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                )}
                {...register("fullName", { required: "Full name is required" })}
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {errors.fullName && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={cn(
                  "pl-10 h-11 transition-all duration-200",
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
                {...register("email")}
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
            <div className="relative">
              <Input
                id="phoneNumber"
                placeholder="98XXXXXXXX"
                className={cn(
                  "pl-10 h-11 transition-all duration-200",
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
                {...register("phoneNumber")}
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">Category</Label>
            <div className="relative">
              <Select
                value={watch("category")}
                onValueChange={(value) => setValue("category", value)}
              >
                <SelectTrigger
                  id="category"
                  className={cn(
                    "pl-10 h-11 transition-all duration-200",
                    "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  )}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Message Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>Your Message</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
          <div className="relative">
            <Input
              id="subject"
              placeholder="What is this regarding?"
              className={cn(
                "pl-10 h-11 transition-all duration-200",
                "focus:ring-2 focus:ring-primary/20 focus:border-primary"
              )}
              {...register("subject")}
            />
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="message" className="text-sm font-medium">
              Message <span className="text-red-500">*</span>
            </Label>
            <span className="text-xs text-muted-foreground">
              {watchedFields.message?.length || 0} characters
            </span>
          </div>
          <Textarea
            id="message"
            placeholder="Please describe your query or concern in detail..."
            rows={5}
            className={cn(
              "resize-none transition-all duration-200",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary",
              errors.message && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
            )}
            {...register("message", {
              required: "Message is required",
              minLength: {
                value: 10,
                message: "Message must be at least 10 characters",
              },
            })}
          />
          {errors.message && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.message.message}
            </p>
          )}
        </div>
      </div>

      {/* Submit Section */}
      <div className="pt-4 border-t">
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Your message will be sent to <span className="font-medium text-foreground">{department?.name || "the department"}</span>
          </p>
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            size="lg"
            className={cn(
              "w-full sm:w-auto min-w-[160px] h-11 font-medium",
              "transition-all duration-200",
              "disabled:opacity-50"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Contact Info Footer */}
      {(department?.email || department?.phoneNo) && (
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-3">Or reach us directly:</p>
          <div className="flex flex-wrap gap-3">
            {department?.email && (
              <a
                href={`mailto:${department.email}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm transition-colors"
              >
                <Mail className="h-4 w-4 text-primary" />
                <span>{department.email}</span>
              </a>
            )}
            {department?.phoneNo && (
              <a
                href={`tel:${department.phoneNo}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm transition-colors"
              >
                <Phone className="h-4 w-4 text-primary" />
                <span>{department.phoneNo}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
