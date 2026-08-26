"""Convert the licensed Neue Montreal TTFs to self-hosted WOFF2.

Source: C:/Users/User/Downloads/NEUE MONTREAL/
Run:    npm run fonts
Output: public/fonts/*.woff2
"""
import os
import sys

from fontTools.ttLib import TTFont

SRC_DIR = r"C:\Users\User\Downloads\NEUE MONTREAL"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "fonts")

FACES = [
    ("NeueMontreal-Regular.ttf", "NeueMontreal-Regular.woff2"),
    ("NeueMontreal-Medium.ttf", "NeueMontreal-Medium.woff2"),
]


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)
    missing = []
    for src_name, out_name in FACES:
        src = os.path.join(SRC_DIR, src_name)
        if not os.path.isfile(src):
            missing.append(src)
            continue
        font = TTFont(src)
        font.flavor = "woff2"
        out = os.path.join(OUT_DIR, out_name)
        font.save(out)
        print(f"{src_name} -> {out_name}  {os.path.getsize(out):,} bytes")
    if missing:
        print("MISSING SOURCE FILES:", *missing, sep="\n  ", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
