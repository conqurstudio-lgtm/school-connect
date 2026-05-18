// South African school subjects — based on CAPS curriculum
// Foundation Phase (Grade R-3), Intermediate (4-6), Senior (7-9), FET (10-12)

export interface SubjectGroup {
  category: string
  subjects: string[]
}

export const SA_SUBJECTS: SubjectGroup[] = [
  {
    category: 'Languages',
    subjects: [
      'English Home Language',
      'English First Additional Language',
      'Afrikaans Home Language',
      'Afrikaans First Additional Language',
      'isiZulu Home Language',
      'isiXhosa Home Language',
      'Sesotho Home Language',
      'Setswana Home Language',
      'Sepedi Home Language',
      'siSwati Home Language',
      'Tshivenda Home Language',
      'Xitsonga Home Language',
      'isiNdebele Home Language',
    ],
  },
  {
    category: 'Mathematics & Science',
    subjects: [
      'Mathematics',
      'Mathematical Literacy',
      'Natural Sciences',
      'Physical Sciences',
      'Life Sciences',
      'Technical Mathematics',
      'Technical Sciences',
    ],
  },
  {
    category: 'Foundation Phase',
    subjects: [
      'Life Skills',
      'Numeracy',
      'Literacy',
      'Beginning Knowledge',
      'Creative Arts',
      'Physical Education',
      'Personal and Social Wellbeing',
    ],
  },
  {
    category: 'Social Sciences',
    subjects: [
      'History',
      'Geography',
      'Social Sciences',
      'Life Orientation',
    ],
  },
  {
    category: 'Economic & Management',
    subjects: [
      'Economics',
      'Business Studies',
      'Accounting',
      'Economic and Management Sciences',
      'Entrepreneurship',
    ],
  },
  {
    category: 'Arts & Culture',
    subjects: [
      'Visual Arts',
      'Music',
      'Dance Studies',
      'Dramatic Arts',
      'Design',
      'Art & Culture',
    ],
  },
  {
    category: 'Technology',
    subjects: [
      'Information Technology',
      'Computer Applications Technology',
      'Engineering Graphics and Design',
      'Technology',
      'Coding & Robotics',
    ],
  },
  {
    category: 'Religion',
    subjects: [
      'Religion Studies',
    ],
  },
  {
    category: 'Agriculture & Hospitality',
    subjects: [
      'Agricultural Sciences',
      'Agricultural Management Practices',
      'Agricultural Technology',
      'Consumer Studies',
      'Hospitality Studies',
      'Tourism',
    ],
  },
  {
    category: 'Physical Activity',
    subjects: [
      'Physical Education',
      'Sport Science',
    ],
  },
]

export const ALL_SUBJECTS_FLAT = SA_SUBJECTS.flatMap(g =>
  g.subjects.map(name => ({ name, category: g.category }))
)
