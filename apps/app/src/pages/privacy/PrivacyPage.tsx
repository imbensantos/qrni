import { Link } from "@tanstack/react-router";
import AdSlot from "../../components/ads/AdSlot";
import AppFooter from "../../components/layout/AppFooter";
import "./PrivacyPage.css";

const SECTIONS = [
  { id: "section-1", label: "Information We Collect" },
  { id: "section-2", label: "How We Use Your Information" },
  { id: "section-3", label: "Third-Party Services" },
  { id: "section-4", label: "Cookies & Local Storage" },
  { id: "section-5", label: "Data Retention" },
  { id: "section-6", label: "Your Rights & Choices" },
  { id: "section-7", label: "Data Security" },
  { id: "section-8", label: "Children's Privacy" },
  { id: "section-9", label: "Changes to This Policy" },
  { id: "section-10", label: "Contact Us" },
];

const TOC_ICON = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3D8A5A"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

function SectionHeading({ number, title }: { number: number; title: string }) {
  const isEven = number % 2 === 0;
  return (
    <div className="privacy-section__heading">
      <span
        className={`privacy-section__badge ${isEven ? "privacy-section__badge--sage" : "privacy-section__badge--terracotta"}`}
        aria-hidden="true"
      >
        {number}
      </span>
      <h2 className="privacy-section__title">{title}</h2>
    </div>
  );
}

