import { Link } from "@tanstack/react-router";
import "./PrivacyPage.css";

function PrivacyPage() {
  return (
    <main id="main-content" className="privacy-page">
      <div className="privacy-body">
        <Link to="/" className="privacy-back-link">
          &larr; Back to home
        </Link>

        <h2 className="privacy-title">Privacy Policy</h2>
        <p className="privacy-effective-date">Effective date: March 18, 2026</p>

        <p>
          QRni ("we", "us", "our") provides a free QR code generator and URL shortener. This policy
          explains what information we collect when you use our service and how we handle it.
        </p>

        <h3>1. Information We Collect</h3>

        <h4>a. Account information (optional)</h4>
        <p>
          If you sign in with Google, we receive your <strong>name</strong>,{" "}
          <strong>email address</strong>, and <strong>profile picture</strong> from your Google
          account. Signing in is entirely optional — you can create QR codes and short links without
          an account.
        </p>

        <h4>b. Links you create</h4>
        <p>
          When you shorten a URL we store the <strong>destination URL</strong>, the generated{" "}
          <strong>short code</strong>, and a <strong>creation timestamp</strong>. If you are signed
          in, the link is associated with your account. If you are not signed in, we store your{" "}
          <strong>IP address</strong> alongside the link for rate-limiting and abuse prevention.
        </p>

        <h4>c. Click counts</h4>
        <p>
          Each time someone visits a short link, we increment an aggregate{" "}
          <strong>click counter</strong> for that link. We do not record the visitor's IP address,
          browser, referrer, or any other identifying information about the person clicking the
          link.
        </p>

        <h4>d. QR codes</h4>
        <p>
          QR code image data is <strong>not sent to our servers</strong>. When you download a QR
          code, the file goes straight to your device.
        </p>

        <h4>e. Audit logs</h4>
        <p>
          For signed-in users, we maintain internal audit logs of actions such as creating, editing,
          or deleting links and namespaces. These logs help us investigate abuse and provide account
          security. <strong>Audit logs are currently retained indefinitely.</strong>
        </p>

        <h4>f. Namespace collaboration</h4>
        <p>
          If you join a namespace as a collaborator, your{" "}
          <strong>name and email address are visible</strong> to all other members of that
          namespace.
        </p>

        <h4>g. Temporary session data</h4>
        <p>
          We use temporary browser storage to cache basic display information (such as your name and
          avatar) for faster page loads. This data is automatically cleared when you close your
          browser tab and is not sent to our servers.
        </p>

        <h3>2. How We Use Your Information</h3>
        <ul>
          <li>
            <strong>Providing the service</strong> — creating and resolving short links, generating
            QR codes, managing namespaces and team access.
          </li>
          <li>
            <strong>Safety</strong> — every destination URL is sent to the{" "}
            <strong>Google Safe Browsing API</strong> to check for malware and phishing threats. The
            full URL is transmitted to Google for this check.
          </li>
          <li>
            <strong>Rate limiting &amp; abuse prevention</strong> — we use IP addresses and user IDs
            to enforce rate limits and detect duplicate submissions.
          </li>
          <li>
            <strong>Analytics</strong> — aggregate click counts so you can see how your links
            perform.
          </li>
        </ul>

        <h3>3. Third-Party Services</h3>
        <p>We rely on the following third-party providers:</p>
        <div className="privacy-table-wrap">
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
            </tbody>
          </table>
        </div>
        {/* TODO: When Google AdSense is added, update:
           1. Remove "We do not use advertising networks" below
           2. Add Google AdSense row to the third-party table (cookies, device info, browsing behavior)
           3. Update the Cookies section to disclose advertising/tracking cookies */}
        <p>We do not sell your data. We do not use advertising networks or tracking pixels.</p>

        <h3>4. Cookies</h3>
        <p>
          QRni itself does not set cookies. Our authentication provider stores session tokens in
          secure cookies to maintain your login session. These cookies are strictly necessary for
          authentication and are cleared when you log out. We do not use cookies for advertising or
          cross-site tracking.
        </p>

        <h3>5. Data Retention</h3>
        <ul>
          <li>
            <strong>Links</strong> — kept until you delete them or request account deletion.
          </li>
          <li>
            <strong>Account data</strong> — kept until you request deletion.
          </li>
          <li>
            <strong>Anonymous IP addresses</strong> — stored alongside anonymous links for as long
            as the link exists. Since anonymous links are not tied to an account, there is no
            self-service mechanism to delete the stored IP. You may contact us to request removal.
          </li>
          <li>
            <strong>Audit logs</strong> — currently retained indefinitely. We plan to implement
            automatic cleanup in the future.
          </li>
          <li>
            <strong>Rate-limit records</strong> — automatically expire after a short period.
          </li>
          <li>
            <strong>Session data</strong> — cleared when you close your browser tab.
          </li>
        </ul>

        <h3>6. Your Rights</h3>
        <p>You can:</p>
        <ul>
          <li>
            <strong>Delete</strong> individual links and namespaces from the app.
          </li>
          <li>
            <strong>Update</strong> your profile information (name and avatar).
          </li>
          <li>
            <strong>Request account deletion</strong> by contacting us at the email below. We will
            delete your account and all associated data.
          </li>
          <li>
            <strong>Request a data export</strong> by contacting us at the email below.
          </li>
        </ul>

        <h3>7. Security</h3>
        <p>
          We use HTTPS everywhere, validate and sanitize all user input, check URLs against threat
          databases, and enforce rate limits to prevent abuse. Authentication is handled through
          industry-standard OAuth 2.0 flows.
        </p>

        <h3>8. Children's Privacy</h3>
        <p>
          QRni is not directed at children under 13. We do not knowingly collect personal
          information from children. If you believe a child has provided us with personal data,
          please contact us so we can delete it.
        </p>

        <h3>9. Changes to This Policy</h3>
        <p>
          We may update this policy from time to time. If we make material changes, we will update
          the effective date at the top of this page. Your continued use of QRni after changes are
          posted constitutes acceptance of the updated policy.
        </p>

        <h3>10. Contact</h3>
        <p>
          Questions or concerns? Reach us at <a href="mailto:privacy@qrni.to">privacy@qrni.to</a>.
        </p>
      </div>

      <footer className="panel-footer privacy-page-footer">
        <p className="copyright-footer">
          &copy; {new Date().getFullYear()} QRni. All rights reserved.
        </p>
        <span className="powered-by">
          Powered by
          <a
            href="https://imbensantos.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit imBento website"
          >
            <img src="/imbento-logo-dark.svg" alt="imBento" className="imbento-logo" />
          </a>
        </span>
      </footer>
    </main>
  );
}

export default PrivacyPage;
