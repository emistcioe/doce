import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Atom,
  Award,
  Bell,
  BookOpen,
  Calendar,
  Clock,
  Download,
  FileText,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import {
  API_JOURNAL_PUBLIC_PREFIX,
  API_PROJECT_PUBLIC_PREFIX,
  API_RESEARCH_PUBLIC_PREFIX,
  API_WEBSITE_PUBLIC_PREFIX,
  DEPARTMENT_CODE,
  getPublicApiUrl,
} from "@/lib/env";
import { departmentSlugFromCode } from "@/lib/department";
import {
  getDepartment,
  listDepartmentEvents,
  listDepartmentStaffs,
} from "@/lib/data/publicDepartment";
import { listNotices as listPublicNotices } from "@/lib/data/publicNotice";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { DepartmentSubmissionSection } from "@/components/submissions/DepartmentSubmissionSection";

function eventStatus(start?: string | null, end?: string | null) {
  const now = new Date();
  const s = new Date(start ?? "");
  const e = new Date(end ?? "");

  const sTime = s.getTime();
  const eTime = e.getTime();

  // If end date is a valid date and already passed
  if (isFinite(eTime) && eTime < now.getTime()) {
    return { label: "Finished", variant: "outline" as const };
  }

  // If start date is a valid date and in the future
  if (isFinite(sTime) && sTime > now.getTime()) {
    return { label: "Upcoming", variant: "secondary" as const };
  }

  // Default to running if dates are invalid or currently ongoing
  return { label: "Running", variant: "default" as const };
}

function formatShortDate(value?: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return value;
  }
}

