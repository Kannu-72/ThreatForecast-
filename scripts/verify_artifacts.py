from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
files=['prevent_x_transformer_best.pt','prevent_x_training_scaler.joblib','prevent_x_transformer_architecture.json','prevent_x_operational_threshold.json']
for f in files:
    p=ROOT/'artifacts'/f
    print(('FOUND ' if p.exists() else 'MISSING'), p)
    if not p.exists(): raise SystemExit(1)
arch=json.loads((ROOT/'artifacts'/'prevent_x_transformer_architecture.json').read_text())
threshold=json.loads((ROOT/'artifacts'/'prevent_x_operational_threshold.json').read_text())['operational_threshold']
assert threshold==0.05
print('PASS threshold=0.05')
print('PASS production artifacts present')
print('Input contract: (5,45)')
print('Output horizons: +10,+20,+30,+40,+50,+60s')
