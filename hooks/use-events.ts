"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE, API_WEBSITE_PUBLIC_PREFIX } from "@/lib/env";

export type ClubEvent = {
  uuid: string;
  title: string;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  date?: string | null;
  thumbnail?: string | null;
  description?: string | null;
  registrationLink?: string | null;
  location?: string | null;
};

interface UseEventsParams {
  club?: string;
  limit?: number;
  ordering?: string;
}

export function generateEventSlug(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getEventDate(event: ClubEvent): string {
  return event.eventStartDate || event.date || "";
}

export function formatEventDate(event: ClubEvent): string {
  const dateString = getEventDate(event);
  if (!dateString) return "Date TBA";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function isUpcomingEvent(event: ClubEvent): boolean {
  const dateString = getEventDate(event);
  if (!dateString) return false;
  const eventDate = new Date(dateString);
  if (isNaN(eventDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return eventDate >= today;
}

export function isPastEvent(event: ClubEvent): boolean {
  const dateString = getEventDate(event);
  if (!dateString) return false;
  const eventDate = new Date(dateString);
  if (isNaN(eventDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return eventDate < today;
}

export function useEvents(params: UseEventsParams = {}) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params.club) searchParams.append("club", params.club);
      if (params.limit) searchParams.append("limit", String(params.limit));
      if (params.ordering) searchParams.append("ordering", params.ordering);

      const url = `${API_BASE.replace(/\/$/, "")}${API_WEBSITE_PUBLIC_PREFIX}/global-events?${searchParams.toString()}`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load events");
      const data = await response.json();
      setEvents(data.results || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [params.club, params.limit, params.ordering]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}
