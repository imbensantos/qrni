import { Link } from "@tanstack/react-router";
import AppFooter from "../../components/layout/AppFooter";
import "./AboutPage.css";

function AboutPage() {
  return (
    <main id="main-content" className="about-page static-page">
      <div className="about-page__inner">
        <Link to="/" className="about-page__back-link">
          &larr; Back to home
        </Link>

        {/* Hero */}
        <section className="about-hero">
          <h1 className="about-hero__title">About QRni</h1>
          <p className="about-hero__subtitle">Free QR codes &amp; short links, no fuss.</p>
          <div className="about-hero__doodle-bar" aria-hidden="true">
            <span className="about-hero__doodle-tilde">~</span>
            <span className="about-hero__doodle-line" />
            <span className="about-hero__doodle-tilde">~</span>
          </div>
        </section>

        {/* Content cards */}
        <section className="about-cards">
          <div className="about-card">
            <div className="about-card__icon about-card__icon--sage">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" rx="0.5" /><path d="M22 14h-2v4h-4v4h4a2 2 0 0 0 2-2z" /></svg>
            </div>
            <h2 className="about-card__title">What is QRni?</h2>
            <p className="about-card__body">
              QRni is a free tool for creating QR codes and shortening URLs. No sign-up required —
              just paste a link, get a QR code or short URL, and go. If you do sign in, you unlock
              features like custom short links, click analytics, and team namespaces for organizing
              links with collaborators.
            </p>
          </div>

          <div className="about-card">
            <div className="about-card__icon about-card__icon--terracotta">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
            </div>
            <h2 className="about-card__title">Why we built it</h2>
            <p className="about-card__body">
              Most QR code tools are bloated with features nobody asked for, paywalled for basic
              use, or plastered with dark patterns. QRni is the opposite — a simple tool that does
              what it says, respects your privacy, and gets out of your way. It's earnestly,
              unapologetically straightforward.
            </p>
          </div>
        </section>

        {/* Meet the maker */}
        <section className="about-maker">
          <h2 className="about-maker__heading">Meet the maker</h2>
          <div className="about-maker__card">
            <div className="about-maker__card-left">
              <img
                src="https://github.com/imbensantos.png"
                alt="Ben Santos"
                className="about-maker__avatar"
              />
              <p className="about-maker__quote">
                "QRni as in 'corny', <br />
                as in 'this is a QR'."
              </p>
            </div>
            <div className="about-maker__card-right">
              <h3 className="about-maker__name">Ben Santos</h3>
              <p className="about-maker__role">
                <span className="about-maker__role-dot" aria-hidden="true" />
                Front-End Developer from Davao City, Philippines
              </p>
              <p className="about-maker__bio">
                A passionate web developer who builds tools that are useful, accessible, and a
                little bit playful. QRni is a labor of love — built with React, Convex, and too many
                late nights.
              </p>
              <div className="about-maker__links">
                <a
                  href="https://imbensantos.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-maker__link-chip"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg> Website
                </a>
                <a
                  href="https://github.com/imbensantos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-maker__link-chip"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> GitHub
                </a>
                <a
                  href="https://linkedin.com/in/imbensantos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-maker__link-chip"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg> LinkedIn
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AppFooter className="static-page-footer" />
    </main>
  );
}

export default AboutPage;
