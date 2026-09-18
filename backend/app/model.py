import json
import numpy as np
import joblib
import torch
import torch.nn as nn
from .config import *

class PositionalEncoding(nn.Module):
    def __init__(self,d_model,max_len=5):
        super().__init__()
        position=torch.arange(max_len,dtype=torch.float32).unsqueeze(1)
        div=torch.exp(torch.arange(0,d_model,2,dtype=torch.float32)*(-np.log(10000.0)/d_model))
        pe=torch.zeros(max_len,d_model)
        pe[:,0::2]=torch.sin(position*div); pe[:,1::2]=torch.cos(position*div)
        self.register_buffer('pe',pe.unsqueeze(0))
    def forward(self,x): return x+self.pe[:,:x.size(1)]

class PREVENTXTransformer(nn.Module):
    def __init__(self):
        super().__init__()
        self.input_projection=nn.Linear(45,64)
        self.positional_encoding=PositionalEncoding(64,5)
        layer=nn.TransformerEncoderLayer(d_model=64,nhead=4,dim_feedforward=128,dropout=.1,batch_first=True,norm_first=True)
        self.transformer=nn.TransformerEncoder(layer,num_layers=2)
        self.forecast_head=nn.Sequential(nn.LayerNorm(64),nn.Linear(64,6),nn.Sigmoid())
    def forward(self,x):
        x=self.input_projection(x); x=self.positional_encoding(x); x=self.transformer(x); return self.forecast_head(x[:,-1,:])

class ModelRuntime:
    def __init__(self): self.model=PREVENTXTransformer(); self.scaler=None; self.threshold=THRESHOLD; self.loaded=False
    def load(self):
        for p in [MODEL_PATH,SCALER_PATH,ARCH_PATH,THRESHOLD_PATH]:
            if not p.exists(): raise FileNotFoundError(p)
        ckpt=torch.load(MODEL_PATH,map_location='cpu',weights_only=False)
        self.model.load_state_dict(ckpt['model_state_dict'],strict=True); self.model.eval()
        self.scaler=joblib.load(SCALER_PATH)
        self.threshold=float(json.loads(THRESHOLD_PATH.read_text())['operational_threshold'])
        if self.threshold!=.05: raise ValueError('Frozen threshold must be 0.05')
        self.loaded=True
    def predict(self,states):
        x=np.asarray(states,dtype=np.float32)
        if x.shape!=(5,45): raise ValueError(f'Expected (5,45), got {x.shape}')
        if not np.isfinite(x).all(): raise ValueError('NaN/Inf in input')
        x=self.scaler.transform(x).astype(np.float32)
        with torch.no_grad(): y=self.model(torch.from_numpy(x).unsqueeze(0)).numpy()[0]
        return np.clip(y.astype(np.float32),0,1)
