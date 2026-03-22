import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Link } from "@tanstack/react-router";
import { api } from "../../../../../convex/_generated/api";
import AdSlot from "../../components/ads/AdSlot";
import AppFooter from "../../components/layout/AppFooter";
import "./ContactPage.css";

const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || "contact@example.com";

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submitContact = useMutation(api.contact.submitContactForm);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      await submitContact({ name, email, message });
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <main id="main-content" className="contact-page static-page">
      <div className="contact-page__inner">
        <Link to="/" className="contact-page__back-link">
          &larr; Back to home
        </Link>

        {/* Hero */}
        <section className="contact-hero">
          <h1 className="contact-hero__title">Get in Touch</h1>
          <p className="contact-hero__subtitle">
            Got a question, found a bug, or just want to say hi? We'd love to hear from you.
          </p>
          <div className="contact-hero__doodle-bar" aria-hidden="true">
            <span className="contact-hero__doodle-tilde">~</span>
            <span className="contact-hero__doodle-line" />
            <span className="contact-hero__doodle-tilde">~</span>
          </div>
        </section>

        {/* Content row */}
        <div className="contact-content">
          {/* Form card */}
          <div className="contact-form-card">
            <h2 className="contact-form-card__title">Send us a message</h2>

            {status === "sent" ? (
              <div className="contact-success">
                <div className="contact-success__icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                </div>
                <h3 className="contact-success__heading">Message sent!</h3>
                <p className="contact-success__text">
                  Thanks for reaching out! We'll get back to you soon.
                </p>
                <button
                  type="button"
                  className="contact-send-another"
                  onClick={() => setStatus("idle")}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <label className="contact-label">
                  <span className="contact-label__text">Name</span>
                  <input
                    type="text"
                    className="contact-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={200}
                    placeholder="Your name"
                  />
                </label>

                <label className="contact-label">
                  <span className="contact-label__text">Email</span>
                  <input
                    type="email"
                    className="contact-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </label>

                <label className="contact-label">
                  <span className="contact-label__text">Message</span>
                  <textarea
                    className="contact-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={5000}
                    rows={6}
                    placeholder="What's on your mind?"
                  />
                </label>

                {status === "error" && <p className="contact-error">{errorMsg}</p>}

                <button type="submit" className="contact-submit" disabled={status === "sending"}>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  {status === "sending" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <aside className="contact-sidebar">
            <div className="contact-sidebar__email-card">
              <div className="contact-sidebar__icon-badge" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              </div>
              <h2 className="contact-sidebar__email-title">Prefer email?</h2>
              <p className="contact-sidebar__email-text">
                You can also reach us directly at{" "}
                <a href={`mailto:${contactEmail}`} className="contact-sidebar__email-link">
                  {contactEmail}
                </a>
                .
              </p>
            </div>

            <div className="contact-sidebar__note-card">
              <div className="contact-sidebar__note-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /></svg>
              </div>
              <h2 className="contact-sidebar__note-title">We actually read these!</h2>
              <p className="contact-sidebar__note-text">
                Every message lands in our inbox. Bug reports, feature ideas, or just a friendly
                hello — we appreciate them all.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <AdSlot
        slot="CONTACT_PILLAR_LEFT_SLOT_ID"
        format="vertical"
        responsive={false}
        className="ad-slot--pillar ad-slot--pillar-left"
      />
      <AdSlot
        slot="CONTACT_PILLAR_RIGHT_SLOT_ID"
        format="vertical"
        responsive={false}
        className="ad-slot--pillar ad-slot--pillar-right"
      />
      <AdSlot
        slot="CONTACT_SLOT_ID"
        format="horizontal"
        className="ad-slot--static-page"
        style={{ maxWidth: 728, margin: "24px auto" }}
      />

      <AppFooter className="static-page-footer" />
    </main>
  );
}

export default ContactPage;
