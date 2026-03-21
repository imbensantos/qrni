import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Link } from "@tanstack/react-router";
import { api } from "../../../../../convex/_generated/api";
import AdSlot from "../../components/ads/AdSlot";
import AppFooter from "../../components/layout/AppFooter";
import "./ContactPage.css";

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
    <main id="main-content" className="static-page contact-page">
      <div className="static-page-body">
        <Link to="/" className="static-page-back-link">
          &larr; Back to home
        </Link>

        <h2 className="static-page-title">Get in Touch</h2>
        <p className="static-page-subtitle">
          Got a question, found a bug, or just want to say hi? We'd love to hear from you.
        </p>

        {status === "sent" ? (
          <div className="contact-success">
            <p>Thanks for reaching out! We'll get back to you soon.</p>
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
              Name
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
              Email
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
              Message
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
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}

        <div className="contact-direct">
          <h3>Prefer email?</h3>
          <p>
            You can also reach us directly at <a href="mailto:contact@qrni.to">contact@qrni.to</a>.
          </p>
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

      <AppFooter className="static-page-footer" variant="privacy" />
    </main>
  );
}

export default ContactPage;
