#!/usr/bin/env bash
# Transcode source demo MP4s to short autoplay-muted loops for the site.
#
# Budget (per design doc):
#   - ≤300 KB per WebM
#   - 8 seconds max
#   - 720p downscaled
#   - ≤20 KB AVIF poster
#
# To re-run manually:
#   ./scripts/transcode-videos.sh

set -euo pipefail

SRC_ACC="/Users/bot/Documents/AI Projects/acc_agent/Demo/My AccounTech Buddy.mp4"
SRC_MCP="/Users/bot/Documents/AI Projects/MCP/MCP Filesystem Demo V1.mp4"
OUT="public/videos"

mkdir -p "$OUT"

transcode_loop() {
  local src="$1"
  local name="$2"
  local start="$3"

  # VP9 WebM, 8s, 720p wide max, no audio, CRF 35 (small file, good quality)
  ffmpeg -y -loglevel error \
    -ss "$start" -t 8 -i "$src" \
    -vf "scale='min(1280,iw)':'-2',fps=24" \
    -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -tile-columns 2 \
    -an -pix_fmt yuv420p \
    "$OUT/$name.webm"

  # JPEG poster from the first frame of the same segment. Universal format,
  # small at 720p with q=5, no libaom still-picture flag headaches.
  ffmpeg -y -loglevel error \
    -ss "$start" -i "$src" -frames:v 1 \
    -vf "scale='min(1280,iw)':'-2'" \
    -q:v 5 \
    "$OUT/$name-poster.jpg"

  echo "  $name.webm      $(du -h "$OUT/$name.webm" | cut -f1)"
  echo "  $name-poster    $(du -h "$OUT/$name-poster.jpg" | cut -f1)"
}

echo "Transcoding AccounTech Buddy..."
transcode_loop "$SRC_ACC" "accountech-buddy" "30"

echo "Transcoding MCP Filesystem..."
transcode_loop "$SRC_MCP" "mcp-filesystem" "30"

echo "Done."
