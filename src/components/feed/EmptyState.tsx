// @ts-nocheck
import type { FeedFilter } from '@/lib/types'

const CONFIG: Record<FeedFilter, { title: string; school: string; parent: string }> = {
  all:       { title: 'Nothing here yet',  school: 'Tap + to share your first post.',   parent: 'Your school hasn\'t posted yet.' },
  updates:   { title: 'No updates',        school: 'Share an announcement.',             parent: 'No announcements yet.' },
  moments:   { title: 'No moments',        school: 'Share a photo from school.',         parent: 'No moments yet.' },
  events:    { title: 'No events',         school: 'Add an upcoming event.',             parent: 'No upcoming events.' },
  documents: { title: 'No documents',      school: 'Share a circular or form.',          parent: 'No documents yet.' },
  pinned:    { title: 'Nothing pinned',    school: 'Pin important posts to keep them at the top.', parent: 'No pinned posts.' },
}

export function EmptyState({ filter, isSchool }: { filter: FeedFilter; isSchool: boolean }) {
  const { title, school, parent } = CONFIG[filter]
  return (
    <div style={{ padding: '64px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: 15, fontWeight: 500, color: '#1A1A1A', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
        {title}
      </p>
      <p style={{ fontSize: 13, color: '#9A9A9A', margin: 0, lineHeight: 1.5 }}>
        {isSchool ? school : parent}
      </p>
    </div>
  )
}
