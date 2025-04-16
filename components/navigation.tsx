"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  DollarSign,
  Menu,
  X,
} from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/clients",
      label: "Clients",
      icon: Users,
    },
    {
      href: "/tasks",
      label: "Tasks",
      icon: ClipboardList,
    },
    {
      href: "/finance",
      label: "Finance",
      icon: DollarSign,
    },
  ];

  return (
    <nav className="border-b">
      <div className="flex items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center space-x-2">
          <LayoutDashboard className="h-6 w-6" />
          <span className="font-bold text-xl">Content Flow</span>
        </Link>
        
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent",
                  pathname === route.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile navigation */}
      {isOpen && (
        <div className="md:hidden border-t">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 hover:bg-accent",
                  pathname === route.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-4 w-4" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export default Navigation;