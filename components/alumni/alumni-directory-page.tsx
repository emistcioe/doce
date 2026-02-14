"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { departmentSlugFromCode } from "@/lib/department";
import { DEPARTMENT_CODE } from "@/lib/env";
import { useDepartmentContext } from "@/providers/department-provider";

interface DepartmentSummary {
  uuid: string;
  name: string;
  slug: string;
  short_name?: string | null;
}

interface ProgramSummary {
  uuid: string;
  name: string;
  slug: string;
  short_name?: string | null;
}

interface AlumniSubmissionItem {
  uuid: string;
  given_name: string;
  middle_name: string;
  surname: string;
  full_name: string;
  roll_no: string;
  registration_number?: string;
  passed_year: string;
  email?: string;
  workplace?: string;
  department?: DepartmentSummary;
  program?: ProgramSummary | null;
  program_other_name?: string;
  program_name?: string;
  created_at: string;
}

interface GroupedAlumni {
  passedYear: string;
  programs: Array<{
    name: string;
    members: AlumniSubmissionItem[];
  }>;
}

const normalize = (value: string) => value.trim().toLowerCase();

const resolveFullName = (entry: AlumniSubmissionItem) => {
  if (entry.full_name?.trim()) return entry.full_name.trim();
  return [entry.given_name, entry.middle_name, entry.surname]
    .filter(Boolean)
    .join(" ")
    .trim();
};

const resolveProgramName = (entry: AlumniSubmissionItem) => {
  if (entry.program_name?.trim()) return entry.program_name.trim();
  if (entry.program?.name?.trim()) return entry.program.name.trim();
  if (entry.program_other_name?.trim()) return entry.program_other_name.trim();
  return "Program not specified";
};

export function AlumniDirectoryPage() {
  const { data: department } = useDepartmentContext();
  const [entries, setEntries] = useState<AlumniSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");

  const departmentSlug = departmentSlugFromCode(DEPARTMENT_CODE) || "";

  useEffect(() => {
    let mounted = true;

    const fetchAllSubmissions = async () => {
      if (!departmentSlug) {
        setLoadError("Department slug is not configured for alumni listing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const limit = 200;
        let offset = 0;
        const collected: AlumniSubmissionItem[] = [];

        while (true) {
          const params = new URLSearchParams({
            department_slug: departmentSlug,
            limit: String(limit),
            offset: String(offset),
          });

          const response = await fetch(`/api/alumni-tracer?${params.toString()}`, {
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(`Failed to load alumni (${response.status})`);
          }

          const data = await response.json();
          const batch = Array.isArray(data?.results)
            ? (data.results as AlumniSubmissionItem[])
            : [];

          collected.push(...batch);

          if (!data?.next || batch.length === 0) break;
          offset += limit;
          if (offset > 10000) break;
        }

        if (!mounted) return;
        setEntries(collected);
      } catch (error) {
        if (!mounted) return;
        setLoadError(
          error instanceof Error ? error.message : "Unable to load alumni data."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAllSubmissions();

    return () => {
      mounted = false;
    };
  }, [departmentSlug]);

  const years = useMemo(
    () =>
      Array.from(new Set(entries.map((entry) => entry.passed_year))).sort(
        (a, b) => Number(b) - Number(a)
      ),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const search = normalize(searchTerm);

    return entries.filter((entry) => {
      const fullName = resolveFullName(entry);
      const workplace = entry.workplace || "";
      const programName = resolveProgramName(entry);

      const matchesYear =
        selectedYear === "all" || entry.passed_year === selectedYear;

      const matchesSearch =
        search.length === 0 ||
        normalize(fullName).includes(search) ||
        normalize(entry.roll_no || "").includes(search) ||
        normalize(workplace).includes(search) ||
        normalize(programName).includes(search);

      return matchesYear && matchesSearch;
    });
  }, [entries, searchTerm, selectedYear]);

  const groupedAlumni = useMemo<GroupedAlumni[]>(() => {
    const byYear = new Map<string, Map<string, AlumniSubmissionItem[]>>();

    filteredEntries.forEach((entry) => {
      const programName = resolveProgramName(entry);
      const year = entry.passed_year || "Unknown";

      if (!byYear.has(year)) {
        byYear.set(year, new Map());
      }

      const byProgram = byYear.get(year)!;
      if (!byProgram.has(programName)) {
        byProgram.set(programName, []);
      }

      byProgram.get(programName)!.push(entry);
    });

    return Array.from(byYear.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([passedYear, byProgram]) => ({
        passedYear,
        programs: Array.from(byProgram.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([name, members]) => ({
            name,
            members: [...members].sort((a, b) =>
              resolveFullName(a).localeCompare(resolveFullName(b))
            ),
          })),
      }));
  }, [filteredEntries]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-primary font-semibold">
            Alumni Directory
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            {department?.name || "Department"} Alumni
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Directory is grouped by passed year and program. Only roll number,
            name, initial avatar, and workplace are displayed.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground">Total Alumni Records</p>
              <p className="text-2xl font-bold text-primary">{entries.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground">Years Covered</p>
              <p className="text-2xl font-bold text-primary">{years.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground">Shown in Filter</p>
              <p className="text-2xl font-bold text-primary">
                {filteredEntries.length}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                  placeholder="Search by name, roll no, workplace, program"
                />
              </div>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading alumni directory...
            </CardContent>
          </Card>
        ) : loadError ? (
          <Card>
            <CardContent className="py-12 text-center text-red-600">
              {loadError}
            </CardContent>
          </Card>
        ) : groupedAlumni.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-lg font-semibold text-foreground">
                No alumni records found
              </p>
              <p className="text-sm text-muted-foreground">
                Alumni submissions will appear here after successful form submissions.
              </p>
            </CardContent>
          </Card>
        ) : (
          groupedAlumni.map((yearGroup) => (
            <section key={yearGroup.passedYear} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-2xl font-bold text-primary">
                  Passed Year {yearGroup.passedYear}
                </h2>
                <Badge variant="secondary">
                  {yearGroup.programs.reduce(
                    (count, group) => count + group.members.length,
                    0
                  )}{" "}
                  alumni
                </Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {yearGroup.programs.map((programGroup) => (
                  <Card key={`${yearGroup.passedYear}-${programGroup.name}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-primary">
                        {programGroup.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {programGroup.members.map((alumni) => {
                        const fullName = resolveFullName(alumni) || "Unknown";
                        return (
                          <article
                            key={alumni.uuid}
                            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                          >
                            <Avatar className="h-11 w-11">
                              <AvatarFallback className="bg-primary text-white font-semibold">
                                {fullName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">{fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                Roll No: {alumni.roll_no || "Not provided"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Workplace: {alumni.workplace || "Not provided"}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
