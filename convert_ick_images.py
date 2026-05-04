from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import pillow_heif

pillow_heif.register_heif_opener()

input_dir = Path('/home/ubuntu/upload')
asset_dir = Path('/home/ubuntu/webdev-static-assets/flush-report/ick-factor')
asset_dir.mkdir(parents=True, exist_ok=True)

files = sorted(input_dir.glob('pasted_file_*.HEIC'))
converted = []
for src in files:
    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img).convert('RGB')
        img.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
        out = asset_dir / (src.stem + '.jpg')
        img.save(out, 'JPEG', quality=86, optimize=True, progressive=True)
        converted.append(out)

thumb_w, thumb_h = 360, 270
label_h = 44
cols = 3
rows = (len(converted) + cols - 1) // cols
sheet = Image.new('RGB', (cols * thumb_w, rows * (thumb_h + label_h)), 'white')
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
except Exception:
    font = ImageFont.load_default()

for idx, path in enumerate(converted):
    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img).convert('RGB')
        canvas = Image.new('RGB', (thumb_w, thumb_h), (244, 251, 255))
        img.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        x = (thumb_w - img.width) // 2
        y = (thumb_h - img.height) // 2
        canvas.paste(img, (x, y))
    col = idx % cols
    row = idx // cols
    px = col * thumb_w
    py = row * (thumb_h + label_h)
    sheet.paste(canvas, (px, py))
    label = f'{idx + 1}. {path.name}'
    draw.rectangle((px, py + thumb_h, px + thumb_w, py + thumb_h + label_h), fill=(15, 76, 92))
    draw.text((px + 10, py + thumb_h + 12), label, fill='white', font=font)

sheet_path = asset_dir / 'ick-factor-contact-sheet.jpg'
sheet.save(sheet_path, 'JPEG', quality=90, optimize=True)

print(sheet_path)
for out in converted:
    print(out)
