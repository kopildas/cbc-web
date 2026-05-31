import { useState } from "react";
import "./index.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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

function App() {
  const [form, setForm] = useState(initialForm);
  const [singleResult, setSingleResult] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
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
      setError(err.message || "Something went wrong");
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

      const response = await fetch(`${API_BASE_URL}/predict-csv?return_explanation=false`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "CSV prediction failed");
      }

      setCsvResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setCsvLoading(false);
    }
  };

  const downloadTemplate = () => {
    window.open(`${API_BASE_URL}/sample-template?format=csv`, "_blank");
  };

  const result = singleResult?.result;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              CBC Hematological Disorder Prediction
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Research-based ML screening tool with explainability
            </p>
          </div>

          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            Local Backend Connected
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Manual CBC Input</h2>
            <p className="mt-1 text-sm text-slate-600">
              Enter CBC values and get prediction, confidence, top-3 classes, and explanation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Object.keys(form).map((key) => (
              <label key={key} className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">{key}</span>
                <input
                  type="number"
                  step="any"
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            ))}
          </div>

          <button
            onClick={predictSingle}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? "Predicting..." : "Predict Single CBC"}
          </button>

          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold">CSV Upload</h2>
            <p className="mt-1 text-sm text-slate-600">
              Upload a CSV file using the same CBC columns.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />

              <button
                onClick={predictCsv}
                disabled={csvLoading}
                className="rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              >
                {csvLoading ? "Uploading..." : "Predict CSV"}
              </button>
            </div>

            <button
              onClick={downloadTemplate}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Download sample CSV template
            </button>
          </div>
        </section>

        <section className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">Prediction Result</h2>

            {!result && (
              <p className="mt-3 text-sm text-slate-600">
                Result will appear here after prediction.
              </p>
            )}

            {result && (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl bg-blue-50 p-5">
                  <p className="text-sm font-medium text-blue-700">Predicted Class</p>
                  <h3 className="mt-1 text-2xl font-bold text-blue-950">
                    {result.prediction}
                  </h3>
                  <p className="mt-2 text-sm text-blue-800">
                    Confidence: {(result.confidence * 100).toFixed(2)}%
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">Top 3 Probabilities</h3>
                  <div className="mt-3 space-y-3">
                    {result.top_3?.map((item, index) => (
                      <div key={item.class}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{index + 1}. {item.class}</span>
                          <span>{(item.probability * 100).toFixed(2)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${item.probability * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {result.warnings?.length > 0 && (
                  <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-semibold">Warnings</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold">Explainability</h3>
                  <div className="mt-3 space-y-3">
                    {result.explanation?.map((item, index) => (
                      <div
                        key={`${item.feature}-${index}`}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex justify-between gap-4">
                          <p className="font-medium text-slate-900">{item.feature}</p>
                          {item.value !== null && item.value !== undefined && (
                            <p className="text-sm text-slate-500">{item.value}</p>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {csvResult && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">CSV Result</h2>
              <p className="mt-2 text-sm text-slate-600">
                File: {csvResult.filename}
              </p>
              <p className="text-sm text-slate-600">
                Rows predicted: {csvResult.n_rows}
              </p>

              <div className="mt-4 max-h-80 overflow-auto rounded-xl border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Prediction</th>
                      <th className="px-3 py-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvResult.results?.map((row) => (
                      <tr key={row.row_index} className="border-t">
                        <td className="px-3 py-2">{row.row_index}</td>
                        <td className="px-3 py-2">{row.prediction}</td>
                        <td className="px-3 py-2">
                          {(row.confidence * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Medical Disclaimer</p>
            <p className="mt-2">
              This system is a research-based screening tool only. It is not a medical diagnosis
              and must not replace consultation with a qualified doctor, hematologist, or laboratory
              professional.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;