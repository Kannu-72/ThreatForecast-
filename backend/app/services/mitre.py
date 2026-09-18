import json
from pathlib import Path

from ..config import MITRE_DIR
from ..packet_features import FEATURE_NAMES


# ============================================================
# PREVENT-X MITRE ATT&CK / ATTACK-TYPE CONTEXT ENGINE
# ============================================================

CATALOG = {
    "T1046": (
        "Network Service Scanning",
        "Discovery",
    ),
    "T1498": (
        "Network Denial of Service",
        "Impact",
    ),
    "T1110": (
        "Brute Force",
        "Credential Access",
    ),
    "T1190": (
        "Exploit Public-Facing Application",
        "Initial Access",
    ),
}


class Mitre:

    def __init__(self):

        self.catalog = dict(CATALOG)
        self.full = False

        path = MITRE_DIR / "enterprise-attack.json"

        if path.exists():

            try:

                payload = json.loads(
                    path.read_text(
                        encoding="utf-8"
                    )
                )

                for obj in payload.get(
                    "objects",
                    []
                ):

                    if obj.get("type") != "attack-pattern":
                        continue

                    ids = [
                        ref.get("external_id")
                        for ref in obj.get(
                            "external_references",
                            []
                        )
                        if ref.get(
                            "source_name"
                        ) == "mitre-attack"
                    ]

                    if not ids:
                        continue

                    technique_id = ids[0]

                    tactics = ", ".join(
                        phase.get(
                            "phase_name",
                            ""
                        )
                        for phase in obj.get(
                            "kill_chain_phases",
                            []
                        )
                        if phase.get("phase_name")
                    )

                    self.catalog[
                        technique_id
                    ] = (
                        obj.get(
                            "name",
                            technique_id
                        ),
                        tactics,
                    )

                self.full = True

            except Exception:
                self.full = False

    # ========================================================
    # Main public method
    # ========================================================

    def candidates(self, state):

        if not state:
            return []

        features = state.get(
            "features",
            []
        )

        if len(features) != 45:
            return []

        f = dict(
            zip(
                FEATURE_NAMES,
                features
            )
        )

        candidates = []

        # ----------------------------------------------------
        # PORT SCANNING
        # ----------------------------------------------------

        scan_score = self._score_port_scan(f)

        if scan_score >= 0.25:

            candidates.append(
                self._attack(
                    attack_type="Port Scan",
                    technique_id="T1046",
                    score=scan_score,
                    severity=self._severity(
                        scan_score
                    ),
                    evidence=[
                        "destination-port diversity",
                        "SYN ratio",
                        "unique flow pairs",
                    ],
                )
            )

        # ----------------------------------------------------
        # DDoS / NETWORK DENIAL OF SERVICE
        # ----------------------------------------------------

        ddos_score = self._score_ddos(f)

        if ddos_score >= 0.25:

            candidates.append(
                self._attack(
                    attack_type="DDoS / DoS",
                    technique_id="T1498",
                    score=ddos_score,
                    severity=self._severity(
                        ddos_score
                    ),
                    evidence=[
                        "packet rate",
                        "byte rate",
                        "packet volume",
                    ],
                )
            )

        # ----------------------------------------------------
        # BRUTE FORCE
        # ----------------------------------------------------

        brute_score = self._score_bruteforce(f)

        if brute_score >= 0.25:

            candidates.append(
                self._attack(
                    attack_type="Brute Force",
                    technique_id="T1110",
                    score=brute_score,
                    severity=self._severity(
                        brute_score
                    ),
                    evidence=[
                        "connection intensity",
                        "SYN activity",
                        "destination-port concentration",
                    ],
                )
            )

        # ----------------------------------------------------
        # WEB / PUBLIC-FACING SERVICE ATTACK
        # ----------------------------------------------------

        web_score = self._score_web(f)

        if web_score >= 0.25:

            candidates.append(
                self._attack(
                    attack_type="Public-Facing Service Attack",
                    technique_id="T1190",
                    score=web_score,
                    severity=self._severity(
                        web_score
                    ),
                    evidence=[
                        "service concentration",
                        "flow concentration",
                        "abnormal connection activity",
                    ],
                )
            )

        # ----------------------------------------------------
        # RECONNAISSANCE
        # ----------------------------------------------------

        recon_score = self._score_recon(f)

        if recon_score >= 0.25:

            candidates.append(
                self._attack(
                    attack_type="Network Reconnaissance",
                    technique_id="T1046",
                    score=recon_score,
                    severity=self._severity(
                        recon_score
                    ),
                    evidence=[
                        "source diversity",
                        "destination diversity",
                        "flow diversity",
                    ],
                )
            )

        # ----------------------------------------------------
        # Rank candidates
        # ----------------------------------------------------

        candidates.sort(
            key=lambda item: item["score"],
            reverse=True
        )

        # Mark primary candidate
        for index, item in enumerate(
            candidates
        ):
            item["primary"] = (
                index == 0
            )

        return candidates

    # ========================================================
    # Attack scoring
    # ========================================================

    def _score_port_scan(self, f):

        dst_ports = min(
            float(f.get(
                "dst_port_count",
                0
            )) / 50.0,
            1.0
        )

        syn_ratio = min(
            max(
                float(f.get(
                    "syn_ratio",
                    0
                )),
                0.0
            ),
            1.0
        )

        flow_diversity = min(
            float(f.get(
                "unique_flow_pairs",
                0
            )) / 1000.0,
            1.0
        )

        return self._clip(
            0.40 * dst_ports
            + 0.35 * syn_ratio
            + 0.25 * flow_diversity
        )

    def _score_ddos(self, f):

        pps = min(
            float(f.get(
                "packets_per_sec",
                0
            )) / 5000.0,
            1.0
        )

        bps = min(
            float(f.get(
                "bytes_per_sec",
                0
            )) / 5_000_000.0,
            1.0
        )

        packets = min(
            float(f.get(
                "packet_count",
                0
            )) / 50_000.0,
            1.0
        )

        return self._clip(
            0.45 * pps
            + 0.30 * bps
            + 0.25 * packets
        )

    def _score_bruteforce(self, f):

        pps = min(
            float(f.get(
                "packets_per_sec",
                0
            )) / 1000.0,
            1.0
        )

        syn_ratio = min(
            max(
                float(f.get(
                    "syn_ratio",
                    0
                )),
                0.0
            ),
            1.0
        )

        dst_ports = min(
            float(f.get(
                "dst_port_count",
                0
            )) / 10.0,
            1.0
        )

        source_share = self._clip(
            float(f.get(
                "max_src_ip_share",
                0
            ))
        )

        return self._clip(
            0.30 * pps
            + 0.25 * syn_ratio
            + 0.20 * dst_ports
            + 0.25 * source_share
        )

    def _score_web(self, f):

        dst_ports = float(
            f.get(
                "dst_port_count",
                0
            )
        )

        tcp_ratio = self._clip(
            float(f.get(
                "tcp_packet_ratio",
                0
            ))
        )

        flow_share = self._clip(
            float(f.get(
                "max_dst_port_share",
                0
            ))
        )

        # HTTP/HTTPS-oriented service behavior
        service_signal = (
            1.0
            if dst_ports <= 10
            else max(
                0.0,
                1.0 - (
                    dst_ports / 100.0
                )
            )
        )

        return self._clip(
            0.35 * service_signal
            + 0.35 * tcp_ratio
            + 0.30 * flow_share
        )

    def _score_recon(self, f):

        srcs = min(
            float(f.get(
                "src_ip_count",
                0
            )) / 100.0,
            1.0
        )

        dsts = min(
            float(f.get(
                "dst_ip_count",
                0
            )) / 100.0,
            1.0
        )

        flows = min(
            float(f.get(
                "unique_flow_pairs",
                0
            )) / 1000.0,
            1.0
        )

        ports = min(
            float(f.get(
                "dst_port_count",
                0
            )) / 100.0,
            1.0
        )

        return self._clip(
            0.25 * srcs
            + 0.25 * dsts
            + 0.25 * flows
            + 0.25 * ports
        )

    # ========================================================
    # Result builder
    # ========================================================

    def _attack(
        self,
        attack_type,
        technique_id,
        score,
        severity,
        evidence,
    ):

        name, tactic = self.catalog.get(
            technique_id,
            CATALOG.get(
                technique_id,
                (
                    technique_id,
                    "Unknown",
                )
            )
        )

        return {
            "attack_type":
                attack_type,

            "technique_id":
                technique_id,

            "name":
                name,

            "tactic":
                tactic,

            "score":
                round(
                    float(score),
                    4
                ),

            "confidence_label":
                self._confidence_label(
                    score
                ),

            "severity":
                severity,

            "evidence":
                evidence,

            "primary":
                False,

            "interpretation":
                (
                    "Heuristic network context; "
                    "not proof of technique execution."
                ),
        }

    # ========================================================
    # Helpers
    # ========================================================

    @staticmethod
    def _clip(value):

        return min(
            1.0,
            max(
                0.0,
                float(value)
            )
        )

    @staticmethod
    def _severity(score):

        if score >= 0.80:
            return "CRITICAL"

        if score >= 0.60:
            return "HIGH"

        if score >= 0.40:
            return "MEDIUM"

        return "LOW"

    @staticmethod
    def _confidence_label(score):

        if score >= 0.80:
            return "High"

        if score >= 0.60:
            return "Moderate-High"

        if score >= 0.40:
            return "Moderate"

        return "Low"