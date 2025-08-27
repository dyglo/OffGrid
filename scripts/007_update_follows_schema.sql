-- Update follows table to support follow requests with status
-- First, add status column to existing follows table
alter table if exists public.follows 
add column if not exists status text default 'pending' check (status in ('pending', 'accepted', 'rejected'));

-- Update existing follows to be accepted (since they were created before this change)
update public.follows set status = 'accepted' where status is null;

-- Create a new table for follow requests notifications
create table if not exists public.follow_notifications (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text) not null,
  updated_at timestamp with time zone default timezone('utc'::text) not null
);

-- Enable RLS
alter table public.follow_notifications enable row level security;

-- RLS policies for follow notifications
create policy "follow_notifications_select_own"
  on public.follow_notifications for select
  using (auth.uid() = follower_id or auth.uid() = following_id);

create policy "follow_notifications_insert_own"
  on public.follow_notifications for insert
  with check (auth.uid() = following_id);

create policy "follow_notifications_update_own"
  on public.follow_notifications for update
  using (auth.uid() = following_id);

create policy "follow_notifications_delete_own"
  on public.follow_notifications for delete
  using (auth.uid() = follower_id or auth.uid() = following_id);

-- Create indexes for performance
create index if not exists follow_notifications_follower_id_idx on public.follow_notifications(follower_id);
create index if not exists follow_notifications_following_id_idx on public.follow_notifications(following_id);
create index if not exists follow_notifications_status_idx on public.follow_notifications(status);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger update_follow_notifications_updated_at
  before update on public.follow_notifications
  for each row
  execute function update_updated_at_column();
