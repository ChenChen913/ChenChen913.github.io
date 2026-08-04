#!/usr/bin/env python3
"""生成站点品牌图片资源（Pillow）：
1. assets/og-image.png        —— 1200×630 社交分享图
2. assets/favicon-32x32.png   —— 32×32 PNG favicon（复刻 assets/favicon.svg 的 W 形）

用法：python generate_assets.py
依赖：pip install pillow
"""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(ROOT, "assets")
ACCENT = (74, 111, 160)      # #4A6FA0
INK = (31, 35, 40)           # #1F2328
INK_SECONDARY = (82, 88, 95) # #52585F
BG = (244, 245, 247)         # #F4F5F7
WHITE = (255, 255, 255)


def _font(size, bold=False):
    candidates = []
    if bold:
        candidates = [
            r"C:\Windows\Fonts\msyhbd.ttc",
            r"C:\Windows\Fonts\arialbd.ttf",
            "/System/Library/Fonts/PingFang.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
    else:
        candidates = [
            r"C:\Windows\Fonts\msyh.ttc",
            r"C:\Windows\Fonts\arial.ttf",
            "/System/Library/Fonts/PingFang.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _fit_font(draw, text, max_width, start_size, bold=False):
    """返回不超过 max_width 的最大字号字体（从 start_size 向下找）。"""
    for size in range(start_size, 11, -2):
        font = _font(size, bold)
        w = draw.textlength(text, font=font)
        if w <= max_width:
            return font
    return _font(12, bold)


def generate_og_image():
    """生成 1200×630 社交分享图：浅色卡片 + 姓名/副标题/网址 + 品牌色条。"""
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # 顶部品牌色条
    d.rectangle([0, 0, W, 12], fill=ACCENT)

    # 白色卡片区域
    card = (90, 90, W - 90, H - 90)
    d.rounded_rectangle(card, radius=24, fill=WHITE, outline=(220, 224, 228), width=2)
    d.rectangle([90, 90, 102, H - 90], fill=ACCENT)  # 左侧强调条

    name = "王晨 · Chen Wang"
    tagline = "信息与计算科学 · 2020 届本科毕业生 · AI 应用开发方向"
    url = "chenchen913.github.io"

    name_font = _fit_font(d, name, 860, 88, bold=True)
    tagline_font = _fit_font(d, tagline, 860, 40)
    url_font = _fit_font(d, url, 860, 34, bold=True)

    d.text((170, 210), name, font=name_font, fill=INK)
    d.text((170, 340), tagline, font=tagline_font, fill=INK_SECONDARY)
    d.text((170, 440), url, font=url_font, fill=ACCENT)

    out = os.path.join(ASSETS, "og-image.png")
    img.save(out, "PNG")
    print("generated:", out, img.size)


def generate_favicon():
    """生成 32×32 PNG favicon，复刻 favicon.svg 的圆角矩形 + 白色 W。"""
    S = 32
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=7, fill=ACCENT)
    # SVG 路径 M17 19l7 26 8-15 8 15 7-26（viewBox 64）缩放到 32
    pts = [(8.5, 9.5), (12, 22.5), (16, 15), (20, 22.5), (23.5, 9.5)]
    d.line(pts, fill=WHITE, width=3, joint="curve")
    out = os.path.join(ASSETS, "favicon-32x32.png")
    img.save(out, "PNG")
    print("generated:", out, img.size)


def main():
    os.makedirs(ASSETS, exist_ok=True)
    generate_og_image()
    generate_favicon()


if __name__ == "__main__":
    main()
