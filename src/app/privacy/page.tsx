import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

const T = {
  white: '#FFFFFF',
  ink: '#21222D',
  ink2: '#545866',
  ink3: '#6F7280',
  border: '#DBDBE5',
  soft: '#F7F8FC',
  accent: '#958CE8',
  blue: '#ACD1FD',
}

const sections = [
  {
    title: 'Who we are',
    body: [
      'School Connect is a parent-teacher communication platform built for South African schools. We help teachers share weekly progress reports, private moments, and learning activities with parents.',
      'Our website is schoolconnect.co.za. For questions contact us at hello@schoolconnect.co.za.',
    ],
  },
  {
    title: 'What data we collect',
    groups: [
      {
        label: 'From schools and teachers',
        items: [
          'School name, address, contact details',
          'Teacher name and email address',
          'Class and grade information',
        ],
      },
      {
        label: 'From parents',
        items: [
          'Parent name',
          'WhatsApp number',
          'Child’s name, grade, and class',
        ],
      },
      {
        label: 'From children',
        items: [
          'No direct data collected from children',
          'Progress scores entered by teachers',
          'Photos shared by teachers of learning moments',
        ],
      },
    ],
  },
  {
    title: 'How we use your data',
    body: ['We use your data only to:'],
    items: [
      'Send weekly progress reports to parents',
      'Deliver private moments from teachers to parents',
      'Send Try at Home activity suggestions',
      'Manage school accounts and teacher profiles',
    ],
    afterItems: ['We never sell your data, share your data with third parties, use your data for advertising, or store payment card details.'],
  },
  {
    title: 'Who can see what',
    groups: [
      {
        label: 'Parents see only',
        items: [
          'Their own child’s reports',
          'Moments shared specifically about their child',
          'School-wide announcements from their school only',
        ],
      },
      {
        label: 'Teachers see only',
        items: [
          'Their own class roster',
          'Reports they have submitted',
          'Moments they have shared',
        ],
      },
      {
        label: 'School admins see only',
        items: [
          'Their own school’s data',
          'Their teachers and learners',
          'No access to other schools',
        ],
      },
    ],
    afterItems: ['School Connect staff can access data only for technical support and only when requested by the school.'],
  },
  {
    title: 'Children’s photos and consent',
    body: ['We take child safety seriously.'],
    items: [
      'Teachers may only share photos of children whose parents have given consent',
      'Consent is collected during parent onboarding',
      'Photos are never publicly visible',
      'Photos are stored securely and never shared outside the platform',
      'Parents can withdraw consent at any time',
    ],
  },
  {
    title: 'How we store your data',
    body: ['All data is stored securely using Supabase — enterprise grade encrypted storage.'],
    items: [
      'Data is encrypted at rest and in transit',
      'Access is controlled by role: parent, teacher and admin',
      'Regular security monitoring is in place',
      'No data is stored outside South Africa',
    ],
  },
  {
    title: 'WhatsApp delivery',
    body: [
      'We use Twilio to deliver WhatsApp notifications. When a report or moment is sent, Twilio delivers the message to the parent’s WhatsApp number. Twilio processes this data according to their own privacy policy. We never store message content on Twilio’s servers beyond delivery.',
    ],
  },
  {
    title: 'POPIA compliance',
    body: ['School Connect complies with the Protection of Personal Information Act (POPIA) of South Africa. This means:'],
    items: [
      'You have the right to know what data we hold about you',
      'You have the right to correct inaccurate data',
      'You have the right to request deletion of your data',
      'You have the right to withdraw consent at any time',
      'We will notify you within 72 hours of any data breach',
    ],
  },
  {
    title: 'Your rights',
    body: ['You can at any time:'],
    items: [
      'Request a copy of all data we hold about you',
      'Ask us to correct any inaccurate information',
      'Ask us to delete your data permanently',
      'Withdraw consent for photo sharing',
      'Cancel your School Connect account',
    ],
    afterItems: ['To exercise any of these rights contact us at hello@schoolconnect.co.za.'],
  },
  {
    title: 'Data retention',
    items: [
      'Active school data is kept for as long as the school has an account',
      'When a school cancels, all data is deleted within 30 days',
      'Parents can request immediate deletion at any time',
      'Deleted data cannot be recovered',
    ],
  },
  {
    title: 'Report links',
    body: ['Weekly reports are shared via private secure links. These links:'],
    items: [
      'Are unique to each parent',
      'Expire after a set number of days',
      'Cannot be accessed without the exact link',
      'Are not indexed by search engines',
    ],
  },
  {
    title: 'Changes to this policy',
    body: ['If we make significant changes to this policy we will notify schools via email at least 14 days before changes take effect.'],
  },
  {
    title: 'Contact us',
    body: [
      'For any privacy or safety concerns:',
      'Email: hello@schoolconnect.co.za',
      'Website: schoolconnect.co.za',
      'WhatsApp: [your number]',
      'We respond to all privacy requests within 48 hours.',
    ],
  },
]

