"""Build helpers/iconSearch.json from Font Awesome Free's metadata.

Usage: npm pack @fortawesome/fontawesome-free@<version>, untar it, then
  python3 scripts/build-icon-search.py package/metadata/icon-families.json
"""
import json
import sys
from pathlib import Path

families = json.load(open(sys.argv[1]))
index = {}
for name, meta in families.items():
    words = [meta.get("label", "")] + meta.get("search", {}).get("terms", [])
    terms = sorted({str(w).lower() for w in words if w} - {name})
    if terms:
        index[name] = " ".join(terms)

out = Path(__file__).resolve().parent.parent / "helpers" / "iconSearch.json"
out.write_text(json.dumps(index, separators=(",", ":"), sort_keys=True) + "\n")
print(f"{len(index)} icons -> {out}")
