from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "scenes" / "options"
SIZE = 512


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts/NotoSansTC-Bold.otf" if bold else "C:/Windows/Fonts/NotoSansTC-Regular.otf"),
        Path("C:/Windows/Fonts/msjhbd.ttc" if bold else "C:/Windows/Fonts/msjh.ttc"),
        Path("C:/Windows/Fonts/mingliub.ttc" if bold else "C:/Windows/Fonts/mingliu.ttc"),
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


FONT_XL = font(56, True)
FONT_L = font(42, True)
FONT_M = font(30, True)
FONT_S = font(22, True)
FONT_XS = font(18, False)


ASSETS = [
    {
        "file": "scene-01-a.png",
        "name": "報告加料",
        "scene": "AI 已把報告寫好了",
        "option": "我想再加新點子",
        "bias": "加值心理",
        "palette": ((103, 84, 255), (255, 91, 181), (255, 205, 97)),
        "icon": "sticky_report",
    },
    {
        "file": "scene-01-b.png",
        "name": "抓蟲檢查",
        "scene": "AI 已把報告寫好了",
        "option": "我先檢查細節",
        "bias": "怕出包",
        "palette": ((69, 138, 255), (74, 220, 255), (255, 219, 112)),
        "icon": "magnifier_bug",
    },
    {
        "file": "scene-01-c.png",
        "name": "誰被影響",
        "scene": "AI 已把報告寫好了",
        "option": "我先想誰會受影響",
        "bias": "關係成本",
        "palette": ((57, 210, 166), (120, 170, 255), (255, 207, 117)),
        "icon": "people_ripple",
    },
    {
        "file": "scene-02-a.png",
        "name": "帶頭試用",
        "scene": "公司突然換成 AI 系統",
        "option": "我帶大家先試用",
        "bias": "跟上隊伍",
        "palette": ((74, 210, 255), (110, 91, 255), (255, 205, 97)),
        "icon": "megaphone_team",
    },
    {
        "file": "scene-02-b.png",
        "name": "先讀規則",
        "scene": "公司突然換成 AI 系統",
        "option": "我先弄懂規則",
        "bias": "少踩雷",
        "palette": ((139, 105, 255), (70, 205, 190), (255, 214, 107)),
        "icon": "rulebook",
    },
    {
        "file": "scene-02-c.png",
        "name": "懶人流程",
        "scene": "公司突然換成 AI 系統",
        "option": "我做一份操作流程",
        "bias": "省力優先",
        "palette": ((80, 178, 255), (65, 225, 170), (255, 188, 92)),
        "icon": "checklist",
    },
    {
        "file": "scene-03-a.png",
        "name": "試水溫",
        "scene": "有人邀你做 AI 新專案",
        "option": "先小試一把",
        "bias": "小賭怡情",
        "palette": ((255, 146, 68), (255, 78, 142), (255, 219, 112)),
        "icon": "toe_water",
    },
    {
        "file": "scene-03-b.png",
        "name": "怕虧試算",
        "scene": "有人邀你做 AI 新專案",
        "option": "先算成本風險",
        "bias": "損失厭惡",
        "palette": ((255, 106, 91), (125, 91, 255), (255, 224, 124)),
        "icon": "calculator_sweat",
    },
    {
        "file": "scene-03-c.png",
        "name": "切小實驗",
        "scene": "有人邀你做 AI 新專案",
        "option": "改成小實驗",
        "bias": "低成本試錯",
        "palette": ((102, 232, 166), (97, 150, 255), (255, 211, 98)),
        "icon": "lab_split",
    },
    {
        "file": "scene-04-a.png",
        "name": "教會朋友",
        "scene": "好友問：我會被AI取代嗎",
        "option": "我教他用 AI 做事",
        "bias": "技能升級",
        "palette": ((255, 172, 71), (89, 214, 255), (255, 219, 115)),
        "icon": "teacher_tool",
    },
    {
        "file": "scene-04-b.png",
        "name": "飯碗穩住",
        "scene": "好友問：我會被AI取代嗎",
        "option": "我先陪他穩住",
        "bias": "飯碗安全感",
        "palette": ((92, 215, 180), (98, 128, 255), (255, 205, 120)),
        "icon": "rice_bowl_shield",
    },
    {
        "file": "scene-04-c.png",
        "name": "三步路線",
        "scene": "好友問：我會被AI取代嗎",
        "option": "我幫他排下一步",
        "bias": "看見出口",
        "palette": ((70, 190, 255), (150, 105, 255), (255, 216, 105)),
        "icon": "three_steps",
    },
    {
        "file": "scene-05-a.png",
        "name": "新點子泡泡",
        "scene": "你拿到一個全新專案",
        "option": "做一個新點子",
        "bias": "差異化",
        "palette": ((255, 96, 172), (116, 94, 255), (255, 221, 111)),
        "icon": "idea_bulb",
    },
    {
        "file": "scene-05-b.png",
        "name": "先搭流程",
        "scene": "你拿到一個全新專案",
        "option": "先搭基本流程",
        "bias": "複利累積",
        "palette": ((88, 205, 150), (93, 153, 255), (255, 213, 102)),
        "icon": "flow_blocks",
    },
    {
        "file": "scene-05-c.png",
        "name": "誰會買單",
        "scene": "你拿到一個全新專案",
        "option": "先找誰真的需要",
        "bias": "需求驗證",
        "palette": ((255, 173, 70), (80, 220, 190), (255, 226, 118)),
        "icon": "customer_wallet",
    },
    {
        "file": "scene-06-a.png",
        "name": "勇敢開始",
        "scene": "一年後回看今天",
        "option": "我有勇敢開始",
        "bias": "後悔最小化",
        "palette": ((135, 98, 255), (82, 202, 255), (255, 213, 110)),
        "icon": "start_flag",
    },
    {
        "file": "scene-06-b.png",
        "name": "留下系統",
        "scene": "一年後回看今天",
        "option": "我留下可用系統",
        "bias": "資產感",
        "palette": ((92, 214, 166), (92, 135, 255), (255, 213, 102)),
        "icon": "system_asset",
    },
    {
        "file": "scene-06-c.png",
        "name": "幫到更多人",
        "scene": "一年後回看今天",
        "option": "我幫到更多人",
        "bias": "社會資本",
        "palette": ((255, 154, 91), (113, 206, 255), (255, 226, 122)),
        "icon": "help_network",
    },
]


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def text_bbox(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def center_text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, fnt, fill, anchor="mm", stroke=0):
    draw.text(xy, text, font=fnt, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=(5, 4, 11, 180))


