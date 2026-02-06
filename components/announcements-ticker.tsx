"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDepartmentNotices } from "@/hooks/use-department";
import { generateEventSlug } from "@/hooks/use-events";

type Item = { kind: "notice"; title: string; href: string };

export default function AnnouncementsTicker() {
  // Fetch notices only
  const { data: notices } = useDepartmentNotices({
    limit: 6,
    ordering: "-publishedAt",
  });

  const items: Item[] = useMemo(() => {
    // Only show notices approved by department
    const no = (notices?.results || [])
      .filter((n) => n.isApprovedByDepartment)
      .map((n) => ({
        kind: "notice" as const,
        title: n.title ?? "",
        href: `/notices/${n.slug || generateEventSlug(n.title) || n.uuid}`,
      }));
    return no;
  }, [notices?.results]);

  const [index, setIndex] = useState(0);
  const [animateIn, setAnimateIn] = useState(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!items.length) return;
    timer.current = window.setInterval(() => {
      // leave
      setAnimateIn(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setAnimateIn(true);
      }, 300); // small gap for leave
    }, 6500);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
    };
  }, [items.length]);

  if (!items.length) {
    // Don't show anything if there are no notices
    return null;
  }

  const current = items[index];

  return (
    <div className="bg-accent text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Announcements</span>
            <button
              aria-label="Previous announcement"
              className="text-white/80 hover:text-white"
              onClick={() => {
                setAnimateIn(false);
                window.setTimeout(() => {
                  setIndex((i) => (i - 1 + items.length) % items.length);
                  setAnimateIn(true);
                }, 120);
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="relative h-6 flex-1 overflow-hidden text-center">
            <Link
              href={current.href}
              className={`inline-block text-sm font-medium transition-all duration-300 will-change-transform ${
                animateIn
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4"
              }`}
              title={current.title}
            >
              {current.title}
            </Link>
          </div>

          <button
            aria-label="Next announcement"
            className="text-white/80 hover:text-white"
            onClick={() => {
              setAnimateIn(false);
              window.setTimeout(() => {
                setIndex((i) => (i + 1) % items.length);
                setAnimateIn(true);
              }, 120);
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
