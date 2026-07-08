// Auto-generate comments based on subject scores (out of 5)

export interface SubjectScore {
  name:  string
  score: number  // 0-5
}

function shortSubjectName(name: string): string {
  const map: Record<string, string> = {
    'English Home Language': 'English',
    'English First Additional Language': 'English',
    'Afrikaans Home Language': 'Afrikaans',
    'Afrikaans First Additional Language': 'Afrikaans',
    'Mathematical Literacy': 'Maths Literacy',
    'Natural Sciences': 'Natural Sciences',
    'Physical Sciences': 'Physical Sciences',
    'Life Sciences': 'Life Sciences',
    'Life Orientation': 'Life Orientation',
    'Business Studies': 'Business Studies',
    'Economic and Management Sciences': 'EMS',
    'Information Technology': 'IT',
    'Computer Applications Technology': 'CAT',
    'Engineering Graphics and Design': 'EGD',
    'Personal and Social Wellbeing': 'Wellbeing',
    'Beginning Knowledge': 'Beginning Knowledge',
    'Coding & Robotics': 'Coding',
  }

  return map[name] || name
}

function joinSubjects(names: string[]): string {
  const clean = names.filter(Boolean)
  if (clean.length === 0) return ''
  if (clean.length === 1) return clean[0]
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`
  return `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}`
}

export function generateComment(scores: Record<string, number>): string {
  const entries = Object.entries(scores)
    .map(([name, score]) => [shortSubjectName(name), Number(score)] as [string, number])
    .filter(([, score]) => Number.isFinite(score))

  if (entries.length === 0) return ''

  const total = entries.reduce((sum, [, score]) => sum + score, 0)
  const avg = total / entries.length
  const sortedHigh = [...entries].sort((a, b) => b[1] - a[1])
  const sortedLow = [...entries].sort((a, b) => a[1] - b[1])

  const strongest = sortedHigh
    .filter(([, score]) => score >= 3.8)
    .slice(0, 2)
    .map(([name]) => name)

  const support = sortedLow
    .filter(([, score]) => score < 3.2)
    .slice(0, 2)
    .map(([name]) => name)

  const best = sortedHigh[0]
  const lowest = sortedLow[0]
  const strongestText = joinSubjects(strongest)
  const supportText = joinSubjects(support)

  if (avg >= 4.5) {
    return `A beautiful week of learning. The learner is excelling across the report, with a lovely strength showing in ${best[0]}. Please keep encouraging this confidence at home.`
  }

  if (avg >= 3.8) {
    if (supportText) {
      return `A strong week overall, especially in ${strongestText || best[0]}. A little light support in ${supportText} will help keep the progress balanced.`
    }

    return `A strong and positive week. The learner is showing confidence, especially in ${strongestText || best[0]}. Keep celebrating this progress and encouraging steady practice.`
  }

  if (avg >= 3) {
    if (supportText && strongestText) {
      return `There is good progress this week, especially in ${strongestText}. The next focus is ${supportText}, where gentle practice at home can make a real difference.`
    }

    if (supportText) {
      return `The learner is making steady progress. This week, ${supportText} needs a little extra attention and encouragement so confidence can keep growing.`
    }

    return `A steady week of learning. The learner is progressing across the subjects, and regular encouragement at home will help build even more confidence.`
  }

  if (avg >= 2) {
    return `The learner needs gentle support this week, especially in ${supportText || lowest[0]}. Let’s focus on small, consistent practice and celebrate each improvement.`
  }

  return `This week needs focused support, especially in ${supportText || lowest[0]}. Please connect with the teacher so we can support the learner one small step at a time.`
}

export function getOverallScore(scores: Record<string, number>): number {
  const vals = Object.values(scores)
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function getScoreColor(score: number): string {
  if (score >= 4)   return '#717171'
  if (score >= 3)   return '#8A8A8A'
  if (score >= 2)   return '#A3A3A3'
  return '#B42318'
}

export function getScoreLabel(score: number): string {
  if (score >= 4.5) return 'Excellent'
  if (score >= 3.5) return 'Very Good'
  if (score >= 2.5) return 'Good'
  if (score >= 1.5) return 'Fair'
  return 'Needs Work'
}
