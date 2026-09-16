#!/usr/bin/env python3
"""Convert product HEIC files to cropped 3:4 JPGs."""

from pathlib import Path
import subprocess
import tempfile

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
TARGET_SIZE = (900, 1200)

CONVERSIONS = [
    ("red-polka/red-dot-1.heic", "red-polka/red-dot-1.jpg"),
    ("red-polka/reddotbacktop.heic", "red-polka/reddotbacktop.jpg"),
    ("red-polka/detailreddot.heic", "red-polka/detailreddot.jpg"),
    ("grommettankyellow/Grommet tank cover photo with headband.heic", "grommettankyellow/cover.jpg"),
    ("grommettankyellow/Grommet tank front.HEIC", "grommettankyellow/front.jpg"),
    ("grommettankyellow/grommet tank back.HEIC", "grommettankyellow/back.jpg"),
    ("sparkle-top/Sparkle top front.heic", "sparkle-top/front.jpg"),
    ("sparkle-top/Sparkle top back.heic", "sparkle-top/back.jpg"),
    ("asymmetric-top-blue/assymetricaquafront.heic", "asymmetric-top-blue/front.jpg"),
    ("asymmetric-top-blue/assymetricaquaback.HEIC", "asymmetric-top-blue/back.jpg"),
    ("asymmetric-top-black/blackasymetricfront.heic", "asymmetric-top-black/front.jpg"),
    ("teal-skirt-top-set/Teal set cover.heic", "teal-skirt-top-set/cover.jpg"),
    ("teal-skirt-top-set/Teal set side.HEIC", "teal-skirt-top-set/side.jpg"),
    ("teal-skirt-top-set/teal Set back.heic", "teal-skirt-top-set/back.jpg"),
    ("teal-skirt-top-set/teal set closer look.HEIC", "teal-skirt-top-set/detail.jpg"),
    ("pinkstripebolero/pinkbolerofront.heic", "pinkstripebolero/bolero-front.jpg"),
    ("pinkstripebolero/pinkbolerofrontupclose.HEIC", "pinkstripebolero/bolero-front-close.jpg"),
    ("pinkstripebolero/pinkbolerotankfront.HEIC", "pinkstripebolero/tank-front.jpg"),
    ("pinkstripebolero/pinkbolerotankback.HEIC", "pinkstripebolero/tank-back.jpg"),
    ("bucklebluepolka/bluedotfront.heic", "bucklebluepolka/front.jpg"),
    ("bucklebluepolka/bluedotback.heic", "bucklebluepolka/back.jpg"),
]

REMOVE = [
    "red-polka/flatlayfront.jpg",
    "red-polka/tag-detail.jpg",
    "stripe-set/front.jpg",
    "stripe-set/vneck-alt.jpg",
    "stripe-set/scoop.jpg",
]


def crop_cover(image: Image.Image, target_w: int, target_h: int) -> Image.Image:
    target_ratio = target_w / target_h
    width, height = image.size
    image_ratio = width / height

    if image_ratio > target_ratio:
        new_width = int(height * target_ratio)
        left = (width - new_width) // 2
        box = (left, 0, left + new_width, height)
    else:
        new_height = int(width / target_ratio)
        top = (height - new_height) // 2
        box = (0, top, width, top + new_height)

    cropped = image.crop(box)
    return cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)


def heic_to_jpg(source: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        subprocess.run(
            ["sips", "-s", "format", "jpeg", str(source), "--out", str(tmp_path)],
            check=True,
            capture_output=True,
        )
        with Image.open(tmp_path) as image:
            rgb = ImageOps.exif_transpose(image).convert("RGB")
            cropped = crop_cover(rgb, *TARGET_SIZE)
            cropped.save(dest, quality=90, optimize=True)
            print(f"Saved {dest.relative_to(ROOT)}")
    finally:
        tmp_path.unlink(missing_ok=True)


def main() -> None:
    old_set_dir = IMAGES / "teal-skirt and top SET"
    new_set_dir = IMAGES / "teal-skirt-top-set"
    if old_set_dir.exists() and not new_set_dir.exists():
        old_set_dir.rename(new_set_dir)
        print(f"Renamed folder to {new_set_dir.relative_to(ROOT)}")

    for rel_source, rel_dest in CONVERSIONS:
        source = IMAGES / rel_source
        dest = IMAGES / rel_dest
        if not source.exists():
            raise FileNotFoundError(f"Missing source: {source}")
        heic_to_jpg(source, dest)

    for rel_path in REMOVE:
        path = IMAGES / rel_path
        if path.exists():
            path.unlink()
            print(f"Removed {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