def line(draw, xy, fill, width=6):
    draw.line(xy, fill=fill, width=width, joint="curve")


def bg(asset: dict) -> Image.Image:
    c1, c2, c3 = asset["palette"]
    im = Image.new("RGBA", (SIZE, SIZE), (8, 6, 18, 255))
    pix = im.load()
    for y in range(SIZE):
        for x in range(SIZE):
            nx = x / (SIZE - 1)
            ny = y / (SIZE - 1)
            radial = max(0, 1 - math.hypot(nx - 0.68, ny - 0.2) * 1.7)
            base = (
                lerp(10, c1[0], radial * 0.34),
                lerp(8, c1[1], radial * 0.34),
                lerp(24, c1[2], radial * 0.34),
                255,
            )
            glow = max(0, 1 - math.hypot(nx - 0.28, ny - 0.7) * 1.5)
            pix[x, y] = (
                min(255, base[0] + int(c2[0] * glow * 0.14)),
                min(255, base[1] + int(c2[1] * glow * 0.14)),
                min(255, base[2] + int(c2[2] * glow * 0.14)),
                255,
            )
    overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for x in range(20, SIZE, 28):
        for y in range(20, SIZE, 28):
            if (x + y) % 84 == 0:
                d.ellipse((x, y, x + 2, y + 2), fill=(255, 255, 255, 30))
    d.rounded_rectangle((22, 22, 490, 490), 48, outline=(*c3, 70), width=3)
    d.rounded_rectangle((48, 64, 464, 436), 36, fill=(255, 255, 255, 18), outline=(255, 255, 255, 34), width=2)
    return Image.alpha_composite(im, overlay)


def draw_header(draw: ImageDraw.ImageDraw, asset: dict):
    _, _, c3 = asset["palette"]
    # Keep the visual readable when it is cropped into the small mobile option thumbnail.
    # Semantic names live in manifest.json and the prompt bible instead of being printed into the art.
    draw.rounded_rectangle((42, 42, 470, 470), 44, outline=(*c3, 96), width=3)
    for x, y in ((84, 88), (428, 88), (84, 424), (428, 424)):
        draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(*c3, 160))


