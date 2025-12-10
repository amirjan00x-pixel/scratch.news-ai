create extension if not exists "pgcrypto";

create table if not exists public.newsletter_subscribers (
    id uuid primary key default gen_random_uuid(),
    email text not null check (
        email = lower(email)
        and length(email) between 5 and 255
        and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    ),
    created_at timestamptz not null default timezone('utc', now()),
    source text null check (source is null or length(source) <= 100)
);

create unique index if not exists newsletter_subscribers_email_key
    on public.newsletter_subscribers (email);

comment on table public.newsletter_subscribers is 'Stores verified newsletter subscribers from the marketing funnel.';
comment on column public.newsletter_subscribers.source is 'Optional location or campaign identifier (e.g. modal, landing-page).';

alter table public.newsletter_subscribers
    enable row level security;

-- No public policies defined. Only service role (backend) can write.
