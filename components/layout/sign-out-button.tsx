'use client';

import { useTransition } from 'react';
import { signOutUser } from '@/app/actions/account';

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => signOutUser())}
      disabled={isPending}
      className="w-full text-left text-sm cursor-pointer disabled:opacity-50"
    >
      {isPending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
