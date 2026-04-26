import { auth, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export async function TopBar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="h-16 shrink-0 border-b border-border bg-card flex items-center justify-end px-6">
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0"
            >
              <Avatar className="h-8 w-8">
                {user.image && (
                  <AvatarImage src={user.image} alt={user.name ?? 'User'} />
                )}
                <AvatarFallback className="bg-primary text-white text-xs">
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/sign-in' });
                }}
              >
                <button
                  type="submit"
                  className="w-full text-left text-sm cursor-pointer"
                >
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
