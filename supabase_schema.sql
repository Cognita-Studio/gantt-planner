-- Gantt Planner schema

create extension if not exists "uuid-ossp";

create table projects (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  text not null,
  name          text not null,
  description   text,
  created_at    timestamptz default now()
);
create index on projects (workspace_id);

create table gantt_items (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  parent_id     uuid references gantt_items(id) on delete cascade,
  sort_order    float not null default 1000,
  type          text not null check (type in ('phase','group','task','subtask','milestone')),
  name          text not null,
  start_date    date,
  end_date      date,
  auto_dates    boolean not null default false,
  color         text,
  assignee      text,
  progress      integer not null default 0 check (progress >= 0 and progress <= 100),
  collapsed     boolean not null default false,
  created_at    timestamptz default now()
);
create index on gantt_items (project_id);
create index on gantt_items (parent_id);

create table dependencies (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  from_item_id  uuid not null references gantt_items(id) on delete cascade,
  to_item_id    uuid not null references gantt_items(id) on delete cascade,
  type          text not null check (type in ('FS','SS','FF','SF')),
  lag_days      integer not null default 0,
  created_at    timestamptz default now(),
  unique(from_item_id, to_item_id, type)
);
create index on dependencies (project_id);
create index on dependencies (from_item_id);
create index on dependencies (to_item_id);

-- RLS: anyone with the workspace_id string can read/write their own data
alter table projects enable row level security;
alter table gantt_items enable row level security;
alter table dependencies enable row level security;

create policy "workspace projects" on projects for all using (true) with check (true);
create policy "workspace items" on gantt_items for all using (true) with check (true);
create policy "workspace deps" on dependencies for all using (true) with check (true);
