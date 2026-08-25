alter table public.businesses
  add column if not exists scrapedo_data_id text,
  add column if not exists review_sync_status text not null default 'not_started',
  add column if not exists review_sync_target integer not null default 500,
  add column if not exists review_sync_fetched integer not null default 0,
  add column if not exists review_sync_stop_reason text,
  add column if not exists review_sync_diagnostics jsonb not null default '{}'::jsonb,
  add column if not exists reviews_last_synced_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_review_sync_status_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_review_sync_status_check
      check (review_sync_status in ('not_started', 'complete', 'partial'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_review_sync_counts_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_review_sync_counts_check
      check (review_sync_target > 0 and review_sync_fetched >= 0);
  end if;
end
$$;

comment on column public.businesses.scrapedo_data_id is
  'Scrape.do/Google Maps data_id preferred over place_id for review pagination.';
comment on column public.businesses.review_sync_diagnostics is
  'Non-secret page counts and retry metadata from the latest review sync attempt.';
