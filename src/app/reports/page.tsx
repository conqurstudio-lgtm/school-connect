import { ReportsClient } from '@/components/reports/ReportsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reports' }
export default function ReportsPage() { return <ReportsClient /> }
