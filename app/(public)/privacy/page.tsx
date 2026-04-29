import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

const LAST_UPDATED = 'April 29, 2026';
const CONTACT_EMAIL = 'm8mi0909@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyn.app';

export default function PrivacyPage() {
  return (
    <div className="space-y-8 text-foreground">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <Section title="1. What we collect">
        <p>When you sign in with Google, we receive and store:</p>
        <ul>
          <li>Your name</li>
          <li>Your email address</li>
          <li>Your profile picture URL</li>
        </ul>
        <p>
          We also store the vocabulary words, categories, review sessions, and
          grammar notes you create inside the app.
        </p>
      </Section>

      <Section title="2. How we use your data">
        <p>Your data is used solely to provide the Wyn service:</p>
        <ul>
          <li>Your email identifies your account</li>
          <li>
            Your vocabulary and review data personalises your learning
            experience
          </li>
          <li>We do not use your data for advertising or marketing</li>
        </ul>
      </Section>

      <Section title="3. Third-party services">
        <p>Wyn uses the following third-party services:</p>
        <ul>
          <li>
            <strong>Google OAuth</strong> — authentication. Governed by{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Unsplash</strong> — image suggestions. Only the search word
            is sent.
          </li>
          <li>
            <strong>Groq</strong> — AI writing feedback. Your sentence and the
            word being practiced are sent for evaluation.
          </li>
          <li>
            <strong>dictionaryapi.dev</strong> — phonetics and definitions. No
            personal data is sent.
          </li>
          <li>
            <strong>Neon</strong> — PostgreSQL database provider, hosted in the
            US.
          </li>
          <li>
            <strong>Vercel</strong> — hosting provider.
          </li>
        </ul>
      </Section>

      <Section title="4. Data sharing">
        <p>
          We do not sell, trade, or transfer your personal information to
          outside parties. Data is only shared with the third-party services
          listed above, to the extent necessary to operate the app.
        </p>
      </Section>

      <Section title="5. Data retention">
        <p>
          Your data is retained for as long as your account is active. You may
          delete your account at any time from the Settings page (
          <span className="text-primary">{APP_URL}/settings</span>), which
          permanently removes all your data from our database.
        </p>
      </Section>

      <Section title="6. Your rights">
        <p>You have the right to:</p>
        <ul>
          <li>Access the data we hold about you</li>
          <li>Delete your account and all associated data</li>
          <li>Export your vocabulary data (available from Settings)</li>
        </ul>
      </Section>

      <Section title="7. Security">
        <p>
          All data is transmitted over HTTPS. We use server-side session
          management via Auth.js and industry-standard security practices.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          For questions about this policy or your data, contact us at{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary underline underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-2 text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-foreground [&_a]:text-primary">
        {children}
      </div>
    </section>
  );
}
