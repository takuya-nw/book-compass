begin;

revoke all privileges on table public.books from authenticated;
revoke all privileges on table public.user_books from authenticated;
revoke all privileges on table public.recommendation_preferences from authenticated;

grant select, insert, update, delete on table public.books to authenticated;
grant select, insert, update, delete on table public.user_books to authenticated;
grant select, insert, update, delete on table public.recommendation_preferences to authenticated;

commit;
