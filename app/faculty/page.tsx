"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDepartment, useDepartmentStaffs } from "@/hooks/use-department";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DEPARTMENT_CODE, SCHEDULE_API_BASE } from "@/lib/env";

// Format title to proper case (ER -> Er., DR -> Dr., etc.)
function formatTitle(title?: string | null): string {
  if (!title) return "";
  const upperTitle = title.toUpperCase();
  if (
    upperTitle === "ER" ||
    upperTitle === "DR" ||
    upperTitle === "AR" ||
    upperTitle === "MR" ||
    upperTitle === "MS" ||
    upperTitle === "MRS"
  ) {
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase() + ".";
  }
  return title;
}

function staffPriority(designation?: string | null): number {
  const d = (designation || "").toUpperCase();

  // Order for "Department Staff": HOD -> Program Coordinator -> Deputy HOD -> others.
  if (d.includes("HEAD OF DEPARTMENT") && !d.includes("DEPUTY")) return 0;
  if (d.includes("PROGRAM COORDINATOR") || d.includes("PROGRAM CO-ORDINATOR"))
    return 1;
  if (d.includes("DEPUTY HEAD OF DEPARTMENT") || (d.includes("DEPUTY") && d.includes("HEAD") && d.includes("DEPARTMENT")))
    return 2;
  return 3;
}

