import "./TeamSpecialties.css";

export default function TeamSpecialties({ onTryNow }) {
  const specialties = [
    "CBC Feature Engineering",
    "Semi-Supervised Learning",
    "Stacked Ensemble Model",
    "Explainable AI / SHAP",
  ];

  return (
    <section className="team-specialties-section">
      <div className="team-section-inner">
        <div className="team-heading">
          <p>WHO WE ARE</p>
          <h2>Meet the CBC-XAI Team</h2>
        </div>

        <div className="team-image-card">
          <div className="team-image-overlay" />
          <div className="team-fake-lab">
            <div className="team-face-shadow" />
            <div className="team-microscope">
              <span className="scope-eye" />
              <span className="scope-body" />
              <span className="scope-arm" />
              <span className="scope-base" />
            </div>
            <div className="team-lab-light" />
            <div className="team-lab-tubes">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="team-info-row">
          <p>
            Our project is built to support hematological disorder screening
            from routine Complete Blood Count data using clinically meaningful
            feature engineering and machine learning.
          </p>

          <p>
            The system combines semi-supervised learning, stacked ensemble
            classification, probability-based outputs, and explainable AI to
            make CBC-based prediction more interpretable.
          </p>

          <div className="team-actions">
            <button onClick={onTryNow}>About Us <span>→</span></button>
            <button onClick={onTryNow}>Detect Article <span>→</span></button>
          </div>
        </div>

        <div className="specialties-grid">
          <div className="specialties-copy">
            <p>WHO WE ARE</p>
            <h3>
              Our
              <br />
              Specialties
            </h3>

            <span>
              Our research focuses on CBC-based multi-class hematological
              disorder classification using routine blood parameters,
              clinically relevant indices, ensemble modeling, and XAI.
            </span>
          </div>

          <div className="specialties-cards">
            {specialties.map((item) => (
              <button key={item} className="specialty-card">
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}