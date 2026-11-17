-- Replace a playlist's tracks in one statement (add, remove, reorder), keeping
-- each surviving track's added_at/added_by. Permission checked explicitly.
create function public.set_playlist_tracks(pid uuid, track_ids text[]) returns integer
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  if auth.uid() is null or not public.can_edit_playlist(pid) then
    raise exception 'not allowed to edit this playlist' using errcode = '42501';
  end if;
  if coalesce(array_length(track_ids, 1), 0) > 10000 then
    raise exception 'a playlist holds at most 10000 tracks' using errcode = '22023';
  end if;
  with old as (
    select track_id, min(added_at) as added_at, (array_agg(added_by order by added_at))[1] as added_by
    from playlist_items where playlist_id = pid group by track_id
  ), gone as (
    delete from playlist_items where playlist_id = pid
  )
  insert into playlist_items (playlist_id, track_id, position, added_by, added_at)
  select pid, t.id, t.ord, coalesce(o.added_by, auth.uid()), coalesce(o.added_at, now())
  from unnest(track_ids) with ordinality as t(id, ord) left join old o on o.track_id = t.id;
  update playlists set version = version + 1 where id = pid returning version into v;
  return v;
end $$;
revoke all on function public.set_playlist_tracks(uuid, text[]) from public, anon;
grant execute on function public.set_playlist_tracks(uuid, text[]) to authenticated;
