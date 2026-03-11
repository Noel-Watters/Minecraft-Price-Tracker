"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";
import { HomeIcon, UserIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import LogoutButton from "@/components/LogoutButton";

interface SidebarProps {
  role: "owner" | "admin";
}

const ownerLinks = [
  { href: "/", label: "Item Market", icon: <HomeIcon className="w-6 h-6" /> },
  { href: "/owner/", label: "Owner Home", icon: <UserIcon className="w-6 h-6" /> },
];

const adminLinks = [
  { href: "/", label: "Item Market", icon: <HomeIcon className="w-6 h-6" /> },
  { href: "/owner/", label: "Owner Home", icon: <UserIcon className="w-6 h-6" /> },
  { href: "/admin/", label: "Admin Panel", icon: <ShieldCheckIcon className="w-6 h-6" /> },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navLinks = role === "admin" ? adminLinks : ownerLinks;

  return (
    <aside className="mt-10 w-20 bg-pv-surface border-r border-b rounded-lg border-pv-accent-border p-2 flex flex-col items-center">
      <nav className="flex flex-col gap-2 items-center">
        {navLinks.map(({ href, label, icon }) => (
          <Link key={href} href={href}>
            <span
              className={`p-2 rounded hover:bg-pv-surface-elevated transition-colors cursor-pointer flex items-center justify-center ${
                pathname === href
                  ? "bg-pv-primary text-white font-semibold "
                  : "text-pv-text-primary hover:text-pv-accent-border"
              }`}
              title={label}
            >
              {icon}
            </span>
          </Link>
        ))}
        <LogoutButton />
      </nav>
    </aside>
  );
}