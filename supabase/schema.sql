-- =============================================================================
-- SCHOOL CONNECT — COMPLETE DATABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- Project: School Connect v1
-- =============================================================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('school', 'parent');
CREATE TYPE post_type AS ENUM ('update', 'moment', 'event', 'document', 'pinned');
CREATE TYPE post_status AS ENUM ('published', 'draft', 'archived');
CREATE TYPE comment_visibility AS ENUM ('private', 'public');
CREATE TYPE comment_status AS ENUM ('open', 'handled');
CREATE TYPE reaction_type AS ENUM ('like', 'love', 'celebrate');
CREATE TYPE notification_type AS ENUM ('school_reply', 'comment_liked', 'comment_made_public', 'new_post');

-- =============================================================================
-- SCHOOLS TABLE
-- Central identity for each school on the platform.
-- =============================================================================

CREATE TABLE schools (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE, -- used in URL: schoolconnect.app/greenfields
  tagline       TEXT,                 -- optional short description
  logo_url      TEXT,                 -- Supabase Storage URL

  -- Contact & location
  address       TEXT,
  city          TEXT,
  country       TEXT DEFAULT 'South Africa',
  email         TEXT,
  phone         TEXT,
  website       TEXT,

  -- Settings
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE, -- future: verified school badge
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  theme_color   TEXT DEFAULT '#0b7ee8',          -- per-school brand color (future)

  -- Owner auth user
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- =============================================================================
-- PROFILES TABLE
-- Extended user info for both school users and parents.
-- One profile per auth.users row.
-- =============================================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity
  full_name     TEXT,
  avatar_url    TEXT,
  email         TEXT,
  phone         TEXT,

  -- Role
  role          user_role NOT NULL DEFAULT 'parent',

  -- Parent-specific fields
  child_name    TEXT,
  child_grade   TEXT,
  school_id     UUID REFERENCES schools(id) ON DELETE SET NULL,

  -- School-specific: if role = 'school', which school they manage
  managed_school_id UUID REFERENCES schools(id) ON DELETE SET NULL,

  -- Metadata
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at  TIMESTAMPTZ
);

-- =============================================================================
-- POSTS TABLE
-- The heart of the platform. Every piece of content lives here.
-- =============================================================================

CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ownership
  school_id     UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  post_type     post_type NOT NULL DEFAULT 'update',
  status        post_status NOT NULL DEFAULT 'published',
  is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  pin_order     INTEGER,                -- lower = higher in pinned list

  -- Text content
  title         TEXT,
  body          TEXT,

  -- Event-specific fields
  event_date    DATE,
  event_time    TIME,
  event_location TEXT,
  event_ends_at  TIMESTAMPTZ,

  -- Counts (denormalized for performance — updated by triggers)
  reaction_count  INTEGER NOT NULL DEFAULT 0,
  comment_count   INTEGER NOT NULL DEFAULT 0,
  view_count      INTEGER NOT NULL DEFAULT 0,

  -- Full-text search vector (auto-updated by trigger)
  search_vector   TSVECTOR
);

-- =============================================================================
-- POST MEDIA TABLE
-- Images and documents attached to posts. Separate table for multiple files.
-- =============================================================================

CREATE TABLE post_media (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  post_id       UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- File info
  media_type    TEXT NOT NULL CHECK (media_type IN ('image', 'document')),
  url           TEXT NOT NULL,          -- Supabase Storage URL
  file_name     TEXT NOT NULL,          -- original filename
  file_size     INTEGER,                -- bytes
  mime_type     TEXT,
  width         INTEGER,                -- for images
  height        INTEGER,                -- for images

  -- Order in post
  sort_order    INTEGER NOT NULL DEFAULT 0
);

-- =============================================================================
-- REACTIONS TABLE
-- Like, love, celebrate per post per user. One reaction per user per post.
-- =============================================================================

CREATE TABLE reactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  post_id       UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type reaction_type NOT NULL DEFAULT 'like',

  UNIQUE (post_id, user_id) -- one reaction per user per post
);

-- =============================================================================
-- COMMENTS TABLE
-- Post-linked private threads. This is the core interaction model.
-- Private by default. School can make public.
-- =============================================================================

