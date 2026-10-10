import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms and Conditions | StreamESPN',
  description:
    'Read the StreamESPN website terms covering sports information, third-party APIs, advertising, affiliate links, refunds, and external services.',
  alternates: {
    canonical: 'https://streamespn.org/terms-and-conditions',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsAndConditionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-4 pb-16 flex-1 w-full">
      {/* MAIN CONTENT CARD */}
      <article className="rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-6 sm:p-10 shadow-xl backdrop-blur-md space-y-8 text-[var(--text-white)]">
        {/* HEADER */}
        <header className="border-b border-[var(--border-glass)] pb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F8C831]">
            <FileText className="h-4 w-4" />
            <span>Website terms</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text-white)]">
            Terms and Conditions
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed pt-1">
            The rules and important disclosures governing use of StreamESPN sports information and external links.
          </p>
          <p className="text-xs text-[var(--text-dim)] pt-2 font-medium">
            <strong>Last Updated:</strong> October 11, 2026
          </p>
        </header>

        {/* TERMS SECTIONS */}
        <div className="space-y-7 text-sm sm:text-base leading-relaxed text-[var(--text-muted)]">
          {/* SECTION 1 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              1. Acceptance of These Terms
            </h2>
            <p>
              By accessing or using StreamESPN (https://streamespn.org/), you agree to these Terms and Conditions. If you do
              not agree, please discontinue use of the website. These Terms apply to the content and services made available
              by StreamESPN itself, not to independent third-party websites.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              2. Sports Information Service
            </h2>
            <p>
              StreamESPN provides sports-related information such as match schedules, fixtures, scores, results, team
              information, tournament information, venues, and event updates. Information is provided for general
              informational purposes. Match times, lineups, scores, and venues may change or contain errors; verify
              time-sensitive details with official organizers.
            </p>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              3. No Official Affiliation
            </h2>
            <p>
              StreamESPN operates as an independent sports information website. Mention of a league, competition, team,
              broadcaster, or organization does not imply affiliation, endorsement, sponsorship, or licensing unless
              expressly stated.
            </p>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              4. Third-Party Sports Data, Images, and Logos
            </h2>
            <p>
              Some data, logos, images, and other assets are obtained from third-party sports APIs and content providers.
              Their use is subject to the relevant provider terms and rights. Team names, trademarks, graphics, and logos
              remain the property of their respective owners. You may not assume that materials on this site are available
              for unrestricted reuse.
            </p>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              5. Advertising, Affiliate and Referral Links
            </h2>
            <p>
              StreamESPN may feature third-party advertisements, affiliate links, or referral links. We may receive
              compensation when visitors click a link or complete a qualifying transaction. Advertising or a link does
              not necessarily mean StreamESPN endorses the advertised product or service.
            </p>
            <p>
              External destinations may have separate privacy policies, service terms, pricing, eligibility rules, and
              availability. You are responsible for reviewing those terms before using their services.
            </p>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              6. Payments, Subscriptions, Refunds and Cancellations
            </h2>
            <p>
              Unless explicitly stated otherwise, payments for products or services promoted through third-party affiliate
              or referral links are handled by the external merchant or provider, not StreamESPN. Refunds, returns,
              cancellations, recurring payments, billing disputes, and customer support for these transactions are
              governed by that provider&apos;s policies.
            </p>
            <p>
              Please check the external provider&apos;s refund and cancellation rules before purchase. Direct payment or
              refund requests to the merchant responsible for the transaction.
            </p>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              7. Permitted Use
            </h2>
            <p>You may use StreamESPN for lawful personal informational purposes. You agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Interfere with site availability, performance, or security.</li>
              <li>Attempt unauthorized access to the website or its systems.</li>
              <li>Use the website for fraud, deception, or unlawful activity.</li>
              <li>Copy or commercially redistribute protected material without the required rights or permissions.</li>
              <li>Misrepresent your relationship with StreamESPN or any referenced sports organization.</li>
            </ul>
          </section>

          {/* SECTION 8 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              8. Accuracy and Availability
            </h2>
            <p>
              We aim to keep information useful and current but do not warrant that all fixtures, scores, statistics,
              images, links, or event details will be continuously accurate, complete, or available. We may change,
              update, or remove content and features at any time.
            </p>
          </section>

          {/* SECTION 9 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              9. External Links and Third-Party Services
            </h2>
            <p>
              Third-party websites and services are operated independently and may become unavailable or change their
              terms. StreamESPN does not control their content, data handling, payment processes, refund outcomes, or
              service performance. Nothing in these Terms excludes responsibilities that cannot lawfully be excluded.
            </p>
          </section>

          {/* SECTION 10 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              10. Intellectual Property and Copyright Requests
            </h2>
            <p>
              Our original website presentation and independently created content may be protected by applicable
              intellectual property law. Third-party content belongs to its rights holders. If you believe content on
              StreamESPN infringes your rights, consult our{' '}
              <Link href="/dmca" className="text-[#F8C831] underline hover:text-yellow-400 font-semibold">
                DMCA / Copyright Policy
              </Link>{' '}
              and{' '}
              <Link href="/contact-us" className="text-[#F8C831] underline hover:text-yellow-400 font-semibold">
                contact us
              </Link>
              .
            </p>
          </section>

          {/* SECTION 11 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              11. Privacy
            </h2>
            <p>
              For information about personal data, hosting technologies, advertising, cookies, and external services,
              read our{' '}
              <Link href="/privacy-policy" className="text-[#F8C831] underline hover:text-yellow-400 font-semibold">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          {/* SECTION 12 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              12. Disclaimers and Liability
            </h2>
            <p>
              To the extent permitted by applicable law, the website and its informational content are provided on an
              &ldquo;as available&rdquo; and &ldquo;as is&rdquo; basis. We do not promise uninterrupted access or
              error-free data. To the extent permitted by law, StreamESPN is not liable for losses arising solely from
              reliance on inaccurate event information or from independent third-party services. Your mandatory legal
              rights are not affected by this provision.
            </p>
          </section>

          {/* SECTION 13 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              13. Changes to These Terms
            </h2>
            <p>
              We may update these Terms when the website, its operations, partnerships, or applicable requirements
              change. Updates will be posted on this page with a revised date. Continued use after publication of new
              terms may be treated as acceptance where permitted by applicable law.
            </p>
          </section>

          {/* SECTION 14 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              14. Contact
            </h2>
            <p>
              Questions about these Terms may be submitted at{' '}
              <Link href="/contact-us" className="text-[#F8C831] underline hover:text-yellow-400 font-semibold">
                https://streamespn.org/contact-us
              </Link>
              .
            </p>
          </section>
        </div>

        {/* CONTACT BOX */}
        <div className="rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] p-6 space-y-3">
          <h2 className="text-lg font-bold text-[var(--text-white)] flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#F8C831]" />
            <span>Contact StreamESPN</span>
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            For questions or concerns about this page, please use our official contact page.
          </p>
          <div>
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F8C831] hover:bg-yellow-400 text-black font-extrabold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Contact Us</span>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
