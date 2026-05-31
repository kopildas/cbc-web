"""
inference.py
Clean inference module for CBC hematological disorder prediction.

No autoencoder.
No AE_Z latent features.
No TensorFlow.
No post-rule override.

Expected structure:
    cbc-ml-backend/
      inference.py
      artifacts/
        meta.joblib
        stack_seed42.joblib
        stack_seed202.joblib
        stack_seed777.joblib
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd


COLUMN_ALIASES = {
    "Hemoglobin": "HGB",
    "Haemoglobin": "HGB",
    "HB": "HGB",
    "Hb": "HGB",
    "Platelet": "PLT",
    "Platelets": "PLT",
    "PCV/HCT": "HCT",
    "PCV": "HCT",
    "Lymphocytes (%)": "LYMp",
    "Lymphocyte (%)": "LYMp",
    "Lymphocytes": "LYMp",
    "Lymphocyte": "LYMp",
    "Neutrophils (%)": "NEUTp",
    "Neutrophil (%)": "NEUTp",
    "Neutrophils": "NEUTp",
    "Neutrophil": "NEUTp",
}


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    for src, dst in COLUMN_ALIASES.items():
        if src in df.columns and dst not in df.columns:
            df[dst] = df[src]

    return df


def to_numeric_frame(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    if {"NEUTp", "LYMp"}.issubset(df.columns):
        df["NLR_p"] = (df["NEUTp"] + 1e-4) / (df["LYMp"] + 1e-4)

    if {"WBC", "LYMp", "PLT"}.issubset(df.columns):
        est_LYMn = df["WBC"] * (df["LYMp"] / 100.0)
        df["PLR_est"] = (df["PLT"] + 1e-4) / (est_LYMn + 1e-4)

    if "HGB" in df.columns:
        df["HGB_low_flag"] = (df["HGB"] < 11.5).astype(float)

    if "MCV" in df.columns:
        df["MCV_micro_flag"] = (df["MCV"] < 80).astype(float)
        df["MCV_macro_flag"] = (df["MCV"] > 100).astype(float)

    if {"WBC", "NEUTp"}.issubset(df.columns):
        df["NEUT_abs"] = df["WBC"] * (df["NEUTp"] / 100.0)

    if {"WBC", "LYMp"}.issubset(df.columns):
        df["LYM_abs"] = df["WBC"] * (df["LYMp"] / 100.0)

    if {"MCV", "RBC"}.issubset(df.columns):
        df["Mentzer"] = df["MCV"] / (df["RBC"] + 1e-6)

    if {"PLT", "NEUT_abs", "LYM_abs"}.issubset(df.columns):
        df["SII"] = (df["PLT"] * df["NEUT_abs"]) / (df["LYM_abs"] + 1e-6)

    if "RBC" in df.columns:
        df["RBC_low_flag"] = (df["RBC"] < 4.2).astype(float)

    return df


def add_thal_indices(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    if {"MCV", "RDW", "HGB"}.issubset(df.columns):
        df["GreenKing"] = (df["MCV"] ** 2 * df["RDW"]) / (df["HGB"] * 100 + 1e-6)

    if {"MCV", "RBC", "HGB"}.issubset(df.columns):
        df["EnglFraser"] = df["MCV"] - df["RBC"] - (5 * df["HGB"]) - 3.4

    if {"MCV", "MCH"}.issubset(df.columns):
        df["ShineLal"] = (df["MCV"] ** 2 * df["MCH"]) / 100.0
        df["Srivastava"] = df["MCV"] / (df["MCH"] + 1e-6)

    if "RDW" in df.columns:
        df["RDW_high_flag"] = (df["RDW"] > 14.5).astype(float)

    if "RBC" in df.columns:
        df["RBC_high_flag"] = (df["RBC"] > 5.0).astype(float)

    return df


def safe_float(value: Any, ndigits: int = 6) -> Optional[float]:
    try:
        if value is None or pd.isna(value):
            return None
        return round(float(value), ndigits)
    except Exception:
        return None


class CBCPredictor:
    def __init__(self, artifact_dir: str = "artifacts"):
        self.artifact_dir = Path(artifact_dir)

        if not self.artifact_dir.exists():
            raise FileNotFoundError(f"Artifact directory not found: {self.artifact_dir}")

        self.meta_path = self.artifact_dir / "meta.joblib"
        if not self.meta_path.exists():
            raise FileNotFoundError(f"Missing artifact: {self.meta_path}")

        self.meta = joblib.load(self.meta_path)

        self.feature_cols: List[str] = list(self.meta["feature_cols"])
        self.label_classes: List[str] = list(self.meta["label_classes"])
        self.imputer_stack = self.meta["imputer_stack"]
        self.scaler_final = self.meta["scaler_final"]

        self.models = self._load_stack_models()

        if not self.models:
            raise FileNotFoundError(
                "No stack models found. Expected stack_seed42.joblib, stack_seed202.joblib, stack_seed777.joblib."
            )

        self.class_order = np.array(self.models[0].classes_)
        self.class_to_col = {int(c): i for i, c in enumerate(self.class_order)}

    def _load_stack_models(self) -> List[Any]:
        preferred_seeds = [42, 202, 777]
        model_paths = []

        for seed in preferred_seeds:
            path = self.artifact_dir / f"stack_seed{seed}.joblib"
            if path.exists():
                model_paths.append(path)

        if not model_paths:
            model_paths = sorted(self.artifact_dir.glob("stack_seed*.joblib"))

        return [joblib.load(path) for path in model_paths]

    def get_sample_input(self) -> Dict[str, float]:
        return {
            "HGB": 12.5,
            "RBC": 4.7,
            "WBC": 7.2,
            "PLT": 250,
            "HCT": 38.0,
            "MCV": 82.0,
            "MCH": 27.0,
            "MCHC": 33.0,
            "RDW": 13.5,
            "NEUTp": 60.0,
            "LYMp": 30.0,
        }

    def model_info(self) -> Dict[str, Any]:
        return {
            "model_type": "Semi-supervised stacked ensemble",
            "features": "Engineered CBC features only",
            "autoencoder_used": False,
            "latent_features_used": False,
            "post_rules_used": False,
            "n_stack_models": len(self.models),
            "classes": self._class_names_in_order(),
            "n_features": len(self.feature_cols),
            "artifact_dir": str(self.artifact_dir),
        }

    def predict_one(
        self,
        values: Dict[str, Optional[float]],
        return_explanation: bool = True,
    ) -> Dict[str, Any]:
        return self.predict_many([values], return_explanation=return_explanation)[0]

    def predict_many(
        self,
        rows: List[Dict[str, Optional[float]]],
        return_explanation: bool = False,
    ) -> List[Dict[str, Any]]:
        if not rows:
            raise ValueError("No input rows provided.")

        input_df = pd.DataFrame(rows)
        x_scaled, x_features, warnings = self._prepare_features(input_df)

        proba = self._predict_proba(x_scaled)
        y_pred = self.class_order[np.argmax(proba, axis=1)]

        results = []
        for i in range(len(input_df)):
            result = self._format_prediction_result(
                row_index=i,
                proba_row=proba[i],
                pred_code=int(y_pred[i]),
                x_row=x_features.iloc[i],
                warnings=warnings,
                return_explanation=return_explanation,
            )
            results.append(result)

        return results

    def _prepare_features(
        self,
        input_df: pd.DataFrame,
    ) -> Tuple[np.ndarray, pd.DataFrame, List[str]]:
        warnings = []

        df = normalize_columns(input_df)
        df = to_numeric_frame(df)

        known_cols = [c for c in df.columns if c in self.feature_cols]
        if not known_cols:
            raise ValueError(
                "No valid CBC columns found. Use columns such as HGB, RBC, WBC, PLT, "
                "HCT, MCV, MCH, MCHC, RDW, NEUTp, LYMp."
            )

        df_fe = add_thal_indices(feature_engineering(df))

        missing_cols = []
        for col in self.feature_cols:
            if col not in df_fe.columns:
                df_fe[col] = np.nan
                missing_cols.append(col)

        if missing_cols:
            preview = ", ".join(missing_cols[:8])
            warnings.append(
                f"{len(missing_cols)} model features were missing and imputed. Examples: {preview}"
            )

        x_features = df_fe[self.feature_cols].copy()

        x_imputed = self.imputer_stack.transform(x_features.values)
        x_scaled = self.scaler_final.transform(x_imputed)

        return x_scaled, x_features, warnings

    def _predict_proba(self, x_scaled: np.ndarray) -> np.ndarray:
        probas = []

        for model in self.models:
            p = model.predict_proba(x_scaled)
            p_aligned = self._align_proba_to_class_order(
                proba=p,
                model_classes=np.array(model.classes_),
            )
            probas.append(p_aligned)

        return np.mean(probas, axis=0)

    def _align_proba_to_class_order(
        self,
        proba: np.ndarray,
        model_classes: np.ndarray,
    ) -> np.ndarray:
        aligned = np.zeros((proba.shape[0], len(self.class_order)), dtype=float)
        target_positions = {int(c): i for i, c in enumerate(self.class_order)}

        for model_col, class_code in enumerate(model_classes):
            class_code = int(class_code)
            if class_code in target_positions:
                aligned[:, target_positions[class_code]] = proba[:, model_col]

        return aligned

    def _format_prediction_result(
        self,
        row_index: int,
        proba_row: np.ndarray,
        pred_code: int,
        x_row: pd.Series,
        warnings: List[str],
        return_explanation: bool,
    ) -> Dict[str, Any]:
        pred_label = self._label_from_code(pred_code)
        confidence = self._proba_for_code(proba_row, pred_code)
        top_3 = self._top_k_predictions(proba_row, k=3)

        result: Dict[str, Any] = {
            "row_index": row_index,
            "prediction": pred_label,
            "confidence": safe_float(confidence),
            "top_3": top_3,
            "warnings": warnings,
        }

        for idx, item in enumerate(top_3, start=1):
            result[f"top_{idx}_class"] = item["class"]
            result[f"top_{idx}_probability"] = item["probability"]

        if return_explanation:
            result["explanation"] = self._build_explanation(
                x_row=x_row,
                prediction=pred_label,
            )

        return result

    def _top_k_predictions(self, proba_row: np.ndarray, k: int = 3) -> List[Dict[str, Any]]:
        order = np.argsort(proba_row)[::-1][:k]

        out = []
        for col_idx in order:
            class_code = int(self.class_order[col_idx])
            out.append(
                {
                    "class": self._label_from_code(class_code),
                    "probability": safe_float(proba_row[col_idx]),
                }
            )

        return out

    def _build_explanation(
        self,
        x_row: pd.Series,
        prediction: str,
    ) -> List[Dict[str, Any]]:
        explanation = []

        def add(feature: str, message: str, value: Any = None):
            explanation.append(
                {
                    "feature": feature,
                    "value": safe_float(value),
                    "message": message,
                }
            )

        hgb = self._row_value(x_row, "HGB")
        mcv = self._row_value(x_row, "MCV")
        plt = self._row_value(x_row, "PLT")
        wbc = self._row_value(x_row, "WBC")
        rbc = self._row_value(x_row, "RBC")
        rdw = self._row_value(x_row, "RDW")
        mentzer = self._row_value(x_row, "Mentzer")
        neutp = self._row_value(x_row, "NEUTp")
        lymp = self._row_value(x_row, "LYMp")

        if hgb is not None:
            if hgb < 11.5:
                add("HGB", "Low hemoglobin supports an anemia-related pattern.", hgb)
            else:
                add("HGB", "Hemoglobin is not below the low-HGB screening threshold.", hgb)

        if mcv is not None:
            if mcv < 80:
                add("MCV", "Low MCV supports a microcytic pattern.", mcv)
            elif mcv > 100:
                add("MCV", "High MCV supports a macrocytic pattern.", mcv)
            else:
                add("MCV", "MCV is within the normocytic range.", mcv)

        if plt is not None:
            if plt < 150:
                add("PLT", "Platelet count is below the common lower reference range.", plt)
            else:
                add("PLT", "Platelet count is not low by simple screening threshold.", plt)

        if wbc is not None:
            if wbc > 11:
                add("WBC", "Elevated WBC may support inflammatory or leukocyte-related abnormality.", wbc)
            elif wbc < 4:
                add("WBC", "Low WBC may indicate leukocyte suppression or abnormality.", wbc)
            else:
                add("WBC", "WBC is not strongly abnormal by simple screening thresholds.", wbc)

        if rbc is not None:
            if rbc < 4.2:
                add("RBC", "Low RBC count supports anemia-related abnormality.", rbc)
            elif rbc > 5.0:
                add("RBC", "High RBC count may support thalassemia-trait-like microcytic patterns.", rbc)

        if rdw is not None and rdw > 14.5:
            add("RDW", "Elevated RDW may support anisocytosis and anemia-related abnormality.", rdw)

        if mentzer is not None:
            if mentzer < 12.5:
                add("Mentzer", "Low Mentzer index can support thalassemia/other microcytic pattern.", mentzer)
            elif mentzer > 13.5:
                add("Mentzer", "Higher Mentzer index can support iron-deficiency anemia pattern.", mentzer)
            else:
                add("Mentzer", "Mentzer index is in a borderline zone.", mentzer)

        if neutp is not None and lymp is not None:
            nlr = (neutp + 1e-4) / (lymp + 1e-4)
            add("NLR_p", "Neutrophil-to-lymphocyte ratio was derived from NEUTp and LYMp.", nlr)

        explanation.append(
            {
                "feature": "prediction_summary",
                "value": None,
                "message": (
                    f"Final prediction is {prediction}. "
                    "This production explanation is based on engineered CBC feature signals. "
                    "For thesis-level XAI, use your saved SHAP analysis outputs."
                ),
            }
        )

        return explanation

    def _class_names_in_order(self) -> List[str]:
        return [self._label_from_code(int(c)) for c in self.class_order]

    def _label_from_code(self, code: int) -> str:
        try:
            return str(self.label_classes[int(code)])
        except Exception:
            return str(code)

    def _proba_for_code(self, proba_row: np.ndarray, class_code: int) -> Optional[float]:
        col = self.class_to_col.get(int(class_code))
        if col is None:
            return None
        return float(proba_row[col])

    @staticmethod
    def _row_value(row: pd.Series, col: str) -> Optional[float]:
        if col not in row.index:
            return None
        return safe_float(row[col])