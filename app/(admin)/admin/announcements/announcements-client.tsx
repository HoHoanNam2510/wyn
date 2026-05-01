'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import {
  createAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
} from '@/app/actions/admin';
import {
  announcementSchema,
  type AnnouncementValues,
} from '@/lib/schemas/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Announcement = {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
};

type Props = {
  announcements: Announcement[];
};

function CreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<AnnouncementValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '', expiresAt: '' },
  });

  function onSubmit(data: AnnouncementValues) {
    startTransition(async () => {
      try {
        await createAnnouncement(data);
        toast.success('Announcement created');
        form.reset();
        router.refresh();
      } catch {
        toast.error('Failed to create announcement');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create Announcement</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Announcement title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Announcement content..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires At (optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create Announcement'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function AnnouncementRow({ announcement }: { announcement: Announcement }) {
  const router = useRouter();
  const [isTogglePending, startToggle] = useTransition();
  const [isDeletePending, startDelete] = useTransition();

  function handleToggle() {
    startToggle(async () => {
      try {
        await toggleAnnouncement(announcement.id, !announcement.isActive);
        toast.success(announcement.isActive ? 'Deactivated' : 'Activated');
        router.refresh();
      } catch {
        toast.error('Failed to update announcement');
      }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      try {
        await deleteAnnouncement(announcement.id);
        toast.success('Announcement deleted');
        router.refresh();
      } catch {
        toast.error('Failed to delete announcement');
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="text-sm font-medium">
        {announcement.title}
      </TableCell>
      <TableCell>
        <Badge
          variant={announcement.isActive ? 'default' : 'secondary'}
          className="text-xs"
        >
          {announcement.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {announcement.expiresAt
          ? new Date(announcement.expiresAt).toLocaleString()
          : '—'}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(announcement.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            disabled={isTogglePending || isDeletePending}
          >
            {announcement.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={isTogglePending || isDeletePending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function AnnouncementsClient({ announcements }: Props) {
  return (
    <div className="space-y-6">
      <CreateForm />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">All Announcements</h2>
        <div className="overflow-hidden rounded-xl border border-foreground/20 [&_thead_tr]:bg-primary/10 [&_thead_tr]:border-foreground/20 [&_tbody_tr]:border-foreground/8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No announcements yet.
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((a) => (
                  <AnnouncementRow key={a.id} announcement={a} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
