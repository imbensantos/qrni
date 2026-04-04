import { Link } from "@tanstack/react-router";

interface AppFooterProps {
  className?: string;
  variant?: "default" | "privacy";
}

function AppFooter({ className = "", variant = "default" }: AppFooterProps) {
  return (
    <footer className={`panel-footer ${className}`}>
      <p className="copyright-footer">
        &copy; QRni {new Date().getFullYear()}
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
