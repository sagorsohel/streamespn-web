import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | StreamESPN',
  description:
    'Read the StreamESPN Privacy Policy for information about visitor privacy, third-party advertising, affiliate links, referral services, and sports data APIs.',
  alternates: {
    canonical: 'https://streamespn.org/privacy-policy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-4 pb-16 flex-1 w-full">
      {/* MAIN CONTENT CARD */}
      <article className="rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-6 sm:p-10 shadow-xl backdrop-blur-md space-y-8 text-[var(--text-white)]">
        {/* HEADER */}
        <header className="border-b border-[var(--border-glass)] pb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F8C831]">
            <Lock className="h-4 w-4" />
            <span>Privacy &amp; Data Protection</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text-white)]">
            Privacy Policy
          </h1>
          <div className="text-xs sm:text-sm text-[var(--text-dim)] pt-1 space-y-1">
            <p>
              <strong>Website:</strong> StreamESPN &nbsp;|&nbsp; <strong>Website URL:</strong>{' '}
              <a href="https://streamespn.org/" className="text-[#F8C831] hover:underline">
                https://streamespn.org/
              </a>
            </p>
            <p>
              <strong>Last Updated:</strong> October 11, 2026
            </p>
          </div>
        </header>

        {/* POLICY SECTIONS */}
        <div className="space-y-7 text-sm sm:text-base leading-relaxed text-[var(--text-muted)]">
          {/* SECTION 1 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              1. Introduction
            </h2>
            <p>Welcome to StreamESPN (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).</p>
            <p>
              At StreamESPN, we value visitor privacy and aim to provide a transparent, accessible, and informative sports
              experience.
            </p>
            <p>
              Our website provides live sports scores, fixtures, match schedules, tournament information, team details,
              results, and related sports updates.
            </p>
            <p>
              This Privacy Policy explains our practices regarding personal information, third-party advertisements,
              affiliate links, referral services, and content obtained through external APIs.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              2. Personal Information
            </h2>
            <p>
              StreamESPN does not require visitors to create accounts or provide personal information to access publicly
              available sports content.
            </p>
            <p>We do not intentionally collect personal information through registration or personal-data submission forms.</p>
            <p>
              Our website is designed to make general sports information accessible without requiring visitors to disclose
              their names, phone numbers, addresses, or payment details.
            </p>
            <p>
              However, technical information such as IP addresses and browser information may be processed by our hosting
              infrastructure or third-party services. Information voluntarily submitted through our contact channels may
              also be received and used to respond to inquiries.
            </p>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              3. Third-Party Advertisements
            </h2>
            <p>StreamESPN may display advertisements provided by independent third-party advertising partners.</p>
            <p>
              These providers may use cookies, online identifiers, and similar technologies to deliver advertisements,
              measure performance, or provide related services.
            </p>
            <p>Each advertising provider operates according to its own privacy policies and data-processing practices.</p>
            <p>StreamESPN does not directly manage the independent data collection practices of these providers.</p>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              4. Affiliate Links and Partnerships
            </h2>
            <p>Our website may contain affiliate links to third-party products, services, subscriptions, or platforms.</p>
            <p>
              We may earn commissions when visitors make qualifying purchases or complete certain actions through these
              links.
            </p>
            <p>Affiliate transactions are managed by the respective third-party merchants or service providers.</p>
            <p>Visitors are encouraged to review the applicable terms and conditions before completing any transaction.</p>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              5. Affiliate Refund and Cancellation Policies
            </h2>
            <p>
              Purchases, subscriptions, payments, refunds, and cancellations made through third-party affiliate links are
              governed by the policies of the respective merchants.
            </p>
            <p>
              Affiliate partners may have their own refund eligibility requirements, cancellation procedures, payment
              conditions, and customer support processes.
            </p>
            <p>
              Unless expressly stated otherwise, StreamESPN does not directly process payments or issue refunds for
              transactions completed on independent third-party websites.
            </p>
            <p>For transaction-related concerns, visitors should contact the responsible merchant or service provider.</p>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              6. Third-Party Referral Links
            </h2>
            <p>
              StreamESPN may include external referral links to sports resources, advertising partners, service
              providers, or other websites.
            </p>
            <p>Following these links may redirect visitors to websites operated independently of StreamESPN.</p>
            <p>These destinations may have different privacy policies, cookies, payment practices, and terms of service.</p>
            <p>We encourage visitors to review the applicable policies before interacting with external services.</p>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              7. Sports Data, Images, and Third-Party APIs
            </h2>
            <p>
              StreamESPN uses third-party APIs and external data services to obtain certain sports-related information and
              visual assets.
            </p>
            <p>Depending on availability and provider permissions, such content may include:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Team names, logos, and emblems</li>
              <li>League and tournament logos</li>
              <li>Sports-related images and graphics</li>
              <li>Match schedules and fixtures</li>
              <li>Live scores and match results</li>
              <li>Team information, standings, and statistics</li>
              <li>Stadium and venue details</li>
              <li>Other sports-related data</li>
            </ul>
            <p>Such content is provided by independent API suppliers or data providers.</p>
            <p>
              Team names, logos, trademarks, and other protected materials remain the property of their respective owners
              or authorized rights holders.
            </p>
            <p>
              Access to content through an API does not necessarily transfer intellectual property rights or grant
              unrestricted permission for commercial use.
            </p>
            <p>
              StreamESPN intends to use third-party content in accordance with applicable provider terms, licenses, and
              intellectual property requirements.
            </p>
            <p>
              If you are a rights holder and believe content displayed on our website infringes your rights, please contact
              us through our official{' '}
              <Link href="/contact-us" className="text-[#F8C831] underline hover:text-yellow-400 font-semibold">
                Contact Us
              </Link>{' '}
              page.
            </p>
            <p>We will review properly submitted reports and take appropriate action where necessary.</p>
          </section>

          {/* SECTION 8 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              8. Cookies and Similar Technologies
            </h2>
            <p>
              StreamESPN does not require visitors to submit personal information to browse publicly available sports
              information.
            </p>
            <p>
              However, our hosting services, third-party advertisers, affiliate networks, and external service providers
              may use cookies or similar technologies.
            </p>
            <p>
              These technologies may support website security, advertising, referral tracking, performance measurement,
              and related operational purposes.
            </p>
            <p>Visitors can manage cookies through their browser settings and available privacy controls.</p>
          </section>

          {/* SECTION 9 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              9. Third-Party Content and External Services
            </h2>
            <p>
              StreamESPN may display or link to information obtained from external sports data providers, advertisers,
              affiliates, and independent websites.
            </p>
            <p>While we aim to present useful and accurate information, external content and data may change without notice.</p>
            <p>Third-party providers are responsible for their own services, policies, and data-processing activities.</p>
            <p>
              StreamESPN is not responsible for the independent privacy practices or commercial transactions of external
              websites.
            </p>
          </section>

          {/* SECTION 10 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              10. Data Security
            </h2>
            <p>We aim to maintain reasonable safeguards for the operation and security of our website.</p>
            <p>
              Although visitors are not required to submit personal information to browse general sports content, certain
              technical data may be processed for hosting, security, and operational purposes.
            </p>
            <p>No internet-based system can guarantee complete security.</p>
          </section>

          {/* SECTION 11 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              11. Children&apos;s Privacy
            </h2>
            <p>
              StreamESPN provides general sports-related information and does not intentionally solicit personal information
              from children.
            </p>
            <p>
              We encourage parents and guardians to supervise children&apos;s interactions with third-party advertisements,
              affiliate links, and external services.
            </p>
          </section>

          {/* SECTION 12 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              12. Updates to This Privacy Policy
            </h2>
            <p>
              We may revise this Privacy Policy periodically to reflect changes in our website, third-party services, API
              integrations, advertising partnerships, or legal requirements.
            </p>
            <p>Updated versions will be published on this page with a revised Last Updated date.</p>
          </section>

          {/* SECTION 13 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              13. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, third-party content, intellectual property concerns, or
              privacy-related matters, please contact us through our official website.
            </p>
            <p>
              <strong>Website:</strong>{' '}
              <a href="https://streamespn.org/" className="text-[#F8C831] hover:underline">
                https://streamespn.org/
              </a>
              <br />
              <strong>Contact Us:</strong>{' '}
              <Link href="/contact-us" className="text-[#F8C831] underline hover:text-yellow-400 font-semibold">
                https://streamespn.org/contact-us
              </Link>
            </p>
            <p>We will review relevant inquiries and respond where appropriate.</p>
          </section>
        </div>

        {/* CONTACT BOX */}
        <div className="rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] p-6 space-y-3">
          <h2 className="text-lg font-bold text-[var(--text-white)] flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#F8C831]" />
            <span>Contact StreamESPN</span>
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            For questions or concerns about this privacy policy, please use our official contact page.
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
