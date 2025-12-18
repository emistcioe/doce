import { DEPARTMENT_CODE } from "@/lib/env";
import { departmentSlugFromCode } from "@/lib/department";
import { getDepartment } from "@/lib/data/publicDepartment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JournalSubmissionForm } from "@/components/submissions/JournalSubmissionForm";
import { BookOpen, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Submit Journal - DOECE",
  description: "Submit your journal article to the Department of Electronics and Computer Engineering",
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Department not found. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const features = [
    { title: "Academic Excellence", description: "Showcase published research" },
    { title: "Peer Recognition", description: "Highlight contributions to the field" },
    { title: "Department Archive", description: "Permanent record in repository" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header Section */}
      <section className="bg-background border-b">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          
          <div className="flex items-start gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">
                Journal Submission
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Submit Journal Article
              </h1>
              <p className="text-muted-foreground">
                Share your published research papers and journal articles with {dept.shortName || dept.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">{feature.title}</span>
                  <span className="text-sm text-muted-foreground ml-1">· {feature.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">
                Journal Article Details
              </CardTitle>
              <CardDescription>
                Provide complete information about your published journal article including all authors and publication details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JournalSubmissionForm department={dept} />
            </CardContent>
          </Card>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Need help? Contact the department at{" "}
            <a href={`mailto:${dept.email || "info@tcioe.edu.np"}`} className="text-primary hover:underline">
              {dept.email || "info@tcioe.edu.np"}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
