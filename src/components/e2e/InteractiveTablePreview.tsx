'use client';

import { useMemo } from 'react';
import {
  InteractiveTable,
  type InteractiveTableColumn,
} from '@/components/ui';

interface PreviewRow {
  id: string;
  account: string;
  activeUsers: number;
  plan: 'Starter' | 'Growth' | 'Scale';
  lastSync: string;
  utilization: number;
}

const numberFormatter = new Intl.NumberFormat();
const percentageFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

const previewRows: Array<Omit<PreviewRow, 'id'>> = [
  { account: 'Arcade Studio', activeUsers: 148, plan: 'Growth', lastSync: '2026-08-24', utilization: 0.82 },
  { account: 'Brightside Home', activeUsers: 23, plan: 'Starter', lastSync: '2026-08-18', utilization: 0.31 },
  { account: 'Cedar & Stone', activeUsers: 906, plan: 'Scale', lastSync: '2026-08-25', utilization: 0.74 },
  { account: 'Driftwood Dental', activeUsers: 67, plan: 'Growth', lastSync: '2026-08-13', utilization: 0.59 },
  { account: 'Evergreen Auto', activeUsers: 312, plan: 'Growth', lastSync: '2026-08-21', utilization: 0.46 },
  { account: 'Fable Coffee', activeUsers: 18, plan: 'Starter', lastSync: '2026-08-10', utilization: 0.24 },
  { account: 'Golden Hour', activeUsers: 1_248, plan: 'Scale', lastSync: '2026-08-25', utilization: 0.93 },
  { account: 'Harbor Health', activeUsers: 431, plan: 'Scale', lastSync: '2026-08-20', utilization: 0.67 },
  { account: 'Ironwood Works', activeUsers: 84, plan: 'Growth', lastSync: '2026-08-16', utilization: 0.38 },
  { account: 'Juniper Legal', activeUsers: 56, plan: 'Growth', lastSync: '2026-08-22', utilization: 0.51 },
  { account: 'Kindred Care', activeUsers: 275, plan: 'Growth', lastSync: '2026-08-19', utilization: 0.44 },
  { account: 'Lighthouse Labs', activeUsers: 702, plan: 'Scale', lastSync: '2026-08-23', utilization: 0.78 },
];

const rows: PreviewRow[] = previewRows.map((row) => ({
  ...row,
  id: row.account.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-'),
}));

export function InteractiveTablePreview() {
  const columns = useMemo<InteractiveTableColumn<PreviewRow>[]>(
    () => [
      {
        id: 'account',
        header: 'Account',
        defaultWidth: 240,
        minWidth: 180,
        sortValue: (row) => row.account,
        cell: (row) => <span className="block truncate font-medium">{row.account}</span>,
      },
      {
        id: 'activeUsers',
        header: 'Active users',
        defaultWidth: 150,
        minWidth: 130,
        sortType: 'number',
        sortValue: (row) => row.activeUsers,
        cell: (row) => <span className="tabular-nums">{numberFormatter.format(row.activeUsers)}</span>,
      },
      {
        id: 'plan',
        header: 'Plan',
        defaultWidth: 150,
        minWidth: 130,
        sortValue: (row) => row.plan,
        cell: (row) => (
          <span className="inline-flex rounded-full bg-[var(--color-accent-light)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-dark)]">
            {row.plan}
          </span>
        ),
      },
      {
        id: 'lastSync',
        header: 'Last sync',
        defaultWidth: 160,
        minWidth: 140,
        sortType: 'date',
        sortValue: (row) => row.lastSync,
        cell: (row) => <time dateTime={row.lastSync}>{dateFormatter.format(new Date(row.lastSync))}</time>,
      },
      {
        id: 'utilization',
        header: 'Utilization',
        defaultWidth: 150,
        minWidth: 130,
        sortType: 'number',
        sortValue: (row) => row.utilization,
        cell: (row) => <span className="tabular-nums">{percentageFormatter.format(row.utilization)}</span>,
      },
    ],
    []
  );

  return (
    <section aria-labelledby="interactive-table-preview-heading" style={{ marginTop: 32 }}>
      <h2 id="interactive-table-preview-heading">Interactive Table</h2>
      <p style={{ color: '#64748b' }}>
        Select a header to sort. Drag its divider to resize it; keyboard users can focus a divider and use arrow keys.
      </p>
      <InteractiveTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        ariaLabel="Interactive table preview"
        initialSort={{ columnId: 'activeUsers', direction: 'descending' }}
      />
    </section>
  );
}
