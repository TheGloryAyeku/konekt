-- Honour the username the user chose at signup.
--
-- The original trigger ignored `raw_user_meta_data->>'username'` and always
-- derived the handle from the email. If the chosen username is taken or
-- malformed we raise, so the client surfaces a real error instead of silently
-- renaming the account.

set search_path = public, extensions;

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  supplied_username text := nullif(lower(new.raw_user_meta_data->>'username'), '');
  suggested_username text;
begin
  if supplied_username is not null then
    if supplied_username !~ '^[a-z0-9_]{3,30}$' then
      raise exception 'invalid username format' using errcode = '23514';
    end if;
    if exists (select 1 from profiles where username = supplied_username) then
      raise exception 'username already taken' using errcode = '23505';
    end if;
    suggested_username := supplied_username;
  else
    suggested_username := lower(
      regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g')
    );

    if char_length(suggested_username) < 3 then
      suggested_username := suggested_username || substr(new.id::text, 1, 6);
    end if;

    while exists (select 1 from profiles where username = suggested_username) loop
      suggested_username := suggested_username || substr(md5(random()::text), 1, 3);
    end loop;
  end if;

  insert into profiles (id, username, display_name)
  values (
    new.id,
    suggested_username,
    coalesce(new.raw_user_meta_data->>'display_name', suggested_username)
  );
  return new;
end; $$;
