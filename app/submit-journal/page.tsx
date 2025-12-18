import { DEPARTMENT_CODE } from "@/lib/env";
import { departmentSlugFromCode } from "@/lib/department";
import { getDepartment } from "@/lib/data/publicDepartment";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JournalSubmissionForm } from "@/components/submissions/JournalSubmissionForm";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Submit Journal - DOCE",
  description: "Submit your journal article to the Department of Civil Engineering",
};

export default async function SubmitJournalPage() {
  const slug = departmentSlugFromCode(DEPARTMENT_CODE);
  
  let dept;
  try {
    dept = slug ? await getDepartment(slug) : undefined;
  } catch (error) {
    console.warn("Failed to fetch department:", error);
    dept = undefined;
  }

  if (!dept?.uuid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 border-white/20">
          <CardContent className="pt-6 text-center">
            <p className="text-white/80">Department not found. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <section className="py-12 px-4 border-b border-white/10">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-6">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <BookOpen className="h-8 w-8 text-purple-400" />
            </div>
            <div className="flex-1">
              <Badge className="bg-purple-500/20 text-purple-300 uppercase tracking-wider mb-3 border border-purple-400/30">
                Journal Submission
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                Submit Journal Article
              </h1>
              <p className="text-xl text-white/70 max-w-2xl">
                Share your published research papers and journal articles with {dept.shortName || dept.name}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-1">✓ Academic Excellence</h3>
              <p className="text-xs text-white/60">Showcase published research work</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-1">✓ Peer Recognition</h3>
              <p className="text-xs text-white/60">Highlight contributions to the field</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-1">✓ Department Archive</h3>
              <p className="text-xs text-white/60">Permanent record in dept repository</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <Card className="bg-white shadow-2xl border-0">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-purple-50 pb-6">
              <CardTitle className="text-2xl font-bold text-slate-900">
                Journal Article Details
              </CardTitle>
              <CardDescription className="text-base">
                Provide complete information about your published journal article including all authors and publication details.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <JournalSubmissionForm department={dept} />
            </CardContent>
          </Card>

          <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-white/70 text-center">
              <strong className="text-white">Need help?</strong> Contact the department at{" "}
              <a href={`mailto:${dept.email || "info@tcioe.edu.np"}`} className="text-purple-400 hover:underline">
                {dept.email || "info@tcioe.edu.np"}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
