"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Calendar, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { deleteLink, moveLink, toggleLink, updateLink } from "./actions";

export type LinkRow = {
  id: string;
  title: string;
  url: string;
  is_enabled: boolean;
  position: number;
  click_count: number;
  scheduled_start: string | null;
  scheduled_end: string | null;
};

export function LinkList({
  links,
  isPro,
}: {
  links: LinkRow[];
  isPro: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {links.map((link, idx) => (
        <LinkItem
          key={link.id}
          link={link}
          isPro={isPro}
          isFirst={idx === 0}
          isLast={idx === links.length - 1}
        />
      ))}
    </div>
  );
}

function LinkItem({
  link,
  isPro,
  isFirst,
  isLast,
}: {
  link: LinkRow;
  isPro: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isScheduled = link.scheduled_start || link.scheduled_end;
  const now = new Date();
  const startActive =
    !link.scheduled_start || new Date(link.scheduled_start) <= now;
  const endActive =
    !link.scheduled_end || new Date(link.scheduled_end) >= now;
  const scheduledLive = isScheduled && startActive && endActive;
  const scheduledPending =
    isScheduled && link.scheduled_start && new Date(link.scheduled_start) > now;
  const scheduledExpired =
    isScheduled && link.scheduled_end && new Date(link.scheduled_end) < now;

  function onToggle(next: boolean) {
    startTransition(async () => {
      const res = await toggleLink(link.id, next);
      if (res?.error) toast.error(res.error);
    });
  }

  function onMove(direction: "up" | "down") {
    startTransition(async () => {
      const res = await moveLink(link.id, direction);
      if (res?.error) toast.error(res.error);
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await deleteLink(link.id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setConfirmOpen(false);
      toast.success("Link deleted");
    });
  }

  return (
    <Card className={!link.is_enabled ? "opacity-60" : ""}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isFirst || pending}
            onClick={() => onMove("up")}
            aria-label="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isLast || pending}
            onClick={() => onMove("down")}
            aria-label="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{link.title}</span>
            {scheduledLive ? (
              <Badge variant="secondary" className="text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                Live
              </Badge>
            ) : null}
            {scheduledPending ? (
              <Badge variant="outline" className="text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                Scheduled
              </Badge>
            ) : null}
            {scheduledExpired ? (
              <Badge variant="outline" className="text-xs">
                Expired
              </Badge>
            ) : null}
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {link.url}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {link.click_count} clicks
          </span>
          <Switch
            checked={link.is_enabled}
            onCheckedChange={onToggle}
            disabled={pending}
            aria-label="Enable link"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditOpen(true)}
            aria-label="Edit link"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmOpen(true)}
            aria-label="Delete link"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      <EditLinkDialog
        link={link}
        isPro={isPro}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this link?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${link.title}" will be removed from your page. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Keep link</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? "Deleting…" : "Delete link"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function toLocalDateTimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function EditLinkDialog({
  link,
  isPro,
  open,
  onOpenChange,
}: {
  link: LinkRow;
  isPro: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateLink({}, formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      onOpenChange(false);
      toast.success("Link updated");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit link</DialogTitle>
          <DialogDescription>
            Change the title, URL, or schedule when it should appear.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={link.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor={`title-${link.id}`}>Title</Label>
            <Input
              id={`title-${link.id}`}
              name="title"
              required
              maxLength={80}
              defaultValue={link.title}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`url-${link.id}`}>URL</Label>
            <Input
              id={`url-${link.id}`}
              name="url"
              type="url"
              required
              defaultValue={link.url}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`start-${link.id}`}>
                Start{!isPro ? " (Pro)" : ""}
              </Label>
              <Input
                id={`start-${link.id}`}
                name="scheduled_start"
                type="datetime-local"
                defaultValue={toLocalDateTimeValue(link.scheduled_start)}
                disabled={!isPro}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`end-${link.id}`}>
                End{!isPro ? " (Pro)" : ""}
              </Label>
              <Input
                id={`end-${link.id}`}
                name="scheduled_end"
                type="datetime-local"
                defaultValue={toLocalDateTimeValue(link.scheduled_end)}
                disabled={!isPro}
              />
            </div>
          </div>
          {!isPro ? (
            <p className="text-xs text-muted-foreground">
              Scheduling is available on Pro. Upgrade in Billing to set start
              and end times.
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
