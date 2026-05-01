'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  Megaphone,
  ScrollText,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/admin/words', label: 'Words', icon: BookOpen, exact: false },
  {
    href: '/admin/feedback',
    label: 'Feedback',
    icon: MessageSquare,
    exact: false,
  },
  {
    href: '/admin/announcements',
    label: 'Announcements',
    icon: Megaphone,
    exact: false,
  },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText, exact: false },
  { href: '/admin/settings', label: 'Settings', icon: Settings, exact: true },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="h-16 flex items-center px-4 border-b border-border">
        <span className="text-lg font-bold text-primary tracking-tight">
          Admin Panel
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0', active && 'text-primary')}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <Separator className="mb-3" />
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>Back to App</span>
        </Link>
      </div>
    </aside>
  );
}
