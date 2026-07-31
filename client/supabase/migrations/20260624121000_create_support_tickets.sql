create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  title text not null,
  description text not null,
  customer_name text not null,
  customer_email text,
  order_id text,
  agent_name text,
  priority text not null default 'STANDARD' check (priority in ('URGENT', 'HIGH', 'STANDARD')),
  status text not null default 'OPEN' check (status in ('OPEN', 'PENDING', 'RESOLVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender text not null check (sender in ('admin', 'customer')),
  sender_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;

drop policy if exists "Admins can manage support tickets" on public.support_tickets;
create policy "Admins can manage support tickets"
  on public.support_tickets
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "Admins can manage support ticket messages" on public.support_ticket_messages;
create policy "Admins can manage support ticket messages"
  on public.support_ticket_messages
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create index if not exists support_tickets_status_idx on public.support_tickets(status);
create index if not exists support_ticket_messages_ticket_id_idx on public.support_ticket_messages(ticket_id);

drop trigger if exists handle_updated_at_support_tickets on public.support_tickets;
create trigger handle_updated_at_support_tickets
  before update on public.support_tickets
  for each row
  execute procedure public.handle_updated_at();
