from pathlib import Path
from urllib.request import urlretrieve
ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'data'/'mitre'/'enterprise-attack.json'
URL='https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json'
TARGET.parent.mkdir(parents=True,exist_ok=True)
print('Downloading official MITRE ATT&CK Enterprise STIX 2.1 bundle...')
urlretrieve(URL,TARGET)
print('Saved',TARGET)
