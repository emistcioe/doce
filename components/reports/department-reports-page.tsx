"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileText, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useDepartment } from "@/hooks/use-department";
import { sanitizeHtml } from "@/lib/utils/sanitize";

type ApiReportItem = {
  uuid: string;
  title: string;
  file: string;
  description?: string | null;
  summary?: string | null;
  issueLabel?: string | null;
  issue_label?: string | null;
  reportTypeDisplay?: string | null;
  report_type_display?: string | null;
  reportType?: string | null;
  report_type?: string | null;
  publishedDate?: string | null;
  published_date?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const PAGE_SIZE = 10;

function getReportTypeLabel(item: ApiReportItem): string {
  return (
    item.reportTypeDisplay ||
    item.report_type_display ||
    item.reportType ||
    item.report_type ||
    "Report"
  );
}

function getIssueLabel(item: ApiReportItem): string {
  return item.issueLabel || item.issue_label || "";
}

function getPublishedDate(item: ApiReportItem): string {
  return item.publishedDate || item.published_date || item.createdAt || item.created_at || "";
}

function formatDate(value: string): string {
  if (!value) return "Date not specified";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

export function DepartmentReportsPage() {
  const { data: dept, slug } = useDepartment();
  const [reports, setReports] = useState<ApiReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchReports = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);
      try {
        const limit = 100;
        let offset = 0;
        const collected: ApiReportItem[] = [];

        while (true) {
          const params = new URLSearchParams({
            category: "REPORT",
            limit: String(limit),
            offset: String(offset),
            ordering: "-published_date",
          });

          const response = await fetch(
            `/api/department/${encodeURIComponent(slug)}/downloads?${params.toString()}`,
            { cache: "no-store" }
          );

          if (!response.ok) {
            throw new Error(`Failed to load reports (${response.status})`);
          }

          const payload = (await response.json()) as PaginatedResponse<ApiReportItem>;
          const batch = Array.isArray(payload?.results) ? payload.results : [];
          collected.push(...batch);

          if (!payload?.next || batch.length === 0) break;
          offset += limit;
          if (offset > 5000) break;
        }

        if (!mounted) return;
        setReports(collected);
      } catch (loadError) {
        if (!mounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load department reports."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReports();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return reports;

    return reports.filter((report) => {
      const summary = report.summary || report.description || "";
      return (
        report.title.toLowerCase().includes(query) ||
        summary.toLowerCase().includes(query) ||
        getReportTypeLabel(report).toLowerCase().includes(query) ||
        getIssueLabel(report).toLowerCase().includes(query)
      );
    });
  }, [reports, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const paginatedReports = filteredReports.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const pages = useMemo(() => {
    const total = pageCount;
    const current = page;
    const delta = 2;
    const start = Math.max(1, current - delta);
    const end = Math.min(total, current + delta);
    const values: number[] = [];
    for (let i = start; i <= end; i += 1) values.push(i);
    if (start > 1) values.unshift(1);
    if (end < total) values.push(total);
    return Array.from(new Set(values));
  }, [page, pageCount]);

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {dept?.name || "Department"} Reports
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto text-pretty">
            Department reports uploaded by the department administration.
            This section is separate from campus-level reports.
          </p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">All Reports</h2>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? `${filteredReports.length} results` : `${reports.length} total reports`}
            </p>
          </div>

          {loading && (
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && <p className="text-red-500">{error}</p>}

          {!loading && !error && (
            <>
              {paginatedReports.length === 0 ? (
                <div className="text-center py-12 border rounded-md">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No reports found matching your search."
                      : "No department reports available right now."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedReports.map((report) => (
                    <Card key={report.uuid} className="hover:shadow-md transition-shadow py-4">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <h4 className="text-base sm:text-lg font-semibold leading-tight">
                                {report.title}
                              </h4>
                              <Badge variant="outline">{getReportTypeLabel(report)}</Badge>
                            </div>
                            <p
                              className="text-muted-foreground text-sm"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(report.summary || report.description || ""),
                              }}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              Published: {formatDate(getPublishedDate(report))}
                              {getIssueLabel(report)
                                ? ` • ${getIssueLabel(report)}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex gap-2 self-start lg:self-auto">
                            <Button
                              variant="outline"
                              onClick={() =>
                                setOpenId((currentId) =>
                                  currentId === report.uuid ? null : report.uuid
                                )
                              }
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            <a href={report.file} target="_blank" rel="noreferrer">
                              <Button className="bg-slate-600 hover:bg-secondary/10">
                                <Download className="h-4 w-4 mr-2" />
                                Open Report
                              </Button>
                            </a>
                          </div>
                        </div>

                        <Collapsible open={openId === report.uuid}>
                          <CollapsibleContent>
                            <div className="mt-3 rounded-md border bg-muted/30 p-2">
                              {/\.(png|jpe?g|gif|webp)$/i.test(report.file) ? (
                                <img
                                  src={report.file}
                                  alt={report.title}
                                  className="max-h-[70vh] w-full object-contain rounded"
                                />
                              ) : /\.pdf($|\?)/i.test(report.file) ? (
                                <div className="h-[70vh]">
                                  <iframe
                                    src={report.file}
                                    className="w-full h-full rounded"
                                  />
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Preview not available.
                                </p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    </Card>
                  ))}

                  {pageCount > 1 && (
                    <Pagination className="pt-2">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              setPage((previousPage) => Math.max(1, previousPage - 1));
                            }}
                          />
                        </PaginationItem>
                        {pages.map((itemPage) => (
                          <PaginationItem key={itemPage}>
                            <PaginationLink
                              href="#"
                              isActive={itemPage === page}
                              onClick={(event) => {
                                event.preventDefault();
                                setPage(itemPage);
                              }}
                            >
                              {itemPage}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              setPage((previousPage) =>
                                Math.min(pageCount, previousPage + 1)
                              );
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
