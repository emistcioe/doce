import { departmentSlugFromCode } from "@/lib/department";
import { DEPARTMENT_CODE } from "@/lib/env";
import { getDepartment } from "@/lib/data/publicDepartment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DepartmentContactForm } from "@/components/submissions/DepartmentContactForm";

export const metadata = {
  title: "Contact Department",
  description: "Send a message to the department office.",
};

export default async function ContactPage() {
  const slug = departmentSlugFromCode(DEPARTMENT_CODE);

  let dept;
  try {
    dept = slug ? await getDepartment(slug) : undefined;
  } catch (error) {
    console.warn("Failed to fetch department:", error);
    dept = undefined;
  }

  if (!dept?.slug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Department not found. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="bg-background border-b">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <div className="space-y-2">
            <p className="text-sm font-medium text-primary uppercase tracking-wider">
              Contact
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Get in touch with {dept.shortName || dept.name}
            </h1>
            <p className="text-muted-foreground">
              Send your query to the department office and we will get back to you.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 px-4">
        <div className="container mx-auto max-w-5xl grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">
                Contact Form
              </CardTitle>
              <CardDescription>
                Fill in the form below. Your message will be emailed to the department.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DepartmentContactForm department={dept} />
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Office Contact</CardTitle>
              <CardDescription>Official department contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {dept.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a className="hover:underline" href={`mailto:${dept.email}`}>
                    {dept.email}
                  </a>
                </div>
              )}
              {dept.phoneNo && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a className="hover:underline" href={`tel:${dept.phoneNo}`}>
                    {dept.phoneNo}
                  </a>
                </div>
              )}
              {!dept.email && !dept.phoneNo && (
                <p className="text-muted-foreground">
                  Contact details are being updated. Please use the form.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
