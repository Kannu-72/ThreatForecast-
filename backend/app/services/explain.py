import hashlib

import numpy as np

from ..packet_features import FEATURE_NAMES


HORIZONS = [
    10,
    20,
    30,
    40,
    50,
    60,
]


class Shap:

    def __init__(self, model):

        self.model = model
        self.cache = {}

    def explain(
        self,
        states,
        horizon,
        max_evals=600
    ):

        if horizon not in HORIZONS:

            raise ValueError(
                "Invalid horizon. "
                "Expected one of "
                f"{HORIZONS}"
            )

        states = np.asarray(
            states,
            dtype=np.float32
        )

        if states.shape != (
            5,
            45
        ):

            raise ValueError(
                "Expected SHAP input "
                "shape (5,45), got "
                f"{states.shape}"
            )

        key = hashlib.sha256(
            states.tobytes()
            + str(horizon).encode()
        ).hexdigest()

        if key in self.cache:
            return self.cache[key]

        horizon_index = HORIZONS.index(
            horizon
        )

        # ----------------------------------------------------
        # Build a realistic background
        # ----------------------------------------------------
        background = self._background(
            states
        )

        flat_states = states.reshape(
            1,
            225
        )

        flat_background = background.reshape(
            1,
            225
        )

        names = [
            f"t{t + 1}_{feature}"
            for t in range(5)
            for feature in FEATURE_NAMES
        ]

        # ----------------------------------------------------
        # Model function
        # ----------------------------------------------------
        def predict_flat(x):

            x = np.asarray(
                x,
                dtype=np.float32
            )

            outputs = []

            for row in x:

                matrix = row.reshape(
                    5,
                    45
                )

                prediction = self.model.predict(
                    matrix
                )

                outputs.append(
                    float(
                        prediction[
                            horizon_index
                        ]
                    )
                )

            return np.asarray(
                outputs,
                dtype=np.float32
            )

        # ----------------------------------------------------
        # SHAP
        # ----------------------------------------------------
        import shap

        masker = shap.maskers.Independent(
            flat_background
        )

        explainer = shap.Explainer(
            predict_flat,
            masker,
            feature_names=names,
            algorithm="permutation"
        )

        # Permutation SHAP requires at least
        # 2 * number_of_features + 1 evaluations.
        minimum_evals = (
            2 * 225 + 1
        )

        evals = max(
            int(max_evals),
            minimum_evals
        )

        explanation = explainer(
            flat_states,
            max_evals=evals
        )

        values = np.asarray(
            explanation.values[0],
            dtype=np.float32
        ).reshape(
            5,
            45
        )

        # ----------------------------------------------------
        # Aggregate across the 5 temporal states
        # ----------------------------------------------------

        aggregate_values = values.mean(
            axis=0
        )

        contributions = []

        for feature, value in zip(
            FEATURE_NAMES,
            aggregate_values
        ):

            contributions.append({
                "feature":
                    feature,

                "shap_value":
                    float(value),

                "abs_shap":
                    float(abs(value))
            })

        contributions.sort(
            key=lambda x: x["abs_shap"],
            reverse=True
        )

        # ----------------------------------------------------
        # Temporal contribution
        # ----------------------------------------------------

        temporal_rows = []

        for t in range(5):

            temporal_values = values[t]

            score = float(
                temporal_values.sum()
            )

            magnitude = float(
                np.abs(
                    temporal_values
                ).sum()
            )

            temporal_rows.append({
                "state_index":
                    t + 1,

                "relative_time":
                    f"-{(5 - t) * 10}s",

                "shap_sum":
                    score,

                "abs_shap_sum":
                    magnitude,
            })

        temporal_rows.sort(
            key=lambda x: x["abs_shap_sum"],
            reverse=True
        )

        # ----------------------------------------------------
        # State × feature detail
        # ----------------------------------------------------

        temporal_feature_contributions = []

        for t in range(5):

            row = []

            for feature, value in zip(
                FEATURE_NAMES,
                values[t]
            ):

                row.append({
                    "feature":
                        feature,

                    "shap_value":
                        float(value),

                    "abs_shap":
                        float(abs(value))
                })

            row.sort(
                key=lambda x: x["abs_shap"],
                reverse=True
            )

            temporal_feature_contributions.append({
                "state_index":
                    t + 1,

                "relative_time":
                    f"-{(5 - t) * 10}s",

                "top_features":
                    row[:8]
            })

        prediction = self.model.predict(
            states
        )

        risk_score = float(
            prediction[horizon_index]
        )

        out = {
            "horizon_seconds":
                horizon,

            "risk_score":
                risk_score,

            "feature_contributions":
                contributions,

            "top_positive": [
                x
                for x in contributions
                if x["shap_value"] > 0
            ][:10],

            "top_negative": [
                x
                for x in contributions
                if x["shap_value"] < 0
            ][:10],

            "temporal_contributions":
                temporal_rows,

            "temporal_feature_contributions":
                temporal_feature_contributions,

            "baseline_description":
                "Training-data feature mean / fallback recent-state baseline",
        }

        self.cache[key] = out

        return out

    # ========================================================
    # Background construction
    # ========================================================

    def _background(self, states):

        scaler = getattr(
            self.model,
            "scaler",
            None
        )

        if scaler is not None:

            mean = getattr(
                scaler,
                "mean_",
                None
            )

            if mean is not None:

                mean = np.asarray(
                    mean,
                    dtype=np.float32
                )

                if mean.shape == (
                    45,
                ):

                    return np.tile(
                        mean,
                        (5, 1)
                    )

        # Safe fallback:
        # recent observed state mean
        return np.mean(
            states,
            axis=0,
            keepdims=True
        ).repeat(
            5,
            axis=0
        )