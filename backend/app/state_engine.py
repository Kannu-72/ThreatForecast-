from collections import deque
import numpy as np
from .packet_features import build_features

class StateEngine:
    def __init__(self): self.bin=None; self.packets=[]; self.states=deque(maxlen=5); self.total=0
    def reset(self): self.bin=None; self.packets=[]; self.states.clear(); self.total=0
    def add(self,p):
        b=int(p.timestamp//10); out=[]
        if self.bin is None: self.bin=b
        if b<self.bin: return out
        if b!=self.bin:
            if self.packets: out.append(self.close())
            self.bin=b; self.packets=[]
        self.packets.append(p); return out
    def close(self):
        s={'start_ts':self.bin*10,'end_ts':self.bin*10+10,'features':np.asarray(build_features(self.packets),dtype=np.float32),'packet_count':len(self.packets)}
        self.states.append(s); self.total+=1; self.packets=[]; return s
    def flush(self):
        return [self.close()] if self.packets else []
    def matrix(self):
        return np.stack([s['features'] for s in self.states]).astype(np.float32) if len(self.states)==5 else None
