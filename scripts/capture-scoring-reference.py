"""Capture existing public coefficient literals without running site JavaScript."""
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

url = 'https://yourpurepath.com/script.js'
with urlopen(Request(url, headers={'User-Agent': 'YourPurePath coefficient reference'}), timeout=20) as response:
    raw = response.read()
source = raw.decode('utf-8')
weights_block = re.search(r'const weights = \{([\s\S]*?)\};', source).group(1)
maps_block = re.search(r'const scoringMaps = \{([\s\S]*?)\};', source).group(1)
weights = {key: int(value) for key, value in re.findall(r'(\w+):\s*(\d+)', weights_block)}
maps = {}
for name, block in re.findall(r'(\w+):\s*\{([^}]+)\}', maps_block):
    maps[name] = {(json.loads(key) if key.startswith('"') else key): float(value) for key, value in re.findall(r'("[^"]+"|[A-Za-z]\w*):\s*([0-9.]+)', block)}
if len(weights) != 19 or len(maps) != 18 or sum(weights.values()) != 98:
    raise RuntimeError('Source coefficients changed; review before replacing reference.')
reference = {
    'source_url': url, 'retrieved_at_utc': datetime.now(timezone.utc).isoformat(), 'source_js_sha256': hashlib.sha256(raw).hexdigest(),
    'weights': weights, 'scoringMaps': maps,
    'original_conversion': 'score = round(weightedTotal / totalWeight * 100); adjustment = clamp(((70 - score) / 30) * 10, -12, 15); age = round(clamp(actualAge + adjustment, 18, 95));',
    'local_conversion_change': 'Same score, adjustment coefficients and rounding; remove final 18/95 output-age caps.',
    'original_bmi_factors': '18.5..24.9 => 1; 25..29.9 or 17..<18.5 => 0.68; 30..34.9 or 16..<17 => 0.34; otherwise 0.12.',
    'local_bmi_change': 'Continuous half-open bands at 25, 30 and 35, with unchanged factor values.'
}
target = Path(__file__).resolve().parents[1] / 'ILLUSTRATIVE-SCORING-REFERENCE.json'
target.write_text(json.dumps(reference, indent=2) + '\n', encoding='utf-8')
print(f'Captured {len(weights)} weights and {len(maps)} option maps; no source code executed.')
