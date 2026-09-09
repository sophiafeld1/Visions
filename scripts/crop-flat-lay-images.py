#!/usr/bin/env python3
"""Tight centered crop for laid-flat product photos."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TARGET_SIZE = (900, 1200)
PADDING_RATIO = 0.08
BG_THRESHOLD = 238

FLAT_LAY_FILES = [
    "stripe-set/front.jpg",
    "stripe-set/vneck.jpg",
    "stripe-set/vneck-alt.jpg",
    "stripe-set/scoop.jpg",
    "red-polka/front.jpg",
    "red-polka/tag-detail.jpg",
    "teal-skirt/front.jpg",
    "teal-skirt/alt-front.jpg",
    "asymmetric-top/front.jpg",
    "peplum-top/front.jpg",
    "peplum-top/front-alt.jpg",
    "peplum-top/back.jpg",
    "lime-bikini/front.jpg",
    "lime-bikini/set-alt.jpg",
    "lime-bikini/set-alt2.jpg",
    "lime-bikini/top.jpg",
    "lime-bikini/top-alt.jpg",
    "bluepolkafront2.jpg",
    "IMG_9602.jpg",
    "bluepolkaside.jpg",
    "bluepolkaside2.jpg",
    "polkablueback.jpg",
    "2pcbluetopfront.jpg",
    "yellowtopfront.jpg",
    "IMG_9607.jpg",
    "sparkletopfront.jpg",
    "sparkletopfront2.jpg",
    "sparkletopback.jpg",
    "blue-polka/front.jpg",
    "blue-polka/back.jpg",
    "sparkle-top/front.jpg",
    "sparkle-top/back.jpg",
    "redpolkafront.jpg",
]

STRIPE_SOURCES = {
    "stripe-set/front.jpg": "FullSizeRender-df32fe2a-519a-431c-b2ff-92f46da89137.png",
    "stripe-set/vneck.jpg": "FullSizeRender-ff3a2abc-3f23-4d5a-b2a3-baaaa02a09cf.png",
    "stripe-set/vneck-alt.jpg": "FullSizeRender-4f800005-9af3-440a-9a97-40e794ab6f7b.png",
    "stripe-set/scoop.jpg": "FullSizeRender-6d841832-a32f-49a7-9d22-a8d5b31eeb75.png",
}


def is_background_pixel(r: int, g: int, b: int) -> bool:
    return r >= BG_THRESHOLD and g >= BG_THRESHOLD and b >= BG_THRESHOLD


def content_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    rgb = image.convert("RGB")
    pixels = rgb.load()
    width, height = rgb.size
    min_x, min_y = width, height
    max_x, max_y = 0, 0

    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            if not is_background_pixel(r, g, b):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x <= min_x or max_y <= min_y:
        return (0, 0, width, height)
    return (min_x, min_y, max_x + 1, max_y + 1)


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

    return image.crop(box).resize((target_w, target_h), Image.Resampling.LANCZOS)


def crop_flat_lay(image: Image.Image) -> Image.Image:
    left, top, right, bottom = content_bbox(image)
    width = right - left
    height = bottom - top
    pad_x = int(width * PADDING_RATIO)
    pad_y = int(height * PADDING_RATIO)

    img_w, img_h = image.size
    left = max(0, left - pad_x)
    top = max(0, top - pad_y)
    right = min(img_w, right + pad_x)
    bottom = min(img_h, bottom + pad_y)

    trimmed = image.crop((left, top, right, bottom))
    return crop_cover(trimmed, *TARGET_SIZE)


def process_path(path: Path) -> None:
    with Image.open(path) as image:
        cropped = crop_flat_lay(image.convert("RGB"))
        cropped.save(path, quality=90, optimize=True)
        print(f"Cropped {path.relative_to(ROOT)}")


def main() -> None:
    assets = Path("/Users/sophiafeldman/.cursor/projects/Users-sophiafeldman-Documents-Visions/assets")
    images = ROOT / "images"

    for rel_path, source_name in STRIPE_SOURCES.items():
        source = assets / source_name
        dest = images / rel_path
        if source.exists():
            with Image.open(source) as image:
                cropped = crop_flat_lay(image.convert("RGB"))
                dest.parent.mkdir(parents=True, exist_ok=True)
                cropped.save(dest, quality=90, optimize=True)
                print(f"Rebuilt {rel_path} from source")

    for rel_path in FLAT_LAY_FILES:
        if rel_path in STRIPE_SOURCES:
            continue
        path = images / rel_path
        if path.exists():
            process_path(path)
        else:
            print(f"Skipping missing file: {rel_path}")


if __name__ == "__main__":
    main()
