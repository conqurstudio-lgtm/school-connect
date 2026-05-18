// ============================================================
// School Connect — Shared Types
// ============================================================

export type UserRole = 'school' | 'parent' | 'teacher'
export type PostType = 'update' | 'moment' | 'event' | 'document' | 'pinned'
export type PostStatus = 'published' | 'draft' | 'archived'
export type CommentVisibility = 'private' | 'public'
export type CommentStatus = 'open' | 'handled' | 'closed'
export type ReactionType = 'like' | 'love' | 'celebrate'
export type TeacherStatus    = 'pending' | 'approved' | 'rejected'
export type RSVPStatus       = 'going' | 'not_going' | 'maybe'

export type NotificationType = 'comment_reply' | 'comment_liked' | 'comment_made_public' | 'new_post'

export interface School {
  id: string
  name: string
  slug: string
  tagline?: string
  logo_url?: string
  cover_url?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  province?: string
  country: string
  invite_token: string
  owner_id: string
  is_verified: boolean
  is_active: boolean
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  role: UserRole
  full_name?: string
  avatar_url?: string
  phone?: string
  school_id?: string
  child_name?: string
  child_grade?: string
  child_class?: string
  subject?: string       // for teachers
  onboarding_done: boolean
  created_at: string
  updated_at: string
}

export interface RSVP {
  id:         string
  post_id:    string
  school_id:  string
  profile_id: string
  status:     RSVPStatus
  created_at: string
  updated_at: string
  // joined
  profile?:   Profile
}

export interface Teacher {
  id:           string
  profile_id:   string
  school_id:    string
  status:       TeacherStatus
  allowed_types: PostType[]   // which post types admin granted
  subject?:     string        // optional — teacher's subject/role
  approved_at?: string
  approved_by?: string
  created_at:   string
  updated_at:   string
  // joined
  profile?: Profile
}

export interface Post {
  id: string
  school_id: string
  author_id: string
  type: PostType
  status: PostStatus
  title?: string
  body?: string
  is_pinned: boolean
  pinned_at?: string
  event_date?: string
  event_time?: string
  event_location?: string
  event_end_date?: string
  document_url?: string
  document_name?: string
  document_size?: number
  document_type?: string
  image_urls: string[]
  view_count: number
  edited_at?: string
  teacher_id?: string    // set when a teacher created the post
  rsvp_count?: number
  my_rsvp?:    RSVPStatus | null
  submitted_by?: Profile // joined
  created_at: string
  updated_at: string
  // joined
  school?: School
  author?: Profile
  reactions?: Reaction[]
  reaction_count?:  number
  reaction_counts?: Record<string, number>
  comment_count?: number
  my_reaction?: ReactionType | null
}

export interface Comment {
  id: string
  post_id: string
  school_id: string
  parent_id?: string
  author_id: string
  body: string
  visibility: CommentVisibility
  status: CommentStatus
  is_school_reply: boolean
  is_acknowledged: boolean
  acknowledged_at?: string
  made_public_at?: string
  created_at: string
  updated_at: string
  // joined
  author?: Profile
  replies?: Comment[]
}

export interface Reaction {
  id: string
  post_id: string
  user_id: string
  school_id: string
  type: ReactionType
  created_at: string
}

export interface Notification {
  id: string
  recipient_id: string
  school_id: string
  type: NotificationType
  post_id?: string
  comment_id?: string
  message: string
  is_read: boolean
  read_at?: string
  created_at: string
  // joined
  post?: Post
  comment?: Comment
}

export type FeedFilter = 'all' | 'updates' | 'moments' | 'events' | 'documents' | 'pinned'

export interface FeedState {
  filter: FeedFilter
  posts: Post[]
  loading: boolean
  error?: string
}

// Auth context shapes
export interface AuthUser {
  id: string
  email?: string
  profile: Profile
  school?: School         // populated for school users
  parentSchool?: School   // populated for parent users
}
