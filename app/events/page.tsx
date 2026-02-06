"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { useDepartment, useDepartmentEvents } from "@/hooks/use-department";
import { Skeleton } from "@/components/ui/skeleton";
import { generateEventSlug } from "@/hooks/use-events";

const sanitizeText = (value?: string | null) =>
  value ? value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";

const truncateText = (value?: string | null, limit = 120) => {
  const text = sanitizeText(value);
  if (!text) return "";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
};

export default function EventsPage() {
  const { data: dept } = useDepartment();
  const { data, loading, error } = useDepartmentEvents({
    ordering: "-eventStartDate",
    limit: 50,
    departmentUuid: dept?.uuid,
  });

  const allEvents = data?.results || [];

  const tcase = (s?: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

  const isUpcoming = (s?: string | null, e?: string | null) => {
    const now = new Date();
    const ed = e ? new Date(e) : null;
    const sd = s ? new Date(s) : null;
    // Event is upcoming if end date is in the future OR if no end date, start date is in the future
    if (ed && !Number.isNaN(ed.getTime())) {
      return ed.getTime() >= now.getTime();
    }
    if (sd && !Number.isNaN(sd.getTime())) {
      return sd.getTime() >= now.getTime();
    }
    return true; // If no dates, show it
  };

  const isPast = (s?: string | null, e?: string | null) => {
    const now = new Date();
    const ed = e ? new Date(e) : null;
    if (ed && !Number.isNaN(ed.getTime())) {
      return ed.getTime() < now.getTime();
    }
    const sd = s ? new Date(s) : null;
    if (sd && !Number.isNaN(sd.getTime())) {
      return sd.getTime() < now.getTime();
    }
    return false;
  };

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

  // Filter events into upcoming and past
  const upcomingEvents = allEvents.filter((e) => isUpcoming(e.eventStartDate, e.eventEndDate));
  const pastEvents = allEvents.filter((e) => isPast(e.eventStartDate, e.eventEndDate));

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

        {/* Upcoming Events Grid */}
        <div className="mb-16">
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

          {!loading && !error && upcomingEvents.length === 0 && (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No upcoming events</p>
              <p className="text-slate-400 text-sm mt-1">Check back soon for new events</p>
            </div>
          )}

          {!loading && !error && upcomingEvents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {upcomingEvents.map((event) => {
                const status = statusOf(event.eventStartDate, event.eventEndDate);
                const eventSlug = generateEventSlug(event.title) || event.uuid;
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
                        asChild
                      >
                        <Link href={`/events/${eventSlug}`}>
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Events Section */}
        {!loading && !error && pastEvents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" />
                Past Events
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event) => (
                <Card
                  key={event.uuid}
                  className="group overflow-hidden bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 rounded-xl opacity-80 hover:opacity-100"
                >
                  <div className="aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden relative">
                    {event.thumbnail ? (
                      <img
                        src={event.thumbnail}
                        alt={event.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-slate-200" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <Badge className="px-2 py-0.5 text-xs font-medium bg-slate-500 hover:bg-slate-500 text-white border-0">
                        Finished
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-base font-semibold text-slate-700 mb-1 line-clamp-1 group-hover:text-slate-900 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-slate-400 text-xs mb-3">
                      {fmt(event.eventStartDate)}
                      {event.eventEndDate && event.eventStartDate !== event.eventEndDate && ` — ${fmt(event.eventEndDate)}`}
                    </p>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-slate-500 hover:text-slate-900"
                      asChild
                    >
                      <Link href={`/events/${generateEventSlug(event.title) || event.uuid}`}>
                        View Details
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
