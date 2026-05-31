import "./DetectionProcess.css";

function FloatingChip() {
  return (
    <div className="dp-chip">
      <span />
    </div>
  );
}

function BloodCellModel() {
  return (
    <div className="dp-cell-model">
      <div className="dp-cell-core" />
    </div>
  );
}

function TubeIcon() {
  return (
    <div className="dp-tube">
      <div className="dp-tube-cap" />
      <div className="dp-tube-body">
        <span />
      </div>
    </div>
  );
}

function VialIcon() {
  return (
    <div className="dp-vial">
      <div className="dp-vial-mouth" />
      <div className="dp-vial-body" />
    </div>
  );
}

function MicroscopeIcon() {
  return (
    <div className="dp-microscope">
      <div className="dp-micro-head" />
      <div className="dp-micro-arm" />
      <div className="dp-micro-base" />
    </div>
  );
}

function ReportIcon() {
  return (
    <div className="dp-report">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export default function DetectionProcess() {
  return (
    <section className="detection-process-section">
      <div className="dp-left-visual">
        <FloatingChip />
        <BloodCellModel />
      </div>

      <div className="dp-content">
        <p className="dp-eyebrow">ADDRESSING CLINICAL NEEDS IN</p>

        <h2>
          CBC-Based
          <br />
          Disorder Detection
        </h2>

        <p className="dp-description">
          Our research model uses routine Complete Blood Count data to support
          multi-class hematological disorder screening through engineered CBC
          features, semi-supervised learning, stacked ensemble prediction, and
          explainable AI.
        </p>

        <div className="dp-steps">
          <div className="dp-step">
            <VialIcon />
            <h3>
              1. CBC Data
              <br />
              Standardization
            </h3>
          </div>

          <div className="dp-step">
            <TubeIcon />
            <h3>
              2. Feature
              <br />
              Engineering
            </h3>
          </div>

          <div className="dp-step">
            <MicroscopeIcon />
            <h3>
              3. Ensemble
              <br />
              Prediction
            </h3>
          </div>

          <div className="dp-step">
            <ReportIcon />
            <h3>
              4. XAI Result
              <br />
              Analysis
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}