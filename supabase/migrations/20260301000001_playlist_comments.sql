-- Ensure playlist_posts has the comments toggle
ALTER TABLE public.playlist_posts 
ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT true;

-- Create playlist_comments table linking to posts
CREATE TABLE IF NOT EXISTS public.playlist_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.playlist_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 500),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.playlist_comments ENABLE ROW LEVEL SECURITY;

-- Post-Based RLS Policies

DROP POLICY IF EXISTS "Anyone can view comments on shared posts" ON public.playlist_comments;
DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.playlist_comments;
DROP POLICY IF EXISTS "Playlist owners can delete any comment" ON public.playlist_comments;
DROP POLICY IF EXISTS "Anyone can view comments on enabled posts" ON public.playlist_comments;
DROP POLICY IF EXISTS "Authenticated users can post comments if enabled" ON public.playlist_comments;
DROP POLICY IF EXISTS "Post owners can delete any comment" ON public.playlist_comments;

CREATE POLICY "Anyone can view comments on enabled posts" ON public.playlist_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.playlist_posts p
            WHERE p.id = post_id
            AND p.comments_enabled = true
            AND p.deleted = false
        )
    );

CREATE POLICY "Authenticated users can post comments if enabled" ON public.playlist_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.playlist_posts p
            WHERE p.id = post_id
            AND p.comments_enabled = true
            AND p.deleted = false
        )
    );

CREATE POLICY "Users can delete their own comments" ON public.playlist_comments
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Post owners can delete any comment" ON public.playlist_comments
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.playlist_posts p
            WHERE p.id = post_id
            AND p.user_id = auth.uid()
        )
    );

-- Indexing
CREATE INDEX IF NOT EXISTS idx_playlist_comments_post_id ON public.playlist_comments(post_id);
