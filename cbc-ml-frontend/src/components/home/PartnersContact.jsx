import "./PartnersContact.css";

export default function PartnersContact() {
  return (
    <section className="partners-contact-section">
      <div className="partners-top-glow" />

      <div className="partners-inner">
        <div className="partners-left">
          <h2>
            Calling for
            <br />
            Partners today
          </h2>
        </div>

        <div className="partners-right-note">
          <p>
            You can send an email directly to
            <br />
            <a href="mailto:admin@cellensinc.com">admin@cellensinc.com</a>, or fill in
            <br />
            the form below to reach us
          </p>

          <div className="partners-mail-icon">
            <span />
          </div>
        </div>

        <form className="partners-form">
          <div className="partners-input-row">
            <input type="text" placeholder="Your Name" />
            <input type="email" placeholder="Your Email" />
          </div>

          <div className="partners-input-row partners-bottom-row">
            <textarea placeholder="Your Message" />
            <div className="partners-side-fields">
              <input type="text" placeholder="Contact Number" />
              <button type="submit">Send</button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}