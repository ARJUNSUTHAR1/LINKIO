"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Link as LinkIcon, BarChart3, Globe, Settings, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: LinkIcon, label: "Links", href: "/dashboard/links" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  // { icon: Globe, label: "Domains", href: "/dashboard/domains" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex w-64 flex-col border-r border-border bg-background">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">LINKIO</span>
        </Link>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 bg-muted/50 border-none"
          />
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Need support?
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
