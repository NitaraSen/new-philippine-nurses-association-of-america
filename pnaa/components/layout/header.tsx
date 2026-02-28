"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/events": "Events",
  "/chapters": "Chapters",
  "/fundraising": "Fundraising",
  "/about": "About PNAA",
};

function getPageTitle(pathname: string): string {
  // Check exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];

  // Check for nested routes
  if (pathname.startsWith("/events/new")) return "New Event";
  if (pathname.includes("/events/") && pathname.endsWith("/edit"))
    return "Edit Event";
  if (pathname.startsWith("/events/")) return "Event Details";

  if (pathname.startsWith("/chapters/")) return "Chapter Details";

  if (pathname.startsWith("/fundraising/new")) return "New Campaign";
  if (pathname.includes("/fundraising/") && pathname.endsWith("/edit"))
    return "Edit Campaign";
  if (pathname.startsWith("/fundraising/")) return "Campaign Details";

  return "PNAA";
}

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [];
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return crumbs;

  // First segment
  const first = segments[0];
  if (pageTitles[`/${first}`]) {
    crumbs.push({ label: pageTitles[`/${first}`], href: `/${first}` });
  }

  // Additional segments
  if (segments.length > 1) {
    if (segments[1] === "new") {
      crumbs.push({ label: "New", href: pathname });
    } else if (segments.length > 2 && segments[2] === "edit") {
      crumbs.push({ label: "Edit", href: pathname });
    } else {
      crumbs.push({ label: "Details", href: pathname });
    }
  }

  return crumbs;
}

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex items-center gap-2">
        {breadcrumbs.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.slice(0, -1).map((crumb, i) => (
              <span key={crumb.href}>
                {i > 0 && <span className="mx-1">/</span>}
                <a href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </a>
              </span>
            ))}
            <span className="mx-1">/</span>
          </div>
        )}
        <h1 className="text-sm font-semibold">{title}</h1>
      </div>
    </header>
  );
}
