import Link from 'next/link'
import { AuthArrow } from '@/components/auth/AuthArrow'


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

export default function TermsPage() {
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
            width: 36,
            height: 36,
            borderRadius: 10,
            color: T.ink,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            marginBottom: 22,
          }}
        >
          <AuthArrow direction="left" size={14} />
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
            School Connect — Terms of Service
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
          <Section title="Who these terms are for">
            <P>These Terms of Service apply to schools, teachers, parents and authorised users who access School Connect.</P>
            <P>By using School Connect, you agree to use the platform responsibly and only for school communication, learner progress reports, private moments and learning-related updates.</P>
          </Section>

          <Section title="Using School Connect">
            <P>School Connect is built to help schools communicate safely with parents. Users must keep their login details private and must not share access with anyone who is not authorised.</P>
            <Bullets items={[
              'Schools are responsible for inviting the correct teachers and parents',
              'Teachers must only share information for learners they are authorised to support',
              'Parents must only access information shared with them by their school',
              'Users must not try to access another school, class, learner or parent account',
            ]} />
          </Section>

          <Section title="School and teacher responsibilities">
            <P>Schools and teachers are responsible for making sure information shared through School Connect is accurate, appropriate and shared with the correct parent or guardian.</P>
            <Bullets items={[
              'Schools must manage teacher and parent access carefully',
              'Teachers should only upload appropriate learning moments and school-related updates',
              'Schools must collect and manage parent consent where required',
              'Schools must tell School Connect if an account should be removed or restricted',
            ]} />
          </Section>

          <Section title="Parent responsibilities">
            <P>Parents should use School Connect to view their own child’s updates and communicate responsibly with the school.</P>
            <Bullets items={[
              'Parents must not share private report links publicly',
              'Parents must keep WhatsApp and contact details up to date with the school',
              'Parents must report incorrect information to the school or School Connect support',
            ]} />
          </Section>

          <Section title="Child safety">
            <P>School Connect must be used in a way that protects children’s privacy and safety. Children’s photos, reports and moments are not public content.</P>
            <Bullets items={[
              'Photos should only be shared where parent consent exists',
              'Private moments should only be visible to the correct parent or guardian',
              'Users must not download, repost or misuse child-related content',
            ]} />
          </Section>

          <Section title="Privacy">
            <P>Your use of School Connect is also covered by our <Link href="/privacy" style={linkStyle}>Privacy & Safety Policy</Link>.</P>
            <P>We collect and use data only to provide the School Connect service, support schools and deliver parent communication.</P>
          </Section>

          <Section title="Service availability">
            <P>We work to keep School Connect reliable and available, but the service may sometimes be unavailable because of maintenance, internet issues, provider outages or updates.</P>
            <P>We may improve, change or update features as the platform grows.</P>
          </Section>

          <Section title="Acceptable use">
            <P>Users may not use School Connect to send harmful, abusive, misleading, unlawful or unrelated content.</P>
            <Bullets items={[
              'Do not upload inappropriate images or messages',
              'Do not attempt to bypass access controls',
              'Do not use School Connect for spam, advertising or unrelated communication',
              'Do not interfere with the security or performance of the platform',
            ]} />
          </Section>

          <Section title="Account access and removal">
            <P>Schools may request that teacher or parent access is updated, disabled or removed. School Connect may restrict access where there is a safety, privacy or security concern.</P>
          </Section>

          <Section title="Contact">
            <P>For questions about these terms, contact us at <PolicyLink href="mailto:hello@schoolconnect.co.za">hello@schoolconnect.co.za</PolicyLink>.</P>
            <P>Website: <PolicyLink href="https://schoolconnect.co.za">schoolconnect.co.za</PolicyLink></P>
            <P>WhatsApp: <PolicyLink href="https://wa.me/27613353328">+27613353328</PolicyLink></P>
          </Section>
        </div>
      </article>
    </main>
  )
}
