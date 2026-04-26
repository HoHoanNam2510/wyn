'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from './sidebar-context';

export function HamburgerButton() {
  const { toggle } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="sm:hidden"
      onClick={toggle}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
