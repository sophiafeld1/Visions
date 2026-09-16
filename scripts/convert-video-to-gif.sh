#!/usr/bin/env bash
# Convert product videos to GIFs that match source speed and color.
set -euo pipefail

convert_to_gif() {
  local input="$1"
  local output="$2"
  local width="$3"
  local fps="$4"
  local palette
  palette="$(mktemp /tmp/visions-palette.XXXXXX.png)"

  local transfer
  transfer="$(ffprobe -v error -select_streams v:0 -show_entries stream=color_transfer -of csv=p=0 "$input")"

  local color_filter
  if [[ "$transfer" == *"arib"* || "$transfer" == "smpte2084" ]]; then
    color_filter="zscale=transfer=linear:npl=100,format=gbrpf32le,zscale=primaries=bt709:transfer=bt709:matrix=bt709,tonemap=tonemap=hable:desat=0,zscale=transfer=bt709:matrix=bt709:primaries=bt709,format=rgb24"
  else
    color_filter="format=rgb24"
  fi

  local scale_filter="fps=${fps},scale=${width}:-2:flags=lanczos"

  ffmpeg -y -i "$input" \
    -vf "${color_filter},${scale_filter},palettegen=max_colors=256:stats_mode=full" \
    "$palette"

  ffmpeg -y -i "$input" -i "$palette" \
    -lavfi "${color_filter},${scale_filter}[x];[x][1:v]paletteuse=dither=sierra2_4a" \
    -loop 0 "$output"

  rm -f "$palette"
  ls -lh "$output"
}

BASE="$(cd "$(dirname "$0")/.." && pwd)/images"

convert_to_gif "$BASE/blacktopTIKTOK.mp4" "$BASE/blacktopTIKTOK.gif" 576 30
convert_to_gif "$BASE/pinkstripebolero/detailvidpinkstripebolero.MOV" "$BASE/pinkstripebolero/detailvidpinkstripebolero.gif" 960 "30000/1001"
convert_to_gif "$BASE/asymmetric-top-blue/f93810fd506d417a8d54d0d4c7216608.MOV" "$BASE/asymmetric-top-blue/f93810fd506d417a8d54d0d4c7216608.gif" 720 30
convert_to_gif "$BASE/asymmetric-top-black/blackassymetricvideo.MOV" "$BASE/asymmetric-top-black/blackassymetricvideo.gif" 960 30

cp "$BASE/asymmetric-top-blue/f93810fd506d417a8d54d0d4c7216608.gif" \
  "$BASE/asymmetric-top-black/f93810fd506d417a8d54d0d4c7216608.gif"

echo "Done."
