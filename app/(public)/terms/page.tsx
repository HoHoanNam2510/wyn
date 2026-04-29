import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Use' };

const LAST_UPDATED = 'April 29, 2026';
const CONTACT_EMAIL = 'm8mi0909@gmail.com';

export default function TermsPage() {
  return (
    <div className="space-y-8 text-foreground">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Terms of Use</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <Section title="1. Acceptance of terms">
        <p>
          By accessing or using Wyn, you agree to these Terms of Use. If you do
          not agree, please do not use the app.
        </p>
      </Section>

      <Section title="2. Description of service">
        <p>
          Wyn is a personal English vocabulary learning application with tools
          for managing vocabulary, spaced repetition review, grammar, and
          idioms.
        </p>
      </Section>

      <Section title="3. User accounts">
        <p>
          You sign in using your Google account. You are responsible for the
          security of your Google credentials and must not share your account
          with others.
        </p>
      </Section>

      <Section title="4. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for any unlawful purpose</li>
          <li>Attempt to access other users&apos; data</li>
          <li>Reverse-engineer or extract the source code</li>
          <li>Use automated tools to scrape or abuse the service</li>
        </ul>
      </Section>

      <Section title="5. Content">
        <p>
          You retain ownership of the vocabulary and notes you create. By
          storing content in Wyn, you grant us a limited licence to store and
          display that content solely to provide the service to you.
        </p>
      </Section>

      <Section title="6. Third-party services">
        <p>
          Wyn integrates with Google OAuth, Unsplash, Groq, and other
          third-party services. Your use of those services is subject to their
          respective terms and policies.
        </p>
      </Section>

      <Section title="7. Disclaimer of warranties">
        <p>
          Wyn is provided &quot;as is&quot; without warranties of any kind. We
          do not guarantee that the service will be uninterrupted or error-free.
        </p>
      </Section>

      <Section title="8. Limitation of liability">
        <p>
          To the maximum extent permitted by law, we shall not be liable for
          indirect, incidental, or consequential damages arising from your use
          of the service.
        </p>
      </Section>

      <Section title="9. Changes to these terms">
        <p>
          We may update these terms from time to time. Continued use of the app
          after changes are posted constitutes acceptance of the updated terms.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          For questions about these terms, contact us at{' '}
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
      <div className="space-y-2 text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}
