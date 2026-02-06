"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink, Search, Users } from "lucide-react";
import { useClubs, clubSlug } from "@/hooks/use-clubs";

export default function ClubsPage() {
  const { clubs, loading, error, refetch } = useClubs();
  const [query, setQuery] = useState("");

  const filteredClubs = useMemo(() => {
    if (!query.trim()) return clubs;
    const q = query.toLowerCase();
    return clubs.filter((club) => {
      const name = club.name?.toLowerCase() || "";
      const desc = club.shortDescription?.toLowerCase() || "";
      return name.includes(q) || desc.includes(q);
    });
  }, [clubs, query]);

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

      <div className="max-w-6xl mx-auto px-6 -mt-10 pb-12">
        <div className="rounded-3xl bg-white shadow-sm border border-slate-200 p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clubs by name or description..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-2">
                Showing {filteredClubs.length} of {clubs.length}
              </span>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="rounded-full border border-slate-200 px-3 py-2 text-slate-600 hover:text-slate-900"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map((club) => {
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
        {filteredClubs.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No clubs match your search yet.
          </div>
        )}
      </div>
    </div>
  );
}
