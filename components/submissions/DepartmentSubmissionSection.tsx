"use client";

import type { DepartmentDetail } from "@/lib/types/department";
import { Button } from "@/components/ui/button";
import { FileCode2, FlaskConical, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Props {
  department?: DepartmentDetail;
}

export function DepartmentSubmissionSection({ department }: Props) {
  if (!department?.uuid) {
    return null;
  }

  const submissions = [
    {
      title: "Submit Project",
      description: "Share your final year, capstone, or academic project with the department.",
      icon: FileCode2,
      href: "/submit-project",
      features: ["Project details & abstract", "Team members & supervisor", "GitHub & demo links"],
    },
    {
      title: "Submit Research",
      description: "Document your ongoing or completed research work and findings.",
      icon: FlaskConical,
      href: "/submit-research",
      features: ["Research methodology", "Expected outcomes", "Publication URLs"],
    },
    {
      title: "Submit Journal",
      description: "Share your published research papers and journal articles.",
      icon: BookOpen,
      href: "/submit-journal",
      features: ["Article details & abstract", "Author information", "DOI & publication data"],
    },
  ];

  return (
    <section id="department-submissions" className="py-16 bg-muted/40">
      <div className="container mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Submissions
          </p>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Submit Your Work
          </h2>
          <p className="text-muted-foreground">
            Students and faculty can submit projects, research, and journal manuscripts. 
            Verify with your campus email and the department will review before publishing.
          </p>
        </div>

        {/* Submission Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {submissions.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group bg-background border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary/70 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors" asChild>
                  <Link href={item.href}>
                    {item.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Use your campus email (<span className="font-medium text-foreground">@tcioe.edu.np</span>) for verification. 
            All submissions are reviewed before publishing.
          </p>
        </div>
      </div>
    </section>
  );
}
