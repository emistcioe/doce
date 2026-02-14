"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDepartmentContext } from "@/providers/department-provider";
import { Menu, X, ChevronDown } from "lucide-react";
import AnnouncementsTicker from "@/components/announcements-ticker";

const mainNavigationItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Programs", href: "/programs" },
  { name: "Alumni", href: "/alumni" },
  { name: "Projects", href: "/projects" },
  { name: "Events", href: "/events" },
  { name: "Notices", href: "/notices" },
  { name: "Downloads", href: "/downloads" },
  { name: "Reports", href: "/reports" },
  { name: "Contact", href: "/contact" },
];

const resourceNavigationItems = [
  { name: "Gallery", href: "/gallery" },
  { name: "Journal", href: "/journal" },
  { name: "Research", href: "/research" },
  { name: "Faculty/Staff", href: "/faculty" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: dept } = useDepartmentContext();

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 relative">
                  <img
                    src="/logo.png"
                    alt="Tribhuvan University Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Tribhuvan University
                  </h1>
                  <h2 className="text-lg font-semibold text-primary">
                    {dept?.name || "Department"}
                  </h2>
                  <p className="text-sm text-gray-600">Thapathali Campus</p>
                </div>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-3">
              <div className="w-10 h-10 relative">
                <img
                  src="/data/accrdiated.webp"
                  alt="UGC Accreditation Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  Accredited by University Grants Commission
                </p>
                <p className="text-xs text-gray-600">(UGC) Nepal</p>
                <p className="text-xs text-gray-600">
                  Quality Education Since 1930 A.D.
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="hidden lg:flex items-center space-x-6">
                {mainNavigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary hover:border-b-2 hover:border-primary transition-all duration-200"
                  >
                    {item.name}
                  </Link>
                ))}

                <div className="relative group">
                  <button className="flex items-center px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                    Resources
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  <div className="absolute left-0 mt-0 w-52 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {resourceNavigationItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden ml-auto"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>

            {isOpen && (
              <div className="lg:hidden border-t border-gray-100">
                <div className="px-4 py-4 space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-gray-400">
                      Main
                    </p>
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                      {mainNavigationItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="shrink-0 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:border-primary transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-gray-400">
                      Resources
                    </p>
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                      {resourceNavigationItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="shrink-0 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:border-primary transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        <AnnouncementsTicker />
      </header>
    </>
  );
}
