"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { useClub } from "@/hooks/use-clubs";

interface ClubDocumentsPageProps {
  params: Promise<{ id: string }>;
}

export default function ClubDocumentsPage({ params }: ClubDocumentsPageProps) {
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
          <p className="text-red-600">Unable to load documents.</p>
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

  const documents = club.documents || [];

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
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
              {club.thumbnail && (
                <Image src={club.thumbnail} alt={club.name} fill className="object-cover" />
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Documents</p>
              <h1 className="text-xl font-semibold text-slate-900">{club.name}</h1>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Club Documents</h2>
          <div className="mt-4 space-y-4">
            {documents.length === 0 && (
              <p className="text-sm text-slate-500">No documents uploaded yet.</p>
            )}
            {documents.map((doc) => (
              <div
                key={doc.uuid}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                    {doc.description && (
                      <p className="text-xs text-slate-500 mt-1">{doc.description}</p>
                    )}
                    {doc.issuedDate && (
                      <p className="text-xs text-slate-400 mt-1">Issued: {doc.issuedDate}</p>
                    )}
                  </div>
                </div>
                <a
                  href={doc.file}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  View Document <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
