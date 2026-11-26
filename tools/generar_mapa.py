"""Genera assets/leonida.svg: mapa ilustrado propio de Leonida (1000 x 1000).

La silueta de costa, ríos y lagos (tools/geo/*.txt) se trazó a baja resolución
a partir de mapas de la comunidad: es solo la forma geográfica. Todo el arte
(colores, texturas, carreteras, rótulos) es propio.
Uso:  python3 tools/generar_mapa.py
"""
import os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO = os.path.join(RAIZ, 'tools', 'geo')


def leer_poligonos(nombre):
    txt = open(os.path.join(GEO, nombre)).read().strip()
    polis = []
    for parte in txt.split('M')[1:]:
        pts = [tuple(map(float, p.split())) for p in parte.rstrip('Z').split('L')]
        polis.append(pts)
    return polis


def chaikin(pts, it=2):
    for _ in range(it):
        nuevo = []
        n = len(pts)
        for i in range(n):
            a, b = pts[i], pts[(i + 1) % n]
            nuevo.append((0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]))
            nuevo.append((0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]))
        pts = nuevo
    return pts


def a_path(polis, it=2):
    out = []
    for p in polis:
        s = chaikin(p, it) if len(p) > 4 else p
        out.append('M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in s) + 'Z')
    return ''.join(out)


def linea(pts):
    """Curva suave que pasa por los puntos (Catmull-Rom → Bézier)."""
    d = f'M{pts[0][0]} {pts[0][1]}'
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f' C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]} {p2[1]}'
    return d


TIERRA = a_path(leer_poligonos('tierra.txt'))
AGUA = a_path(leer_poligonos('agua.txt'), 1)

# ── Carreteras (trazado propio aproximado) ──
AUTOPISTAS = [
    # Port Gellhorn → Ruta 628 → Ambrosia → Belville → Vice City
    [(205, 418), (260, 405), (330, 392), (400, 372), (470, 348), (520, 336), (575, 372), (625, 428), (668, 466), (690, 478)],
    # Port Gellhorn → Mount Kalaga → Ambrosia
    [(210, 405), (228, 340), (290, 262), (370, 205), (450, 222), (500, 280), (520, 330)],
    # Vice City → Hamlet → Grassrivers → Capri (costa del Golfo)
    [(690, 500), (660, 520), (630, 560), (605, 640), (580, 705), (565, 735)],
    # Ruta 1: Vice City → costa sur → Leonida Keys
    [(692, 505), (696, 560), (712, 615), (752, 662), (792, 700), (822, 745), (842, 800), (850, 850), (848, 880), (832, 912), (870, 936), (900, 944)],
]
SECUNDARIAS = [
    [(205, 425), (232, 480), (250, 540), (300, 598), (370, 640), (450, 700), (520, 722), (565, 735)],
    [(690, 478), (712, 420), (722, 340), (712, 250), (700, 160)],
    [(400, 372), (380, 300), (370, 205)],
    [(520, 336), (600, 300), (660, 250), (700, 200)],
    [(668, 466), (650, 490), (645, 528)],
    [(470, 348), (455, 430), (470, 520), (520, 560), (630, 560)],
    [(700, 480), (712, 478), (722, 470)],  # puentes a Vice Beach
    [(700, 498), (722, 495)],
]

ZONAS_URBANAS = {
    'vc': 'M655 448 L690 440 L712 452 L716 480 L708 505 L700 540 L680 548 L650 540 L640 520 L645 490 Z',
    'beach': 'M716 448 L724 446 L728 470 L727 505 L720 508 L716 480 Z',
    'pg': 'M168 392 L215 380 L262 392 L268 430 L240 448 L195 446 L170 425 Z',
    'kl': 'M826 846 L858 838 L872 860 L860 890 L832 892 L822 870 Z',
    'amb': 'M505 322 L535 320 L542 345 L512 352 Z',
    'hamlet': 'M630 515 L655 512 L660 536 L636 540 Z',
    'capri': 'M548 726 L582 724 L586 748 L552 750 Z',
    'watson': 'M292 588 L318 585 L320 606 L296 608 Z',
    'belville': 'M618 430 L640 428 L642 448 L620 450 Z',
}

RANCHOS = [  # rótulos (x, y, texto, tamaño, clase)
    (395, 165, 'MOUNT KALAGA', 19, 'reg'), (395, 182, 'NATIONAL PARK', 8.5, 'sub'),
    (200, 365, 'PORT GELLHORN', 17, 'reg'),
    (560, 268, 'AMBROSIA', 19, 'reg'),
    (470, 610, 'GRASSRIVERS', 19, 'reg'),
    (775, 418, 'VICE CITY', 21, 'reg'),
    (800, 965, 'LEONIDA KEYS', 15, 'reg'),
    (150, 700, 'Golfo de Leonida', 17, 'agua'),
    (870, 300, 'Océano Atlántico', 17, 'agua'),
    (560, 880, 'Estrecho de Leonida', 14, 'agua'),
    (552, 317, 'Lago Leonida', 7.5, 'lago'),
    # condados y pueblos
    (395, 196, 'Condado de Lummox', 7.5, 'cond'), (200, 378, 'Condado de Kelly', 7.5, 'cond'),
    (560, 281, 'Condado de Leonard', 7.5, 'cond'), (775, 430, 'Condado de Vice-Dale', 7.5, 'cond'),
    (800, 977, 'Condado de Mariana', 7, 'cond'),
    (845, 868, 'Key Lento', 8, 'pueblo'), (306, 600, 'Watson Bay', 7, 'pueblo'),
    (566, 740, 'Capri', 7, 'pueblo'), (645, 548, 'Hamlet', 7, 'pueblo'), (630, 425, 'Belville', 7, 'pueblo'),
    (320, 410, 'Ruta 628', 6, 'ruta'), (578, 87, 'Hyde Island', 6.5, 'pueblo'),
]

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="2000" height="2000">
<defs>
  <radialGradient id="oceano" cx="0.55" cy="0.45" r="0.75">
    <stop offset="0" stop-color="#1f5f86"/><stop offset="0.6" stop-color="#174a6b"/><stop offset="1" stop-color="#0d2f47"/>
  </radialGradient>
  <linearGradient id="tierraBase" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0" stop-color="#5f7d52"/><stop offset="0.45" stop-color="#7a9160"/><stop offset="0.75" stop-color="#8f9a6a"/><stop offset="1" stop-color="#a7a57a"/>
  </linearGradient>
  <radialGradient id="monte" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#2d4a2c" stop-opacity="0.95"/><stop offset="1" stop-color="#2d4a2c" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="cumbre" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#9c9480"/><stop offset="1" stop-color="#9c9480" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="humedal" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#4f6b3f" stop-opacity="0.9"/><stop offset="1" stop-color="#4f6b3f" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="arena" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#c8bd8a" stop-opacity="0.8"/><stop offset="1" stop-color="#c8bd8a" stop-opacity="0"/>
  </radialGradient>
  <pattern id="pastos" width="6" height="6" patternUnits="userSpaceOnUse">
    <path d="M1 5 l1 -2 M4 2 l1 -2" stroke="#3e5a35" stroke-width="0.45" opacity="0.7"/>
  </pattern>
  <pattern id="cultivo" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
    <rect width="3.5" height="7" fill="#a9b26c"/><rect x="3.5" width="3.5" height="7" fill="#93a35d"/>
  </pattern>
  <pattern id="bosque" width="5" height="5" patternUnits="userSpaceOnUse">
    <circle cx="1.5" cy="1.5" r="1.3" fill="#24401f" opacity="0.55"/><circle cx="4" cy="3.8" r="1.1" fill="#3b5e30" opacity="0.6"/>
  </pattern>
  <pattern id="calles" width="3.2" height="3.2" patternUnits="userSpaceOnUse">
    <rect width="3.2" height="3.2" fill="#8d8f8d"/><rect x="0.35" y="0.35" width="2.5" height="2.5" fill="#b9b6ac"/>
  </pattern>
  <clipPath id="recorteTierra"><path d="{TIERRA}"/></clipPath>
  <filter id="difuso" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="sombraTxt"><feDropShadow dx="0" dy="0.6" stdDeviation="0.8" flood-color="#000" flood-opacity="0.85"/></filter>
</defs>

<rect width="1000" height="1000" fill="url(#oceano)"/>
<!-- aguas someras -->
<path d="{TIERRA}" fill="none" stroke="#3ea3b5" stroke-width="34" stroke-opacity="0.22" filter="url(#difuso)"/>
<path d="{TIERRA}" fill="none" stroke="#5cc4c9" stroke-width="12" stroke-opacity="0.28" filter="url(#difuso)"/>
<ellipse cx="840" cy="915" rx="90" ry="40" fill="#4cc0c2" opacity="0.18" filter="url(#difuso)"/>
<!-- tierra -->
<path d="{TIERRA}" fill="#dccc95" stroke="#e9dcab" stroke-width="2.4" stroke-linejoin="round"/>
<g clip-path="url(#recorteTierra)">
  <rect width="1000" height="1000" fill="url(#tierraBase)" transform="translate(0 0)"/>
  <path d="{TIERRA}" fill="none" stroke="#d9c98f" stroke-width="2.2"/>
  <!-- Mount Kalaga: bosque y relieve -->
  <ellipse cx="380" cy="190" rx="300" ry="130" fill="url(#monte)"/>
  <ellipse cx="380" cy="190" rx="290" ry="120" fill="url(#bosque)" opacity="0.8"/>
  <ellipse cx="405" cy="150" rx="70" ry="40" fill="url(#cumbre)" opacity="0.75"/>
  <ellipse cx="330" cy="200" rx="50" ry="28" fill="url(#cumbre)" opacity="0.5"/>
  <g fill="none" stroke="#2a3f27" stroke-width="0.9" opacity="0.55" stroke-linecap="round">
    <path d="M340 150 Q380 120 440 140 T520 150"/><path d="M300 185 Q350 160 400 178 T480 172"/>
    <path d="M250 215 Q300 200 350 215"/><path d="M420 200 Q460 190 500 205"/><path d="M360 125 Q400 105 450 118"/>
  </g>
  <!-- Ambrosia: cañaverales -->
  <ellipse cx="555" cy="335" rx="95" ry="70" fill="url(#cultivo)" opacity="0.55"/>
  <!-- Grassrivers: humedal -->
  <ellipse cx="480" cy="540" rx="210" ry="150" fill="url(#humedal)"/>
  <ellipse cx="480" cy="540" rx="200" ry="140" fill="url(#pastos)" opacity="0.9"/>
  <ellipse cx="640" cy="680" rx="90" ry="70" fill="url(#humedal)" opacity="0.7"/>
  <!-- cola sur y Cayos: arena -->
  <ellipse cx="800" cy="820" rx="120" ry="90" fill="url(#arena)"/>
</g>
<!-- ríos y lagos -->
<path d="{AGUA}" fill="#2e7799" stroke="#8fd2de" stroke-width="0.6" stroke-opacity="0.7"/>
<!-- zonas urbanas -->
<g clip-path="url(#recorteTierra)" opacity="0.95">
  {''.join(f'<path d="{d}" fill="url(#calles)"/>' for d in ZONAS_URBANAS.values())}
</g>
<!-- carreteras -->
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
  {''.join(f'<path d="{linea(r)}" stroke="#5b4a2a" stroke-width="1.6" opacity="0.5"/>' for r in SECUNDARIAS)}
  {''.join(f'<path d="{linea(r)}" stroke="#f3ead0" stroke-width="1"/>' for r in SECUNDARIAS)}
  {''.join(f'<path d="{linea(r)}" stroke="#4a3412" stroke-width="3.4" opacity="0.6"/>' for r in AUTOPISTAS)}
  {''.join(f'<path d="{linea(r)}" stroke="#f4b33d" stroke-width="2.2"/>' for r in AUTOPISTAS)}
</g>
<!-- rótulos -->
<g font-family="'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" text-anchor="middle" filter="url(#sombraTxt)">
'''
for x, y, t, s, c in RANCHOS:
    if c == 'reg':
        svg += f'  <text x="{x}" y="{y}" font-size="{s}" font-weight="800" letter-spacing="{s*0.18:.1f}" fill="#ffffff">{t}</text>\n'
    elif c == 'sub':
        svg += f'  <text x="{x}" y="{y}" font-size="{s}" font-weight="700" letter-spacing="2" fill="#e9f2e6">{t}</text>\n'
    elif c == 'agua':
        svg += f'  <text x="{x}" y="{y}" font-size="{s}" font-style="italic" font-family="Georgia, serif" fill="#9fd6e6" opacity="0.85" filter="none">{t}</text>\n'
    elif c == 'lago':
        svg += f'  <text x="{x}" y="{y}" font-size="{s}" font-style="italic" font-family="Georgia, serif" fill="#d7f1f7">{t}</text>\n'
    elif c == 'cond':
        svg += f'  <text x="{x}" y="{y}" font-size="{s}" font-weight="600" letter-spacing="1" fill="#f1e9c9" opacity="0.9">{t.upper()}</text>\n'
    elif c == 'ruta':
        svg += f'  <text x="{x}" y="{y}" font-size="{s}" font-weight="700" fill="#ffe4a3">{t}</text>\n'
    else:
        svg += f'  <text x="{x}" y="{y}" font-size="{s}" font-weight="700" fill="#ffffff">{t}</text>\n'
svg += '''</g>
<g transform="translate(90 900)" opacity="0.9">
  <circle r="26" fill="none" stroke="#9fd6e6" stroke-width="1.2"/>
  <path d="M0 -23 L5 0 L0 23 L-5 0 Z" fill="#fff"/><path d="M-23 0 L0 5 L23 0 L0 -5 Z" fill="#9fd6e6"/>
  <text y="-31" font-family="Arial" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">N</text>
</g>
<text x="992" y="994" font-family="Arial" font-size="7" fill="#9fd6e6" text-anchor="end">Mapa ilustrado por fans · no oficial · posiciones aproximadas</text>
</svg>
'''
open(os.path.join(RAIZ, 'assets', 'leonida.svg'), 'w').write(svg)
print('ok', len(svg) // 1024, 'KB')
