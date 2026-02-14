"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Eye, Search } from "lucide-react";
import { useDepartment, useDepartmentDownloads } from "@/hooks/use-department";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import type { DepartmentDownload } from "@/lib/types/department";

type PublicationKind = "ALL" | "DOWNLOAD" | "SYLLABUS" | "REPORT" | "MAGAZINE";
type CategoryValue = Exclude<PublicationKind, "ALL"> | "OTHER";

const CATEGORY_FILTERS: Array<{ label: string; value: PublicationKind }> = [
  { label: "All", value: "ALL" },
  { label: "Downloads", value: "DOWNLOAD" },
  { label: "Syllabus", value: "SYLLABUS" },
  { label: "Magazines", value: "MAGAZINE" },
  { label: "Reports", value: "REPORT" },
];

function normalizeCategory(raw?: string | null): CategoryValue {
  const normalized = String(raw || "").trim().toUpperCase();
  if (normalized === "DOWNLOAD" || normalized === "DOWNLOADS") return "DOWNLOAD";
  if (normalized === "SYLLABUS" || normalized === "SYLLABI") return "SYLLABUS";
  if (normalized === "MAGAZINE" || normalized === "MAGAZINES") return "MAGAZINE";
  if (normalized === "REPORT" || normalized === "REPORTS") return "REPORT";
  return "OTHER";
}

function parseCategoryParam(raw?: string | null): PublicationKind {
  if (!raw) return "ALL";
  const normalized = normalizeCategory(raw);
  if (normalized === "OTHER") return "ALL";
  return normalized;
}

function getCategoryLabel(download: DepartmentDownload): string {
  const explicit =
    download.categoryDisplay ||
    download.category_display ||
    download.category;

  if (explicit) return explicit;

  const normalized = normalizeCategory(download.category);
  if (normalized === "DOWNLOAD") return "Academic Download";
  if (normalized === "SYLLABUS") return "Syllabus";
  if (normalized === "MAGAZINE") return "Magazine";
  if (normalized === "REPORT") return "Report";

  return "Download";
}

export default function DownloadsPage() {
  const PAGE_SIZE = 10;
  const { data: dept } = useDepartment();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [publicationKind, setPublicationKind] = useState<PublicationKind>("ALL");
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const { data, loading, error } = useDepartmentDownloads({
    limit: 1000,
    offset: 0,
  });

  useEffect(() => {
    setPublicationKind(parseCategoryParam(categoryParam));
  }, [categoryParam]);

  const filteredDownloads = useMemo(() => {
    const allDownloads = data?.results || [];

    return allDownloads.filter((download) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        download.title.toLowerCase().includes(query) ||
        (download.summary || "").toLowerCase().includes(query) ||
        (download.description || "").toLowerCase().includes(query) ||
        (download.issueLabel || download.issue_label || "").toLowerCase().includes(query) ||
        getCategoryLabel(download).toLowerCase().includes(query);

      const category = normalizeCategory(download.category);
      const matchesCategory = publicationKind === "ALL" || category === publicationKind;

      return matchesSearch && matchesCategory;
    });
  }, [data?.results, publicationKind, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredDownloads.length / PAGE_SIZE));

  const paginatedDownloads = filteredDownloads.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, publicationKind]);

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

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {dept?.name || "Department"} Downloads & Publications
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto text-pretty">
            Browse academic downloads, syllabus files, magazines, and reports in one place.
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            {CATEGORY_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={publicationKind === filter.value ? "default" : "outline"}
                onClick={() => setPublicationKind(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">All Resources</h2>
            <p className="text-sm text-muted-foreground">
              {searchTerm || publicationKind !== "ALL"
                ? `${filteredDownloads.length} results`
                : `${data?.count || 0} total files`}
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

          {error && <p className="text-red-500">Failed to load resources.</p>}

          {!loading && !error && (
            <>
              {paginatedDownloads.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm || publicationKind !== "ALL"
                      ? "No resources found matching your filters."
                      : "No resources available right now."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedDownloads.map((download) => (
                    <Card
                      key={download.uuid}
                      className="hover:shadow-md transition-shadow py-4"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1 gap-2">
                              <h4 className="text-base sm:text-lg font-semibold leading-tight">
                                {download.title}
                              </h4>
                              <Badge variant="outline">{getCategoryLabel(download)}</Badge>
                            </div>
                            <p
                              className="text-muted-foreground text-sm"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(download.summary || download.description || ""),
                              }}
                            />
                          </div>

                          <div className="flex gap-2 self-start lg:self-auto">
                            <Button
                              variant="outline"
                              onClick={() =>
                                setOpenId((currentId) =>
                                  currentId === download.uuid ? null : download.uuid
                                )
                              }
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>

                            <a href={download.file} target="_blank" rel="noreferrer">
                              <Button className="bg-slate-600 hover:bg-secondary/10">
                                <Download className="h-4 w-4 mr-2" />
                                Open File
                              </Button>
                            </a>
                          </div>
                        </div>

                        <Collapsible open={openId === download.uuid}>
                          <CollapsibleContent>
                            <div className="mt-3 rounded-md border bg-muted/30 p-2">
                              {/\.(png|jpe?g|gif|webp)$/i.test(download.file) ? (
                                <img
                                  src={download.file}
                                  alt={download.title}
                                  className="max-h-[70vh] w-full object-contain rounded"
                                />
                              ) : /\.pdf($|\?)/i.test(download.file) ? (
                                <div className="h-[70vh]">
                                  <iframe
                                    src={download.file}
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
                              setPage((currentPage) => Math.max(1, currentPage - 1));
                            }}
                          />
                        </PaginationItem>

                        {pages.map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              isActive={pageNumber === page}
                              onClick={(event) => {
                                event.preventDefault();
                                setPage(pageNumber);
                              }}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              setPage((currentPage) => Math.min(pageCount, currentPage + 1));
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
