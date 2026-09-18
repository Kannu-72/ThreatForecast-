import numpy as np
from backend.app.packet_features import FEATURE_NAMES, PacketRecord, build_features

def test_feature_schema():
    assert len(FEATURE_NAMES)==45
    packets=[PacketRecord(1.0,'10.0.0.1','10.0.0.2','TCP',64,60,1000,80,'S',65535),PacketRecord(1.2,'10.0.0.1','10.0.0.2','TCP',64,80,1000,80,'A',65535)]
    x=build_features(packets)
    assert len(x)==45 and np.isfinite(x).all()
