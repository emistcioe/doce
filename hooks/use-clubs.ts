"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE, API_WEBSITE_PUBLIC_PREFIX } from "@/lib/env";

export interface ClubMember {
  uuid: string;
  fullName: string;
  designation: string;
  photo?: string;
  isAlumni?: boolean;
  batchYear?: string;
}

export interface ClubDocument {
  uuid: string;
  title: string;
  description?: string | null;
  file: string;
  issuedDate?: string | null;
}

export interface Club {
  uuid: string;
  name: string;
  slug?: string;
  shortDescription: string;
  detailedDescription?: string;
  thumbnail?: string;
  websiteUrl?: string;
  members?: ClubMember[];
  documents?: ClubDocument[];
  department?: { uuid: string; name: string } | null;
}

interface ClubsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Club[];
}

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

const getApiUrl = (path: string) => `${API_BASE.replace(/\/$/, "")}${path}`;

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getApiUrl(`${API_WEBSITE_PUBLIC_PREFIX}/clubs?limit=200`);
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load clubs");
      const data = (await response.json()) as ClubsResponse;
      setClubs(data.results || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load clubs");
      setClubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClubs();
  }, [fetchClubs]);

  return { clubs, loading, error, refetch: fetchClubs };
}

export function useClub(params: { id: string }) {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClub = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let clubUuid = params.id;
      if (!isUUID(params.id)) {
        const listUrl = getApiUrl(`${API_WEBSITE_PUBLIC_PREFIX}/clubs?limit=200`);
        const listRes = await fetch(listUrl, { cache: "no-store" });
        if (!listRes.ok) throw new Error("Failed to load club list");
        const listData = (await listRes.json()) as ClubsResponse;
        const match = listData.results?.find((c) => {
          const slug = (c.slug || toSlug(c.name || "")).toLowerCase();
          return slug === params.id.toLowerCase();
        });
        if (!match) throw new Error("Club not found");
        clubUuid = match.uuid;
      }

      const detailUrl = getApiUrl(`${API_WEBSITE_PUBLIC_PREFIX}/clubs/${clubUuid}`);
      const detailRes = await fetch(detailUrl, { cache: "no-store" });
      if (!detailRes.ok) throw new Error("Club not found");
      const detailData = (await detailRes.json()) as Club;
      setClub(detailData);
    } catch (e: any) {
      setError(e?.message || "Failed to load club");
      setClub(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void fetchClub();
  }, [fetchClub]);

  return { club, loading, error, refetch: fetchClub };
}

export function clubSlug(name?: string | null) {
  return name ? toSlug(name) : "";
}

export function generateClubSubdomain(clubName: string): string {
  const slug = clubSlug(clubName);
  return `${slug}.tcioe.edu.np`;
}
