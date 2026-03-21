import { Link } from "@tanstack/react-router";
import AdSlot from "../ads/AdSlot";

interface AppFooterProps {
  className?: string;
  adSlot?: { slot: string; format: string; className: string };
  variant?: "default" | "privacy";
}

function AppFooter({ className = "", adSlot, variant = "default" }: AppFooterProps) {
  return (
    <footer className={`panel-footer ${className}`}>
      {adSlot && <AdSlot slot={adSlot.slot} format={adSlot.format} className={adSlot.className} />}
      <p className="copyright-footer">
        &copy; {new Date().getFullYear()} QRni
        {variant === "privacy" ? (
          ". All rights reserved."
        ) : (
          <>
            {" "}
            &middot;{" "}
            <Link to="/about" className="footer-link">
              About
            </Link>{" "}
            &middot;{" "}
            <Link to="/contact" className="footer-link">
              Contact
            </Link>{" "}
            &middot;{" "}
            <Link to="/privacy" className="footer-link">
              Privacy
            </Link>
          </>
        )}
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
  );
}

export default AppFooter;
