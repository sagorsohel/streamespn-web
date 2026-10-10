import React from 'react';
import type { Metadata } from 'next';
import ContactUsClient from './ContactUsClient';

export const metadata: Metadata = {
  title: 'Contact Us | StreamESPN',
  description:
    'Get in touch with the StreamESPN team for general inquiries, feedback, DMCA copyright notices, and advertising partnerships.',
  alternates: {
    canonical: 'https://streamespn.org/contact-us',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactUsPage() {
  return <ContactUsClient />;
}