function PrivacyPage() {
  return (
    <main id="main-content" className="privacy-page static-page">
      <div className="privacy-page__inner">
        <Link to="/" className="privacy-page__back-link">
          &larr; Back to home
        </Link>

        {/* Hero */}
        <section className="privacy-hero">
          <h1 className="privacy-hero__title">Privacy Policy</h1>
          <p className="privacy-hero__subtitle">Effective date: March 22, 2026</p>
          <div className="privacy-hero__doodle-bar" aria-hidden="true">
            <span className="privacy-hero__doodle-tilde">~</span>
            <span className="privacy-hero__doodle-line" />
            <span className="privacy-hero__doodle-tilde">~</span>
          </div>
        </section>

        {/* Quick Navigation TOC */}
        <nav className="privacy-toc" aria-label="Privacy policy sections">
          <div className="privacy-toc__header">
            <div className="privacy-toc__icon-badge" aria-hidden="true">
              {TOC_ICON}
            </div>
            <h2 className="privacy-toc__title">Quick Navigation</h2>
          </div>
          <ul className="privacy-toc__list">
            {SECTIONS.map((section, index) => (
              <li key={section.id} className="privacy-toc__item">
                <a href={`#${section.id}`} className="privacy-toc__link">
                  {index + 1}. {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content card */}
        <div className="privacy-content">
          <p className="privacy-content__intro">
            Your privacy matters to us. This policy explains what data QRni collects, how we use it,
            and what choices you have. We keep it simple and honest — no legalese maze.
          </p>

          {/* Section 1 */}
          <section id="section-1" className="privacy-section">
            <SectionHeading number={1} title="Information We Collect" />

            <h3 className="privacy-section__sub">Account information (optional)</h3>
            <p className="privacy-section__body">
              If you sign in with Google, we receive your <strong>name</strong>,{" "}
              <strong>email address</strong>, and <strong>profile picture</strong> from your Google
              account. Signing in is entirely optional — you can create QR codes and short links
              without an account.
            </p>

            <h3 className="privacy-section__sub">Links you create</h3>
            <p className="privacy-section__body">
              When you shorten a URL we store the <strong>destination URL</strong>, the generated{" "}
              <strong>short code</strong>, a <strong>creation timestamp</strong>, and{" "}
              <strong>Open Graph metadata</strong> (page title, description, and preview image)
              fetched from the destination for link previews. If you are signed in, the link is
              associated with your account. If you are not signed in, we store your{" "}
              <strong>IP address</strong> alongside the link for rate-limiting and abuse prevention.
            </p>

            <h3 className="privacy-section__sub">Click counts</h3>
            <p className="privacy-section__body">
              Each time someone visits a short link, we increment an aggregate{" "}
              <strong>click counter</strong> for that link. We do not collect any personal
              information about visitors who click your links.
            </p>

            <h3 className="privacy-section__sub">QR codes</h3>
            <p className="privacy-section__body">
              QR code image data is <strong>not sent to our servers</strong>. When you download a QR
              code, the file goes straight to your device.
            </p>

            <h3 className="privacy-section__sub">Audit logs</h3>
            <p className="privacy-section__body">
              For signed-in users, we maintain internal audit logs of actions such as creating,
              editing, or deleting links and namespaces. These logs help us investigate abuse and
              provide account security.{" "}
              <strong>
                Audit logs are retained for a limited period and then automatically deleted.
              </strong>
            </p>

            <h3 className="privacy-section__sub">Namespace collaboration</h3>
            <p className="privacy-section__body">
              If you join a namespace as a collaborator, your{" "}
              <strong>name and email address are visible</strong> to all other members of that
              namespace.
            </p>

            <h3 className="privacy-section__sub">Contact form submissions</h3>
            <p className="privacy-section__body">
              When you submit a message through our contact form, we store your name, email address,
              and message. This data is used solely to respond to your inquiry and is not shared
              with third parties.
            </p>

            <h3 className="privacy-section__sub">Temporary session data</h3>
            <p className="privacy-section__body">
              We use temporary browser storage to cache basic display information (such as your name
              and avatar) for faster page loads. This data is automatically cleared when you close
              your browser tab and is not sent to our servers.
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 2 */}
          <section id="section-2" className="privacy-section">
            <SectionHeading number={2} title="How We Use Your Information" />
            <p className="privacy-section__body">We use the information we collect to:</p>
            <ul className="privacy-section__list">
              <li>Generate QR codes and short links for your URLs</li>
              <li>Show aggregate click counts so you can see how your links perform</li>
              <li>Maintain your account and saved links</li>
              <li>
                Check destination URLs against the Google Safe Browsing API for malware and phishing
                threats
              </li>
              <li>Prevent abuse and enforce rate limits</li>
              <li>Display contextual ads via Google AdSense</li>
            </ul>
            <p className="privacy-section__body privacy-section__body--note">
              <em>
                We do not sell your personal data. We do not use it for profiling beyond what is
                described above.
              </em>
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 3 */}
          <section id="section-3" className="privacy-section">
            <SectionHeading number={3} title="Third-Party Services" />
            <p className="privacy-section__body">
              QRni integrates with the following third-party services:
            </p>

            {/* Desktop table */}
            <div className="privacy-table-wrap" aria-label="Third-party service providers">
              <table className="privacy-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Purpose</th>
                    <th>Data shared</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Google OAuth</td>
                    <td>Sign-in authentication</td>
                    <td>Name, email, profile picture</td>
                  </tr>
                  <tr>
                    <td>Google Safe Browsing</td>
                    <td>URL safety checks</td>
                    <td>Destination URLs you shorten</td>
                  </tr>
                  <tr>
                    <td>Google AdSense</td>
                    <td>Ad serving</td>
                    <td>
                      Cookies and browsing data (see{" "}
                      <a
                        href="https://policies.google.com/technologies/ads"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Google's ad policies
                      </a>
                      )
                    </td>
                  </tr>
                  <tr>
                    <td>Google Fonts</td>
                    <td>Typography</td>
                    <td>Standard font requests (IP address to Google's CDN)</td>
                  </tr>
                  <tr>
                    <td>Cloud infrastructure provider</td>
                    <td>Backend &amp; database</td>
                    <td>All stored data described in this policy</td>
                  </tr>
                  <tr>
                    <td>Vercel</td>
                    <td>Hosting &amp; analytics</td>
                    <td>
                      Page views and web vitals (see{" "}
                      <a
                        href="https://vercel.com/docs/analytics/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Vercel's privacy
                      </a>
                      )
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <ul className="privacy-service-cards" aria-label="Third-party service providers">
              {[
                {
                  provider: "Google OAuth",
                  purpose: "Sign-in authentication",
                  data: "Name, email, profile picture",
                },
                {
                  provider: "Google Safe Browsing",
                  purpose: "URL safety checks",
                  data: "Destination URLs you shorten",
                },
                {
                  provider: "Google AdSense",
                  purpose: "Ad serving",
                  data: "Cookies and browsing data (see Google's ad policies)",
                },
                {
                  provider: "Google Fonts",
                  purpose: "Typography",
                  data: "Standard font requests (IP address to Google's CDN)",
                },
                {
                  provider: "Cloud infrastructure provider",
                  purpose: "Backend & database",
                  data: "All stored data described in this policy",
                },
                {
                  provider: "Vercel",
                  purpose: "Hosting & analytics",
                  data: "Page views and web vitals (see Vercel's privacy)",
                },
              ].map((service) => (
                <li key={service.provider} className="privacy-service-card">
                  <span className="privacy-service-card__provider">{service.provider}</span>
                  <span className="privacy-service-card__purpose">{service.purpose}</span>
                  <span className="privacy-service-card__data">{service.data}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="privacy-divider" />

          {/* Section 4 */}
          <section id="section-4" className="privacy-section">
            <SectionHeading number={4} title="Cookies & Local Storage" />
            <p className="privacy-section__body">
              QRni itself does not set tracking cookies. However, Google AdSense may set cookies to
              serve personalized ads. You can manage cookie preferences through your browser
              settings or opt out of personalized advertising at{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="privacy-section__link"
              >
                Google's Ad Settings
              </a>{" "}
              page.
            </p>
            <p className="privacy-section__body">
              We use browser localStorage to save your preferences (such as whether to automatically
              create a short link) so they persist between sessions. This data never leaves your
              device.
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 5 */}
          <section id="section-5" className="privacy-section">
            <SectionHeading number={5} title="Data Retention" />
            <ul className="privacy-section__list">
              <li>
                <strong>Links</strong> — kept until you delete them or request account deletion.
              </li>
              <li>
                <strong>Account data</strong> — kept until you request deletion.
              </li>
              <li>
                <strong>Anonymous IP addresses</strong> — stored alongside anonymous links for as
                long as the link exists. You may contact us to request removal.
              </li>
              <li>
                <strong>Audit logs</strong> — retained for a limited period and then automatically
                deleted.
              </li>
              <li>
                <strong>Rate-limit records</strong> — automatically expire after a short period.
              </li>
              <li>
                <strong>Contact form submissions</strong> — retained until we have responded to your
                inquiry, then deleted.
              </li>
              <li>
                <strong>Session data</strong> — cleared when you close your browser tab.
              </li>
            </ul>
          </section>

          <hr className="privacy-divider" />

          {/* Section 6 */}
          <section id="section-6" className="privacy-section">
            <SectionHeading number={6} title="Your Rights & Choices" />
            <p className="privacy-section__body">You can:</p>
            <ul className="privacy-section__list">
              <li>
                <strong>Delete</strong> individual links and namespaces from the app.
              </li>
              <li>
                <strong>Update</strong> your profile information (name and avatar).
              </li>
              <li>
                <strong>Request account deletion</strong> by contacting us at the email below. We
                will delete your account and all associated data.
              </li>
              <li>
                <strong>Request a data export</strong> by contacting us at the email below.
              </li>
              <li>
                <strong>Opt out</strong> of personalized advertising via{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="privacy-section__link"
                >
                  Google Ad Settings
                </a>
                .
              </li>
            </ul>
            <p className="privacy-section__body">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:contact@qrni.to" className="privacy-section__link">
                contact@qrni.to
              </a>
              .
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 7 */}
          <section id="section-7" className="privacy-section">
            <SectionHeading number={7} title="Data Security" />
            <p className="privacy-section__body">
              We take reasonable measures to protect your data. All data in transit is encrypted via
              HTTPS. Our infrastructure provides encryption at rest. Authentication is handled
              through Google OAuth — we never store passwords.
            </p>
            <p className="privacy-section__body">
              That said, no system is 100% secure. If you discover a security vulnerability, please
              report it to{" "}
              <a href="mailto:contact@qrni.to" className="privacy-section__link">
                contact@qrni.to
              </a>
              .
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 8 */}
          <section id="section-8" className="privacy-section">
            <SectionHeading number={8} title="Children's Privacy" />
            <p className="privacy-section__body">
              QRni is not directed at children under 13. We do not knowingly collect personal
              information from children. If you believe a child has provided us with personal data,
              please contact us and we will promptly delete it.
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 9 */}
          <section id="section-9" className="privacy-section">
            <SectionHeading number={9} title="Changes to This Policy" />
            <p className="privacy-section__body">
              We may update this policy from time to time. When we do, we will update the "Effective
              date" at the top of this page. For significant changes, we will notify signed-in users
              via email. We encourage you to review this page periodically.
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 10 */}
          <section id="section-10" className="privacy-section">
            <SectionHeading number={10} title="Contact Us" />
            <p className="privacy-section__body">
              If you have any questions about this Privacy Policy or how we handle your data, reach
              out to us at{" "}
              <a href="mailto:contact@qrni.to" className="privacy-section__link">
                contact@qrni.to
              </a>
              . You can also visit our{" "}
              <Link to="/contact" className="privacy-section__link">
                contact page
              </Link>
              . We are based in Davao City, Philippines.
            </p>
          </section>
        </div>

        {/* Contact CTA */}
        <div className="privacy-cta">
          <svg
            className="privacy-cta__icon"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3D8A5A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <h2 className="privacy-cta__title">Questions about your privacy?</h2>
          <p className="privacy-cta__text">
            We take privacy seriously and we are happy to answer any questions. Reach out anytime —
            we do not bite.
          </p>
          <Link to="/contact" className="privacy-cta__button">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Contact Us
          </Link>
        </div>
      </div>

      <AdSlot
        slot="PRIVACY_PILLAR_LEFT_SLOT_ID"
        format="vertical"
        responsive={false}
        className="ad-slot--pillar ad-slot--pillar-left"
      />
      <AdSlot
        slot="PRIVACY_PILLAR_RIGHT_SLOT_ID"
        format="vertical"
        responsive={false}
        className="ad-slot--pillar ad-slot--pillar-right"
      />
      <AdSlot
        slot="PRIVACY_SLOT_ID"
        format="horizontal"
        className="ad-slot--static-page"
        style={{ maxWidth: 728, margin: "24px auto" }}
      />

      <AppFooter className="static-page-footer" />
    </main>
  );
}

export default PrivacyPage;
