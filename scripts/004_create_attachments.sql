-- Create attachments table for file uploads
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_url text not null,
  file_type text not null,
  file_name text not null,
  file_size bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.attachments enable row level security;

-- RLS policies for attachments (inherit from messages)
create policy "attachments_select_via_message"
  on public.attachments for select
  using (
    exists (
      select 1 from public.messages 
      where messages.id = attachments.message_id 
      and (messages.sender_id = auth.uid() or messages.receiver_id = auth.uid())
    )
  );

create policy "attachments_insert_via_message"
  on public.attachments for insert
  with check (
    exists (
      select 1 from public.messages 
      where messages.id = attachments.message_id 
      and messages.sender_id = auth.uid()
    )
  );

create policy "attachments_delete_via_message"
  on public.attachments for delete
  using (
    exists (
      select 1 from public.messages 
      where messages.id = attachments.message_id 
      and messages.sender_id = auth.uid()
    )
  );

-- Create indexes for performance
create index if not exists attachments_message_id_idx on public.attachments(message_id);
