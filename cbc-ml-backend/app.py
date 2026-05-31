"""
app.py
FastAPI backend for CBC hematological disorder prediction.

Run:
    ./venv/Scripts/python.exe -m uvicorn app:app --reload

Project structure:
    cbc-ml-backend/
      app.py
      inference.py
      artifacts/
        meta.joblib
        stack_seed42.joblib
        stack_seed202.joblib
        stack_seed777.joblib
"""

from __future__ import annotations

import io
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Literal, Optional

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from inference import CBCPredictor


APP_NAME = "CBC Hematological Disorder Prediction API"
APP_VERSION = "1.0.0"

ARTIFACT_DIR = os.getenv("ARTIFACT_DIR", "artifacts")
MAX_CSV_ROWS = int(os.getenv("MAX_CSV_ROWS", "200"))

MEDICAL_DISCLAIMER = (
    "This system is a research-based screening tool only. "
    "It is not a medical diagnosis and must not replace consultation with a qualified doctor, "
    "hematologist, or laboratory professional."
)


class SinglePredictionRequest(BaseModel):
    values: Dict[str, Optional[float]] = Field(
        ...,
        description="CBC values such as HGB, RBC, WBC, PLT, HCT, MCV, MCH, MCHC, RDW, NEUTp, LYMp."
    )
    return_explanation: bool = True


class BatchPredictionRequest(BaseModel):
    rows: List[Dict[str, Optional[float]]]
    return_explanation: bool = False


def get_predictor(request: Request) -> CBCPredictor:
    predictor = getattr(request.app.state, "predictor", None)
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model is not loaded yet.")
    return predictor


def make_json_safe(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {str(k): make_json_safe(v) for k, v in obj.items()}

    if isinstance(obj, list):
        return [make_json_safe(v) for v in obj]

    if isinstance(obj, tuple):
        return [make_json_safe(v) for v in obj]

    if hasattr(obj, "item"):
        try:
            return obj.item()
        except Exception:
            pass

    try:
        if pd.isna(obj):
            return None
    except Exception:
        pass

    return obj


def read_csv_upload(file_bytes: bytes) -> pd.DataFrame:
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read CSV file. Please upload a valid CSV. Error: {exc}",
        )

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded CSV is empty.")

    if len(df) > MAX_CSV_ROWS:
        raise HTTPException(
            status_code=400,
            detail=f"CSV has {len(df)} rows. Maximum allowed rows per request is {MAX_CSV_ROWS}.",
        )

    return df


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.predictor = CBCPredictor(artifact_dir=ARTIFACT_DIR)
        app.state.model_error = None
        print(f"[API] Model loaded from: {ARTIFACT_DIR}")
    except Exception as exc:
        app.state.predictor = None
        app.state.model_error = str(exc)
        print(f"[API] Model loading failed: {exc}")

    yield

    app.state.predictor = None
    print("[API] Shutdown complete.")


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="API for CBC-based hematological disorder prediction with explainability.",
    lifespan=lifespan,
)


frontend_origins_env = os.getenv("FRONTEND_ORIGINS", "")

if frontend_origins_env.strip():
    allowed_origins = [origin.strip() for origin in frontend_origins_env.split(",")]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "app": APP_NAME,
        "version": APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "disclaimer": MEDICAL_DISCLAIMER,
    }


@app.get("/health")
def health(request: Request) -> Dict[str, Any]:
    predictor = getattr(request.app.state, "predictor", None)
    model_error = getattr(request.app.state, "model_error", None)

    return {
        "status": "ok" if predictor is not None else "model_not_loaded",
        "model_loaded": predictor is not None,
        "model_error": model_error,
        "artifact_dir": ARTIFACT_DIR,
        "version": APP_VERSION,
    }


@app.get("/model-info")
def model_info(request: Request) -> Dict[str, Any]:
    predictor = get_predictor(request)

    return {
        "success": True,
        "model": make_json_safe(predictor.model_info()),
        "disclaimer": MEDICAL_DISCLAIMER,
    }


@app.get("/sample-template")
def sample_template(
    request: Request,
    format: Literal["json", "csv"] = Query(default="json"),
):
    predictor = get_predictor(request)
    template = predictor.get_sample_input()

    if format == "json":
        return {
            "success": True,
            "template": template,
            "note": "Use these columns for manual input or CSV upload.",
        }

    df = pd.DataFrame([template])
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cbc_sample_template.csv"},
    )


@app.post("/predict-single")
def predict_single(
    payload: SinglePredictionRequest,
    request: Request,
) -> Dict[str, Any]:
    predictor = get_predictor(request)

    try:
        result = predictor.predict_one(
            payload.values,
            return_explanation=payload.return_explanation,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    return {
        "success": True,
        "result": make_json_safe(result),
        "disclaimer": MEDICAL_DISCLAIMER,
    }


@app.post("/predict-batch")
def predict_batch(
    payload: BatchPredictionRequest,
    request: Request,
) -> Dict[str, Any]:
    predictor = get_predictor(request)

    if not payload.rows:
        raise HTTPException(status_code=400, detail="No rows provided.")

    if len(payload.rows) > MAX_CSV_ROWS:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum allowed rows per request is {MAX_CSV_ROWS}.",
        )

    try:
        results = predictor.predict_many(
            payload.rows,
            return_explanation=payload.return_explanation,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {exc}")

    return {
        "success": True,
        "n_rows": len(payload.rows),
        "results": make_json_safe(results),
        "disclaimer": MEDICAL_DISCLAIMER,
    }


@app.post("/predict-csv")
async def predict_csv(
    request: Request,
    file: UploadFile = File(...),
    return_explanation: bool = Query(default=False),
) -> Dict[str, Any]:
    predictor = get_predictor(request)

    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")

    file_bytes = await file.read()
    df = read_csv_upload(file_bytes)

    rows = df.where(pd.notnull(df), None).to_dict(orient="records")

    try:
        results = predictor.predict_many(
            rows,
            return_explanation=return_explanation,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"CSV prediction failed: {exc}")

    return {
        "success": True,
        "filename": filename,
        "n_rows": len(rows),
        "input_columns": list(df.columns),
        "results": make_json_safe(results),
        "disclaimer": MEDICAL_DISCLAIMER,
    }


@app.post("/predict-csv-download")
async def predict_csv_download(
    request: Request,
    file: UploadFile = File(...),
    return_explanation: bool = Query(default=False),
):
    predictor = get_predictor(request)

    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")

    file_bytes = await file.read()
    df = read_csv_upload(file_bytes)

    rows = df.where(pd.notnull(df), None).to_dict(orient="records")

    try:
        results = predictor.predict_many(
            rows,
            return_explanation=return_explanation,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"CSV prediction failed: {exc}")

    result_df = pd.DataFrame(make_json_safe(results))
    output_df = pd.concat(
        [df.reset_index(drop=True), result_df.reset_index(drop=True)],
        axis=1,
    )

    csv_buffer = io.StringIO()
    output_df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cbc_predictions.csv"},
    )