-- Schema inicial do VibeFinance (MySQL 8).
-- IDs são UUIDs em texto para manter compatibilidade com os dados existentes.

create table users (
  id            char(36)     not null primary key,
  email         varchar(255) not null,
  password_hash varchar(100) not null,
  created_at    datetime(3)  not null default current_timestamp(3),
  constraint users_email_uk unique (email)
);

create table auth_sessions (
  token_hash char(64)    not null primary key,
  user_id    char(36)    not null,
  created_at datetime(3) not null default current_timestamp(3),
  expires_at datetime(3) not null,
  constraint auth_sessions_user_fk foreign key (user_id) references users (id) on delete cascade
);

create table households (
  id          char(36)    not null primary key,
  name        varchar(80) not null,
  invite_code varchar(8)  not null,
  created_by  char(36)    null,
  created_at  datetime(3) not null default current_timestamp(3),
  constraint households_invite_code_uk unique (invite_code),
  constraint households_created_by_fk foreign key (created_by) references users (id) on delete set null,
  constraint households_name_len_chk check (char_length(name) between 1 and 80)
);

create table profiles (
  id           char(36)     not null primary key,
  full_name    varchar(120) null,
  birth_date   date         null,
  whatsapp     varchar(20)  null,
  household_id char(36)     null,
  created_at   datetime(3)  not null default current_timestamp(3),
  constraint profiles_user_fk foreign key (id) references users (id) on delete cascade,
  constraint profiles_household_fk foreign key (household_id) references households (id) on delete set null
);

create table household_members (
  id             char(36)      not null primary key,
  household_id   char(36)      not null,
  user_id        char(36)      not null,
  nickname       varchar(40)   null,
  monthly_income decimal(12,2) not null default 0,
  role           varchar(10)   not null default 'member',
  joined_at      datetime(3)   not null default current_timestamp(3),
  constraint hm_household_user_uk unique (household_id, user_id),
  constraint hm_household_fk foreign key (household_id) references households (id) on delete cascade,
  constraint hm_user_fk foreign key (user_id) references users (id) on delete cascade,
  constraint hm_income_chk check (monthly_income >= 0),
  constraint hm_role_chk check (role in ('admin', 'member'))
);
create index hm_user_idx on household_members (user_id);

create table cards (
  id           char(36)      not null primary key,
  household_id char(36)      not null,
  user_id      char(36)      not null,
  name         varchar(80)   not null,
  type         varchar(10)   not null,
  bank         varchar(80)   null,
  color        char(7)       not null default '#6366f1',
  credit_limit decimal(12,2) null,
  created_at   datetime(3)   not null default current_timestamp(3),
  constraint cards_household_fk foreign key (household_id) references households (id) on delete cascade,
  constraint cards_user_fk foreign key (user_id) references users (id) on delete cascade,
  constraint cards_type_chk check (type in ('credit', 'debit', 'hybrid')),
  constraint cards_name_len_chk check (char_length(name) between 1 and 80),
  constraint cards_limit_chk check (credit_limit is null or credit_limit > 0),
  constraint cards_color_chk check (regexp_like(color, '^#[0-9a-fA-F]{6}$'))
);

create table transactions (
  id           char(36)      not null primary key,
  user_id      char(36)      not null,
  title        varchar(120)  not null,
  amount       decimal(14,2) not null,
  category     varchar(30)   not null,
  type         varchar(10)   not null,
  date         date          not null,
  bank_source  varchar(40)   null,
  household_id char(36)      null,
  card_id      char(36)      null,
  created_at   datetime(3)   not null default current_timestamp(3),
  constraint transactions_user_fk foreign key (user_id) references users (id) on delete cascade,
  constraint transactions_household_fk foreign key (household_id) references households (id) on delete set null,
  constraint transactions_card_fk foreign key (card_id) references cards (id) on delete set null,
  constraint transactions_title_len_chk check (char_length(title) between 1 and 120),
  constraint transactions_amount_chk check (amount > 0),
  constraint transactions_type_chk check (type in ('income', 'expense'))
);
create index transactions_user_date_idx on transactions (user_id, date desc, created_at desc);
create index transactions_household_date_idx on transactions (household_id, date desc);

