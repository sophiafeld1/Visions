#!/usr/bin/env bash
# Direct video → GIF conversion. No color, speed, or crop changes.
set -euo pipefail

convert_to_gif() {
  local input="$1"
  local output="$2"
  echo "Converting $(basename "$input")..."
  ffmpeg -y -loglevel error -i "$input" \
    -filter_complex "split[s0][s1];[s0]palettegen=stats_mode=full[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
    -loop 0 "$output"
  ls -lh "$output"
}

BASE="$(cd "$(dirname "$0")/.." && pwd)/images"

convert_to_gif "$BASE/blacktopTIKTOK.mp4" "$BASE/blacktopTIKTOK.gif"
convert_to_gif "$BASE/pinkstripebolero/detailvidpinkstripebolero.MOV" "$BASE/pinkstripebolero/detailvidpinkstripebolero.gif"
convert_to_gif "$BASE/asymmetric-top-blue/f93810fd506d417a8d54d0d4c7216608.MOV" "$BASE/asymmetric-top-blue/f93810fd506d417a8d54d0d4c7216608.gif"
convert_to_gif "$BASE/asymmetric-top-black/blackassymetricvideo.MOV" "$BASE/asymmetric-top-black/blackassymetricvideo.gif"

cp "$BASE/asymmetric-top-blue/f93810fd506d417a8d54d0d4c7216608.gif" \
  "$BASE/asymmetric-top-black/f93810fd506d417a8d54d0d4c7216608.gif"

echo "Done."
