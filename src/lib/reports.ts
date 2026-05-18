// Auto-generate comments based on subject scores (out of 5)

export interface SubjectScore {
  name:  string
  score: number  // 0-5
}

export function generateComment(scores: Record<string, number>): string {
  const entries = Object.entries(scores)
  if (entries.length === 0) return ''

  const total   = entries.reduce((sum, [, s]) => sum + s, 0)
  const avg     = total / entries.length
  const sorted  = [...entries].sort((a, b) => b[1] - a[1])
  const best    = sorted[0]
  const lowest  = sorted[sorted.length - 1]

  if (avg >= 4.5) {
    return `Outstanding week — excelling across all subjects. Especially strong in ${best[0]}.`
  }
  if (avg >= 3.8) {
    return `Strong week overall. Great work in ${best[0]}. Keep building on this progress.`
  }
  if (avg >= 3) {
    if (best[1] >= 4 && lowest[1] < 3) {
      return `Doing well in ${best[0]}. Could use some extra practice in ${lowest[0]} this week.`
    }
    return `Steady progress this week. Focus on consistency across subjects.`
  }
  if (avg >= 2) {
    return `Improvement needed. Let's give ${lowest[0]} extra attention next week.`
  }
  return `Needs focused support — especially in ${lowest[0]}. Let's connect to plan next steps.`
}

export function getOverallScore(scores: Record<string, number>): number {
  const vals = Object.values(scores)
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function getScoreColor(score: number): string {
  if (score >= 4)   return '#22C55E'  // green
  if (score >= 3)   return '#78A6FE'  // blue
  if (score >= 2)   return '#F59E0B'  // amber
  return '#EF4444'                     // red
}

export function getScoreLabel(score: number): string {
  if (score >= 4.5) return 'Excellent'
  if (score >= 3.5) return 'Very Good'
  if (score >= 2.5) return 'Good'
  if (score >= 1.5) return 'Fair'
  return 'Needs Work'
}