export default function FacultyPage() {
  const { data: dept } = useDepartment();
  const {
    data: staffData,
    loading: staffLoading,
    error: staffError,
  } = useDepartmentStaffs({
    limit: 100,
    ordering: "displayOrder",
  });
  const staff =
    staffData?.results
      ?.slice()
      .sort((a, b) => {
        const pa = staffPriority(a.designation);
        const pb = staffPriority(b.designation);
        if (pa !== pb) return pa - pb;
        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      }) || [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<
    {
      id: string;
      name: string;
      email?: string | null;
      designation?: string | null;
      teacher_type?: string | null;
      subjects?: { id: string; name: string; code: string }[];
    }[]
  >([]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const deptRes = await fetch(`${SCHEDULE_API_BASE}/department/list/`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!deptRes.ok)
          throw new Error(`Department fetch failed ${deptRes.status}`);
        const deptJson = await deptRes.json();
        const code = (DEPARTMENT_CODE || "").toUpperCase();
        const target = (deptJson?.results || []).find(
          (d: any) => (d?.name || "").toUpperCase() === code
        );
        const departmentId = target?.id;
        if (!departmentId)
          throw new Error("Department not found in schedule backend.");

        const teacherRes = await fetch(
          `${SCHEDULE_API_BASE}/teacher/list/?department=${encodeURIComponent(
            departmentId
          )}&is_assigned=true`,
          { headers: { Accept: "application/json" }, signal: controller.signal }
        );
        if (!teacherRes.ok)
          throw new Error(`Teacher fetch failed ${teacherRes.status}`);
        const teacherJson = await teacherRes.json();
        setTeachers(
          (teacherJson?.results || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            email: t.email,
            designation: t.designation,
            teacher_type: t.teacher_type,
            subjects: t.subjects || [],
          }))
        );
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Failed to load faculty."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, []);
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {dept?.name || "Department"} Faculty & Staff
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto text-pretty">
            Meet our distinguished faculty members and dedicated staff who are
            committed to excellence in education and research.
          </p>
        </div>

        {/* Department Staff from CMS */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Department Staff</h2>
          {staffLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {staffError && (
            <p className="text-red-500">Failed to load department staff.</p>
          )}
          {!staffLoading && !staffError && staff.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((member) => {
                const photoSrc =
                  member.photo && member.photo.trim().length > 0
                    ? member.photo
                    : "/placeholder-user.jpg";
                return (
                  <article
                    key={member.uuid}
                    className="group relative flex flex-col items-center rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="mt-6 h-28 w-28 overflow-hidden rounded-2xl border-2 border-white bg-gray-50 shadow-md">
                      <img
                        src={photoSrc}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2 px-5">
                      <span className="h-0.5 w-10 rounded-full bg-primary/60" />
                      <span className="h-0.5 w-10 rounded-full bg-primary/60" />
                    </div>
                    <div className="flex flex-col items-center gap-1 px-6 pb-6 pt-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
                        {member.designation || "Staff"}
                      </p>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {member.title ? `${formatTitle(member.title)} ` : ""}
                        {member.name}
                      </h3>
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="mt-1 inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
                        >
                          {member.email}
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {!staffLoading && !staffError && staff.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No staff records available right now.
            </p>
          )}
        </div>

        {/* Full-time Teachers */}
        <div className="space-y-4 mt-12">
          <h2 className="text-3xl font-bold">Full-Time Teachers</h2>
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {error && <p className="text-red-500">Failed to load teachers.</p>}
          {!loading &&
            !error &&
            teachers.filter((t) => t.teacher_type === "full_time").length >
              0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers
                  .filter((t) => t.teacher_type === "full_time")
                  .map((member) => (
                    <article
                      key={member.id}
                      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-primary/5 p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30"
                    >
                      {/* Decorative elements */}
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-2xl transition-all duration-300 group-hover:scale-150" />
                      <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 blur-2xl transition-all duration-300 group-hover:scale-125" />

                      {/* Content */}
                      <div className="relative z-10 space-y-4">
                        {/* Name initial circle */}
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xl font-bold text-white shadow-lg ring-4 ring-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-primary">
                              {member.name}
                            </h3>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {member.designation
                                ? member.designation.replace(/_/g, " ")
                                : "Faculty"}
                            </p>
                          </div>
                        </div>

                        {/* Decorative divider */}
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                        </div>

                        {/* Email */}
                        {member.email && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <svg
                                className="h-4 w-4 text-primary/70"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="text-xs font-semibold text-gray-500">
                                Email
                              </span>
                            </div>
                            <a
                              href={`mailto:${member.email}`}
                              className="block break-all text-sm font-medium text-primary transition-all hover:text-primary/80 hover:translate-x-1"
                            >
                              {member.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Hover effect corner accent */}
                      <div className="absolute bottom-0 right-0 h-20 w-20 translate-x-10 translate-y-10 rounded-full bg-gradient-to-tl from-primary/20 to-transparent opacity-0 blur-xl transition-all duration-500 group-hover:translate-x-6 group-hover:translate-y-6 group-hover:opacity-100" />
                    </article>
                  ))}
              </div>
            )}
          {!loading &&
            !error &&
            teachers.filter((t) => t.teacher_type === "full_time").length ===
              0 && (
              <p className="text-sm text-muted-foreground">
                No full-time teachers available right now.
              </p>
            )}
        </div>

        {/* Visiting Faculties (Part-time Teachers) */}
        <div className="space-y-4 mt-12">
          <h2 className="text-3xl font-bold">Visiting Faculties</h2>
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!loading &&
            !error &&
            teachers.filter((t) => t.teacher_type === "part_time").length >
              0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers
                  .filter((t) => t.teacher_type === "part_time")
                  .map((member) => (
                    <article
                      key={member.id}
                      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-blue-500/5 p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-500/30"
                    >
                      {/* Decorative elements */}
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 blur-2xl transition-all duration-300 group-hover:scale-150" />
                      <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-tr from-purple-500/10 to-pink-500/10 blur-2xl transition-all duration-300 group-hover:scale-125" />

                      {/* Content */}
                      <div className="relative z-10 space-y-4">
                        {/* Name initial circle */}
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xl font-bold text-white shadow-lg ring-4 ring-blue-500/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                              {member.name}
                            </h3>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {member.designation
                                ? member.designation.replace(/_/g, " ")
                                : "Visiting Faculty"}
                            </p>
                          </div>
                        </div>

                        {/* Decorative divider */}
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500/50" />
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                        </div>

                        {/* Email */}
                        {member.email && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <svg
                                className="h-4 w-4 text-blue-500/70"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="text-xs font-semibold text-gray-500">
                                Email
                              </span>
                            </div>
                            <a
                              href={`mailto:${member.email}`}
                              className="block break-all text-sm font-medium text-blue-600 transition-all hover:text-blue-500 hover:translate-x-1"
                            >
                              {member.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Hover effect corner accent */}
                      <div className="absolute bottom-0 right-0 h-20 w-20 translate-x-10 translate-y-10 rounded-full bg-gradient-to-tl from-blue-500/20 to-transparent opacity-0 blur-xl transition-all duration-500 group-hover:translate-x-6 group-hover:translate-y-6 group-hover:opacity-100" />
                    </article>
                  ))}
              </div>
            )}
          {!loading &&
            !error &&
            teachers.filter((t) => t.teacher_type === "part_time").length ===
              0 && (
              <p className="text-sm text-muted-foreground">
                No visiting faculties available right now.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
