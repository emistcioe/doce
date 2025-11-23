import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { DepartmentProvider } from "@/providers/department-provider";
import { QueryProvider } from "@/providers/query-provider";
import { getDepartment } from "@/lib/data/publicDepartment";
import { departmentSlugFromCode } from "@/lib/department";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { department?: string };
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  // pick department from route params, then query string, then env fallback, then default
  const fromParams = params?.department;
  const fromQuery = searchParams?.department
    ? Array.isArray(searchParams.department)
      ? searchParams.department[0]
      : searchParams.department
    : undefined;
  const deptCode =
    fromParams || fromQuery || process.env.NEXT_PUBLIC_DEPARTMENT || "doece"; // default to electronics & computer

  // Convert department code to slug
  const deptSlug = departmentSlugFromCode(deptCode) || deptCode;

  // Fetch department data dynamically
  let departmentName = "Department";
  try {
    const departmentData = await getDepartment(deptSlug);
    departmentName = departmentData.name;
  } catch (error) {
    console.error("Failed to fetch department data:", error);
    // Fallback to code-based name
    departmentName = `Department of ${deptCode}`;
  }

  const title = `${departmentName} - Tribhuvan University`;
  return {
    title,
    description: `${departmentName} at Tribhuvan University, Thapathali Campus. Excellence in teaching, research, and innovation.`,
    icons: {
      icon: "/logo.ico",
      shortcut: "/logo.ico",
      apple: "/logo.ico",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}
      >
        <QueryProvider>
          <DepartmentProvider>
            <Navigation />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </DepartmentProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
