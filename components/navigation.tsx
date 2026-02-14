"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDepartmentContext } from "@/providers/department-provider";
import { Menu, X, ChevronDown } from "lucide-react";
import AnnouncementsTicker from "@/components/announcements-ticker";

const navigationItems = [
  { name: "Home", href: "/", group: "main" },
  { name: "About", href: "/about", group: "main" },
  { name: "Programs", href: "/programs", group: "main" },
  { name: "Faculty & Staff", href: "/faculty", group: "main" },
  { name: "Alumni", href: "/alumni", group: "main" },
  { name: "Projects", href: "/projects", group: "main" },
  { name: "Research", href: "/research", group: "main" },
  { name: "Journal", href: "/journal", group: "main" },
  { name: "Events", href: "/events", group: "main" },
  { name: "Notices", href: "/notices", group: "main" },
  { name: "Downloads", href: "/downloads", group: "main" },
  { name: "Gallery", href: "/gallery", group: "more" },
  { name: "Contact", href: "/contact", group: "more" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: dept } = useDepartmentContext();
  const mainItems = navigationItems.filter((item) => item.group === "main");
  const moreItems = navigationItems.filter((item) => item.group === "more");

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* University Logo and Title */}
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

            {/* Accreditation Badge */}
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
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-6">
                {mainItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary hover:border-b-2 hover:border-primary transition-all duration-200"
                  >
                    {item.name}
                  </Link>
                ))}
                {moreItems.length > 1 && (
                  <div className="relative group">
                    <button className="flex items-center px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                      More
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                    <div className="absolute left-0 mt-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      {moreItems.map((item) => (
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
                )}
                {moreItems.length === 1 && (
                  <Link
                    key={moreItems[0].name}
                    href={moreItems[0].href}
                    className="px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary hover:border-b-2 hover:border-primary transition-all duration-200"
                  >
                    {moreItems[0].name}
                  </Link>
                )}
              </div>

              {/* Mobile menu button */}
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

            {/* Mobile Navigation */}
            {isOpen && (
              <div className="lg:hidden border-t border-gray-100">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
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
