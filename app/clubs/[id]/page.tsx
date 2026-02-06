"use client";

import React, { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  Users,
  Calendar,
  FileText,
  User,
  GraduationCap,
  Share2,
  Image as ImageIcon,
} from "lucide-react";
import { useClub, generateClubSubdomain } from "@/hooks/use-clubs";
import {
  useEvents,
  formatEventDate,
  isUpcomingEvent,
  isPastEvent,
  generateEventSlug,
} from "@/hooks/use-events";
import { API_BASE, API_WEBSITE_PUBLIC_PREFIX } from "@/lib/env";
import type { ClubEvent } from "@/hooks/use-events";

interface ClubDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ClubDetailPage({ params }: ClubDetailPageProps) {
  const resolvedParams = React.use(params);
  const { club, loading, error, refetch } = useClub({
    id: resolvedParams.id,
  });

  const { events: clubEvents } = useEvents({
    limit: 50,
    ordering: "-date",
    club: club?.uuid,
  });

  const [clubEventDetails, setClubEventDetails] = useState<ClubEvent[]>([]);

  const clubSubdomain = club ? generateClubSubdomain(club.name) : null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: club?.name,
          text: club?.shortDescription,
          url: window.location.href,
        });
      } catch {
        // ignore share cancel
      }
      return;
    }
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  useEffect(() => {
    let isMounted = true;
    if (!clubEvents.length) {
      setClubEventDetails([]);
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

        const results = await Promise.all(detailPromises);
        if (isMounted) {
          setClubEventDetails(
            results.filter((item): item is ClubEvent => Boolean(item))
          );
        }
      } catch (err) {
        console.error("Error fetching club event details:", err);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [clubEvents]);

  const extractTextFromHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const aboutText = useMemo(() => {
    if (!club) return "";
    if (club.detailedDescription) {
      return extractTextFromHtml(club.detailedDescription);
    }
    return club.shortDescription || "";
  }, [club]);

  const activeMembers = (club?.members || []).filter(
    (member) => !member.isAlumni
  );
  const alumniMembers = (club?.members || []).filter(
    (member) => member.isAlumni
  );

  const upcomingEvents = clubEvents.filter(isUpcomingEvent).slice(0, 3);
  const pastEvents = clubEvents.filter(isPastEvent).slice(0, 3);

  const eventGalleryImages = clubEventDetails.flatMap(
    (event) => event.gallery || []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-800"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-red-600 text-lg mb-4">Error loading club</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="bg-slate-900 text-white px-6 py-2 rounded-full hover:bg-slate-800 mr-4"
          >
            Try Again
          </button>
          <Link
            href="/clubs"
            className="text-slate-900 hover:text-slate-700"
          >
            Back to Clubs
          </Link>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-gray-600 text-lg mb-4">Club not found</div>
          <Link
            href="/clubs"
            className="bg-slate-900 text-white px-6 py-2 rounded-full hover:bg-slate-800"
          >
            Back to Clubs
          </Link>
        </div>
      </div>
    );
  }

  const clubId = resolvedParams.id;

  return (
    <article className="min-h-screen bg-slate-50">
      <section className="relative">
        <div className="relative h-[45vh] min-h-[320px] overflow-hidden">
          <Image
            src={club.thumbnail || "/placeholder.svg?height=420&width=1200"}
            alt={club.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </div>

        <div className="absolute inset-0">
          <div className="max-w-6xl mx-auto h-full px-6 py-8 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <Link
                href="/clubs"
                className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Clubs
              </Link>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>

            <div className="text-white">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
                <span className="rounded-full bg-white/20 px-3 py-1">Student Club</span>
                {club.department?.name && (
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    {club.department.name}
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">
                {club.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80">
                {club.shortDescription}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {(club.websiteUrl || clubSubdomain) && (
                  <a
                    href={club.websiteUrl || `https://${clubSubdomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                  >
                    Visit Website
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <a
                  href={`mailto:${club.department?.name ? "info@tcioe.edu.np" : "info@tcioe.edu.np"}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/50 px-4 py-2 text-sm font-semibold text-white"
                >
                  Contact
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Members</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {club.members?.length || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Documents</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {club.documents?.length || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Events</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {clubEvents.length}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">About</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {aboutText || "No description available yet."}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Quick Links</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "Documents", href: `/clubs/${clubId}/documents`, icon: FileText },
                { label: "Events", href: `/clubs/${clubId}/events`, icon: Calendar },
                { label: "Members", href: `/clubs/${clubId}/members`, icon: Users },
                { label: "Alumni", href: `/clubs/${clubId}/alumni`, icon: GraduationCap },
                { label: "Gallery", href: `/clubs/${clubId}/gallery`, icon: ImageIcon },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-slate-500" />
                    {item.label}
                  </span>
                  <span className="text-slate-400">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Upcoming Events</h2>
              <Link
                href={`/clubs/${clubId}/events`}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-slate-500">No upcoming events yet.</p>
              )}
              {upcomingEvents.map((event) => (
                <Link
                  key={event.uuid}
                  href={`/events/${generateEventSlug(event.title) || event.uuid}`}
                  className="block rounded-xl border border-slate-200 p-4 hover:border-slate-300"
                >
                  <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatEventDate(event as ClubEvent)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Past Events</h2>
              <Link
                href={`/clubs/${clubId}/events`}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {pastEvents.length === 0 && (
                <p className="text-sm text-slate-500">No past events yet.</p>
              )}
              {pastEvents.map((event) => (
                <Link
                  key={event.uuid}
                  href={`/events/${generateEventSlug(event.title) || event.uuid}`}
                  className="block rounded-xl border border-slate-200 p-4 hover:border-slate-300"
                >
                  <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatEventDate(event as ClubEvent)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Members</h2>
            <Link
              href={`/clubs/${clubId}/members`}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              View all
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeMembers.slice(0, 6).map((member) => (
              <div
                key={member.uuid}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-100">
                  {member.photo ? (
                    <Image src={member.photo} alt={member.fullName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {member.fullName}
                  </p>
                  <p className="text-xs text-slate-500">{member.designation}</p>
                </div>
              </div>
            ))}
            {activeMembers.length === 0 && (
              <p className="text-sm text-slate-500">No members listed.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Gallery</h2>
            <Link
              href={`/clubs/${clubId}/gallery`}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...eventGalleryImages].slice(0, 6).map((item, index) => (
                  <div
                    key={`${item.uuid || item.id || index}`}
                    className="relative h-40 overflow-hidden rounded-xl bg-slate-100"
                  >
                    <Image
                      src={item.image || item.url || item}
                      alt={item.caption || "Club gallery"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
            {eventGalleryImages.length === 0 && (
                <p className="text-sm text-slate-500">No gallery images yet.</p>
              )}
          </div>
        </div>

        {alumniMembers.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Alumni</h2>
              <Link
                href={`/clubs/${clubId}/alumni`}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                View all
              </Link>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {alumniMembers.length} alumni members listed.
            </p>
          </div>
        )}
      </section>
    </article>
  );
}
