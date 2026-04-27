'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  BookOpen,
  FolderOpen,
  RotateCcw,
  BarChart3,
  LayoutDashboard,
  BookMarked,
  ScanText,
  Lightbulb,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/words', label: 'Words', icon: BookOpen },
  { href: '/categories', label: 'Categories', icon: FolderOpen },
  { href: '/grammar', label: 'Grammar', icon: BookMarked },
  { href: '/idioms', label: 'Idioms', icon: Lightbulb },
  { href: '/text-scanner', label: 'Text Scanner', icon: ScanText },
  { href: '/review', label: 'Review', icon: RotateCcw },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  // Close on navigation
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      {/* Backdrop — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-56 shrink-0 border-r border-border bg-card flex flex-col',
          'transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'sm:static sm:translate-x-0 sm:transition-none'
        )}
      >
        {/* Close button — mobile only */}
        <button
          className="absolute top-4 right-4 sm:hidden text-muted-foreground hover:text-foreground"
          onClick={close}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="h-16 flex items-center px-4 border-b border-border gap-2.5">
          <div className="shrink-0 h-[54px] w-[54px] rounded-xl bg-white border border-border overflow-hidden flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Wyn"
              width={54}
              height={54}
              className="object-contain"
              priority
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
    </>
  );
}
