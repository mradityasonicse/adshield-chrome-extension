import os
from PIL import Image, ImageDraw

def create_shield_icon(size):
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = int(canvas_size * 0.08)
    w = canvas_size - 2 * margin
    h = canvas_size - 2 * margin
    cx = canvas_size // 2

    top_y = margin + int(h * 0.1)
    bottom_y = margin + int(h * 0.95)
    left_x = margin + int(w * 0.1)
    right_x = margin + int(w * 0.9)
    mid_y = margin + int(h * 0.55)

    shield_points = [
        (cx, top_y),
        (right_x, top_y + int(h * 0.08)),
        (right_x, mid_y),
        (cx, bottom_y),
        (left_x, mid_y),
        (left_x, top_y + int(h * 0.08)),
    ]

    # Outer shield (Emerald #10b981)
    draw.polygon(shield_points, fill=(16, 185, 129, 255))

    # Inner shield background
    inner_margin = int(canvas_size * 0.07)
    inner_top_y = top_y + inner_margin
    inner_bottom_y = bottom_y - inner_margin
    inner_left_x = left_x + inner_margin
    inner_right_x = right_x - inner_margin
    inner_mid_y = mid_y - int(inner_margin * 0.3)

    inner_points = [
        (cx, inner_top_y),
        (inner_right_x, inner_top_y + int(h * 0.06)),
        (inner_right_x, inner_mid_y),
        (cx, inner_bottom_y),
        (inner_left_x, inner_mid_y),
        (inner_left_x, inner_top_y + int(h * 0.06)),
    ]
    draw.polygon(inner_points, fill=(15, 23, 42, 240)) # Slate dark core

    # Center checkmark
    p1 = (cx - int(w * 0.22), mid_y - int(h * 0.02))
    p2 = (cx - int(w * 0.05), mid_y + int(h * 0.15))
    p3 = (cx + int(w * 0.26), mid_y - int(h * 0.18))

    line_w = max(int(canvas_size * 0.08), 2)
    draw.line([p1, p2, p3], fill=(16, 185, 129, 255), width=line_w, joint="curve")

    res = img.resize((size, size), Image.Resampling.LANCZOS)
    return res

output_dir = r"D:\adshield-chrome-extension\icons"
for s in [16, 32, 48, 128]:
    icon = create_shield_icon(s)
    out_path = os.path.join(output_dir, f"icon{s}.png")
    icon.save(out_path, "PNG")
    print(f"Generated {out_path} ({s}x{s})")
