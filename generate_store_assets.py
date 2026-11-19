import os
from PIL import Image, ImageDraw, ImageFont

desktop_dir = r"C:\Users\OMEN\Desktop"

# -------------------------------------------------------------
# 1. GENERATE LOGO (300 x 300 px)
# -------------------------------------------------------------
def generate_logo():
    size = 300
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (10, 15, 29, 255)) # Dark slate bg
    draw = ImageDraw.Draw(img)

    margin = int(canvas_size * 0.15)
    w = canvas_size - 2 * margin
    h = canvas_size - 2 * margin
    cx = canvas_size // 2

    top_y = margin + int(h * 0.08)
    bottom_y = margin + int(h * 0.95)
    left_x = margin + int(w * 0.1)
    right_x = margin + int(w * 0.9)
    mid_y = margin + int(h * 0.55)

    shield_outer = [
        (cx, top_y),
        (right_x, top_y + int(h * 0.08)),
        (right_x, mid_y),
        (cx, bottom_y),
        (left_x, mid_y),
        (left_x, top_y + int(h * 0.08)),
    ]
    # Glowing emerald border
    draw.polygon(shield_outer, fill=(16, 185, 129, 255))

    # Inner core
    inner_m = int(canvas_size * 0.05)
    shield_inner = [
        (cx, top_y + inner_m),
        (right_x - inner_m, top_y + int(h * 0.08) + int(inner_m * 0.5)),
        (right_x - inner_m, mid_y - int(inner_m * 0.3)),
        (cx, bottom_y - inner_m),
        (left_x + inner_m, mid_y - int(inner_m * 0.3)),
        (left_x + inner_m, top_y + int(h * 0.08) + int(inner_m * 0.5)),
    ]
    draw.polygon(shield_inner, fill=(15, 23, 42, 255))

    # Center checkmark
    p1 = (cx - int(w * 0.2), mid_y - int(h * 0.02))
    p2 = (cx - int(w * 0.05), mid_y + int(h * 0.15))
    p3 = (cx + int(w * 0.25), mid_y - int(h * 0.18))
    draw.line([p1, p2, p3], fill=(16, 185, 129, 255), width=int(canvas_size * 0.06), joint="curve")

    logo = img.resize((size, size), Image.Resampling.LANCZOS)
    out_path = os.path.join(desktop_dir, "adshield-logo-300x300.png")
    logo.save(out_path, "PNG")
    print(f"Generated {out_path}")

