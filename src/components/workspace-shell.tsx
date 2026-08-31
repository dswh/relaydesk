"use client";

import {
  BarChart3,
  BookOpenText,
  ChevronsUpDown,
  Inbox,
  LifeBuoy,
  Search,
  Settings,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand-mark";

const navigation = [
  { href: "/inbox", label: "Inbox", icon: Inbox, badge: "6" },
  { href: "/customers", label: "Customers", icon: UsersRound },
  { href: "/knowledge", label: "Knowledge", icon: BookOpenText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <BrandMark />
        </div>

        <button className="workspace-switcher" type="button">
          <span className="workspace-avatar">NL</span>
          <span className="workspace-copy">
            <strong>Northstar Labs</strong>
            <span>Support workspace</span>
          </span>
          <ChevronsUpDown size={15} aria-hidden="true" />
        </button>

        <nav className="main-nav" aria-label="Workspace navigation">
          <p className="nav-label">Workspace</p>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                className={`nav-item ${active ? "active" : ""}`}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <nav className="utility-nav" aria-label="Support and settings">
          <Link className="nav-item" href="/search">
            <Search size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </Link>
          <Link className="nav-item" href="/settings">
            <Settings size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Settings</span>
          </Link>
          <a className="nav-item" href="mailto:support@relaydesk.dev">
            <LifeBuoy size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Help</span>
          </a>
        </nav>

        <div className="agent-card">
          <span className="agent-avatar">AS</span>
          <span className="agent-card-copy">
            <strong>Arun Sharma</strong>
            <span><i /> Available</span>
          </span>
          <button type="button" aria-label="Open account menu">•••</button>
        </div>
      </aside>

      <div className="mobile-header">
        <BrandMark />
        <span className="mobile-workspace">Northstar Labs</span>
      </div>

      <main className="workspace-main">{children}</main>

      <nav className="mobile-nav" aria-label="Mobile workspace navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              className={active ? "active" : ""}
              href={item.href}
              key={item.href}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
