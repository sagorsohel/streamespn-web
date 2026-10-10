import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, ShieldCheck, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DMCA & Copyright Policy | StreamESPN',
  description:
    'How to report copyright concerns relating to StreamESPN sports data, images, team logos, and third-party content.',
  alternates: {
    canonical: 'https://streamespn.org/dmca',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DmcaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-4 pb-16 flex-1 w-full">
      {/* BREADCRUMB */}
    

      {/* MAIN CONTENT CARD */}
      <article className="rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-6 sm:p-10 shadow-xl backdrop-blur-md space-y-8 text-[var(--text-white)]">
        {/* HEADER */}
        <header className="border-b border-[var(--border-glass)] pb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F8C831]">
            <ShieldCheck className="h-4 w-4" />
            <span>Copyright &amp; content rights</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text-white)]">
            DMCA &amp; Copyright Policy
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed pt-1">
            Information for copyright owners and representatives who wish to report potentially infringing material
            displayed on StreamESPN.
          </p>
          <p className="text-xs text-[var(--text-dim)] pt-2 font-medium">
            <strong>Last Updated:</strong> October 11, 2026
          </p>
        </header>

        {/* POLICY SECTIONS */}
        <div className="space-y-7 text-sm sm:text-base leading-relaxed text-[var(--text-muted)]">
          {/* SECTION 1 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              1. Copyright and Intellectual Property
            </h2>
            <p>
              StreamESPN is an independent sports information website featuring fixtures, scores, schedules, team
              information, and match details. Some sports data, team logos, tournament emblems, and images may be
              supplied through third-party APIs or external providers. Ownership of third-party trademarks and
              copyrighted materials remains with the respective rights holders.
            </p>
            <p>
              Access to an image or other asset through an API does not, by itself, establish permission for every use. We
              aim to respect applicable intellectual property rights and review credible reports of unauthorized content.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              2. Reporting Copyright Concerns
            </h2>
            <p>
              If you are a copyright owner or an authorized representative and believe that specific material on StreamESPN
              infringes your rights, please submit a written complaint through our{' '}
              <a
                href="https://streamespn.org/contact-us"
                className="text-[#F8C831] underline hover:text-yellow-400 font-semibold"
              >
                Contact Us page
              </a>
              . Include enough detail for us to identify and investigate the material.
            </p>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              3. What to Include in a Copyright Notice
            </h2>
            <ol className="list-decimal list-inside space-y-2 pl-1">
              <li>Your physical or electronic signature as the copyright owner or authorized agent.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>
                The exact URL(s) of the allegedly infringing material on StreamESPN, with a description that helps
                locate it.
              </li>
              <li>Your name and appropriate contact details, including an email address.</li>
              <li>
                A statement that you have a good-faith belief that the disputed use is not authorized by the rights owner,
                its agent, or the law.
              </li>
              <li>
                A statement that the information in your notice is accurate and, under penalty of perjury, that you are
                authorized to act on behalf of the copyright owner.
              </li>
            </ol>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              4. Review and Response
            </h2>
            <p>
              We review sufficiently detailed reports and may remove content, disable access to material or links,
              contact relevant providers, or seek clarification where appropriate. We may preserve information relating
              to a complaint as reasonably necessary to address it or meet legal obligations.
            </p>
            <p>
              Submitting a report does not guarantee removal. A complaint must identify a legitimate rights concern, and
              applicable exceptions or permissions may be relevant.
            </p>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              5. Third-Party APIs, Images, and Logos
            </h2>
            <p>
              Some sports images, logos, and statistics are furnished by third-party providers. If a rights concern
              involves an asset supplied by an external API, please provide the specific page URL and asset details. We
              can review the displayed material and, where appropriate, contact the supplier or disable its display.
            </p>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              6. External Websites and Links
            </h2>
            <p>
              Some pages contain third-party advertising, affiliate, and referral links. External sites are
              independently operated; StreamESPN cannot remove content hosted on sites it does not control. We may,
              however, review and remove links displayed on StreamESPN when warranted.
            </p>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              7. Counter-Notifications and Disputes
            </h2>
            <p>
              If content is removed following a copyright complaint and you believe the removal occurred due to mistake
              or misidentification, contact us with the relevant URL, a description of the removed content, your
              explanation, and suitable contact information. Where formal counter-notification procedures apply,
              additional legally required statements and details may be needed.
            </p>
          </section>

          {/* SECTION 8 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              8. False or Misleading Reports
            </h2>
            <p>
              Please submit complaints only when you have a reasonable basis to assert the rights involved. Knowingly
              material misrepresentations in copyright notices or counter-notices may have legal consequences.
            </p>
          </section>

          {/* SECTION 9 */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              9. Notice Contact
            </h2>
            <p>
              Copyright questions and reports can be initiated through{' '}
              <a
                href="https://streamespn.org/contact-us"
                className="text-[#F8C831] underline hover:text-yellow-400 font-semibold"
              >
                https://streamespn.org/contact-us
              </a>
              .
            </p>
            <p className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-glass)] text-xs text-[var(--text-muted)]">
              <strong className="text-[var(--text-white)]">Important:</strong> This page provides a reporting channel but
              does not itself represent that StreamESPN has registered a designated DMCA agent with the U.S. Copyright
              Office. If a formal designated-agent process is applicable, the relevant agent details and registration must
              be separately completed.
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
            <a
              href="https://streamespn.org/contact-us"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F8C831] hover:bg-yellow-400 text-black font-extrabold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Contact Us</span>
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
