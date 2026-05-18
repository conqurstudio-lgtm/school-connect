import { FeedClient } from '@/components/feed/FeedClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Feed' }

// No server-side auth check — FeedClient handles auth itself
// This avoids the cookie/middleware session timing issue
export default function FeedPage() {
  return <FeedClient />
}