def draw_report(draw, c):
    draw.rounded_rectangle((172, 138, 340, 318), 18, fill=(248, 249, 240, 255), outline=(30, 34, 50, 120), width=4)
    for y in (180, 215, 250):
        line(draw, (202, y, 310, y), (45, 58, 88, 180), 5)
    draw.rounded_rectangle((246, 112, 378, 190), 18, fill=(*c, 230))
    center_text(draw, (312, 150), "+1", FONT_L, (5, 4, 12, 255))


def draw_magnifier(draw, c):
    draw.ellipse((152, 134, 318, 300), outline=(*c, 255), width=18)
    line(draw, (286, 270, 374, 358), (*c, 255), 20)
    draw.ellipse((214, 190, 242, 218), fill=(255, 80, 90, 255))
    line(draw, (205, 232, 252, 232), (255, 80, 90, 255), 7)
    line(draw, (198, 204, 258, 258), (255, 80, 90, 190), 5)
    line(draw, (258, 204, 198, 258), (255, 80, 90, 190), 5)


def draw_people_ripple(draw, c):
    for i, x in enumerate((170, 256, 342)):
        y = 206 + (i % 2) * 22
        draw.ellipse((x - 34, y - 34, x + 34, y + 34), fill=(255, 255, 255, 230))
        draw.rounded_rectangle((x - 48, y + 34, x + 48, y + 112), 32, fill=(*c, 210))
    for r in (70, 112, 154):
        draw.ellipse((256 - r, 256 - r, 256 + r, 256 + r), outline=(*c, 70), width=4)


def draw_megaphone(draw, c):
    draw.polygon([(148, 226), (318, 150), (318, 306)], fill=(*c, 245))
    draw.rounded_rectangle((120, 214, 172, 272), 15, fill=(255, 255, 255, 240))
    line(draw, (170, 270, 205, 354), (255, 255, 255, 220), 16)
    for i, x in enumerate((333, 363, 392)):
        draw.arc((x - 50, 178 - i * 12, x + 50, 306 + i * 12), -48, 48, fill=(255, 255, 255, 170), width=5)


def draw_rulebook(draw, c):
    draw.rounded_rectangle((152, 126, 360, 338), 24, fill=(255, 255, 255, 238), outline=(*c, 255), width=6)
    draw.rectangle((174, 126, 218, 338), fill=(*c, 210))
    for y in (176, 222, 268):
        draw.ellipse((238, y - 9, 256, y + 9), fill=(*c, 255))
        line(draw, (272, y, 326, y), (40, 44, 65, 180), 5)
    center_text(draw, (256, 382), "別踩雷", FONT_M, (255, 255, 255, 230), stroke=2)


def draw_checklist(draw, c):
    draw.rounded_rectangle((142, 122, 370, 348), 26, fill=(255, 255, 255, 235))
    for idx, y in enumerate((178, 232, 286)):
        draw.rounded_rectangle((176, y - 18, 212, y + 18), 10, outline=(*c, 255), width=5)
        line(draw, (180, y, 193, y + 13, 216, y - 18), (*c, 255), 6)
        line(draw, (236, y, 326, y), (42, 46, 70, 185), 6)
    center_text(draw, (256, 382), "懶人包", FONT_M, (*c, 255), stroke=2)


def draw_toe_water(draw, c):
    for r in (42, 78, 116):
        draw.arc((256 - r, 255 - r, 256 + r, 255 + r), 15, 165, fill=(*c, 160), width=7)
    draw.ellipse((210, 142, 304, 242), fill=(255, 255, 255, 235))
    draw.ellipse((288, 142, 322, 176), fill=(255, 255, 255, 235))
    draw.rounded_rectangle((205, 238, 310, 302), 28, fill=(*c, 230))
    center_text(draw, (256, 358), "試水溫", FONT_M, (255, 255, 255, 235), stroke=2)


def draw_calculator(draw, c):
    draw.rounded_rectangle((162, 122, 350, 342), 28, fill=(255, 255, 255, 238), outline=(*c, 250), width=6)
    draw.rounded_rectangle((192, 154, 320, 202), 12, fill=(20, 25, 36, 240))
    center_text(draw, (256, 178), "怕虧", FONT_S, (*c, 255))
    for row in range(3):
        for col in range(3):
            x, y = 198 + col * 45, 230 + row * 34
            draw.rounded_rectangle((x, y, x + 28, y + 22), 7, fill=(*c, 120))
    draw.ellipse((335, 112, 362, 153), fill=(92, 210, 255, 220))


