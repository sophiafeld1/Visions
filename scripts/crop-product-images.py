#!/usr/bin/env python3
"""Center-crop product images to a uniform 3:4 aspect ratio."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
TARGET_SIZE = (900, 1200)  # 3:4 portrait

FILES = [
    "blacktopfront2.jpg",
    "blacktopfront3.jpg",
    "blacktopback1.jpg",
    "blacktopback3.jpg",
    "bluedotfront3.jpg",
    "bluedotsideALT.jpg",
    "bluedotside.jpg",
    "reddotfront.jpg",
    "reddotside.jpg",
    "reddotside2.jpg",
    "sparkletopfront1.jpg",
    "sparkletopback.jpg",
    "sparkletop2.jpg",
    "yellowtopandheadband.jpg",
    "yellowandheadbandback.jpg",
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


def main() -> None:
    backup_dir = IMAGES / "_originals"
    backup_dir.mkdir(exist_ok=True)

    for filename in FILES:
        path = IMAGES / filename
        if not path.exists():
            print(f"Skipping missing file: {filename}")
            continue

        backup_path = backup_dir / filename
        if not backup_path.exists():
            backup_path.write_bytes(path.read_bytes())

        with Image.open(path) as image:
            rgb = image.convert("RGB")
            cropped = crop_cover(rgb, *TARGET_SIZE)
            cropped.save(path, quality=90, optimize=True)
            print(f"Cropped {filename} -> {TARGET_SIZE[0]}x{TARGET_SIZE[1]}")


if __name__ == "__main__":
    main()
