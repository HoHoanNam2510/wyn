'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import {
  createAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from '@/app/actions/admin';
import {
  announcementSchema,
  type AnnouncementValues,
} from '@/lib/schemas/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

function EditDialog({
  announcement,
  open,
  onClose,
}: {
  announcement: Announcement;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<AnnouncementValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement.title,
      content: announcement.content,
      expiresAt: announcement.expiresAt
        ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
        : '',
    },
  });

  function onSubmit(data: AnnouncementValues) {
    startTransition(async () => {
      try {
        await updateAnnouncement(announcement.id, data);
        toast.success('Announcement updated');
        onClose();
        router.refresh();
      } catch {
        toast.error('Failed to update announcement');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Textarea rows={3} {...field} />
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
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementActions({ announcement }: { announcement: Announcement }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
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
    <>
      <EditDialog
        announcement={announcement}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
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
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setEditOpen(true)}
          disabled={isTogglePending || isDeletePending}
        >
          <Pencil className="h-4 w-4" />
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
    </>
  );
}

const columns: Column<Announcement>[] = [
  {
    key: 'title',
    header: 'Title',
    cell: (a) => <span className="text-sm font-medium">{a.title}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (a) => (
      <Badge variant={a.isActive ? 'default' : 'secondary'} className="text-xs">
        {a.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    key: 'expires',
    header: 'Expires',
    cell: (a) => (
      <span className="text-sm text-muted-foreground">
        {a.expiresAt ? new Date(a.expiresAt).toLocaleString() : '—'}
      </span>
    ),
  },
  {
    key: 'created',
    header: 'Created',
    cell: (a) => (
      <span className="text-sm text-muted-foreground">
        {new Date(a.createdAt).toLocaleDateString()}
      </span>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    cell: (a) => <AnnouncementActions announcement={a} />,
  },
];

export function AnnouncementsClient({ announcements }: Props) {
  return (
    <div className="space-y-6">
      <CreateForm />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">All Announcements</h2>
        <DataTable
          columns={columns}
          rows={announcements}
          rowKey={(a) => a.id}
          empty="No announcements yet."
        />
      </div>
    </div>
  );
}
