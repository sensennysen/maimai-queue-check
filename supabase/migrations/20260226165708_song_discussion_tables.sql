-- song_tags_dictionary table
create table public.song_tags_dictionary (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_predefined boolean not null default false,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.song_tags_dictionary is 'Dictionary of available tags for songs, both system-defined and user-created.';

-- song_tags table
create table public.song_tags (
  song_id text not null,
  tag_id uuid not null references public.song_tags_dictionary(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (song_id, tag_id, user_id)
);

comment on table public.song_tags is 'Maps tags to songs, attributed to specific users.';

-- song_ratings table
create table public.song_ratings (
  song_id text not null,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (song_id, user_id)
);

comment on table public.song_ratings is 'User ratings for songs (1-5 stars).';

-- song_comments table
create table public.song_comments (
  id uuid primary key default gen_random_uuid(),
  song_id text not null,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.song_comments is 'User comments on songs.';

-- song_comment_votes table
create table public.song_comment_votes (
  comment_id uuid not null references public.song_comments(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  vote_type smallint not null check (vote_type in (-1, 1)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (comment_id, user_id)
);

comment on table public.song_comment_votes is 'Upvotes and downvotes on song comments.';

-- Enable RLS
alter table public.song_tags_dictionary enable row level security;
alter table public.song_tags enable row level security;
alter table public.song_ratings enable row level security;
alter table public.song_comments enable row level security;
alter table public.song_comment_votes enable row level security;

-- RLS Policies for song_tags_dictionary
create policy "Tags dictionary is viewable by everyone"
  on public.song_tags_dictionary for select
  to public
  using (true);

create policy "Authenticated users can create custom tags"
  on public.song_tags_dictionary for insert
  to authenticated
  with check (auth.uid() = created_by and is_predefined = false);

create policy "Users can update their own custom tags"
  on public.song_tags_dictionary for update
  to authenticated
  using (auth.uid() = created_by and is_predefined = false);

-- RLS Policies for song_tags
create policy "Song tags are viewable by everyone"
  on public.song_tags for select
  to public
  using (true);

create policy "Authenticated users can tag songs"
  on public.song_tags for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own tags"
  on public.song_tags for delete
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policies for song_ratings
create policy "Song ratings are viewable by everyone"
  on public.song_ratings for select
  to public
  using (true);

create policy "Authenticated users can rate songs"
  on public.song_ratings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own ratings"
  on public.song_ratings for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own ratings"
  on public.song_ratings for delete
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policies for song_comments
create policy "Song comments are viewable by everyone"
  on public.song_comments for select
  to public
  using (true);

create policy "Authenticated users can comment on songs"
  on public.song_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on public.song_comments for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.song_comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policies for song_comment_votes
create policy "Comment votes are viewable by everyone"
  on public.song_comment_votes for select
  to public
  using (true);

create policy "Authenticated users can vote on comments"
  on public.song_comment_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own votes"
  on public.song_comment_votes for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own votes"
  on public.song_comment_votes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Function to handle timestamp updates on song_ratings and song_comments
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for updated_at
create trigger handle_updated_at_song_ratings
  before update on public.song_ratings
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at_song_comments
  before update on public.song_comments
  for each row execute function public.handle_updated_at();
