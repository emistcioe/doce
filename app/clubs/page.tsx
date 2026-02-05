"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users } from "lucide-react";
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
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Clubs</p>
              <h1 className="text-xl font-semibold text-slate-900">Student Clubs</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <Link
              key={club.uuid}
              href={`/clubs/${clubSlug(club.name) || club.uuid}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300"
            >
              <div className="relative h-36 w-full overflow-hidden rounded-xl bg-slate-100">
                {club.thumbnail && (
                  <Image src={club.thumbnail} alt={club.name} fill className="object-cover" />
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-900">{club.name}</p>
                <p className="mt-1 text-xs text-slate-500">{club.shortDescription}</p>
              </div>
            </Link>
          ))}
          {clubs.length == 0 && (
            <p className="text-sm text-slate-500">No clubs available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
