#!/usr/bin/env python3
"""Re-crop product images from untouched full-resolution sources."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
TARGET_SIZE = (900, 1200)

# Damaged shop filenames -> untouched source files still in images/
RESTORE_FROM = {
    "blacktopfront2.jpg": "blacktopfront.jpg",
    "blacktopfront3.jpg": "blacktopfront.jpg",
    "blacktopback1.jpg": "blacktopback2.jpg",
    "blacktopback3.jpg": "blacktopback4.PNG",
    "bluedotfront3.jpg": "bluedotfront2.jpg",
    "bluedotsideALT.jpg": "bluedotback.jpg",
    "bluedotside.jpg": "bluedotfront.jpg",
}


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


def restore_file(output_name: str, source_name: str) -> None:
    source = IMAGES / source_name
    output = IMAGES / output_name

    if not source.exists():
        print(f"Skip {output_name}: missing source {source_name}")
        return

    with Image.open(source) as image:
        rgb = image.convert("RGB")
        cropped = crop_cover(rgb, *TARGET_SIZE)
        cropped.save(output, quality=92, optimize=True)

    print(f"Restored {output_name} from {source_name}")


def main() -> None:
    for output_name, source_name in RESTORE_FROM.items():
        restore_file(output_name, source_name)

    missing = [
        "reddotfront.jpg",
        "reddotside.jpg",
        "reddotside2.jpg",
        "sparkletopfront1.jpg",
        "sparkletopback.jpg",
        "sparkletop2.jpg",
        "yellowtopandheadband.jpg",
        "yellowandheadbandback.jpg",
    ]

    print("\nStill need originals re-uploaded for:")
    for name in missing:
        print(f"  - {name}")


if __name__ == "__main__":
    main()