def draw_lab_split(draw, c):
    draw.polygon([(216, 124), (296, 124), (286, 218), (350, 342), (162, 342), (226, 218)], fill=(255, 255, 255, 235))
    draw.line((216, 124, 296, 124), fill=(*c, 255), width=8)
    draw.polygon([(202, 286), (310, 286), (338, 334), (174, 334)], fill=(*c, 200))
    for x, y, r in [(176, 188, 16), (338, 198, 12), (312, 146, 9)]:
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(*c, 200))
    center_text(draw, (256, 384), "切小", FONT_M, (255, 255, 255, 235), stroke=2)


def draw_teacher_tool(draw, c):
    draw.rounded_rectangle((132, 146, 380, 308), 26, fill=(255, 255, 255, 235))
    draw.ellipse((164, 190, 224, 250), fill=(*c, 230))
    draw.ellipse((292, 190, 352, 250), fill=(78, 205, 255, 230))
    line(draw, (224, 220, 292, 220), (*c, 255), 7)
    draw.rounded_rectangle((204, 282, 308, 336), 14, fill=(20, 25, 40, 230))
    center_text(draw, (256, 310), "AI", FONT_M, (255, 255, 255, 240))


def draw_rice_bowl_shield(draw, c):
    draw.pieslice((156, 196, 356, 396), 0, 180, fill=(255, 255, 255, 240), outline=(*c, 255), width=6)
    draw.rectangle((178, 292, 334, 326), fill=(255, 255, 255, 240))
    draw.polygon([(256, 116), (354, 162), (334, 286), (256, 340), (178, 286), (158, 162)], outline=(*c, 220), fill=(*c, 52))
    center_text(draw, (256, 242), "飯碗", FONT_M, (10, 12, 22, 255))


def draw_three_steps(draw, c):
    pts = [(148, 304), (244, 238), (328, 176)]
    line(draw, (pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1]), (*c, 255), 10)
    for i, (x, y) in enumerate(pts, 1):
        draw.ellipse((x - 34, y - 34, x + 34, y + 34), fill=(255, 255, 255, 238))
        center_text(draw, (x, y), str(i), FONT_M, (10, 12, 22, 255))
    center_text(draw, (256, 378), "下一步", FONT_M, (*c, 255), stroke=2)


def draw_idea_bulb(draw, c):
    draw.ellipse((178, 122, 334, 278), fill=(255, 255, 255, 235), outline=(*c, 255), width=8)
    draw.rounded_rectangle((218, 272, 294, 342), 16, fill=(*c, 230))
    for a in range(0, 360, 45):
        x1 = 256 + math.cos(math.radians(a)) * 112
        y1 = 200 + math.sin(math.radians(a)) * 112
        x2 = 256 + math.cos(math.radians(a)) * 142
        y2 = 200 + math.sin(math.radians(a)) * 142
        line(draw, (x1, y1, x2, y2), (*c, 180), 5)
    center_text(draw, (256, 207), "新", FONT_XL, (10, 12, 22, 255))


def draw_flow_blocks(draw, c):
    boxes = [(132, 150), (276, 150), (132, 282), (276, 282)]
    for x, y in boxes:
        draw.rounded_rectangle((x, y, x + 104, y + 74), 18, fill=(255, 255, 255, 235), outline=(*c, 220), width=5)
    line(draw, (236, 187, 276, 187), (*c, 255), 8)
    line(draw, (184, 224, 184, 282), (*c, 255), 8)
    line(draw, (328, 224, 328, 282), (*c, 255), 8)
    center_text(draw, (256, 388), "SOP", FONT_L, (255, 255, 255, 235), stroke=2)


def draw_customer_wallet(draw, c):
    draw.rounded_rectangle((150, 192, 362, 316), 24, fill=(255, 255, 255, 235), outline=(*c, 250), width=6)
    draw.rounded_rectangle((246, 220, 342, 286), 20, fill=(*c, 230))
    draw.ellipse((304, 244, 326, 266), fill=(15, 18, 28, 230))
    draw.ellipse((176, 116, 246, 186), fill=(255, 255, 255, 230))
    center_text(draw, (211, 151), "誰?", FONT_S, (10, 12, 22, 255))
    center_text(draw, (256, 384), "買單", FONT_M, (*c, 255), stroke=2)