create table subscriptions (
  id                char(36)      not null primary key,
  user_id           char(36)      not null,
  name              varchar(80)   not null,
  amount            decimal(14,2) not null,
  billing_cycle     varchar(10)   not null,
  category          varchar(30)   not null,
  color             char(7)       not null default '#ef233c',
  next_billing_date date          not null,
  bank_source       varchar(40)   null,
  created_at        datetime(3)   not null default current_timestamp(3),
  constraint subscriptions_user_fk foreign key (user_id) references users (id) on delete cascade,
  constraint subscriptions_name_len_chk check (char_length(name) between 1 and 80),
  constraint subscriptions_amount_chk check (amount > 0),
  constraint subscriptions_cycle_chk check (billing_cycle in ('monthly', 'yearly')),
  constraint subscriptions_color_chk check (regexp_like(color, '^#[0-9a-fA-F]{6}$'))
);
create index subscriptions_user_next_idx on subscriptions (user_id, next_billing_date);

create table installments (
  id                 char(36)      not null primary key,
  user_id            char(36)      not null,
  name               varchar(120)  not null,
  total_amount       decimal(14,2) not null,
  installment_amount decimal(14,2) not null,
  total_installments int           not null,
  paid_installments  int           not null default 0,
  start_date         date          not null,
  bank_source        varchar(40)   null,
  created_at         datetime(3)   not null default current_timestamp(3),
  constraint installments_user_fk foreign key (user_id) references users (id) on delete cascade,
  constraint installments_name_len_chk check (char_length(name) between 1 and 120),
  constraint installments_total_amount_chk check (total_amount > 0),
  constraint installments_amount_chk check (installment_amount > 0),
  constraint installments_count_chk check (total_installments between 1 and 360),
  constraint installments_paid_chk check (paid_installments >= 0 and paid_installments <= total_installments)
);
create index installments_user_start_idx on installments (user_id, start_date);

create table goals (
  id             char(36)      not null primary key,
  user_id        char(36)      not null,
  name           varchar(80)   not null,
  target_amount  decimal(14,2) not null,
  current_amount decimal(14,2) not null default 0,
  deadline       date          not null,
  category       varchar(30)   not null,
  color          char(7)       not null default '#ef233c',
  household_id   char(36)      null,
  scope          varchar(10)   not null default 'personal',
  created_at     datetime(3)   not null default current_timestamp(3),
  constraint goals_user_fk foreign key (user_id) references users (id) on delete cascade,
  constraint goals_household_fk foreign key (household_id) references households (id) on delete set null,
  constraint goals_name_len_chk check (char_length(name) between 1 and 80),
  constraint goals_target_chk check (target_amount > 0),
  constraint goals_current_chk check (current_amount >= 0 and current_amount <= target_amount * 2),
  constraint goals_scope_chk check (scope in ('personal', 'household')),
  constraint goals_color_chk check (regexp_like(color, '^#[0-9a-fA-F]{6}$'))
);
create index goals_user_deadline_idx on goals (user_id, deadline);

create table spending_limits (
  id            char(36)      not null primary key,
  user_id       char(36)      null,
  household_id  char(36)      null,
  category      varchar(30)   not null,
  monthly_limit decimal(14,2) not null,
  scope         varchar(10)   not null default 'personal',
  created_at    datetime(3)   not null default current_timestamp(3),
  constraint spending_limits_user_fk foreign key (user_id) references users (id) on delete cascade,
  constraint spending_limits_household_fk foreign key (household_id) references households (id) on delete cascade,
  constraint spending_limits_amount_chk check (monthly_limit > 0),
  constraint spending_limits_scope_chk check (scope in ('personal', 'household'))
);
create index spending_limits_user_idx on spending_limits (user_id, category);
create index spending_limits_household_idx on spending_limits (household_id, category);

create table budget_estimates (
  id           char(36)      not null primary key,
  user_id      char(36)      not null,
  household_id char(36)      null,
  label        varchar(120)  not null,
  amount       decimal(14,2) not null,
  month        char(7)       not null,
  created_at   datetime(3)   not null default current_timestamp(3),
  updated_at   datetime(3)   null,
  constraint budget_estimates_user_fk foreign key (user_id) references users (id) on delete cascade,
  constraint budget_estimates_household_fk foreign key (household_id) references households (id) on delete cascade
);
create index budget_estimates_month_idx on budget_estimates (household_id, month);

create table user_onboarding (
  id                   char(36)      not null primary key,
  user_id              char(36)      not null,
  monthly_salary       decimal(14,2) null,
  financial_goal       varchar(500)  null,
  preferred_categories json          null,
  completed_at         datetime(3)   not null default current_timestamp(3),
  constraint user_onboarding_user_uk unique (user_id),
  constraint user_onboarding_user_fk foreign key (user_id) references users (id) on delete cascade
);