const summary = [
  'We collect only what we need',
  'We never sell your data',
  'Only parents see their own child',
  'Only teachers see their own class',
  'Photos require parent consent',
  'You can delete your data anytime',
  'We’re POPIA compliant',
  'We take child safety seriously',
]

function BulletList({ items }: { items?: string[] }) {
  if (!items?.length) return null

  return (
    <ul style={{
      margin: '9px 0 0',
      padding: 0,
      listStyle: 'none',
      display: 'grid',
      gap: 7,
    }}>
      {items.map((item) => (
        <li key={item} style={{
          display: 'grid',
          gridTemplateColumns: '8px 1fr',
          gap: 9,
          alignItems: 'start',
          color: T.ink2,
          fontSize: 14,
          lineHeight: 1.5,
          fontWeight: 410,
        }}>
          <span style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: T.accent,
            marginTop: 8,
          }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <main style={{
      minHeight: '100dvh',
      background: T.white,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      color: T.ink,
      padding: 'max(18px, env(safe-area-inset-top)) 18px max(28px, env(safe-area-inset-bottom))',
      boxSizing: 'border-box',
    }}>
      <section style={{
        width: '100%',
        maxWidth: 760,
        margin: '0 auto',
      }}>
        <Link
          href="/"
          aria-label="Back to welcome"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            color: T.ink,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            marginBottom: 22,
          }}
        >
          <ArrowLeft size={20} strokeWidth={2.1} />
        </Link>

        <header style={{
          marginBottom: 28,
        }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            background: T.soft,
            border: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.ink,
            marginBottom: 16,
          }}>
            <ShieldCheck size={25} strokeWidth={1.8} />
          </div>

          <p style={{
            margin: '0 0 8px',
            color: T.ink3,
            fontSize: 12.5,
            fontWeight: 560,
            letterSpacing: '-0.01em',
          }}>
            Last updated: June 2026
          </p>

          <h1 style={{
            margin: 0,
            fontSize: 34,
            lineHeight: 1.03,
            fontWeight: 700,
            letterSpacing: '-0.055em',
            color: T.ink,
          }}>
            Privacy & Safety Policy
          </h1>

          <p style={{
            margin: '12px 0 0',
            color: T.ink3,
            fontSize: 15,
            lineHeight: 1.55,
            fontWeight: 410,
            maxWidth: 600,
          }}>
            Plain-English privacy and safety information for School Connect, built for South African schools, teachers and parents.
          </p>
        </header>

        <section style={{
          display: 'grid',
          gap: 18,
        }}>
          {sections.map((section) => (
            <article key={section.title} style={{
              borderTop: `1px solid ${T.border}`,
              paddingTop: 18,
            }}>
              <h2 style={{
                margin: 0,
                color: T.ink,
                fontSize: 18,
                lineHeight: 1.2,
                fontWeight: 650,
                letterSpacing: '-0.03em',
              }}>
                {section.title}
              </h2>

              {section.body?.map((paragraph) => (
                <p key={paragraph} style={{
                  margin: '9px 0 0',
                  color: T.ink2,
                  fontSize: 14,
                  lineHeight: 1.55,
                  fontWeight: 410,
                }}>
                  {paragraph}
                </p>
              ))}

              {'groups' in section && section.groups?.length ? (
                <div style={{ display: 'grid', gap: 13, marginTop: 12 }}>
                  {section.groups.map((group) => (
                    <div key={group.label}>
                      <p style={{
                        margin: 0,
                        color: T.ink,
                        fontSize: 13.5,
                        fontWeight: 620,
                        letterSpacing: '-0.015em',
                      }}>
                        {group.label}
                      </p>
                      <BulletList items={group.items} />
                    </div>
                  ))}
                </div>
              ) : null}

              <BulletList items={section.items} />

              {section.afterItems?.map((paragraph) => (
                <p key={paragraph} style={{
                  margin: '10px 0 0',
                  color: T.ink2,
                  fontSize: 14,
                  lineHeight: 1.55,
                  fontWeight: 410,
                }}>
                  {paragraph}
                </p>
              ))}
            </article>
          ))}

          <article style={{
            border: `1px solid ${T.border}`,
            borderRadius: 24,
            background: T.soft,
            padding: 18,
            marginTop: 4,
          }}>
            <h2 style={{
              margin: 0,
              color: T.ink,
              fontSize: 18,
              lineHeight: 1.2,
              fontWeight: 650,
              letterSpacing: '-0.03em',
            }}>
              Summary
            </h2>
            <BulletList items={summary} />
          </article>
        </section>
      </section>
    </main>
  )
}
