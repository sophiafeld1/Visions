#!/usr/bin/env python3
"""Import and crop new product images into images/<product>/ subfolders."""

from pathlib import Path
from shutil import copy2

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path("/Users/sophiafeldman/.cursor/projects/Users-sophiafeldman-Documents-Visions/assets")
IMAGES = ROOT / "images"
TARGET_SIZE = (900, 1200)

IMPORTS = {
    "teal-skirt": [
        ("FullSizeRender-f05e942e-b9d2-499e-9f16-dcbd15b054de.png", "front.jpg"),
        ("FullSizeRender-0e5810cd-3b0f-48d8-861c-dcdc69e1bcc4.png", "alt-front.jpg"),
        ("IMG_9910-a6e19184-e45d-4af7-bc7a-a9c88b82dbf1.png", "detail.jpg"),
    ],
    "red-polka": [
        ("IMG_9928-574de266-4246-43e1-a82f-90891aa6c72b.png", "front.jpg"),
        ("IMG_9139-c8acfcea-9edc-45d2-a8cc-80b886b00707.png", "model-front.jpg"),
        ("IMG_9930-904e7185-29bb-4cea-97c4-19c9c34b4a10.png", "tag-detail.jpg"),
        ("IMG_9128-62c26387-ead5-42c8-8277-42fbcfb59d32.png", "model-back.jpg"),
    ],
    "lime-bikini": [
        ("IMG_9912-f9083ca0-493b-4eb4-b16c-dff5be2f54f3.png", "front.jpg"),
        ("FullSizeRender-ba02bce7-7e71-4527-a6bd-fca94379de71.png", "set-alt.jpg"),
        ("FullSizeRender-5d58c95c-f549-4e0c-bd31-bc06dbbd5c3f.png", "top.jpg"),
        ("IMG_9915-9d344882-f489-4d7c-84fb-86801bfb0d83.png", "set-alt2.jpg"),
        ("IMG_9916-69e5f69b-10bb-4bea-b992-689292156829.png", "top-alt.jpg"),
    ],
    "stripe-set": [
        ("FullSizeRender-df32fe2a-519a-431c-b2ff-92f46da89137.png", "front.jpg"),
        ("FullSizeRender-ff3a2abc-3f23-4d5a-b2a3-baaaa02a09cf.png", "vneck.jpg"),
        ("FullSizeRender-4f800005-9af3-440a-9a97-40e794ab6f7b.png", "vneck-alt.jpg"),
        ("FullSizeRender-6d841832-a32f-49a7-9d22-a8d5b31eeb75.png", "scoop.jpg"),
    ],
    "peplum-top": [
        ("FullSizeRender-936337c4-864e-4d2f-8afc-f69cb6e8caf0.png", "front.jpg"),
        ("FullSizeRender-4f30db66-29ef-4dcb-a19b-569dc1f80183.png", "front-alt.jpg"),
        ("FullSizeRender-6770e465-7ce0-43a1-8e94-36c447f35ac1.png", "back.jpg"),
    ],
    "asymmetric-top": [
        ("FullSizeRender-220e09dd-7746-4ff2-ab3b-344d3b33e9ab.png", "front.jpg"),
        ("FullSizeRender-4d390efc-9c7f-4fb9-b23e-f2a68f8c32b5.png", "detail.jpg"),
    ],
}

MOV_SOURCE = Path(
    "/Users/sophiafeldman/Library/Messages/Attachments/87/07/"
    "11CC577A-C226-4E3C-84BD-673981EF892E/IMG_9911.MOV"
)


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
    for folder, files in IMPORTS.items():
        out_dir = IMAGES / folder
        out_dir.mkdir(parents=True, exist_ok=True)

        for source_name, dest_name in files:
            source = ASSETS / source_name
            dest = out_dir / dest_name
            if not source.exists():
                raise FileNotFoundError(f"Missing asset: {source}")

            with Image.open(source) as image:
                rgb = image.convert("RGB")
                cropped = crop_cover(rgb, *TARGET_SIZE)
                cropped.save(dest, quality=90, optimize=True)
                print(f"Saved {dest.relative_to(ROOT)}")

    mov_dest = IMAGES / "red-polka" / "video.mov"
    if MOV_SOURCE.exists():
        copy2(MOV_SOURCE, mov_dest)
        print(f"Saved {mov_dest.relative_to(ROOT)}")
    else:
        print(f"Warning: MOV not found at {MOV_SOURCE}")


if __name__ == "__main__":
    main()
