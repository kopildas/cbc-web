import "./SiteFooter.css";

function FooterLogo() {
  return (
    <div className="footer-brand">
      <div className="footer-logo-mark">
        <span className="footer-logo-ring ring-one" />
        <span className="footer-logo-ring ring-two" />
        <span className="footer-logo-ring ring-three" />
        <span className="footer-logo-dot" />
      </div>

      <h2>CELLENS</h2>
      <p>© 2026 Cellens.com</p>
    </div>
  );
}

function FooterSocials() {
  return (
    <div className="footer-socials">
      <span>⌕</span>
      <span>◎</span>
      <span>☍</span>
      <span>↗</span>
    </div>
  );
}

export default function SiteFooter({ onTryNow }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <FooterLogo />

        <div className="footer-sitemap">
          <h3>Sitemap</h3>

          <nav>
            <button>Home</button>
            <button>About</button>
            <button>Our Technologies</button>
            <button>Contact</button>
            <button>FAQ</button>
          </nav>

          <div className="footer-policy-links">
            <button>Privacy Policy</button>
            <button>Terms of Usage</button>
          </div>
        </div>

        <div className="footer-contact">
          <h3>Contact</h3>

          <p>+84 123 456 789</p>
          <p>contact@cellens.com</p>

          <FooterSocials />

          <div className="footer-newsletter">
            <h3>Subscribe to our Newsletter</h3>

            <form>
              <input type="email" placeholder="Your email here" />
              <button type="submit">→</button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
}