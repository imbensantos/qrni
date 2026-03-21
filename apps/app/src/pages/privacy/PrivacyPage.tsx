import { Link } from "@tanstack/react-router";
import AdSlot from "../../components/ads/AdSlot";
import AppFooter from "../../components/layout/AppFooter";
import "./PrivacyPage.css";

const SECTIONS = [
  { id: "section-1", label: "Information We Collect" },
  { id: "section-2", label: "How We Use Your Information" },
  { id: "section-3", label: "Third-Party Services" },
  { id: "section-4", label: "Cookies" },
  { id: "section-5", label: "Data Retention" },
  { id: "section-6", label: "Your Rights" },
  { id: "section-7", label: "Security" },
  { id: "section-8", label: "Children's Privacy" },
  { id: "section-9", label: "Changes to This Policy" },
  { id: "section-10", label: "Contact" },
];

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
              &#128203;
            </div>
            <h2 className="privacy-toc__title">Quick Navigation</h2>
          </div>
          <ul className="privacy-toc__list">
            {SECTIONS.map((section) => (
              <li key={section.id} className="privacy-toc__item">
                <a href={`#${section.id}`} className="privacy-toc__link">
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content card */}
        <div className="privacy-content">
          <p className="privacy-content__intro">
            QRni ("we", "us", "our") provides a free QR code generator and URL shortener. This
            policy explains what information we collect when you use our service and how we handle
            it.
          </p>

          {/* Section 1 */}
          <section id="section-1" className="privacy-section">
            <SectionHeading number={1} title="Information We Collect" />

            <h3 className="privacy-section__sub">a. Account information (optional)</h3>
            <p className="privacy-section__body">
              If you sign in with Google, we receive your <strong>name</strong>,{" "}
              <strong>email address</strong>, and <strong>profile picture</strong> from your Google
              account. Signing in is entirely optional — you can create QR codes and short links
              without an account.
            </p>

            <h3 className="privacy-section__sub">b. Links you create</h3>
            <p className="privacy-section__body">
              When you shorten a URL we store the <strong>destination URL</strong>, the generated{" "}
              <strong>short code</strong>, and a <strong>creation timestamp</strong>. If you are
              signed in, the link is associated with your account. If you are not signed in, we
              store your <strong>IP address</strong> alongside the link for rate-limiting and abuse
              prevention.
            </p>

            <h3 className="privacy-section__sub">c. Click counts</h3>
            <p className="privacy-section__body">
              Each time someone visits a short link, we increment an aggregate{" "}
              <strong>click counter</strong> for that link. We do not record the visitor's IP
              address, browser, referrer, or any other identifying information about the person
              clicking the link.
            </p>

            <h3 className="privacy-section__sub">d. QR codes</h3>
            <p className="privacy-section__body">
              QR code image data is <strong>not sent to our servers</strong>. When you download a QR
              code, the file goes straight to your device.
            </p>

            <h3 className="privacy-section__sub">e. Audit logs</h3>
            <p className="privacy-section__body">
              For signed-in users, we maintain internal audit logs of actions such as creating,
              editing, or deleting links and namespaces. These logs help us investigate abuse and
              provide account security.{" "}
              <strong>Audit logs are retained for 90 days and then automatically deleted.</strong>
            </p>

            <h3 className="privacy-section__sub">f. Namespace collaboration</h3>
            <p className="privacy-section__body">
              If you join a namespace as a collaborator, your{" "}
              <strong>name and email address are visible</strong> to all other members of that
              namespace.
            </p>

            <h3 className="privacy-section__sub">g. Temporary session data</h3>
            <p className="privacy-section__body">
              We use temporary browser storage to cache basic display information (such as your name
              and avatar) for faster page loads. This data is automatically cleared when you close
              your browser tab and is not sent to our servers.
            </p>

            <h3 className="privacy-section__sub">h. Contact form submissions</h3>
            <p className="privacy-section__body">
              When you submit a message through our contact form, we store your name, email address,
              and message. This data is used solely to respond to your inquiry and is not shared
              with third parties.
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 2 */}
          <section id="section-2" className="privacy-section">
            <SectionHeading number={2} title="How We Use Your Information" />
            <ul className="privacy-section__list">
              <li>
                <strong>Providing the service</strong> — creating and resolving short links,
                generating QR codes, managing namespaces and team access.
              </li>
              <li>
                <strong>Safety</strong> — every destination URL is sent to the{" "}
                <strong>Google Safe Browsing API</strong> to check for malware and phishing threats.
                The full URL is transmitted to Google for this check.
              </li>
              <li>
                <strong>Rate limiting &amp; abuse prevention</strong> — we use IP addresses and user
                IDs to enforce rate limits and detect duplicate submissions.
              </li>
              <li>
                <strong>Analytics</strong> — aggregate click counts so you can see how your links
                perform.
              </li>
            </ul>
          </section>

          <hr className="privacy-divider" />

          {/* Section 3 */}
          <section id="section-3" className="privacy-section">
            <SectionHeading number={3} title="Third-Party Services" />
            <p className="privacy-section__body">We rely on the following third-party providers:</p>

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
                    <td>Sign-in</td>
                    <td>Authentication tokens; Google returns your name, email, and avatar</td>
                  </tr>
                  <tr>
                    <td>Google Safe Browsing</td>
                    <td>URL threat detection</td>
                    <td>Full destination URLs submitted for shortening</td>
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
                    <td>Vercel Analytics</td>
                    <td>Performance monitoring</td>
                    <td>
                      Page views, web vitals, and device information (see{" "}
                      <a
                        href="https://vercel.com/docs/analytics/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Vercel's privacy policy
                      </a>
                      )
                    </td>
                  </tr>
                  <tr>
                    <td>Google AdSense</td>
                    <td>Advertising</td>
                    <td>
                      Cookies, device information, and browsing behavior for ad personalization (see{" "}
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
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <ul className="privacy-service-cards" aria-label="Third-party service providers">
              {[
                {
                  provider: "Google OAuth",
                  purpose: "Sign-in",
                  data: "Authentication tokens; Google returns your name, email, and avatar",
                },
                {
                  provider: "Google Safe Browsing",
                  purpose: "URL threat detection",
                  data: "Full destination URLs submitted for shortening",
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
                  provider: "Vercel Analytics",
                  purpose: "Performance monitoring",
                  data: "Page views, web vitals, and device information",
                },
                {
                  provider: "Google AdSense",
                  purpose: "Advertising",
                  data: "Cookies, device information, and browsing behavior for ad personalization",
                },
              ].map((service) => (
                <li key={service.provider} className="privacy-service-card">
                  <span className="privacy-service-card__provider">{service.provider}</span>
                  <span className="privacy-service-card__purpose">{service.purpose}</span>
                  <span className="privacy-service-card__data">{service.data}</span>
                </li>
              ))}
            </ul>

            <p className="privacy-section__body">
              We use Google AdSense to display ads to free-tier users. Google may use cookies and
              device identifiers to serve personalized ads. You can opt out of personalized
              advertising at{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ad Settings
              </a>
              . We do not sell your data.
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 4 */}
          <section id="section-4" className="privacy-section">
            <SectionHeading number={4} title="Cookies" />
            <p className="privacy-section__body">
              QRni uses cookies for authentication (session tokens via our auth provider) and
              advertising (Google AdSense may set cookies for ad personalization and measurement).
              Authentication cookies are strictly necessary and are cleared when you log out. You
              can manage ad cookie preferences through your{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ad Settings
              </a>
              .
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
                long as the link exists. Since anonymous links are not tied to an account, there is
                no self-service mechanism to delete the stored IP. You may contact us to request
                removal.
              </li>
              <li>
                <strong>Audit logs</strong> — retained for 90 days and then automatically deleted.
              </li>
              <li>
                <strong>Rate-limit records</strong> — automatically expire after a short period.
              </li>
              <li>
                <strong>Session data</strong> — cleared when you close your browser tab.
              </li>
              <li>
                <strong>Contact form submissions</strong> — retained until we have responded to your
                inquiry, then deleted.
              </li>
            </ul>
          </section>

          <hr className="privacy-divider" />

          {/* Section 6 */}
          <section id="section-6" className="privacy-section">
            <SectionHeading number={6} title="Your Rights" />
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
            </ul>
          </section>

          <hr className="privacy-divider" />

          {/* Section 7 */}
          <section id="section-7" className="privacy-section">
            <SectionHeading number={7} title="Security" />
            <p className="privacy-section__body">
              We use HTTPS everywhere, validate and sanitize all user input, check URLs against
              threat databases, and enforce rate limits to prevent abuse. Authentication is handled
              through industry-standard OAuth 2.0 flows.
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 8 */}
          <section id="section-8" className="privacy-section">
            <SectionHeading number={8} title="Children's Privacy" />
            <p className="privacy-section__body">
              QRni is not directed at children under 13. We do not knowingly collect personal
              information from children. If you believe a child has provided us with personal data,
              please contact us so we can delete it.
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 9 */}
          <section id="section-9" className="privacy-section">
            <SectionHeading number={9} title="Changes to This Policy" />
            <p className="privacy-section__body">
              We may update this policy from time to time. If we make material changes, we will
              update the effective date at the top of this page. Your continued use of QRni after
              changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <hr className="privacy-divider" />

          {/* Section 10 */}
          <section id="section-10" className="privacy-section">
            <SectionHeading number={10} title="Contact" />
            <p className="privacy-section__body">
              Questions or concerns? Visit our{" "}
              <Link to="/contact" className="privacy-section__link">
                contact page
              </Link>{" "}
              or reach us at{" "}
              <a href="mailto:contact@qrni.to" className="privacy-section__link">
                contact@qrni.to
              </a>
              .
            </p>
          </section>
        </div>

        {/* Contact CTA */}
        <div className="privacy-cta">
          <div className="privacy-cta__icon" aria-hidden="true">
            &#128737;&#65039;
          </div>
          <h2 className="privacy-cta__title">We're here to help</h2>
          <p className="privacy-cta__text">
            Questions about your data or this policy? We're happy to help.
          </p>
          <Link to="/contact" className="privacy-cta__button">
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
