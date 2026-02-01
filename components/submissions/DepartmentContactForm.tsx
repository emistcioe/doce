"use client";

import { useForm } from "react-hook-form";
import { Mail, Phone, Send } from "lucide-react";

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
      reset(defaultValues);
    } catch (error) {
      toast({
        description:
          error instanceof Error ? error.message : "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!canSubmit && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Department email is not configured yet. Please try again later or call the office.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name *</Label>
          <Input
            id="fullName"
            placeholder="Your name"
            {...register("fullName", { required: "Full name is required" })}
          />
          {errors.fullName && (
            <p className="text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={watch("category")}
            onValueChange={(value) => setValue("category", value)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone</Label>
          <Input id="phoneNumber" placeholder="98XXXXXXXX" {...register("phoneNumber")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" placeholder="What is this about?" {...register("subject")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          placeholder="Write your message here..."
          rows={6}
          {...register("message", {
            required: "Message is required",
            minLength: {
              value: 10,
              message: "Message must be at least 10 characters",
            },
          })}
        />
        {errors.message && (
          <p className="text-sm text-red-600">{errors.message.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span>We will send your query to {department?.name || "the department"}.</span>
        </div>
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? "Sending..." : "Send Message"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {department?.email && (
          <span className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {department.email}
          </span>
        )}
        {department?.phoneNo && (
          <span className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {department.phoneNo}
          </span>
        )}
      </div>
    </form>
  );
}