CREATE TABLE comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Links
  post_id       UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- the parent who wrote it
  school_id     UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

  -- Content
  body          TEXT NOT NULL,

  -- Visibility — private by default, school can make public
  visibility    comment_visibility NOT NULL DEFAULT 'private',
  status        comment_status NOT NULL DEFAULT 'open',

  -- School response fields
  school_liked  BOOLEAN NOT NULL DEFAULT FALSE,
  school_reply  TEXT,                       -- school's reply text
  school_replied_at TIMESTAMPTZ,
  marked_public_at  TIMESTAMPTZ
);

-- =============================================================================
-- NOTIFICATIONS TABLE
-- Internal only. No Twilio. Links directly to post + comment.
-- =============================================================================

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at       TIMESTAMPTZ,

  -- Who receives it
  recipient_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What triggered it
  notification_type notification_type NOT NULL,

  -- Context links — all nullable, use what applies
  school_id     UUID REFERENCES schools(id) ON DELETE CASCADE,
  post_id       UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id    UUID REFERENCES comments(id) ON DELETE CASCADE,

  -- Denormalized preview text (avoid extra joins on notification fetch)
  title         TEXT,
  preview       TEXT
);

-- =============================================================================
-- PARENT INVITES TABLE
-- School generates invite links. Parents join through them.
-- =============================================================================

CREATE TABLE parent_invites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,             -- null = never expires

  school_id     UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE,   -- random token in invite URL
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,

  -- Tracking
  uses_count    INTEGER NOT NULL DEFAULT 0,
  max_uses      INTEGER                 -- null = unlimited
);

-- =============================================================================
-- INDEXES — for performance on common queries
-- =============================================================================

-- Posts: school feed query (most common — school + published + ordered)
CREATE INDEX idx_posts_school_feed
  ON posts (school_id, status, is_pinned, created_at DESC);

-- Posts: by type (for category filters)
CREATE INDEX idx_posts_type
  ON posts (school_id, post_type, created_at DESC);

-- Posts: full text search
CREATE INDEX idx_posts_search
  ON posts USING GIN (search_vector);

-- Comments: parent thread (parent opens a post, loads their private thread)
CREATE INDEX idx_comments_post_parent
  ON comments (post_id, parent_id, created_at ASC);

-- Comments: school inbox (school loads all open comments for their school)
CREATE INDEX idx_comments_school_open
  ON comments (school_id, status, created_at DESC);

-- Reactions: fast count lookup
CREATE INDEX idx_reactions_post
  ON reactions (post_id);

-- Notifications: unread for user
CREATE INDEX idx_notifications_recipient
  ON notifications (recipient_id, read_at, created_at DESC);

-- Media: ordered per post
CREATE INDEX idx_media_post
  ON post_media (post_id, sort_order);

-- Invite token lookup
CREATE INDEX idx_invites_token
  ON parent_invites (token);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update post search vector when title or body changes
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.body, '') || ' ' ||
    COALESCE(NEW.event_location, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_search_vector
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

-- Auto-update reaction_count on posts when reactions change
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET reaction_count = reaction_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reactions_count_update
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW EXECUTE FUNCTION update_reaction_count();

-- Auto-update comment_count on posts when comments change
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_count_update
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Auto-create profile when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Critical. This is what keeps parent A from seeing parent B's private comments.
-- =============================================================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_invites ENABLE ROW LEVEL SECURITY;

-- ---- SCHOOLS ----

-- Anyone can read school info (needed for public invite pages)
CREATE POLICY "schools_read_public" ON schools
  FOR SELECT USING (is_active = TRUE);

-- Only the school owner can update their school
CREATE POLICY "schools_update_owner" ON schools
  FOR UPDATE USING (auth.uid() = owner_id);

-- Only authenticated users can insert (handled by our server function)
CREATE POLICY "schools_insert_authenticated" ON schools
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- ---- PROFILES ----

-- Users can read their own profile
CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- School users can read parent profiles in their school
CREATE POLICY "profiles_school_reads_parents" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'school'
        AND p.managed_school_id = profiles.school_id
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ---- POSTS ----

-- Parents and school members can read published posts for their school
CREATE POLICY "posts_read_school_members" ON posts
  FOR SELECT USING (
    status = 'published'
    AND (
      -- School user who manages this school
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND managed_school_id = posts.school_id
      )
      OR
      -- Parent enrolled in this school
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND school_id = posts.school_id
      )
    )
  );

