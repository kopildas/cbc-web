import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./PredictCbc.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const initialForm = {
  HGB: "10.2",
  RBC: "4.1",
  WBC: "7.8",
  PLT: "260",
  HCT: "32.5",
  MCV: "72",
  MCH: "23.5",
  MCHC: "31",
  PDW: "12.5",
  RDW: "16.2",
  NEUTp: "60",
  LYMp: "30",
};

const fieldGroups = [
  {
    title: "Red Cell Profile",
    fields: ["HGB", "RBC", "HCT", "MCV", "MCH", "MCHC", "RDW"],
  },
  {
    title: "White Cell & Platelet Profile",
    fields: ["WBC", "PLT", "PDW", "NEUTp", "LYMp"],
  },
];

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0.00%";
  }

  return `${(Number(value) * 100).toFixed(2)}%`;
}

function getExplanationText(item) {
  if (typeof item === "string") return item;

  return (
    item?.message ||
    item?.explanation ||
    item?.reason ||
    item?.description ||
    "This feature contributed to the model decision."
  );
}

export default function PredictCbc() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [singleResult, setSingleResult] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [error, setError] = useState("");

  const result = singleResult?.result;

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setSingleResult(null);
    setCsvResult(null);
    setCsvFile(null);
    setError("");
  };

  const buildPayload = () => {
    const values = {};

    Object.entries(form).forEach(([key, value]) => {
      values[key] = value === "" ? null : Number(value);
    });

    return {
      values,
      return_explanation: true,
    };
  };

  const predictSingle = async () => {
    setLoading(true);
    setError("");
    setSingleResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/predict-single`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Prediction failed");
      }

      setSingleResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong while predicting.");
    } finally {
      setLoading(false);
    }
  };

  const predictCsv = async () => {
    if (!csvFile) {
      setError("Please select a CSV file first.");
      return;
    }

    setCsvLoading(true);
    setError("");
    setCsvResult(null);

    try {
      const formData = new FormData();
      formData.append("file", csvFile);

      const response = await fetch(
        `${API_BASE_URL}/predict-csv?return_explanation=false`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "CSV prediction failed");
      }

      setCsvResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong while processing CSV.");
    } finally {
      setCsvLoading(false);
    }
  };

  const downloadTemplate = () => {
    window.open(`${API_BASE_URL}/sample-template?format=csv`, "_blank");
  };

  return (
    <main className="predict-page">
      <div className="predict-bg-orb predict-orb-one" />
      <div className="predict-bg-orb predict-orb-two" />
      <div className="predict-bg-grid" />

      <nav className="predict-nav">
        <button className="predict-logo" onClick={() => navigate("/")}>
          <span className="predict-logo-orb">
            <span />
          </span>
          <span>CBC-XAI</span>
        </button>

        <div className="predict-nav-links">
          <Link to="/">Home</Link>
          <a href="#manual-cbc">Manual Input</a>
          <a href="#csv-upload">CSV Upload</a>
          <a href="#result">Result</a>
        </div>

        <button className="predict-nav-btn" onClick={() => navigate("/")}>
          Back Home →
        </button>
      </nav>

      <section className="predict-hero">
        <p className="predict-eyebrow">AI-ASSISTED CBC SCREENING</p>

        <h1>
          Predict CBC-Based
          <br />
          Blood Disease Pattern
        </h1>

        <p className="predict-subtitle">
          Enter routine CBC values to generate model prediction, confidence,
          top-3 probabilities, and explainable clinical signals.
        </p>

        <div className="predict-stats">
          <div>
            <strong>9</strong>
            <span>Disease Classes</span>
          </div>
          <div>
            <strong>25</strong>
            <span>Engineered Features</span>
          </div>
          <div>
            <strong>XAI</strong>
            <span>Explanation Ready</span>
          </div>
        </div>
      </section>

      <section className="predict-workspace">
        <div id="manual-cbc" className="predict-card input-card">
          <div className="card-header">
            <div>
              <p className="section-label">MANUAL CBC INPUT</p>
              <h2>Patient CBC Information</h2>
            </div>

            <button className="ghost-btn" onClick={resetForm}>
              Reset
            </button>
          </div>

          <p className="card-description">
            Fill the CBC parameters below. Empty values will be sent as missing
            values and handled by the backend model if supported.
          </p>

          <div className="field-group-wrap">
            {fieldGroups.map((group) => (
              <div className="field-group" key={group.title}>
                <h3>{group.title}</h3>

                <div className="field-grid">
                  {group.fields.map((key) => (
                    <label key={key} className="predict-field">
                      <span>{key}</span>
                      <input
                        type="number"
                        step="any"
                        value={form[key]}
                        onChange={(event) =>
                          handleChange(key, event.target.value)
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            className="primary-predict-btn"
            onClick={predictSingle}
            disabled={loading}
          >
            {loading ? "Predicting..." : "Predict Single CBC →"}
          </button>

          <div id="csv-upload" className="csv-panel">
            <div>
              <p className="section-label">CSV BATCH MODE</p>
              <h2>Upload CBC File</h2>
              <p>
                Upload a CSV file with the same CBC columns and process multiple
                rows at once.
              </p>
            </div>

            <div className="csv-actions">
              <input
                type="file"
                accept=".csv"
                onChange={(event) =>
                  setCsvFile(event.target.files?.[0] || null)
                }
              />

              <button onClick={predictCsv} disabled={csvLoading}>
                {csvLoading ? "Processing..." : "Predict CSV"}
              </button>

              <button type="button" onClick={downloadTemplate}>
                Download Template
              </button>
            </div>
          </div>
        </div>

        <aside id="result" className="predict-card result-card">
          <div className="card-header">
            <div>
              <p className="section-label">MODEL OUTPUT</p>
              <h2>Prediction Result</h2>
            </div>
          </div>

          {error && <div className="predict-error">{error}</div>}

          {!result && !error && (
            <div className="empty-result">
              <div className="empty-orb">
                <span />
              </div>
              <h3>No prediction yet</h3>
              <p>
                Submit CBC values from the left panel. The prediction, model
                confidence, top classes, and explanations will appear here.
              </p>
            </div>
          )}

          {result && (
            <div className="result-content">
              <div className="prediction-box">
                <p>Predicted Class</p>
                <h3>{result.prediction}</h3>
                <span>Confidence {formatPercent(result.confidence)}</span>
              </div>

              <div className="top-three">
                <h3>Top 3 Probabilities</h3>

                {result.top_3?.map((item, index) => (
                  <div className="probability-row" key={`${item.class}-${index}`}>
                    <div>
                      <span>
                        {index + 1}. {item.class}
                      </span>
                      <strong>{formatPercent(item.probability)}</strong>
                    </div>

                    <div className="probability-track">
                      <span
                        style={{
                          width: `${Math.max(
                            2,
                            Number(item.probability || 0) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {result.warnings?.length > 0 && (
                <div className="warning-box">
                  <h3>Warnings</h3>
                  {result.warnings.map((warning, index) => (
                    <p key={index}>{warning}</p>
                  ))}
                </div>
              )}

              {result.explanation?.length > 0 && (
                <div className="xai-box">
                  <h3>Explainability Signals</h3>

                  {result.explanation.map((item, index) => (
                    <div className="xai-item" key={index}>
                      <div>
                        <strong>
                          {item?.feature || item?.name || `Signal ${index + 1}`}
                        </strong>

                        {item?.value !== undefined && item?.value !== null && (
                          <span>{item.value}</span>
                        )}
                      </div>

                      <p>{getExplanationText(item)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {csvResult && (
            <div className="csv-result-box">
              <h3>CSV Result</h3>
              <p>File: {csvResult.filename}</p>
              <p>Rows predicted: {csvResult.n_rows}</p>

              <div className="csv-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Prediction</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>

                  <tbody>
                    {csvResult.results?.map((row) => (
                      <tr key={row.row_index}>
                        <td>{row.row_index}</td>
                        <td>{row.prediction}</td>
                        <td>{formatPercent(row.confidence)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="medical-note">
            <strong>Medical Disclaimer</strong>
            <p>
              This system is a research-based screening tool only. It is not a
              medical diagnosis and must not replace consultation with a
              qualified doctor, hematologist, or laboratory professional.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}