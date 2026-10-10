import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Info, Mail, Trophy, Calendar, Clock, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | StreamESPN',
  description:
    'Learn about StreamESPN, a sports information website featuring live scores, fixtures, match schedules, tournament details, and match updates.',
  alternates: {
    canonical: 'https://streamespn.org/about-us',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutUsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-4 pb-16 flex-1 w-full">
      {/* MAIN CONTENT CARD */}
      <article className="rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-6 sm:p-10 shadow-xl backdrop-blur-md space-y-8 text-[var(--text-white)]">
        {/* HEADER */}
        <header className="border-b border-[var(--border-glass)] pb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F8C831]">
            <Info className="h-4 w-4" />
            <span>Get to know us</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text-white)]">
            About StreamESPN
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed pt-1">
            Sports information, organized for fans who want to stay connected to matches, teams, and competitions.
          </p>
        </header>

        {/* CONTENT SECTIONS */}
        <div className="space-y-7 text-sm sm:text-base leading-relaxed text-[var(--text-muted)]">
          {/* WHO WE ARE */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              Who We Are
            </h2>
            <p>
              StreamESPN is a sports information website focused on helping visitors find match schedules, fixtures,
              scores, results, and relevant event details in one convenient place. We aim to make it easier to follow
              favorite teams and discover upcoming sporting events.
            </p>
          </section>

          {/* WHAT YOU'LL FIND HERE */}
          <section className="space-y-3.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              What You&apos;ll Find Here
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] space-y-1">
                <div className="flex items-center gap-2 font-bold text-[var(--text-white)] text-sm sm:text-base">
                  <Trophy className="h-4 w-4 text-[#F8C831]" />
                  <strong>Scores &amp; Results</strong>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  Match scores, outcomes, and relevant event updates where available.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] space-y-1">
                <div className="flex items-center gap-2 font-bold text-[var(--text-white)] text-sm sm:text-base">
                  <Calendar className="h-4 w-4 text-[#F8C831]" />
                  <strong>Fixtures &amp; Schedules</strong>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  Upcoming matches, dates, times, and competition calendars.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] space-y-1">
                <div className="flex items-center gap-2 font-bold text-[var(--text-white)] text-sm sm:text-base">
                  <Clock className="h-4 w-4 text-[#F8C831]" />
                  <strong>Match Information</strong>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  Event details such as teams, tournaments, venues, and kickoff times.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] space-y-1">
                <div className="flex items-center gap-2 font-bold text-[var(--text-white)] text-sm sm:text-base">
                  <Layers className="h-4 w-4 text-[#F8C831]" />
                  <strong>Sports &amp; Competitions</strong>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  Information across soccer and other sports and tournaments covered on the website.
                </p>
              </div>
            </div>
          </section>

          {/* OUR APPROACH */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              Our Approach
            </h2>
            <p>
              We aim to present sports information in a clear, accessible, and mobile-friendly format. Event details can
              change, so visitors should confirm critical information, such as kickoff times and venues, with official
              competition organizers when necessary.
            </p>
          </section>

          {/* SPORTS DATA, IMAGES & LOGOS */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              Sports Data, Images &amp; Logos
            </h2>
            <p>
              Some match information, team details, images, team logos, and tournament graphics displayed on StreamESPN
              are sourced from third-party sports data APIs and external providers. We do not claim ownership of
              third-party trademarks, logos, or other protected content. These materials remain the property of their
              respective owners and are subject to applicable provider terms and rights.
            </p>
            <p>
              If you are a rights holder and have a concern about material appearing on our website, please{' '}
              <Link href="/contact-us" className="text-[#F8C831] underline hover:text-yellow-400 font-semibold">
                contact us
              </Link>{' '}
              so we can review it.
            </p>
          </section>

          {/* ADVERTISING, AFFILIATE & REFERRAL LINKS */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              Advertising, Affiliate &amp; Referral Links
            </h2>
            <p>
              To support the website, StreamESPN may feature third-party advertisements, affiliate links, and referral
              links. We may earn a commission when visitors complete qualifying actions through certain links, without
              necessarily increasing the price they pay.
            </p>
            <p>
              External websites are independently operated. Any purchases, subscriptions, payment terms, cancellations,
              and refunds are governed by the respective provider&apos;s policies. We encourage visitors to read those
              terms before completing a transaction.
            </p>
          </section>

          {/* INDEPENDENT WEBSITE */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              Independent Website
            </h2>
            <p>
              StreamESPN is an independent sports information website. References to teams, leagues, competitions,
              organizations, and trademarks do not imply official affiliation, sponsorship, or endorsement unless
              explicitly stated.
            </p>
          </section>

          {/* OUR COMMITMENT TO VISITORS */}
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-white)]">
              Our Commitment to Visitors
            </h2>
            <p>
              Our goal is to keep sports information understandable and easy to navigate. We welcome feedback about
              incorrect event details, broken links, and content concerns so we can review them and improve the
              experience.
            </p>
          </section>
        </div>

        {/* CONTACT BOX */}
        <div className="rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] p-6 space-y-3">
          <h2 className="text-lg font-bold text-[var(--text-white)] flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#F8C831]" />
            <span>Contact Us</span>
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Have a question, suggestion, correction, or content-related concern? Reach us through our official contact page.
          </p>
          <div>
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F8C831] hover:bg-yellow-400 text-black font-extrabold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Visit Contact Us</span>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
