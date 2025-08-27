-- Add status column to messages table to support message delivery/read states
alter table if exists public.messages
  add column if not exists status text default 'sent' not null
    check (status in ('sending', 'sent', 'delivered', 'read', 'failed'));

-- Backfill existing rows (if any) to a sensible default
update public.messages set status = 'sent' where status is null;

-- Add index for queries filtering by status
create index if not exists messages_status_idx on public.messages(status);

-- Ensure updated_at is kept current on updates (uses function created in other migrations)
do $$
begin
  -- create trigger only if function exists and trigger doesn't already exist
  if exists (select 1 from pg_proc where proname = 'update_updated_at_column') then
    if not exists (select 1 from pg_trigger where tgname = 'update_messages_updated_at') then
      create trigger update_messages_updated_at
        before update on public.messages
        for each row
        execute function update_updated_at_column();
    end if;
  end if;
end$$;