function humanizeLabel(value?: string) {
  if (!value) return "";
  return value
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function stripHtml(input?: string) {
  if (!input) return "";
  const sanitized = sanitizeHtml(input);
  return sanitized
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function HomePage() {
  const slug = departmentSlugFromCode(DEPARTMENT_CODE);

  const fetchPublicList = async (
    path: string,
    params: Record<string, string>
  ) => {
    const query = new URLSearchParams(params).toString();
    const url = `${getPublicApiUrl(path)}${query ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 120 },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${path} (${response.status} ${response.statusText})`
      );
    }
    return response.json();
  };

  // Handle potential API failures during build gracefully
  let dept, eventsRes, staffsRes, noticesRes;
  let researchPayload: any;
  let projectPayload: any;
  let journalPayload: any;
  let formsPayload: any;

  try {
    dept = slug ? await getDepartment(slug) : undefined;
  } catch (error) {
    console.warn("Failed to fetch department:", error);
    dept = undefined;
  }

  try {
    [eventsRes, staffsRes] =
      slug && dept?.uuid
        ? await Promise.all([
            listDepartmentEvents(dept.uuid, {
              limit: 6,
              ordering: "-eventStartDate",
            }),
            listDepartmentStaffs(slug, { limit: 20, ordering: "displayOrder" }),
          ])
        : [undefined, undefined];
  } catch (error) {
    console.warn("Failed to fetch events/staff:", error);
    eventsRes = undefined;
    staffsRes = undefined;
  }

  try {
    noticesRes = dept
      ? await listPublicNotices({
          limit: 4,
          ordering: "-publishedAt",
          department: dept.uuid,
        })
      : undefined;
  } catch (error) {
    console.warn("Failed to fetch notices:", error);
    noticesRes = undefined;
  }

  try {
    researchPayload =
      slug && slug.length > 0
        ? await fetchPublicList(`${API_RESEARCH_PUBLIC_PREFIX}/research`, {
            department_slug: slug,
            limit: "3",
            ordering: "-date_published",
          })
        : undefined;
  } catch (error) {
    console.warn("Failed to fetch research highlights:", error);
    researchPayload = undefined;
  }

  try {
    projectPayload =
      slug && slug.length > 0
        ? await fetchPublicList(`${API_PROJECT_PUBLIC_PREFIX}/projects`, {
            department_slug: slug,
            limit: "3",
            ordering: "-created_at",
          })
        : undefined;
  } catch (error) {
    console.warn("Failed to fetch project highlights:", error);
    projectPayload = undefined;
  }

  try {
    journalPayload =
      slug && slug.length > 0
        ? await fetchPublicList(`${API_JOURNAL_PUBLIC_PREFIX}/articles`, {
            department_slug: slug,
            limit: "2",
            ordering: "-date_published",
          })
        : undefined;
  } catch (error) {
    console.warn("Failed to fetch journal highlights:", error);
    journalPayload = undefined;
  }

  try {
    formsPayload =
      slug && slug.length > 0
        ? await fetchPublicList(
            `${API_WEBSITE_PUBLIC_PREFIX}/forms/${slug}`,
            { limit: "6" }
          )
        : undefined;
  } catch (error) {
    console.warn("Failed to fetch forms:", error);
    formsPayload = undefined;
  }

  const events = eventsRes?.results || [];
  const notices = (noticesRes?.results || []).filter((n) => n.isApprovedByDepartment);
  const featuredNotice = notices.find((n) => n.isFeatured && n.thumbnail);
  const hod = (staffsRes?.results || []).sort(
    (a, b) => a.displayOrder - b.displayOrder
  )[0];
  const researchHighlights = researchPayload?.results ?? [];
  const projectHighlights = projectPayload?.results ?? [];
  const journalHighlights = journalPayload?.results ?? [];
  const forms = Array.isArray(formsPayload)
    ? formsPayload
    : formsPayload?.results ?? [];
  const featuredForms = forms.slice(0, 6);
  const researchSpotlight = researchHighlights[0];
  const projectSpotlight = projectHighlights[0];
  const journalSpotlight = journalHighlights[0];
  return (
    <div className="relative bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background to-muted">
        <div className="absolute inset-0 hero-pattern"></div>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100 scale-110 filter contrast-110 brightness-95"
          style={{
            backgroundImage: `url(${
              dept?.thumbnail || "/university-campus-building-academic.jpg"
            })`,
          }}
        />
        {/* Darkened overlay to ensure hero text is readable on all images. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50 backdrop-blur-[1px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.65)]">
            {dept?.name || "Department"}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto drop-shadow-sm">
            Empowering the next generation of scientists and engineers through
            innovative education, cutting-edge research, and practical
            applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              <Link href="/programs">Explore Programs</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-white hover:bg-primary/90 hover:text-primary-foreground bg-transparent"
            >
              <Link href="/research">Research & Projects</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* HOD Message (campus style) */}
      <section className="py-16 bg-muted/30 text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Image first on large screens */}
            <div className="flex justify-center lg:justify-start order-1">
              <div className="w-44 h-44 md:w-56 md:h-56 rounded-full bg-background ring-4 ring-background shadow-sm overflow-hidden">
                {hod?.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hod.photo}
                    alt={hod?.name || "HOD"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Photo
                  </div>
                )}
              </div>
            </div>
            <div className="order-2">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4">
                Message From Head of Department
              </h2>
              <div
                className="text-base leading-relaxed text-muted-foreground mb-4 max-w-3xl prose prose-sm prose-slate dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(
                    hod?.message ||
                      "Welcome to our department. We foster academic excellence and holistic development through quality teaching, research and industry collaboration."
                  ),
                }}
              />
              {hod && (
                <div className="mt-4">
                  <p className="text-lg font-semibold">{hod.name}</p>
                  <p className="text-muted-foreground">{hod.designation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About Department */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-sm tracking-widest text-primary font-semibold mb-2">
                ABOUT DEPARTMENT
              </h3>
              <h2 className="text-3xl font-bold mb-4">
                {dept?.name || "Our Department"}
              </h2>
              <div
                className="text-muted-foreground leading-relaxed prose prose-sm prose-slate dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(
                    dept?.detailedDescription ||
                      dept?.briefDescription ||
                      "Our department is committed to quality education, research, and community engagement. We aim to empower students with strong fundamentals and hands‑on experiences to tackle real‑world challenges."
                  ),
                }}
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    dept?.thumbnail ||
                    "/university-campus-building-academic.jpg"
                  }
                  alt={dept?.name || "Department"}
                  className="w-full h-full object-cover filter brightness-95 contrast-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notices + Events in two columns */}
      <section className="py-16 bg-muted/30 text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Notices */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center">
                  <Bell className="h-6 w-6 text-primary mr-2" /> Recent Notices
                </h3>
                <Link href="/notices" className="text-primary hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-2">
                {notices.length === 0 && (
                  <div className="p-4 border border-border rounded-lg bg-background text-muted-foreground">
                    No notices available.
                  </div>
                )}
                {notices.map((n) => (
                  <Link
                    href="/notices"
                    key={n.uuid}
                    className="block p-3 border border-dashed border-border rounded-lg hover:bg-muted/30 transition-colors bg-background/80 cursor-pointer"
                    aria-label={`Open notices page`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-medium mb-0.5 text-foreground line-clamp-1">
                          {n.title}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" />{" "}
                          {new Date(n.publishedAt).toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "short", day: "2-digit" }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {n.isFeatured && <Badge>Featured</Badge>}
                        {n.category?.name && (
                          <Badge variant="outline">{n.category.name}</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Events */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center">
                  <Calendar className="h-6 w-6 text-primary mr-2" /> Events
                </h3>
                <Link href="/events" className="text-primary hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {events
                  .filter((ev) => {
                    const st = eventStatus(
                      ev.eventStartDate,
                      ev.eventEndDate
                    ).label;
                    return st === "Upcoming" || st === "Running";
                  })
                  .map((ev) => {
                    const st = eventStatus(ev.eventStartDate, ev.eventEndDate);
                    return (
                      <div
                        key={ev.uuid}
                        className="p-4 border border-border rounded-lg hover:bg-card transition-colors bg-background"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium mb-1 text-foreground">
                              {ev.title}
                            </h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-4 w-4" /> {ev.eventStartDate}{" "}
                              – {ev.eventEndDate}
                            </p>
                          </div>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Forms */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold flex items-center">
              <FileText className="h-6 w-6 text-primary mr-2" /> Open Forms
            </h3>
            {forms.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {forms.length} active
              </span>
            )}
          </div>
          {forms.length === 0 ? (
            <div className="p-4 border border-dashed border-border rounded-lg bg-muted/30 text-muted-foreground">
              No active forms available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredForms.map((form) => {
                const ownerName =
                  form.ownerName ??
                  form.owner_name ??
                  dept?.name ??
                  "Department";
                const descriptionText = stripHtml(form.description || "");
                return (
                  <Card
                    key={form.uuid}
                    className="hover:shadow-lg transition-shadow bg-card border-border"
                  >
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-lg text-card-foreground">
                        {form.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                        {descriptionText || "Registration form"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {ownerName}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                        asChild
                      >
                        <Link href={`/forms/${form.slug}`}>
                          Open Form
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured Sections moved last */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Discover Our Department
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow bg-card border-border">
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-card-foreground">
                  Academic Programs
                </CardTitle>
                <CardDescription>
                  Comprehensive undergraduate and graduate programs in applied
                  sciences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                >
                  <Link href="/programs">View Programs</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-card border-border">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-card-foreground">
                  Faculty & Staff
                </CardTitle>
                <CardDescription>
                  Meet our distinguished faculty and dedicated staff members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                >
                  <Link href="/faculty">Meet Our Team</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-card border-border">
              <CardHeader>
                <Award className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-card-foreground">
                  Research Excellence
                </CardTitle>
                <CardDescription>
                  Cutting-edge research projects and innovative solutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                >
                  <Link href="/research">Explore Research</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground font-semibold">
              Research & Innovation
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              Featured research, projects, and journal pieces
            </h2>
            <p className="text-gray-600">
              Fresh scholarship and student projects anchored to the department,
              all in one place.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border border-border/50 bg-white shadow-md">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    <Atom className="h-5 w-5 text-primary" />
                    Research
                  </div>
                  {researchSpotlight?.status && (
                    <Badge variant="outline">
                      {humanizeLabel(researchSpotlight.status)}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-semibold leading-snug">
                  {researchSpotlight?.title ||
                    "Research updates will appear shortly"}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                  {researchSpotlight
                    ? researchSpotlight.abstract
                    : "Our faculty publish impactful research and we will highlight one of them here."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {researchSpotlight ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {researchSpotlight.department?.name ||
                        "Department research"}{" "}
                      ·{" "}
                      {researchSpotlight.fundingAgency ||
                        "Sponsored initiative"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatShortDate(researchSpotlight.startDate)} –{" "}
                      {researchSpotlight.endDate
                        ? formatShortDate(researchSpotlight.endDate)
                        : "Ongoing"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    We showcase a flagship research article as soon as it is
                    ready.
                  </p>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/research">Explore research</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/50 bg-white shadow-md">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    <Layers className="h-5 w-5 text-primary" />
                    Projects
                  </div>
                  {projectSpotlight?.status && (
                    <Badge variant="outline">
                      {humanizeLabel(projectSpotlight.status)}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-semibold leading-snug">
                  {projectSpotlight?.title ||
                    "Featured projects land here soon"}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                  {projectSpotlight?.abstract ||
                    "Hands-on solutions and prototypes from our department teams."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {projectSpotlight ? (
                  <p className="text-sm text-muted-foreground">
                    {projectSpotlight.department?.name || "Department project"}{" "}
                    · {projectSpotlight.academicYear || "Academic update"}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Coming soon: a student or faculty showcase from the latest
                    term.
                  </p>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/projects">View projects</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/50 bg-white shadow-md">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Journal
                  </div>
                  {journalSpotlight?.genre && (
                    <Badge variant="outline">{journalSpotlight.genre}</Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-semibold leading-snug">
                  {journalSpotlight?.title ||
                    "Journal articles from the department will appear here"}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                  {journalSpotlight?.abstract ||
                    "Stay tuned for published papers or conference articles that represent the department."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {journalSpotlight ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {journalSpotlight.discipline || "Department journal"} ·{" "}
                      {formatShortDate(journalSpotlight.datePublished)}
                    </p>
                    {journalSpotlight.doiId && (
                      <p className="text-sm text-muted-foreground">
                        DOI: {journalSpotlight.doiId}
                      </p>
                    )}
                    {journalSpotlight.authors?.length ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {journalSpotlight.authors
                          .map((author: any) =>
                            [author.givenName, author.familyName]
                              .filter(Boolean)
                              .join(" ")
                          )
                          .join(", ")}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    We pull the latest journal article tied to your department.
                  </p>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <a href="/journal">Visit journal</a>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <DepartmentSubmissionSection department={dept} />
    </div>
  );
}
