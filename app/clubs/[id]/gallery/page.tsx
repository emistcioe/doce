"use client";

import React, { useEffect, useState } from "react";
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

export default function ClubGalleryPage({ params }: ClubGalleryPageProps) {
  const resolvedParams = React.use(params);
  const { club, loading, error, refetch } = useClub({ id: resolvedParams.id });
  const { events: clubEvents } = useEvents({
    limit: 50,
    ordering: "-date",
    club: club?.uuid,
  });

  const [eventGalleryImages, setEventGalleryImages] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (!clubEvents.length) {
      setEventGalleryImages([]);
      return;
    }

    const fetchDetails = async () => {
      try {
        const detailPromises = clubEvents.slice(0, 8).map(async (event) => {
          const response = await fetch(`${API_BASE.replace(/\/$/, "")}${API_WEBSITE_PUBLIC_PREFIX}/global-events/${event.uuid}`, {
            cache: "no-store",
          });
          if (!response.ok) return null;
          return (await response.json()) as ClubEvent;
        });

        const results = await Promise.all(detailPromises);
        if (isMounted) {
          const images = results
            .filter((item): item is ClubEvent => Boolean(item))
            .flatMap((item) => item.gallery || []);
          setEventGalleryImages(images);
        }
      } catch {
        setEventGalleryImages([]);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [clubEvents]);

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

  const galleryItems = [...eventGalleryImages];

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
                  src={item.image || item.url || item}
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
