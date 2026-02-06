"use client";

import { useParams, useRouter } from "next/navigation";
import { useDepartmentNotices } from "@/hooks/use-department";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Download, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import Link from "next/link";
import { generateEventSlug } from "@/hooks/use-events";

export default function NoticeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const noticeKey = params.id as string;
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      noticeKey
    );

  const { data, loading, error } = useDepartmentNotices({
    ordering: "-publishedAt",
    limit: 100,
  });

  const allNotices = (data?.results || []).filter((n) => n.isApprovedByDepartment);
  const notice = allNotices.find((n) =>
    isUuid ? n.uuid === noticeKey : generateEventSlug(n.title) === noticeKey
  );
  
  // Get latest 5 notices for sidebar (excluding current)
  const latestNotices = allNotices
    .filter((n) =>
      isUuid
        ? n.uuid !== noticeKey
        : generateEventSlug(n.title) !== noticeKey
    )
    .slice(0, 5);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="w-16 h-1 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-12 w-3/4 mb-4" />
              <Skeleton className="h-6 w-48 mb-8" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-24 w-full mb-3" />
              <Skeleton className="h-24 w-full mb-3" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Notice Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The notice you are looking for does not exist or has been removed.
          </p>
          <Link href="/notices">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notices
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Notices and Announcements
          </h1>
          <div className="w-16 h-1 bg-primary"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Notice Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 break-words">
              {notice.title}
            </h2>

            {/* Category Badge */}
            {notice.category?.name && (
              <Badge variant="secondary" className="mb-4 uppercase text-xs font-medium">
                {notice.category.name}
              </Badge>
            )}

            {/* Published Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Calendar className="h-4 w-4" />
              <span>Published on {formatDate(notice.publishedAt)}</span>
              <span className="text-muted-foreground/50">•</span>
              
            </div>

            {/* Description Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <div
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(notice.description || ""),
                }}
              />
            </div>

            {/* Attachments - PDF Viewer */}
            {notice.medias && notice.medias.length > 0 && (
              <div className="space-y-4">
                {notice.medias.map((m) => (
                  <div key={m.uuid}>
                    {/* Preview for images */}
                    {/\.(png|jpe?g|gif|webp)$/i.test(m.file) && (
                      <div className="mb-4">
                        <img
                          src={m.file}
                          alt={m.caption || notice.title}
                          className="max-h-[60vh] w-full object-contain rounded border"
                        />
                        <div className="mt-2 flex justify-end">
                          <a href={m.file} target="_blank" rel="noreferrer" download>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* PDF Viewer - keeping as is */}
                    {/\.pdf($|\?)/i.test(m.file) && (
                      <div className="h-[70vh] rounded border overflow-hidden">
                        <iframe
                          src={m.file}
                          className="w-full h-full"
                          title={m.caption || "PDF Preview"}
                        />
                      </div>
                    )}

                    {/* Other file types */}
                    {!/\.(png|jpe?g|gif|webp)$/i.test(m.file) &&
                      !/\.pdf($|\?)/i.test(m.file) && (
                        <Card>
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {m.caption || "Attachment"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {m.mediaType || "File"}
                                </p>
                              </div>
                              <a href={m.file} target="_blank" rel="noreferrer">
                                <Button size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Latest Notices */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold mb-4">Latest Notices</h3>
            <div className="space-y-3">
              {latestNotices.map((n) => (
                <Link
                  key={n.uuid}
                  href={`/notices/${generateEventSlug(n.title) || n.uuid}`}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-medium text-sm mb-2 line-clamp-2 hover:text-primary transition-colors">
                      {n.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatDate(n.publishedAt)}
                    </p>
                    {n.category?.name && (
                      <Badge
                        variant={
                          n.category.name.toLowerCase() === "event"
                            ? "default"
                            : n.category.name.toLowerCase() === "admission"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {n.category.name}
                      </Badge>
                    )}
                  </Card>
                </Link>
              ))}
            </div>

            {/* View All Notices Link */}
            <Link
              href="/notices"
              className="inline-flex items-center text-primary hover:underline mt-4 text-sm font-medium"
            >
              View All Notices →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
