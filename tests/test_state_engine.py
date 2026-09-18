from backend.app.packet_features import PacketRecord
from backend.app.state_engine import StateEngine

def p(ts): return PacketRecord(ts,'10.0.0.1','10.0.0.2','TCP',64,60,1000,80,'A',65535)
def test_five_states():
    e=StateEngine()
    for t in [0.1,10.1,20.1,30.1,40.1,50.1]: e.add(p(t))
    assert e.total==5
    assert e.matrix().shape==(5,45)