def draw_start_flag(draw, c):
    line(draw, (178, 130, 178, 346), (255, 255, 255, 230), 10)
    draw.polygon([(188, 138), (350, 178), (188, 226)], fill=(*c, 240))
    draw.ellipse((144, 322, 212, 390), fill=(255, 255, 255, 230))
    center_text(draw, (256, 390), "先開始", FONT_M, (255, 255, 255, 235), stroke=2)


def draw_system_asset(draw, c):
    draw.rounded_rectangle((128, 132, 384, 322), 28, fill=(255, 255, 255, 235), outline=(*c, 250), width=6)
    for i, (x, y) in enumerate([(170, 180), (256, 180), (342, 180), (212, 260), (300, 260)]):
        draw.ellipse((x - 28, y - 28, x + 28, y + 28), fill=(*c, 210))
    for xy in [(198, 180, 228, 180), (284, 180, 314, 180), (184, 208, 212, 260), (328, 208, 300, 260)]:
        line(draw, xy, (20, 25, 35, 130), 6)
    center_text(draw, (256, 382), "可用", FONT_M, (*c, 255), stroke=2)


def draw_help_network(draw, c):
    center = (256, 232)
    nodes = [(154, 178), (356, 178), (160, 314), (352, 314), center]
    for a, b in [(0, 4), (1, 4), (2, 4), (3, 4), (0, 1), (2, 3)]:
        line(draw, (nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1]), (*c, 140), 6)
    for i, (x, y) in enumerate(nodes):
        r = 38 if i == 4 else 30
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, 235), outline=(*c, 210), width=4)
    center_text(draw, center, "+", FONT_L, (*c, 255))
    center_text(draw, (256, 390), "一起強", FONT_M, (255, 255, 255, 235), stroke=2)


ICON_DRAWERS: dict[str, Callable[[ImageDraw.ImageDraw, tuple[int, int, int]], None]] = {
    "sticky_report": draw_report,
    "magnifier_bug": draw_magnifier,
    "people_ripple": draw_people_ripple,
    "megaphone_team": draw_megaphone,
    "rulebook": draw_rulebook,
    "checklist": draw_checklist,
    "toe_water": draw_toe_water,
    "calculator_sweat": draw_calculator,
    "lab_split": draw_lab_split,
    "teacher_tool": draw_teacher_tool,
    "rice_bowl_shield": draw_rice_bowl_shield,
    "three_steps": draw_three_steps,
    "idea_bulb": draw_idea_bulb,
    "flow_blocks": draw_flow_blocks,
    "customer_wallet": draw_customer_wallet,
    "start_flag": draw_start_flag,
    "system_asset": draw_system_asset,
    "help_network": draw_help_network,
}


def render(asset: dict) -> Image.Image:
    c1, c2, c3 = asset["palette"]
    im = bg(asset)
    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((116, 108, 396, 388), fill=(*c1, 42))
    gd.ellipse((146, 132, 366, 352), fill=(*c2, 34))
    glow = glow.filter(ImageFilter.GaussianBlur(24))
    im = Image.alpha_composite(im, glow)
    d = ImageDraw.Draw(im)
    ICON_DRAWERS[asset["icon"]](d, c3)
    draw_header(d, asset)
    return im.convert("RGB")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {
        "version": "alpha-18-grounded-economy-psychology",
        "purpose": "Quiz option illustrations with grounded, humorous, mass-market economic psychology cues.",
        "recommendedSize": {
            "width": 512,
            "height": 512,
            "unit": "px",
            "note": "Displayed as a cropped option-card thumbnail in the 390px mobile quiz UI. Keep the main visual centered and readable at small size.",
        },
        "style": [
            "grounded everyday situations",
            "funny but not childish",
            "mass-market economic psychology",
            "large readable iconography",
            "AI/futuristic accent lines",
        ],
        "files": [],
    }
    for asset in ASSETS:
        out = OUT_DIR / asset["file"]
        render(asset).save(out, quality=95)
        manifest["files"].append(
            {
                "file": asset["file"],
                "semanticName": asset["name"],
                "scene": asset["scene"],
                "option": asset["option"],
                "psychology": asset["bias"],
            }
        )
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(ASSETS)} option assets in {OUT_DIR}")


if __name__ == "__main__":
    main()
