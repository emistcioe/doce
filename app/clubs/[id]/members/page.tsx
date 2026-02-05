"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Users, User } from "lucide-react";
import { useClub } from "@/hooks/use-clubs";

interface ClubMembersPageProps {
  params: Promise<{ id: string }>;
}

export default function ClubMembersPage({ params }: ClubMembersPageProps) {
  const resolvedParams = React.use(params);
  const { club, loading, error, refetch } = useClub({ id: resolvedParams.id });

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
          <p className="text-red-600">Unable to load members.</p>
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

  const members = (club.members || []).filter((member) => !member.isAlumni);

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
            <Users className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Members</p>
              <h1 className="text-xl font-semibold text-slate-900">{club.name}</h1>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.length === 0 && (
              <p className="text-sm text-slate-500">No members listed.</p>
            )}
            {members.map((member) => (
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
                  <p className="text-sm font-semibold text-slate-900">{member.fullName}</p>
                  <p className="text-xs text-slate-500">{member.designation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
