'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  InteractiveTable,
  type InteractiveTableColumn,
} from '@/components/ui';
import { showConfirm } from '@/components/ui/ConfirmDialog';
import { showToast } from '@/components/ui/Toast';

interface AllowedDomain {
  id: string;
  domain: string;
  created_at: string;
}

interface SettingsPageProps {
  initialDomains: AllowedDomain[];
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
});

export function SettingsPage({ initialDomains }: SettingsPageProps) {
  const [domains, setDomains] = useState<AllowedDomain[]>(initialDomains);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Re-entrancy guard: the kit ConfirmDialog closes imperatively, so its
  // Confirm button can be clicked twice before React re-renders — `loading`
  // state closures would be stale. A ref reliably stops a second DELETE.
  const actionInFlightRef = useRef(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/v1/allowed-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: input.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to add domain', 'error');
        return;
      }

      setDomains((prev) => [...prev, data]);
      setInput('');
      showToast('Domain added', 'success');
    } catch {
      showToast('Failed to add domain', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = useCallback((domain: AllowedDomain) => {
    setEditingId(domain.id);
    setEditValue(domain.domain);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue('');
  }, []);

  const handleUpdate = useCallback(async (id: string) => {
    if (!editValue.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/allowed-domains/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: editValue.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to update domain', 'error');
        return;
      }

      setDomains((prev) => prev.map((d) => (d.id === id ? data : d)));
      setEditingId(null);
      setEditValue('');
      showToast('Domain updated', 'success');
    } catch {
      showToast('Failed to update domain', 'error');
    } finally {
      setLoading(false);
    }
  }, [editValue]);

  const doDelete = useCallback(async (id: string) => {
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/allowed-domains/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to delete domain', 'error');
        return;
      }

      setDomains((prev) => prev.filter((d) => d.id !== id));
      showToast('Domain deleted', 'success');
    } catch {
      showToast('Failed to delete domain', 'error');
    } finally {
      actionInFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  const requestDelete = useCallback((domain: AllowedDomain) => {
    showConfirm(
      'Remove this domain?',
      `“${domain.domain}” will no longer be allowed to load widget embeds.`,
      () => doDelete(domain.id),
      { confirmText: 'Remove', cancelText: 'Cancel' }
    );
  }, [doDelete]);

  const columns = useMemo<InteractiveTableColumn<AllowedDomain>[]>(
    () => [
      {
        id: 'domain',
        header: 'Domain',
        sortValue: (domain) => domain.domain,
        defaultWidth: 360,
        minWidth: 220,
        cell: (domain) =>
          editingId === domain.id ? (
            <Input
              type="text"
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              disabled={loading}
              aria-label={`Domain for ${domain.domain}`}
            />
          ) : (
            <span className="block truncate font-medium text-[var(--color-text-primary)]">
              {domain.domain}
            </span>
          ),
      },
      {
        id: 'createdAt',
        header: 'Added',
        sortType: 'date',
        sortValue: (domain) => domain.created_at,
        defaultWidth: 160,
        minWidth: 130,
        cell: (domain) => (
          <time className="whitespace-nowrap text-[var(--color-text-secondary)]" dateTime={domain.created_at}>
            {dateFormatter.format(new Date(domain.created_at))}
          </time>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        resizable: false,
        sortable: false,
        defaultWidth: 180,
        minWidth: 180,
        maxWidth: 180,
        cell: (domain) =>
          editingId === domain.id ? (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                onClick={() => handleUpdate(domain.id)}
                disabled={loading || !editValue.trim()}
              >
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} disabled={loading}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(domain)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-[var(--color-danger)] hover:bg-[var(--color-danger-light)]"
                onClick={() => requestDelete(domain)}
              >
                Delete
              </Button>
            </div>
          ),
      },
    ],
    [cancelEdit, editValue, editingId, handleUpdate, loading, requestDelete, startEdit]
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Settings</h1>
      <p className="mt-1 mb-8 text-[var(--color-text-secondary)]">
        Manage the domains that are allowed to load widget embeds.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Allowed Domains</CardTitle>
          <CardDescription>
            When empty, all embed requests are blocked. Add each domain you want to allow.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleAdd} className="mb-6 flex items-center gap-3">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. example.com"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Save
          </Button>
        </form>

        <InteractiveTable
          rows={domains}
          columns={columns}
          rowKey={(domain) => domain.id}
          ariaLabel="Allowed domains"
          initialSort={{ columnId: 'domain' }}
          emptyState="No domains allowed yet. When empty, all embed requests are blocked."
        />
      </Card>
    </div>
  );
}