-- Only the school can create posts
CREATE POLICY "posts_insert_school" ON posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'school'
        AND managed_school_id = school_id
    )
  );

-- Only the school can update posts
CREATE POLICY "posts_update_school" ON posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'school'
        AND managed_school_id = posts.school_id
    )
  );

-- Only the school can delete posts
CREATE POLICY "posts_delete_school" ON posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'school'
        AND managed_school_id = posts.school_id
    )
  );

-- ---- POST MEDIA ----

-- Read: same as post read — members of school
CREATE POLICY "media_read_school_members" ON post_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = post_media.post_id
        AND p.status = 'published'
        AND (pr.school_id = p.school_id OR pr.managed_school_id = p.school_id)
    )
  );

-- Insert: school only
CREATE POLICY "media_insert_school" ON post_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = post_media.post_id
        AND pr.role = 'school'
        AND pr.managed_school_id = p.school_id
    )
  );

-- ---- REACTIONS ----

-- School members can read reactions
CREATE POLICY "reactions_read_school_members" ON reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = reactions.post_id
        AND (pr.school_id = p.school_id OR pr.managed_school_id = p.school_id)
    )
  );

-- Any school member can insert/delete their own reaction
CREATE POLICY "reactions_insert_own" ON reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reactions_delete_own" ON reactions
  FOR DELETE USING (auth.uid() = user_id);

-- ---- COMMENTS ----

-- Parents can only read their own comments + public comments on their school's posts
CREATE POLICY "comments_read_parent" ON comments
  FOR SELECT USING (
    -- Own comments
    auth.uid() = parent_id
    OR
    -- Public comments visible to all school members
    (
      visibility = 'public'
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND school_id = comments.school_id
      )
    )
    OR
    -- School user can read all comments for their school
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'school'
        AND managed_school_id = comments.school_id
    )
  );

-- Parents can insert comments
CREATE POLICY "comments_insert_parent" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = parent_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
    )
  );

-- School can update comments (reply, mark public, close)
CREATE POLICY "comments_update_school" ON comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'school'
        AND managed_school_id = comments.school_id
    )
  );

-- ---- NOTIFICATIONS ----

-- Users only see their own notifications
CREATE POLICY "notifications_read_own" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- ---- PARENT INVITES ----

-- Anyone can read invite by token (needed for invite page)
CREATE POLICY "invites_read_token" ON parent_invites
  FOR SELECT USING (is_active = TRUE);

-- School can manage their own invites
CREATE POLICY "invites_manage_school" ON parent_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'school'
        AND managed_school_id = parent_invites.school_id
    )
  );

-- =============================================================================
-- STORAGE BUCKETS
-- Run these separately in Supabase Dashboard → Storage, OR via SQL below.
-- =============================================================================

-- School logos (public readable, school writable)
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-logos', 'school-logos', TRUE)
ON CONFLICT DO NOTHING;

-- Post images (public readable, school writable)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', TRUE)
ON CONFLICT DO NOTHING;

-- Post documents (authenticated readable, school writable)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-documents', 'post-documents', FALSE)
ON CONFLICT DO NOTHING;

-- Storage RLS policies
CREATE POLICY "logo_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-logos');

CREATE POLICY "logo_school_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'school-logos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "images_school_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "documents_authenticated_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'post-documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "documents_school_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-documents'
    AND auth.role() = 'authenticated'
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get the school for the current authenticated user
CREATE OR REPLACE FUNCTION get_my_school()
RETURNS UUID AS $$
  SELECT COALESCE(managed_school_id, school_id)
  FROM profiles
  WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is the school admin for a given school
CREATE OR REPLACE FUNCTION is_school_admin(school_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'school'
      AND managed_school_id = school_uuid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =============================================================================
-- SCHEMA COMPLETE
-- =============================================================================
