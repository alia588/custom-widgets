'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/logout/actions';
import { SettingsIcon } from '@/components/SettingsIcon';

const navItems = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-sidebar)]">
      <div className="flex h-16 items-center justify-center border-b border-[var(--color-border)]">
        <span className="text-lg font-bold text-[var(--color-text-primary)]">B</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              data-active={isActive ? 'true' : undefined}
              className="ui-control ui-nav-item group relative justify-center"
            >
              <Icon className="h-5 w-5" />
              <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md border border-[var(--color-border)] bg-white px-2 py-1 text-xs text-[var(--color-text-primary)] shadow-[var(--shadow-md)] group-hover:block">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] p-2">
        <form action={logout}>
          <button
            type="submit"
            title="Sign out"
            className="ui-control ui-nav-item group relative justify-center"
          >
            <LogoutIcon className="h-5 w-5" />
            <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md border border-[var(--color-border)] bg-white px-2 py-1 text-xs text-[var(--color-text-primary)] shadow-[var(--shadow-md)] group-hover:block">
              Sign out
            </span>
          </button>
        </form>
      </div>
    </aside>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
