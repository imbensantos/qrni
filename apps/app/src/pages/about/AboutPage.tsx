import { Link } from "@tanstack/react-router";
import AdSlot from "../../components/ads/AdSlot";
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
              <span role="img" aria-label="QR code">
                &#128279;
              </span>
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
              <span role="img" aria-label="Heart">
                &#10084;&#65039;
              </span>
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
              <p className="about-maker__quote">"a little bit corny"</p>
            </div>
            <div className="about-maker__card-right">
              <h3 className="about-maker__name">Ben Santos</h3>
              <p className="about-maker__role">
                <span className="about-maker__role-dot" aria-hidden="true" />
                Front-End Developer from Davao City, Philippines
              </p>
              <p className="about-maker__bio">
                A passionate web developer who builds tools that are useful, accessible, and a
                little bit corny. QRni is a labor of love — built with React, Convex, and too many
                late nights.
              </p>
              <div className="about-maker__links">
                <a
                  href="https://imbensantos.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-maker__link-chip"
                >
                  <span aria-hidden="true">&#127760;</span> Website
                </a>
                <a
                  href="https://github.com/imbensantos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-maker__link-chip"
                >
                  <span aria-hidden="true">&#128728;</span> GitHub
                </a>
                <a
                  href="https://linkedin.com/in/imbensantos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-maker__link-chip"
                >
                  <span aria-hidden="true">&#128101;</span> LinkedIn
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AdSlot
        slot="ABOUT_PILLAR_LEFT_SLOT_ID"
        format="vertical"
        responsive={false}
        className="ad-slot--pillar ad-slot--pillar-left"
      />
      <AdSlot
        slot="ABOUT_PILLAR_RIGHT_SLOT_ID"
        format="vertical"
        responsive={false}
        className="ad-slot--pillar ad-slot--pillar-right"
      />
      <AdSlot
        slot="ABOUT_SLOT_ID"
        format="horizontal"
        className="ad-slot--static-page"
        style={{ maxWidth: 728, margin: "24px auto" }}
      />

      <AppFooter className="static-page-footer" />
    </main>
  );
}

export default AboutPage;