# -------------------------------------------------------------
# 2. GENERATE SCREENSHOT (1280 x 800 px)
# -------------------------------------------------------------
def generate_screenshot():
    w, h = 1280, 800
    img = Image.new("RGBA", (w, h), (10, 15, 29, 255))
    draw = ImageDraw.Draw(img)

    # Ambient glow gradients
    for r in range(400, 0, -10):
        alpha = int((1 - r / 400) * 40)
        draw.ellipse([640 - r, 380 - r, 640 + r, 380 + r], fill=(16, 185, 129, alpha))

    # Header Text
    draw.text((640, 70), "AdShield Pro - Manifest V3 Ad Blocker", fill=(255, 255, 255), anchor="mm")
    draw.text((640, 105), "Fast, Lightweight & Privacy-First Browsing Protection", fill=(148, 163, 184), anchor="mm")

    # Center Popup Card Mockup (380 x 560 px)
    card_x1, card_y1 = 450, 150
    card_x2, card_y2 = 830, 720
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=16, fill=(15, 23, 42, 245), outline=(16, 185, 129, 100), width=2)

    # Popup Header inside card
    draw.rounded_rectangle([card_x1 + 20, card_y1 + 20, card_x1 + 54, card_y1 + 54], radius=8, fill=(16, 185, 129, 255))
    draw.text((card_x1 + 65, card_y1 + 28), "AdShield PRO", fill=(255, 255, 255))
    draw.text((card_x1 + 65, card_y1 + 44), "Protection Active", fill=(16, 185, 129))

    # Center Shield Icon in card
    scx, scy = 640, 260
    draw.ellipse([scx - 45, scy - 45, scx + 45, scy + 45], fill=(30, 41, 59), outline=(16, 185, 129), width=2)
    # Checkmark inside button
    draw.line([(scx - 16, scy - 2), (scx - 4, scy + 12), (scx + 20, scy - 14)], fill=(16, 185, 129), width=4)

    # Site Status Card
    draw.rounded_rectangle([card_x1 + 20, card_y1 + 170, card_x2 - 20, card_y1 + 225], radius=10, fill=(30, 41, 59, 200), outline=(255, 255, 255, 20), width=1)
    draw.text((card_x1 + 35, card_y1 + 185), "youtube.com", fill=(255, 255, 255))
    draw.text((card_x1 + 35, card_y1 + 203), "Protected", fill=(16, 185, 129))
    draw.rounded_rectangle([card_x2 - 130, card_y1 + 182, card_x2 - 30, card_y1 + 212], radius=6, fill=(255, 255, 255, 25))
    draw.text((card_x2 - 80, card_y1 + 197), "Pause Site", fill=(203, 213, 225), anchor="mm")

    # Metrics Grid inside card
    # Box 1: Blocked on page
    bx1, by1 = card_x1 + 20, card_y1 + 245
    bx2, by2 = card_x1 + 180, card_y1 + 320
    draw.rounded_rectangle([bx1, by1, bx2, by2], radius=10, fill=(16, 185, 129, 30), outline=(16, 185, 129, 80), width=1)
    draw.text((bx1 + 15, by1 + 14), "18", fill=(255, 255, 255))
    draw.text((bx1 + 15, by1 + 44), "BLOCKED ON PAGE", fill=(148, 163, 184))

    # Box 2: Total blocked
    bx3, by3 = card_x1 + 200, card_y1 + 245
    bx4, by4 = card_x2 - 20, card_y1 + 320
    draw.rounded_rectangle([bx3, by3, bx4, by4], radius=10, fill=(30, 41, 59, 200), outline=(255, 255, 255, 20), width=1)
    draw.text((bx3 + 15, by1 + 14), "1,420", fill=(255, 255, 255))
    draw.text((bx3 + 15, by1 + 44), "ALL-TIME BLOCKED", fill=(148, 163, 184))

    # Features list
    fy = card_y1 + 340
    features = [
        ("• 216+ DeclarativeNetRequest Rules", (16, 185, 129)),
        ("• YouTube Video Ad Auto-Skipper", (239, 68, 68)),
        ("• Cosmetic DOM Ad Collapser", (6, 182, 212)),
        ("• Anti-Adblock Modal Defuser", (139, 92, 246)),
    ]
    for text, col in features:
        draw.rounded_rectangle([card_x1 + 20, fy, card_x2 - 20, fy + 38], radius=8, fill=(30, 41, 59, 150), outline=(255, 255, 255, 15), width=1)
        draw.text((card_x1 + 35, fy + 19), text, fill=(241, 245, 249), anchor="lm")
        fy += 46

    # Side Feature Badges
    draw.rounded_rectangle([120, 280, 360, 480], radius=14, fill=(15, 23, 42, 200), outline=(16, 185, 129, 60), width=1)
    draw.text((240, 320), "⚡ 2x Faster Browsing", fill=(16, 185, 129), anchor="mm")
    draw.text((240, 360), "Blocks heavy tracking scripts", fill=(203, 213, 225), anchor="mm")
    draw.text((240, 385), "before download begins.", fill=(148, 163, 184), anchor="mm")
    draw.text((240, 430), "0% CPU Overhead", fill=(6, 182, 212), anchor="mm")

    draw.rounded_rectangle([920, 280, 1160, 480], radius=14, fill=(15, 23, 42, 200), outline=(16, 185, 129, 60), width=1)
    draw.text((1040, 320), "🔒 100% Private", fill=(16, 185, 129), anchor="mm")
    draw.text((1040, 360), "Zero Telemetry", fill=(203, 213, 225), anchor="mm")
    draw.text((1040, 385), "Zero Personal Data Collection.", fill=(148, 163, 184), anchor="mm")
    draw.text((1040, 430), "Local Manifest V3 Rules", fill=(139, 92, 246), anchor="mm")

    out_path = os.path.join(desktop_dir, "adshield-screenshot-1280x800.png")
    img.save(out_path, "PNG")
    print(f"Generated {out_path}")

# -------------------------------------------------------------
# 3. GENERATE PROMO TILE (440 x 280 px)
# -------------------------------------------------------------
def generate_promo():
    w, h = 440, 280
    img = Image.new("RGBA", (w, h), (10, 15, 29, 255))
    draw = ImageDraw.Draw(img)

    for r in range(160, 0, -8):
        alpha = int((1 - r / 160) * 50)
        draw.ellipse([220 - r, 120 - r, 220 + r, 120 + r], fill=(16, 185, 129, alpha))

    # Center Shield Icon
    scx, scy = 220, 90
    draw.ellipse([scx - 35, scy - 35, scx + 35, scy + 35], fill=(15, 23, 42), outline=(16, 185, 129), width=2)
    draw.line([(scx - 12, scy - 2), (scx - 3, scy + 10), (scx + 15, scy - 10)], fill=(16, 185, 129), width=4)

    draw.text((220, 165), "AdShield PRO", fill=(255, 255, 255), anchor="mm")
    draw.text((220, 195), "Manifest V3 Ad & Video Shield", fill=(16, 185, 129), anchor="mm")
    draw.text((220, 225), "Clean • Fast • Ad-Free Web", fill=(148, 163, 184), anchor="mm")

    out_path = os.path.join(desktop_dir, "adshield-promo-440x280.png")
    img.save(out_path, "PNG")
    print(f"Generated {out_path}")

generate_logo()
generate_screenshot()
generate_promo()
