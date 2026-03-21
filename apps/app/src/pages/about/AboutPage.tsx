import { Link } from "@tanstack/react-router";
import AdSlot from "../../components/ads/AdSlot";
import AppFooter from "../../components/layout/AppFooter";
import "./AboutPage.css";

function AboutPage() {
  return (
    <main id="main-content" className="static-page about-page">
      <div className="static-page-body">
        <Link to="/" className="static-page-back-link">
          &larr; Back to home
        </Link>

        <h2 className="static-page-title">About QRni</h2>
        <p className="static-page-subtitle">Free QR codes & short links, no fuss.</p>

        <h3>What is QRni?</h3>
        <p>
          QRni is a free tool for creating QR codes and shortening URLs. No sign-up required — just
          paste a link, get a QR code or short URL, and go. If you do sign in, you unlock features
          like custom short links, click analytics, and team namespaces for organizing links with
          collaborators.
        </p>

        <h3>Why we built it</h3>
        <p>
          Most QR code tools are bloated with features nobody asked for, paywalled for basic use, or
          plastered with dark patterns. QRni is the opposite — a simple tool that does what it says,
          respects your privacy, and gets out of your way. It's earnestly, unapologetically
          straightforward.
        </p>

        <h3>Meet the maker</h3>
        <div className="about-maker-card">
          <img
            src="https://github.com/imbensantos.png"
            alt="Ben Santos"
            className="about-maker-avatar"
          />
          <div className="about-maker-info">
            <h4 className="about-maker-name">Ben Santos</h4>
            <p className="about-maker-role">Front-End Developer from Davao City, Philippines</p>
            <p className="about-maker-bio">
              A passionate web developer who builds tools that are useful, accessible, and a little
              bit corny. QRni is a labor of love — built with React, Convex, and too many late
              nights.
            </p>
            <div className="about-maker-links">
              <a href="https://imbensantos.com" target="_blank" rel="noopener noreferrer">
                Website
              </a>
              <a href="https://github.com/imbensantos" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/imbensantos"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
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

      <AppFooter className="static-page-footer" variant="privacy" />
    </main>
  );
}

export default AboutPage;
