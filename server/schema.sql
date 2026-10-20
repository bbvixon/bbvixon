create table if not exists contact_messages (
  id bigserial primary key,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  source text default 'portfolio',
  created_at timestamptz not null default now()
);

create table if not exists assistant_logs (
  id bigserial primary key,
  question text not null,
  answer text,
  model text,
  source text default 'portfolio',
  created_at timestamptz not null default now()
);

create table if not exists design_stories (
  slug text primary key,
  title text not null,
  role text not null default '',
  summary text not null default '',
  outcome text not null default '',
  tags jsonb not null default '[]'::jsonb,
  thumbnail_url text,
  document_url text,
  redesign_document_url text,
  figma_url text,
  page_images jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  status text not null default 'ready' check (status in ('ready', 'placeholder')),
  published boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists design_stories_publish_order_idx
  on design_stories (published, sort_order, updated_at desc);
