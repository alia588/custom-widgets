'use client';

import { useState } from 'react';

interface AllowedDomain {
  id: string;
  domain: string;
  created_at: string;
}

interface SettingsPageProps {
  initialDomains: AllowedDomain[];
}

export function SettingsPage({ initialDomains }: SettingsPageProps) {
  const [domains, setDomains] = useState<AllowedDomain[]>(initialDomains);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

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
        showMessage('error', data.error || 'Failed to add domain');
        return;
      }

      setDomains((prev) => [...prev, data]);
      setInput('');
      showMessage('success', 'Domain added');
    } catch {
      showMessage('error', 'Failed to add domain');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (domain: AllowedDomain) => {
    setEditingId(domain.id);
    setEditValue(domain.domain);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleUpdate = async (id: string) => {
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
        showMessage('error', data.error || 'Failed to update domain');
        return;
      }

      setDomains((prev) => prev.map((d) => (d.id === id ? data : d)));
      setEditingId(null);
      setEditValue('');
      showMessage('success', 'Domain updated');
    } catch {
      showMessage('error', 'Failed to update domain');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this domain?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/allowed-domains/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showMessage('error', data.error || 'Failed to delete domain');
        return;
      }

      setDomains((prev) => prev.filter((d) => d.id !== id));
      showMessage('success', 'Domain deleted');
    } catch {
      showMessage('error', 'Failed to delete domain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-1 mb-8 text-neutral-500">
        Manage the domains that are allowed to load widget embeds.
      </p>

      <div className="rounded-2xl bg-neutral-900 p-6 ring-1 ring-neutral-800">
        <h2 className="mb-4 text-lg font-semibold">Allowed Domains</h2>

        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20'
                : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAdd} className="mb-6 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. example.com"
            disabled={loading}
            className="flex-1 rounded-lg bg-[#ffffff0a] px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            Save
          </button>
        </form>

        {domains.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No domains allowed yet. When empty, all embed requests are blocked.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {domains.map((domain) => (
              <li
                key={domain.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                {editingId === domain.id ? (
                  <>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      disabled={loading}
                      className="flex-1 rounded-lg bg-[#ffffff0a] px-3 py-2 text-sm text-neutral-100 outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdate(domain.id)}
                        disabled={loading || !editValue.trim()}
                        className="rounded-lg bg-green-600/20 px-3 py-1.5 text-xs font-semibold text-green-400 transition-colors hover:bg-green-600/30 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={loading}
                        className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:bg-neutral-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-neutral-200">{domain.domain}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(domain)}
                        className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:bg-neutral-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(domain.id)}
                        className="rounded-lg bg-red-600/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-600/20"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
