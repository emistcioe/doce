"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar } from "lucide-react";
import { useClub } from "@/hooks/use-clubs";
import {
  useEvents,
  formatEventDate,
  isUpcomingEvent,
  isPastEvent,
  generateEventSlug,
} from "@/hooks/use-events";
import type { ClubEvent } from "@/hooks/use-events";

interface ClubEventsPageProps {
  params: Promise<{ id: string }>;
}

export default function ClubEventsPage({ params }: ClubEventsPageProps) {
  const resolvedParams = React.use(params);
  const { club, loading, error, refetch } = useClub({ id: resolvedParams.id });

  const { events } = useEvents({
    limit: 200,
    ordering: "-date",
    club: club?.uuid,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-red-600">Unable to load events.</p>
          {error && <p className="text-sm text-slate-500 mt-2">{error}</p>}
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const upcomingEvents = events.filter(isUpcomingEvent);
  const pastEvents = events.filter(isPastEvent);

  const renderEventCard = (event: any) => (
    <Link
      key={event.uuid}
      href={`/events/${generateEventSlug(event.title) || event.uuid}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-20 overflow-hidden rounded-xl bg-slate-100">
          {event.thumbnail && (
            <Image src={event.thumbnail} alt={event.title} fill className="object-cover" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{event.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatEventDate(event as ClubEvent)}
          </p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/clubs/${resolvedParams.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Club
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Events</p>
              <h1 className="text-xl font-semibold text-slate-900">{club.name}</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Events</h2>
            <div className="mt-4 space-y-3">
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-slate-500">No upcoming events.</p>
              )}
              {upcomingEvents.map(renderEventCard)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Past Events</h2>
            <div className="mt-4 space-y-3">
              {pastEvents.length === 0 && (
                <p className="text-sm text-slate-500">No past events yet.</p>
              )}
              {pastEvents.map(renderEventCard)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
