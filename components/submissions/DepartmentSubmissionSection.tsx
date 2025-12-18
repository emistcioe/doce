"use client";

import type { DepartmentDetail } from "@/lib/types/department";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FileCode2, FlaskConical, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Props {
  department?: DepartmentDetail;
}

export function DepartmentSubmissionSection({ department }: Props) {
  if (!department?.uuid) {
    return null;
  }

  return (
    <section
      id="department-submissions"
      className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white"
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <Badge className="bg-white/10 text-white uppercase tracking-[0.4em] border border-white/20">
            submissions
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Submit Your Work
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            Students and faculty can submit projects, research updates, and
            journal manuscripts directly to the department. Verify with your
            campus email (OTP) and the department along with campus QA will
            review before publishing.
          </p>
          <p className="text-sm text-white/60">
            Use your campus email (
            <span className="font-mono text-blue-400">@tcioe.edu.np</span>) to request OTP.
            Need help? Email{" "}
            <a href={`mailto:${department.email || "info@tcioe.edu.np"}`} className="text-blue-400 hover:underline">
              {department.email || "info@tcioe.edu.np"}
            </a>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Project Submission Card */}
          <Card className="group bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-105">
            <CardHeader className="space-y-3">
              <div className="p-3 bg-blue-500/20 rounded-lg w-fit group-hover:bg-blue-500/30 transition-colors">
                <FileCode2 className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Submit Project
              </CardTitle>
              <CardDescription className="text-white/70 text-base">
                Share your final year, capstone, or academic project with comprehensive details and team information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">✓</span>
                  <span>Project details & abstract</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">✓</span>
                  <span>Team members & supervisor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">✓</span>
                  <span>GitHub & demo links</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:shadow-lg group-hover:shadow-blue-500/20" 
                asChild
              >
                <Link href="/submit-project">
                  Submit Project
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Research Submission Card */}
          <Card className="group bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-105">
            <CardHeader className="space-y-3">
              <div className="p-3 bg-emerald-500/20 rounded-lg w-fit group-hover:bg-emerald-500/30 transition-colors">
                <FlaskConical className="h-8 w-8 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Submit Research
              </CardTitle>
              <CardDescription className="text-white/70 text-base">
                Document your ongoing or completed research work including methodology and expected outcomes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Research methodology</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Expected outcomes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Publication & project URLs</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white group-hover:shadow-lg group-hover:shadow-emerald-500/20" 
                asChild
              >
                <Link href="/submit-research">
                  Submit Research
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Journal Submission Card */}
          <Card className="group bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-105">
            <CardHeader className="space-y-3">
              <div className="p-3 bg-purple-500/20 rounded-lg w-fit group-hover:bg-purple-500/30 transition-colors">
                <BookOpen className="h-8 w-8 text-purple-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Submit Journal
              </CardTitle>
              <CardDescription className="text-white/70 text-base">
                Share your published research papers and journal articles with complete author and publication details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">✓</span>
                  <span>Article details & abstract</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">✓</span>
                  <span>Author information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">✓</span>
                  <span>DOI & publication data</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white group-hover:shadow-lg group-hover:shadow-purple-500/20" 
                asChild
              >
                <Link href="/submit-journal">
                  Submit Journal
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/60 text-sm max-w-2xl mx-auto">
            All submissions are reviewed by the department team before publishing. 
            You can modify entries with the department team after review.
          </p>
        </div>
      </div>
    </section>
  );
}
