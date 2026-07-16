begin;

create table public.books (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  identity_key text not null,
  isbn10 text,
  isbn13 text,
  title text not null,
  subtitle text,
  authors text[] not null default '{}',
  publisher text,
  published_date text,
  description text,
  price numeric(12, 2),
  currency text,
  thumbnail_url text,
  large_image_url text,
  categories text[] not null default '{}',
  review_average numeric(2, 1),
  review_count integer,
  product_url text,
  source text not null,
  source_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint books_pkey primary key (user_id, id),
  constraint books_identity_key_unique unique (user_id, identity_key),
  constraint books_title_not_blank check (length(btrim(title)) > 0),
  constraint books_identity_key_not_blank check (length(btrim(identity_key)) > 0),
  constraint books_source_id_not_blank check (length(btrim(source_id)) > 0),
  constraint books_price_non_negative check (price is null or price >= 0),
  constraint books_review_average_range check (
    review_average is null or review_average between 0 and 5
  ),
  constraint books_review_count_non_negative check (
    review_count is null or review_count >= 0
  ),
  constraint books_source_allowed check (source in ('google', 'rakuten', 'mock'))
);

create table public.user_books (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  book_id text not null,
  status text not null,
  personal_rating smallint,
  personal_note text,
  registered_at timestamptz not null,
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  deleted_at timestamptz,
  constraint user_books_pkey primary key (user_id, id),
  constraint user_books_book_unique unique (user_id, book_id),
  constraint user_books_book_fkey foreign key (user_id, book_id)
    references public.books (user_id, id) on delete cascade,
  constraint user_books_status_allowed check (
    status in ('wantToRead', 'reading', 'completed', 'notInterested')
  ),
  constraint user_books_personal_rating_range check (
    personal_rating is null or personal_rating between 1 and 5
  ),
  constraint user_books_reading_dates_order check (
    started_at is null or finished_at is null or started_at <= finished_at
  )
);

create table public.recommendation_preferences (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book_key text not null,
  book_title text,
  signal text,
  authors text[] not null default '{}',
  categories text[] not null default '{}',
  dismissed boolean not null default false,
  feedback_updated_at timestamptz,
  dismissed_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint recommendation_preferences_pkey primary key (user_id, book_key),
  constraint recommendation_preferences_book_key_not_blank check (
    length(btrim(book_key)) > 0
  ),
  constraint recommendation_preferences_signal_allowed check (
    signal is null or signal in ('interested', 'notForMe')
  ),
  constraint recommendation_preferences_has_value check (
    signal is not null or dismissed or deleted_at is not null
  )
);

create index books_user_isbn13_idx
  on public.books (user_id, isbn13)
  where isbn13 is not null;

create index books_user_isbn10_idx
  on public.books (user_id, isbn10)
  where isbn10 is not null;

create index books_user_title_idx
  on public.books (user_id, lower(title));

create index user_books_active_status_idx
  on public.user_books (user_id, status, registered_at desc)
  where deleted_at is null;

create index user_books_active_updated_idx
  on public.user_books (user_id, updated_at desc)
  where deleted_at is null;

create index recommendation_preferences_active_signal_idx
  on public.recommendation_preferences (user_id, signal)
  where deleted_at is null and signal is not null;

create index recommendation_preferences_active_dismissed_idx
  on public.recommendation_preferences (user_id)
  where deleted_at is null and dismissed;

create or replace function public.set_book_compass_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger books_set_updated_at
before update on public.books
for each row execute function public.set_book_compass_updated_at();

create trigger user_books_set_updated_at
before update on public.user_books
for each row execute function public.set_book_compass_updated_at();

create trigger recommendation_preferences_set_updated_at
before update on public.recommendation_preferences
for each row execute function public.set_book_compass_updated_at();

alter table public.books enable row level security;
alter table public.user_books enable row level security;
alter table public.recommendation_preferences enable row level security;

alter table public.books force row level security;
alter table public.user_books force row level security;
alter table public.recommendation_preferences force row level security;

revoke all on table public.books from anon;
revoke all on table public.user_books from anon;
revoke all on table public.recommendation_preferences from anon;

grant select, insert, update, delete on table public.books to authenticated;
grant select, insert, update, delete on table public.user_books to authenticated;
grant select, insert, update, delete on table public.recommendation_preferences to authenticated;

create policy "Users manage their own books"
on public.books
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own user books"
on public.user_books
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own recommendation preferences"
on public.recommendation_preferences
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on function public.set_book_compass_updated_at() from public;
revoke all on function public.set_book_compass_updated_at() from anon;
revoke all on function public.set_book_compass_updated_at() from authenticated;

commit;
