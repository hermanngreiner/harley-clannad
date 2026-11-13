# Erzeugt die Handy-Symbole für Kalender und Shop: Clublogo abgedunkelt im Hintergrund, davor das Symbol.
# Aufruf: python make-icons.py <logo.jpg>   (schreibt kalender/ und shop/ neben dieses Skript)
import os
import sys
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

S = 1024  # Arbeitsgröße, am Ende verkleinert (glatte Kanten)
ORANGE = (243, 107, 33, 255)
WHITE = (255, 255, 255, 255)
DARK = (40, 40, 40, 255)
HERE = os.path.dirname(os.path.abspath(__file__))


def background(logo_path):
    logo = Image.open(logo_path).convert('RGB')
    w, h = logo.size
    side = min(w, h)
    logo = logo.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
    logo = logo.resize((S, S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2))
    logo = ImageEnhance.Brightness(logo).enhance(0.42)
    return logo.convert('RGBA')


def shadow(glyph):
    """Weicher dunkler Schatten unter dem Symbol, damit es sich vom Logo abhebt."""
    alpha = glyph.split()[3]
    sh = Image.new('RGBA', glyph.size, (0, 0, 0, 0))
    sh.putalpha(alpha.filter(ImageFilter.GaussianBlur(28)).point(lambda a: int(a * 0.85)))
    out = Image.new('RGBA', glyph.size, (0, 0, 0, 0))
    out.alpha_composite(sh, (0, 18))
    out.alpha_composite(glyph)
    return out


def calendar_glyph():
    g = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    x0, y0, x1, y1 = 262, 300, 762, 770
    r = 60
    d.rounded_rectangle((x0, y0, x1, y1), r, fill=WHITE)
    # orange Kopfleiste
    d.rounded_rectangle((x0, y0, x1, y0 + 150), r, fill=ORANGE)
    d.rectangle((x0, y0 + 90, x1, y0 + 150), fill=ORANGE)
    # Ringe
    for cx in (382, 642):
        d.rounded_rectangle((cx - 26, y0 - 60, cx + 26, y0 + 60), 26, fill=DARK)
    # Tage: 4 x 3 Kästchen, eines orange
    cols, rows = 4, 3
    gx0, gy0, gx1, gy1 = x0 + 55, y0 + 200, x1 - 55, y1 - 55
    cw = (gx1 - gx0) / cols
    ch = (gy1 - gy0) / rows
    for row in range(rows):
        for col in range(cols):
            bx = gx0 + col * cw + 12
            by = gy0 + row * ch + 12
            color = ORANGE if (row, col) == (1, 2) else (70, 70, 70, 255)
            d.rounded_rectangle((bx, by, bx + cw - 24, by + ch - 24), 14, fill=color)
    return g


def shop_glyph():
    g = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    # Henkel
    d.arc((382, 220, 642, 520), 180, 360, fill=WHITE, width=46)
    d.line((382 + 23, 370, 382 + 23, 420), fill=WHITE, width=46)
    d.line((642 - 23, 370, 642 - 23, 420), fill=WHITE, width=46)
    # Tasche (leicht trapezförmig)
    d.polygon([(282, 390), (742, 390), (782, 800), (242, 800)], fill=WHITE)
    d.rounded_rectangle((242, 740, 782, 800), 30, fill=WHITE)
    # T-Shirt in Orange auf der Tasche
    cx, top = 512, 470
    shirt = [
        (cx - 70, top), (cx - 30, top), (cx - 20, top + 22), (cx, top + 30), (cx + 20, top + 22), (cx + 30, top),
        (cx + 70, top), (cx + 160, top + 70), (cx + 120, top + 130), (cx + 85, top + 105),
        (cx + 85, top + 270), (cx - 85, top + 270), (cx - 85, top + 105), (cx - 120, top + 130), (cx - 160, top + 70)
    ]
    d.polygon(shirt, fill=ORANGE)
    return g


def build(logo_path, glyph, folder):
    icon = background(logo_path)
    icon.alpha_composite(shadow(glyph))
    out = os.path.join(HERE, "..", folder)
    os.makedirs(out, exist_ok=True)
    rgb = icon.convert('RGB')  # iPhone mag keine Transparenz
    rgb.resize((180, 180), Image.LANCZOS).save(os.path.join(out, 'apple-touch-icon.png'), optimize=True)
    rgb.resize((192, 192), Image.LANCZOS).save(os.path.join(out, 'icon-192.png'), optimize=True)
    rgb.resize((512, 512), Image.LANCZOS).save(os.path.join(out, 'icon-512.png'), optimize=True)
    rgb.resize((48, 48), Image.LANCZOS).save(os.path.join(out, 'favicon.png'), optimize=True)
    return rgb


if __name__ == '__main__':
    src = sys.argv[1]
    a = build(src, calendar_glyph(), 'kalender')
    b = build(src, shop_glyph(), 'shop')
    # Vorschau: beide nebeneinander mit runden Ecken wie am iPhone
    prev = Image.new('RGB', (2 * 220 + 60, 260), (235, 235, 235))
    for i, im in enumerate((a, b)):
        small = im.resize((180, 180), Image.LANCZOS)
        mask = Image.new('L', (180, 180), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, 179, 179), 40, fill=255)
        prev.paste(small, (40 + i * 240, 40), mask)
    prev.save(os.path.join(HERE, "vorschau-symbole.png"))
    print('fertig')
