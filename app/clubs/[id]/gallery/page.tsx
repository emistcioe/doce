"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useClub } from "@/hooks/use-clubs";
import { useEvents } from "@/hooks/use-events";
import { API_BASE, API_WEBSITE_PUBLIC_PREFIX } from "@/lib/env";
import type { ClubEvent } from "@/hooks/use-events";

interface ClubGalleryPageProps {
  params: Promise<{ id: string }>;
}

type GalleryItem = {
  uuid?: string;
  id?: string;
  image?: string;
  url?: string;
  caption?: string | null;
};

export default function ClubGalleryPage({ params }: ClubGalleryPageProps) {
  const resolvedParams = React.use(params);
  const { club, loading, error, refetch } = useClub({ id: resolvedParams.id });
  const { events: clubEvents } = useEvents({
    limit: 50,
    ordering: "-date",
    club: club?.uuid,
  });

  const [clubGalleryItems, setClubGalleryItems] = useState<GalleryItem[]>([]);
  const [eventDetailGallery, setEventDetailGallery] = useState<GalleryItem[]>([]);
  const [eventGalleryItems, setEventGalleryItems] = useState<GalleryItem[]>([]);

  const resolveImageUrl = (value?: string | null) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    const base = API_BASE.replace(/\/$/, "");
    return `${base}${value.startsWith("/") ? "" : "/"}${value}`;
  };

  const normalizeGalleryItems = (items: GalleryItem[]) =>
    items
      .map((item) => {
        const src = resolveImageUrl(item.image || item.url);
        if (!src) return null;
        return { ...item, image: src };
      })
      .filter((item): item is GalleryItem => Boolean(item));

  useEffect(() => {
    let isMounted = true;
    if (!clubEvents.length) {
      setEventDetailGallery([]);
      setEventGalleryItems([]);
      return;
    }

    const fetchDetails = async () => {
      try {
        const detailPromises = clubEvents.slice(0, 6).map(async (event) => {
          const response = await fetch(`${API_BASE.replace(/\/$/, "")}${API_WEBSITE_PUBLIC_PREFIX}/global-events/${event.uuid}`, {
            cache: "no-store",
          });
          if (!response.ok) return null;
          return (await response.json()) as ClubEvent;
        });

        const galleryPromises = clubEvents.slice(0, 4).map(async (event) => {
          const params = new URLSearchParams({
            limit: "12",
            source_type: "global_event",
            source_identifier: event.uuid,
          });
          const response = await fetch(
            `/api/proxy/api/v1/public/website-mod/global-gallery?${params.toString()}`,
            { cache: "no-store" }
          );
          if (!response.ok) return [];
          const data = await response.json();
          return Array.isArray(data?.results) ? data.results : [];
        });

        const [results, galleryResults] = await Promise.all([
          Promise.all(detailPromises),
          Promise.all(galleryPromises),
        ]);
        if (isMounted) {
          const detailGallery = normalizeGalleryItems(
            results
              .filter((item): item is ClubEvent => Boolean(item))
              .flatMap((item) => item.gallery || [])
          );
          const eventGallery = normalizeGalleryItems(
            galleryResults.flat().filter(Boolean)
          );
          setEventDetailGallery(detailGallery);
          setEventGalleryItems(eventGallery);
        }
      } catch {
        setEventDetailGallery([]);
        setEventGalleryItems([]);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [clubEvents]);

  useEffect(() => {
    let isMounted = true;
    if (!club?.uuid) {
      setClubGalleryItems([]);
      return;
    }

    const controller = new AbortController();
    const fetchClubGallery = async () => {
      try {
        const params = new URLSearchParams({
          limit: "30",
          source_type: "club_gallery",
          source_identifier: club.uuid,
        });
        const response = await fetch(
          `/api/proxy/api/v1/public/website-mod/global-gallery?${params.toString()}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (!response.ok) return;
        const data = await response.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        if (isMounted) {
          setClubGalleryItems(normalizeGalleryItems(results));
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    };

    void fetchClubGallery();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [club?.uuid]);

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
          <p className="text-red-600">Unable to load gallery.</p>
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

  const galleryItems = useMemo(() => {
    const items = [...clubGalleryItems, ...eventDetailGallery, ...eventGalleryItems];
    const seen = new Set<string>();
    return items.filter((item) => {
      const src = item.image || item.url;
      if (!src) return false;
      if (seen.has(src)) return false;
      seen.add(src);
      return true;
    });
  }, [clubGalleryItems, eventDetailGallery, eventGalleryItems]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
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
            <ImageIcon className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Gallery</p>
              <h1 className="text-xl font-semibold text-slate-900">{club.name}</h1>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          {galleryItems.length === 0 && (
            <p className="text-sm text-slate-500">No gallery images yet.</p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item, index) => (
              <div
                key={`${item.uuid || item.id || index}`}
                className="relative h-48 overflow-hidden rounded-xl bg-slate-100"
              >
                <Image
                  src={item.image || item.url || ""}
                  alt={item.caption || "Club gallery"}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
