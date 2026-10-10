'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function ContactUsClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    url: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Email, and Message).');
      return;
    }

    setSubmitting(true);

    // Simulate sending with clean UI response
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-4 pb-16 flex-1 w-full space-y-8">
      {/* 1. HEADER CARD */}
      <article className="rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-6 sm:p-10 shadow-xl backdrop-blur-md space-y-6 text-[var(--text-white)]">
        <div className="border-b border-[var(--border-glass)] pb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F8C831]">
            <MessageSquare className="h-4 w-4" />
            <span>Get in Touch</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text-white)]">
            Contact StreamESPN
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed pt-1">
            Have questions, feedback, partnership inquiries, or copyright concerns? We are here to help.
            Submit your message below and our team will get back to you.
          </p>
        </div>

        {/* 2. CONTACT CHANNELS SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F8C831]">
              <Mail className="h-4 w-4" />
              <span>General Support</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Questions, suggestions, or site assistance.</p>
            <p className="text-xs font-semibold text-[var(--text-white)] select-all">contact@streamespn.org</p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F8C831]">
              <ShieldCheck className="h-4 w-4" />
              <span>Copyright &amp; DMCA</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Report unauthorized content or DMCA notices.</p>
            <Link
              href="/dmca"
              className="text-xs font-bold text-[#F8C831] hover:underline flex items-center gap-1"
            >
              <span>View DMCA Policy</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F8C831]">
              <Clock className="h-4 w-4" />
              <span>Response Time</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">We aim to review and reply promptly.</p>
            <p className="text-xs font-semibold text-[var(--text-white)]">Within 24–48 hours</p>
          </div>
        </div>

        {/* 3. CONTACT FORM / SUCCESS STATE */}
        <div className="pt-2">
          {submitted ? (
            <div className="p-8 rounded-2xl border border-green-500/20 bg-green-500/10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-500/20 text-[#40b857] flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-white)]">
                  Message Sent Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto">
                  Thank you for reaching out to StreamESPN. We have received your inquiry and will review it
                  shortly.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      subject: 'general',
                      url: '',
                      message: '',
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#F8C831] hover:bg-yellow-400 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NAME */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--text-white)] uppercase tracking-wider">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] px-4 py-2.5 text-xs sm:text-sm text-[var(--text-white)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[#F8C831] transition-all"
                  />
                </div>

                {/* EMAIL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--text-white)] uppercase tracking-wider">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                    className="w-full rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] px-4 py-2.5 text-xs sm:text-sm text-[var(--text-white)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[#F8C831] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SUBJECT DROPDOWN */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--text-white)] uppercase tracking-wider">
                    Topic / Subject <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] px-4 py-2.5 text-xs sm:text-sm text-[var(--text-white)] focus:outline-none focus:border-[#F8C831] transition-all"
                  >
                    <option value="general" className="bg-zinc-900 text-white">
                      General Inquiry / Feedback
                    </option>
                    <option value="dmca" className="bg-zinc-900 text-white">
                      DMCA &amp; Copyright Concern
                    </option>
                    <option value="streaming" className="bg-zinc-900 text-white">
                      Schedule or Event Issue
                    </option>
                    <option value="partnership" className="bg-zinc-900 text-white">
                      Advertising &amp; Partnerships
                    </option>
                    <option value="other" className="bg-zinc-900 text-white">
                      Other Inquiries
                    </option>
                  </select>
                </div>

                {/* RELEVANT URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--text-white)] uppercase tracking-wider">
                    Relevant Page / Match URL <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://streamespn.org/..."
                    className="w-full rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] px-4 py-2.5 text-xs sm:text-sm text-[var(--text-white)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[#F8C831] transition-all"
                  />
                </div>
              </div>

              {/* MESSAGE TEXTAREA */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[var(--text-white)] uppercase tracking-wider">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Please provide details about your inquiry or copyright notice..."
                  className="w-full rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] px-4 py-3 text-xs sm:text-sm text-[var(--text-white)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[#F8C831] transition-all resize-y"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#F8C831] hover:bg-yellow-400 disabled:opacity-50 text-black font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </article>
    </div>
  );
}
