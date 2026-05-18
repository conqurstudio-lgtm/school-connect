-- ============================================================
-- School Connect — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- for future full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- for accent-insensitive search

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('school', 'parent');
CREATE TYPE post_type AS ENUM ('update', 'moment', 'event', 'document', 'pinned');
CREATE TYPE post_status AS ENUM ('published', 'draft', 'archived');
CREATE TYPE comment_visibility AS ENUM ('private', 'public');
CREATE TYPE comment_status AS ENUM ('open', 'handled', 'closed');
CREATE TYPE reaction_type AS ENUM ('like', 'love', 'celebrate');
CREATE TYPE notification_type AS ENUM ('comment_reply', 'comment_liked', 'comment_made_public', 'new_post');

-- ============================================================
-- SCHOOLS
-- ============================================================

CREATE TABLE schools (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              text NOT NULL,
  slug              text UNIQUE NOT NULL,           -- e.g. "greenfields-primary" → /feed/greenfields-primary
  tagline           text,
  logo_url          text,
  cover_url         text,
  address           text,
  phone             text,
  email             text,
  website           text,
  province          text,
  country           text DEFAULT 'South Africa',
  invite_token      text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  owner_id          uuid NOT NULL,                  -- references auth.users
  is_verified       boolean DEFAULT false,          -- future: verified school badge
  is_active         boolean DEFAULT true,
  settings          jsonb DEFAULT '{}',             -- future: notification prefs, theme color, etc.
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

CREATE TABLE profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role              user_role NOT NULL,
  full_name         text,
  avatar_url        text,
  phone             text,
  -- school-specific
  school_id         uuid REFERENCES schools(id) ON DELETE SET NULL,
  -- parent-specific
  child_name        text,
  child_grade       text,
  child_class       text,
  -- meta
  onboarding_done   boolean DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ============================================================
-- POSTS
-- ============================================================

CREATE TABLE posts (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id         uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  author_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type              post_type NOT NULL DEFAULT 'update',
  status            post_status NOT NULL DEFAULT 'published',
  title             text,
  body              text,
  is_pinned         boolean DEFAULT false,
  pinned_at         timestamptz,
  -- event fields
  event_date        date,
  event_time        time,
  event_location    text,
  event_end_date    date,
  -- document fields
  document_url      text,
  document_name     text,
  document_size     bigint,
  document_type     text,
  -- media
  image_urls        text[] DEFAULT '{}',
  -- meta
  view_count        integer DEFAULT 0,
  edited_at         timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Index for fast feed queries
CREATE INDEX idx_posts_school_id       ON posts(school_id, created_at DESC);
CREATE INDEX idx_posts_type            ON posts(school_id, type);
CREATE INDEX idx_posts_pinned          ON posts(school_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_posts_status          ON posts(status) WHERE status = 'published';

-- Full-text search index (future)
CREATE INDEX idx_posts_fts ON posts USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
);

-- ============================================================
-- COMMENTS (private post-linked threads)
-- ============================================================

CREATE TABLE comments (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id           uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  school_id         uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  parent_id         uuid REFERENCES comments(id) ON DELETE CASCADE,  -- for school replies
  author_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body              text NOT NULL,
  visibility        comment_visibility NOT NULL DEFAULT 'private',
  status            comment_status NOT NULL DEFAULT 'open',
  is_school_reply   boolean DEFAULT false,
  is_acknowledged   boolean DEFAULT false,     -- school liked/acknowledged
  acknowledged_at   timestamptz,
  made_public_at    timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_comments_post_id      ON comments(post_id, created_at ASC);
CREATE INDEX idx_comments_author_id    ON comments(author_id);
CREATE INDEX idx_comments_school_id    ON comments(school_id, status);
CREATE INDEX idx_comments_visibility   ON comments(school_id, visibility) WHERE visibility = 'public';

-- ============================================================
-- REACTIONS
-- ============================================================

CREATE TABLE reactions (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id           uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id         uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  type              reaction_type NOT NULL DEFAULT 'like',
  created_at        timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)          -- one reaction per user per post
);

CREATE INDEX idx_reactions_post_id     ON reactions(post_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id         uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  type              notification_type NOT NULL,
  post_id           uuid REFERENCES posts(id) ON DELETE CASCADE,
  comment_id        uuid REFERENCES comments(id) ON DELETE CASCADE,
  message           text NOT NULL,
  is_read           boolean DEFAULT false,
  read_at           timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread     ON notifications(recipient_id) WHERE is_read = false;

-- ============================================================
-- INVITE LINKS (for tracking + analytics later)
-- ============================================================

CREATE TABLE invite_uses (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id         uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  invite_token      text NOT NULL,
  used_by           uuid REFERENCES profiles(id) ON DELETE SET NULL,
  used_at           timestamptz DEFAULT now(),
  ip_address        inet
);

-- ============================================================
-- POST VIEWS (for future analytics — which posts parents engage with)
-- ============================================================

CREATE TABLE post_views (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id           uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id         uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  viewed_at         timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_views_post_id    ON post_views(post_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_schools_updated_at   BEFORE UPDATE ON schools   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_profiles_updated_at  BEFORE UPDATE ON profiles  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_posts_updated_at     BEFORE UPDATE ON posts     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_comments_updated_at  BEFORE UPDATE ON comments  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'parent'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- AUTO-INCREMENT POST VIEW COUNT
-- ============================================================

CREATE OR REPLACE FUNCTION increment_post_view_count()
RETURNS trigger AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_view_created
  AFTER INSERT ON post_views
  FOR EACH ROW EXECUTE FUNCTION increment_post_view_count();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE schools       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_uses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views    ENABLE ROW LEVEL SECURITY;

-- ---- SCHOOLS ----

-- Anyone authenticated can read a school (needed for invite flow)
CREATE POLICY "schools_read" ON schools
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only the owner can update their school
CREATE POLICY "schools_owner_update" ON schools
  FOR UPDATE USING (owner_id = auth.uid());

-- Only the owner can insert (handled via API with service role for slug generation)
CREATE POLICY "schools_owner_insert" ON schools
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- ---- PROFILES ----

-- Users can always read their own profile
CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT USING (id = auth.uid());

-- School owners can read profiles of their members
CREATE POLICY "profiles_read_school_members" ON profiles
  FOR SELECT USING (
    school_id IN (
      SELECT id FROM schools WHERE owner_id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ---- POSTS ----

-- Published posts in a school are visible to all school members
CREATE POLICY "posts_read_members" ON posts
  FOR SELECT USING (
    status = 'published' AND
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- School owners can read all posts (including drafts)
CREATE POLICY "posts_read_school_owner" ON posts
  FOR SELECT USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
  );

-- Only school owners can write posts
CREATE POLICY "posts_write_school" ON posts
  FOR INSERT WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
  );

CREATE POLICY "posts_update_school" ON posts
  FOR UPDATE USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
  );

CREATE POLICY "posts_delete_school" ON posts
  FOR DELETE USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
  );

-- ---- COMMENTS ----

-- Parents can only read their own comments + school replies to them
CREATE POLICY "comments_read_own" ON comments
  FOR SELECT USING (
    author_id = auth.uid() OR
    parent_id IN (SELECT id FROM comments WHERE author_id = auth.uid()) OR
    visibility = 'public'
  );

-- School owners can read all comments in their school
CREATE POLICY "comments_read_school" ON comments
  FOR SELECT USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
  );

-- Parents can write their own comments
CREATE POLICY "comments_write_parent" ON comments
  FOR INSERT WITH CHECK (author_id = auth.uid());

-- School can write replies
CREATE POLICY "comments_write_school" ON comments
  FOR INSERT WITH CHECK (
    is_school_reply = true AND
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
  );

-- School can update comment visibility/status
CREATE POLICY "comments_update_school" ON comments
  FOR UPDATE USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
  );

-- ---- REACTIONS ----

CREATE POLICY "reactions_read" ON reactions
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()) OR
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
  );

CREATE POLICY "reactions_write" ON reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reactions_delete_own" ON reactions
  FOR DELETE USING (user_id = auth.uid());

-- ---- NOTIFICATIONS ----

CREATE POLICY "notifications_read_own" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- ---- POST VIEWS ----

CREATE POLICY "post_views_insert" ON post_views
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_views_read_school" ON post_views
  FOR SELECT USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
  );

-- ============================================================
-- STORAGE BUCKETS (run after schema)
-- ============================================================

-- These need to be created via Supabase dashboard or via API
-- Bucket: school-assets   (logos, cover images) — public read
-- Bucket: post-images     (moment photos, post images) — public read
-- Bucket: post-documents  (circulars, newsletters, forms) — authenticated read

