'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FolderOpen,
  RotateCcw,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/words', label: 'Words', icon: BookOpen },
  { href: '/categories', label: 'Categories', icon: FolderOpen },
  { href: '/review', label: 'Review', icon: RotateCcw },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="h-16 flex items-center px-4 border-b border-border gap-2.5">
        <div className="shrink-0 h-[54px] w-[54px] rounded-xl bg-white border border-border overflow-hidden flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Wyn"
            width={54}
            height={54}
            className="object-contain"
          />
        </div>
        <span className="text-lg font-bold text-primary tracking-tight">
          Wyn
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
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
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
