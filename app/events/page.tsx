"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, MapPin } from "lucide-react";
import { getPublicApiUrl } from "@/lib/env";
import { useDepartment, useDepartmentEvents } from "@/hooks/use-department";
import { Skeleton } from "@/components/ui/skeleton";

type GlobalEventItem = {
  uuid: string;
  title: string;
  description?: string | null;
  eventType?: string | null;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
};

const formatEventDate = (value?: string | null) => {
  if (!value) return "TBD";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return value;
  }
};

const formatEventRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "Dates to be announced";
  const from = formatEventDate(start);
  if (!end) return from;
  const to = formatEventDate(end);
  return from === to ? from : `${from} — ${to}`;
};

const sanitizeText = (value?: string | null) =>
  value ? value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";

const truncateText = (value?: string | null, limit = 120) => {
  const text = sanitizeText(value);
  if (!text) return "";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
};

const humanizeEventType = (value?: string | null) =>
  value
    ? value
        .split(/[_\s]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
    : "";

export default function EventsPage() {
  const { data: dept } = useDepartment();
  const { data, loading, error } = useDepartmentEvents({
    ordering: "-eventStartDate",
    limit: 20,
    departmentUuid: dept?.uuid,
  });

  const events = data?.results || [];

  const tcase = (s?: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

  const statusOf = (s?: string | null, e?: string | null) => {
    const now = new Date();
    const sd = s ? new Date(s) : null;
    const ed = e ? new Date(e) : null;
    if (ed && !Number.isNaN(ed.getTime()) && ed.getTime() < now.getTime())
      return { label: "Finished", color: "bg-slate-500" };
    if (sd && !Number.isNaN(sd.getTime()) && sd.getTime() > now.getTime())
      return { label: "Upcoming", color: "bg-blue-500" };
    return { label: "Running", color: "bg-emerald-500" };
  };

  const fmt = (d?: string | null) => {
    if (!d) return "TBD";
    try {
      const date = new Date(d);
      return Number.isNaN(date.getTime())
        ? d
        : date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
          });
    } catch {
      return d;
    }
  };

  const [globalEvents, setGlobalEvents] = useState<GlobalEventItem[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!dept?.uuid) {
      setGlobalEvents([]);
      setGlobalLoading(false);
      return;
    }

    const controller = new AbortController();
    const fetchGlobalEvents = async () => {
      setGlobalLoading(true);
      setGlobalError(null);
      try {
        const params = new URLSearchParams({
          limit: "4",
          department: dept.uuid,
          ordering: "-eventStartDate",
        });
        const response = await fetch(
          `${getPublicApiUrl("/api/v1/public/website-mod/global-events")}?${params.toString()}`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to load campus events (${response.status})`);
        }
        const data = await response.json();
        const items = Array.isArray(data?.results) ? data.results : [];
        setGlobalEvents(items);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setGlobalError(
          error instanceof Error
            ? error.message
            : "Unable to load campus events right now."
        );
      } finally {
        setGlobalLoading(false);
      }
    };

    void fetchGlobalEvents();
    return () => controller.abort();
  }, [dept?.uuid]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-xs font-medium tracking-wide">
            Events & Activities
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            {dept?.name || "Department"} Events
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Stay updated with our upcoming events, conferences, workshops, and
            academic activities that foster learning and collaboration.
          </p>
        </div>

        {/* Events Grid */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">Upcoming Events</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-6" />
          </div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
                  <Skeleton className="aspect-[16/9]" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-red-600 font-medium">Failed to load events</p>
              <p className="text-red-500 text-sm mt-1">Please try again later</p>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No events scheduled</p>
              <p className="text-slate-400 text-sm mt-1">Check back soon for upcoming events</p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map((event) => {
                const status = statusOf(event.eventStartDate, event.eventEndDate);
                return (
                  <Card
                    key={event.uuid}
                    className="group overflow-hidden bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300 rounded-2xl"
                  >
                    <div className="aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden relative">
                      {event.thumbnail ? (
                        <img
                          src={event.thumbnail}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="h-16 w-16 text-slate-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 flex gap-2">
                        <Badge className={`px-3 py-1 text-xs font-medium ${status.color} hover:${status.color} text-white border-0`}>
                          {status.label}
                        </Badge>
                        {event.eventType && (
                          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium bg-white/90 text-slate-700">
                            {tcase(event.eventType)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-slate-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">
                        {truncateText(event.description, 120)}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-5">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {fmt(event.eventStartDate)}
                        </span>
                        {event.eventEndDate && event.eventStartDate !== event.eventEndDate && (
                          <>
                            <span className="text-slate-300">→</span>
                            <span>{fmt(event.eventEndDate)}</span>
                          </>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        className="w-full group/btn hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-200"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Campus-wide Events */}
        <div className="border-t border-slate-100 pt-16">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-1.5 text-xs font-medium tracking-wide text-blue-600 border-blue-200 bg-blue-50">
              Campus Highlights
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Global events tied to {dept?.shortName || "your department"}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Events that bring the whole campus together — filtered for your department so you know what's nearby.
            </p>
          </div>

          {globalLoading ? (
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : globalError ? (
            <div className="text-center py-12 bg-red-50 rounded-2xl max-w-2xl mx-auto">
              <p className="text-red-600">{globalError}</p>
            </div>
          ) : globalEvents.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 max-w-2xl mx-auto">
              <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No campus-wide events</p>
              <p className="text-slate-400 text-sm mt-1">
                No campus-wide events are linked to this department right now.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {globalEvents.map((event) => (
                <div
                  key={event.uuid}
                  className="group relative rounded-2xl border border-slate-100 bg-white p-6 hover:shadow-lg hover:shadow-slate-100/50 hover:border-slate-200 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium mt-1">
                        {formatEventRange(event.eventStartDate, event.eventEndDate)}
                      </p>
                    </div>
                    {event.eventType && (
                      <Badge variant="secondary" className="shrink-0 bg-slate-100 text-slate-600 hover:bg-slate-100">
                        {humanizeEventType(event.eventType)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {truncateText(event.description, 140)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Button
              variant="outline"
              className="px-8 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-200"
              asChild
            >
              <a href="https://tcioe.edu.np/events" target="_blank" rel="noreferrer">
                Browse all campus events
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
