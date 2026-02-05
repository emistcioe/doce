"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink, Users } from "lucide-react";
import { useClubs, clubSlug } from "@/hooks/use-clubs";

export default function ClubsPage() {
  const { clubs, loading, error, refetch } = useClubs();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-red-600">Unable to load clubs.</p>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Clubs</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold">Student Clubs</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/75">
              Explore student-led communities, projects, and events that shape the department culture.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
              Total clubs: {clubs.length}
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
              Updated live
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-8 pb-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => {
            const clubId = clubSlug(club.name) || club.uuid;
            return (
              <div
                key={club.uuid}
                className="group rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/clubs/${clubId}`} className="block">
                  <div className="relative h-44 overflow-hidden rounded-t-3xl bg-slate-100">
                    {club.thumbnail ? (
                      <Image
                        src={club.thumbnail}
                        alt={club.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-white text-slate-400">
                        <Users className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Student club</p>
                      {club.department?.name && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                          {club.department.name}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">{club.name}</h2>
                    <p className="text-sm text-slate-600">
                      {club.shortDescription || "A student-run club in the department."}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        Members: {club.members?.length || 0}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        Documents: {club.documents?.length || 0}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                  <Link
                    href={`/clubs/${clubId}`}
                    className="text-sm font-semibold text-slate-900"
                  >
                    View club
                  </Link>
                  {club.websiteUrl && (
                    <a
                      href={club.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Website <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {clubs.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No clubs available right now.
          </div>
        )}
      </div>
    </div>
  );
}
