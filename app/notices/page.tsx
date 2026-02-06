"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, FileText, Download, Search, Calendar } from "lucide-react";
import { useDepartmentNotices } from "@/hooks/use-department";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateEventSlug } from "@/hooks/use-events";

export default function NoticesPage() {
  const { data, loading, error } = useDepartmentNotices({
    ordering: "-publishedAt",
    limit: 100,
  });

  // Only show notices approved by department
  const notices = (data?.results || []).filter((n) => n.isApprovedByDepartment);
  const totalCount = data?.count || notices.length;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    notices.forEach((n) => n.category?.name && set.add(n.category.name));
    return Array.from(set);
  }, [notices]);

  // Apply filters
  const filtered = useMemo(() => {
    return notices.filter((n) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = n.title?.toLowerCase().includes(query);
        const descMatch = n.description?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && n.category?.name !== selectedCategory) {
        return false;
      }

      // Date range filter
      if (startDate) {
        const noticeDate = new Date(n.publishedAt);
        const filterStart = new Date(startDate);
        if (noticeDate < filterStart) return false;
      }

      if (endDate) {
        const noticeDate = new Date(n.publishedAt);
        const filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);
        if (noticeDate > filterEnd) return false;
      }

      return true;
    });
  }, [notices, searchQuery, selectedCategory, startDate, endDate]);

  // Helper to strip HTML and truncate description
  const getShortDescription = (html: string, maxLength = 150) => {
    const text = html.replace(/<[^>]*>/g, "").trim();
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Check if notice has downloadable media (PDF files)
  const hasDownloadableMedia = (medias: { file: string; mediaType: string }[]) =>
    medias?.some((m) => m.mediaType === "application/pdf" || m.file?.endsWith(".pdf"));

  const getPdfUrl = (medias: { file: string; mediaType: string }[]) =>
    medias?.find((m) => m.mediaType === "application/pdf" || m.file?.endsWith(".pdf"))?.file;

  const handleFilter = () => {
    // Filters are already applied reactively, this is just for the button UX
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || startDate || endDate;

  return (
    <div className="py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Notices and Announcements
          </h1>
          <div className="w-16 h-1 bg-primary"></div>
        </div>

        {/* Filter Card */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Select */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="dd/mm/yyyy"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="dd/mm/yyyy"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Button */}
            <div className="flex justify-end">
              <Button onClick={handleFilter} className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </Card>

        {/* Notice Count */}
        <div className="text-right text-sm text-muted-foreground mb-6">
          Showing {filtered.length} of {totalCount} notices
        </div>

        {/* Notices List */}
        {loading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Failed to load notices.</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No notices found.
              </div>
            ) : (
              filtered.map((notice) => (
                <Card
                  key={notice.uuid}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col gap-3">
                    {/* Top row: Date and Category */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(notice.publishedAt)}</span>
                      </div>
                      {notice.category?.name && (
                        <Badge
                          variant="outline"
                          className="rounded-md font-normal"
                        >
                          {notice.category.name}
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-foreground leading-snug">
                      {notice.title}
                    </h3>

                    {/* Description */}
                    {notice.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getShortDescription(notice.description)}
                      </p>
                    )}

                    {/* Bottom row: Read More button and icons */}
                    <div className="flex items-center justify-between mt-2">
                    <Link href={`/notices/${notice.slug || generateEventSlug(notice.title) || notice.uuid}`}>
                        <Button size="sm" className="px-6">
                          Read More
                        </Button>
                      </Link>

                      {/* PDF/Download icons */}
                      {hasDownloadableMedia(notice.medias) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <a
                            href={getPdfUrl(notice.medias)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground transition-colors"
                            title="View PDF"
                          >
                            <FileText className="h-5 w-5" />
                          </a>
                          <a
                            href={getPdfUrl(notice.medias)}
                            download
                            className="hover:text-foreground transition-colors"
                            title="Download"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
