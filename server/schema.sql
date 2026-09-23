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
