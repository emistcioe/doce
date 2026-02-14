"use client";

import Link from "next/link";
import { Facebook, Mail, Phone, MapPin, X } from "lucide-react";
import { useDepartmentContext } from "@/providers/department-provider";
import { useDepartmentNotices } from "@/hooks/use-department";
import { useEffect, useMemo, useState } from "react";
import FeaturedNoticeModal from "@/components/featured-notice-modal";

export function Footer() {
  const { data: dept } = useDepartmentContext();
  // Global featured notice popup (once per notice)
  const { data: noticeData } = useDepartmentNotices({
    limit: 5,
    ordering: "-publishedAt",
    departmentUuid: dept?.uuid,
  });
  const featured = useMemo(
    () => (noticeData?.results || []).find((n) => n.isApprovedByDepartment && n.isFeatured && n.thumbnail),
    [noticeData]
  );
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (featured) setOpen(true);
  }, [featured]);

  const email = dept?.email || "info@tcioe.edu.np";
  const phone = dept?.phoneNo || "+977-1-4259955";
  const address = "Thapathali Campus, Kathmandu";

  return (
    <footer
      className="text-primary-foreground"
      style={{ backgroundColor: "#201631" }}
    >
      {/* Global Featured Notice Modal */}
      {featured && (
        <FeaturedNoticeModal
          open={open}
          title={featured.title}
          imageUrl={featured.thumbnail as string}
          onClose={() => setOpen(false)}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Department Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-2">
              <img
                src="/data/logo.svg"
                alt="Department Logo"
                className="h-8 w-8"
              />
              <h3 className="text-lg font-semibold">
                {dept?.name || "Department"}
              </h3>
            </div>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              This department fosters excellence in teaching, research, and
              innovation, preparing students for successful careers in applied
              sciences.
            </p>
            <div className="flex space-x-3">
              <Facebook className="h-5 w-5 hover:text-secondary cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Access</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="hover:text-secondary transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/programs"
                  className="hover:text-secondary transition-colors"
                >
                  Programs
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="hover:text-secondary transition-colors"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  href="/notices"
                  className="hover:text-secondary transition-colors"
                >
                  Notices
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="hover:text-secondary transition-colors"
                >
                  Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources + Submissions */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Resources</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link
                    href="/downloads"
                    className="hover:text-secondary transition-colors"
                  >
                    Downloads
                  </Link>
                </li>
                <li>
                  <Link
                    href="/reports"
                    className="hover:text-secondary transition-colors"
                  >
                    Reports
                  </Link>
                </li>
                <li>
                  <Link
                    href="/gallery"
                    className="hover:text-secondary transition-colors"
                  >
                    Gallery
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faculty"
                    className="hover:text-secondary transition-colors"
                  >
                    Faculty/Staff
                  </Link>
                </li>
                <li>
                  <Link
                    href="/alumni"
                    className="hover:text-secondary transition-colors"
                  >
                    Alumni
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Submit Work</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a
                    href="/submit-project"
                    className="hover:text-secondary transition-colors"
                  >
                    Submit Project
                  </a>
                </li>
                <li>
                  <a
                    href="/submit-research"
                    className="hover:text-secondary transition-colors"
                  >
                    Submit Research
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Get In Touch */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Get In Touch</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${email}`} className="hover:underline">
                  {email}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{address}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm">
          <p>&copy; 2025 Thapathali Campus — {dept?.name || "Department"}</p>
          <Link
            href="https://status.tcioe.edu.np"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 sm:mt-0 flex items-center space-x-2 hover:underline transition-all"
          >
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
