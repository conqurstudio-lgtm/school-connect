import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const T = {
  white: '#FFFFFF',
  ink: '#21222D',
  border: '#DBDBE5',
  accent: '#958CE8',
}

const linkStyle: React.CSSProperties = {
  color: T.accent,
  textDecoration: 'none',
  fontWeight: 600,
}

function PolicyLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith('http')

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      style={linkStyle}
    >
      {children}
    </a>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      borderTop: `1px solid ${T.border}`,
      paddingTop: 18,
    }}>
      <h2 style={{
        margin: 0,
        color: T.ink,
        fontSize: 15.5,
        lineHeight: 1.2,
        fontWeight: 600,
        letterSpacing: '-0.022em',
      }}>
        {title}
      </h2>

      <div style={{
        marginTop: 9,
        color: T.ink,
        fontSize: 12.7,
        lineHeight: 1.54,
        fontWeight: 410,
      }}>
        {children}
      </div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 9px',
      color: T.ink,
      fontSize: 12.7,
      lineHeight: 1.54,
      fontWeight: 410,
    }}>
      {children}
    </p>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '12px 0 5px',
      color: T.ink,
      fontSize: 12.4,
      lineHeight: 1.35,
      fontWeight: 570,
      letterSpacing: '-0.015em',
    }}>
      {children}
    </p>
  )
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{
      margin: '6px 0 9px',
      padding: 0,
      listStyle: 'none',
      display: 'grid',
      gap: 7,
    }}>
      {items.map((item, index) => (
        <li key={index} style={{
          display: 'grid',
          gridTemplateColumns: '8px 1fr',
          gap: 9,
          alignItems: 'start',
          color: T.ink,
          fontSize: 12.7,
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
    <main className="sc-page-enter" style={{
      minHeight: '100dvh',
      background: T.white,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      color: T.ink,
      padding: 'max(18px, env(safe-area-inset-top)) 18px max(30px, env(safe-area-inset-bottom))',
      boxSizing: 'border-box',
    }}>
      <article style={{
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

        <header style={{ marginBottom: 28 }}>
          <h1 style={{
            margin: 0,
            fontSize: 25,
            lineHeight: 1.08,
            fontWeight: 650,
            letterSpacing: '-0.04em',
            color: T.ink,
          }}>
            School Connect — Privacy & Safety Policy
          </h1>

          <p style={{
            margin: '12px 0 0',
            color: T.ink,
            fontSize: 12.7,
            lineHeight: 1.46,
            fontWeight: 410,
          }}>
            Last updated: June 2026
          </p>
        </header>

        <div style={{ display: 'grid', gap: 18 }}>
          <Section title="Who we are">
            <P>School Connect is a parent-teacher communication platform built for South African schools. We help teachers share weekly progress reports, private moments, and learning activities with parents.</P>
            <P>Our website is <PolicyLink href="https://schoolconnect.co.za">schoolconnect.co.za</PolicyLink></P>
            <P>For questions contact us at <PolicyLink href="mailto:hello@schoolconnect.co.za">hello@schoolconnect.co.za</PolicyLink></P>
          </Section>

          <Section title="What data we collect">
            <Label>From schools and teachers:</Label>
            <Bullets items={['School name, address, contact details', 'Teacher name and email address', 'Class and grade information']} />
            <Label>From parents:</Label>
            <Bullets items={['Parent name', 'WhatsApp number', 'Child’s name, grade, and class']} />
            <Label>From children:</Label>
            <Bullets items={['No direct data collected from children', 'Progress scores entered by teachers', 'Photos shared by teachers of learning moments']} />
          </Section>

          <Section title="How we use your data">
            <P>We use your data only to:</P>
            <Bullets items={['Send weekly progress reports to parents', 'Deliver private moments from teachers to parents', 'Send Try at Home activity suggestions', 'Manage school accounts and teacher profiles']} />
            <Label>We never:</Label>
            <Bullets items={['Sell your data to anyone', 'Share your data with third parties', 'Use your data for advertising', 'Store payment card details']} />
          </Section>

          <Section title="Who can see what">
            <Label>Parents see only:</Label>
            <Bullets items={['Their own child’s reports', 'Moments shared specifically about their child', 'School-wide announcements from their school only']} />
            <Label>Teachers see only:</Label>
            <Bullets items={['Their own class roster', 'Reports they have submitted', 'Moments they have shared']} />
            <Label>School admins see only:</Label>
            <Bullets items={['Their own school’s data', 'Their teachers and learners', 'No access to other schools']} />
            <P>School Connect staff can access data only for technical support and only when requested by the school.</P>
          </Section>

          <Section title="Children’s photos and consent">
            <P>We take child safety seriously.</P>
            <Bullets items={['Teachers may only share photos of children whose parents have given consent', 'Consent is collected during parent onboarding', 'Photos are never publicly visible', 'Photos are stored securely and never shared outside the platform', 'Parents can withdraw consent at any time']} />
          </Section>

          <Section title="How we store your data">
            <P>All data is stored securely using Supabase — enterprise grade encrypted storage.</P>
            <Bullets items={['Data is encrypted at rest and in transit', 'Access is controlled by role (parent, teacher, admin)', 'Regular security monitoring is in place', 'No data is stored outside South Africa']} />
          </Section>

          <Section title="WhatsApp delivery">
            <P>We use Twilio to deliver WhatsApp notifications. When a report or moment is sent, Twilio delivers the message to the parent’s WhatsApp number. Twilio processes this data according to their own privacy policy. We never store message content on Twilio’s servers beyond delivery.</P>
            <P>For WhatsApp privacy or safety concerns, contact us on <PolicyLink href="https://wa.me/27613353328">+27613353328</PolicyLink>.</P>
          </Section>

          <Section title="POPIA compliance">
            <P>School Connect complies with the Protection of Personal Information Act (POPIA) of South Africa.</P>
            <P>This means:</P>
            <Bullets items={['You have the right to know what data we hold about you', 'You have the right to correct inaccurate data', 'You have the right to request deletion of your data', 'You have the right to withdraw consent at any time', 'We will notify you within 72 hours of any data breach']} />
          </Section>

          <Section title="Your rights">
            <P>You can at any time:</P>
            <Bullets items={['Request a copy of all data we hold about you', 'Ask us to correct any inaccurate information', 'Ask us to delete your data permanently', 'Withdraw consent for photo sharing', 'Cancel your School Connect account']} />
            <P>To exercise any of these rights contact us at <PolicyLink href="mailto:hello@schoolconnect.co.za">hello@schoolconnect.co.za</PolicyLink></P>
          </Section>

          <Section title="Data retention">
            <Bullets items={['Active school data is kept for as long as the school has an account', 'When a school cancels, all data is deleted within 30 days', 'Parents can request immediate deletion at any time', 'Deleted data cannot be recovered']} />
          </Section>

          <Section title="Report links">
            <P>Weekly reports are shared via private secure links. These links:</P>
            <Bullets items={['Are unique to each parent', 'Expire after a set number of days', 'Cannot be accessed without the exact link', 'Are not indexed by search engines']} />
          </Section>

          <Section title="Changes to this policy">
            <P>If we make significant changes to this policy we will notify schools via email at least 14 days before changes take effect.</P>
          </Section>

          <Section title="Contact us">
            <P>For any privacy or safety concerns:</P>
            <P>Email: <PolicyLink href="mailto:hello@schoolconnect.co.za">hello@schoolconnect.co.za</PolicyLink> Website: <PolicyLink href="https://schoolconnect.co.za">schoolconnect.co.za</PolicyLink> WhatsApp: <PolicyLink href="https://wa.me/27613353328">+27613353328</PolicyLink></P>
            <P>We respond to all privacy requests within 48 hours.</P>
          </Section>

          <Section title="Summary (plain English)">
            <Bullets items={['We collect only what we need', 'We never sell your data', 'Only parents see their own child', 'Only teachers see their own class', 'Photos require parent consent', 'You can delete your data anytime', 'We’re POPIA compliant', 'We take child safety seriously']} />
          </Section>
        </div>
      </article>
    </main>
  )
}
