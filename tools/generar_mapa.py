"""Genera assets/leonida.svg: mapa ilustrado propio de Leonida (1000 x 1394).

Base geográfica: el mapa oficial "Visit Leonida". La costa, islas, lagos, ríos y
zonas urbanas (tools/geo/*.txt) se trazaron de ese mapa; las carreteras y rótulos
se colocaron leyendo sus posiciones. El dibujo (colores, texturas, trazos,
tipografía) es propio: la imagen oficial NO se incluye ni se publica.

Las posiciones de carreteras y rótulos están en píxeles de la imagen oficial
(1461 x 2000) y se convierten con `c()`.
Uso:  python3 tools/generar_mapa.py
"""
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO = os.path.join(RAIZ, 'tools', 'geo')
ANCHO, ALTO = 1000, 1394


def c(px, py):
    """Píxel del mapa oficial → coordenada del mapa propio."""
    return round((px - 48) * 1000 / 1364, 1), round((py - 48) * 1000 / 1364, 1)


def leer(nombre):
    polis = []
    for linea in open(os.path.join(GEO, nombre)).read().strip().split('\n'):
        for parte in linea.split('M')[1:]:
            polis.append([tuple(map(float, p.split())) for p in parte.rstrip('Z').split('L')])
    return polis


def chaikin(pts, it=2):
    for _ in range(it):
        n = len(pts)
        nuevo = []
        for i in range(n):
            a, b = pts[i], pts[(i + 1) % n]
            nuevo += [(0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]), (0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1])]
        pts = nuevo
    return pts


def a_path(polis, it=2):
    return ''.join('M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in (chaikin(p, it) if len(p) > 4 else p)) + 'Z' for p in polis)


def linea(pts_px):
    pts = [c(*p) for p in pts_px]
    d = f'M{pts[0][0]} {pts[0][1]}'
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f' C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]} {p2[1]}'
    return d


TIERRA = a_path(leer('tierra.txt'))
AGUA = a_path(leer('agua.txt'), 1)
URBANO = a_path(leer('urbano.txt'), 1)

# ── Carreteras (en píxeles del mapa oficial) ──
INTERESTATALES = {
    '404': [(430, 575), (462, 640), (478, 760), (470, 880), (478, 985), (520, 1040), (640, 1046), (731, 1043), (820, 1030), (905, 1018), (985, 1002)],
    '297': [(430, 575), (520, 550), (610, 545), (700, 527), (780, 522), (830, 533), (900, 497), (962, 470)],
    '97': [(962, 470), (1030, 540), (1052, 583), (1085, 680), (1093, 760), (1062, 840), (1012, 905), (990, 967), (975, 1050), (962, 1140), (945, 1205), (925, 1265)],
}
FEDERALES = {
    '35': [(850, 470), (812, 587), (800, 700), (803, 789), (800, 900), (803, 1025), (845, 1110), (875, 1240), (899, 1323), (890, 1420), (905, 1535)],
    '183': [(640, 760), (614, 898), (560, 975), (480, 1050), (460, 1071), (470, 1140), (560, 1215), (650, 1290), (740, 1330), (830, 1350), (899, 1323)],
}
ESTATALES = {
    '1A': [(905, 1535), (880, 1600), (835, 1665), (780, 1720), (720, 1745), (650, 1762), (560, 1748), (470, 1722), (410, 1705)],
    '1A ': [(899, 1323), (960, 1350), (1012, 1385), (990, 1440), (950, 1500), (905, 1535)],
    '628': [(520, 430), (606, 447), (700, 418), (780, 362), (856, 337), (935, 330)],
    '82': [(470, 1140), (586, 1218), (690, 1255), (790, 1300), (850, 1320)],
    '62': [(470, 800), (516, 825), (650, 812), (760, 805), (859, 812), (960, 790), (1050, 780)],
    '397': [(962, 1105), (1024, 1113), (1100, 1108), (1180, 1085), (1230, 1060)],
}
LOCALES = [
    [(1062, 840), (1150, 850), (1210, 880), (1235, 920)],      # Decor District → Washington Island
    [(990, 967), (1060, 975), (1120, 990), (1200, 1000)],      # Crosstown → Vice Beach
    [(1235, 860), (1250, 960), (1255, 1060), (1240, 1160)],    # Vice Beach (costa)
    [(1062, 1215), (1100, 1235), (1160, 1250)],                # Tequesta → Gloriana Key
    [(470, 1140), (440, 1215), (480, 1290), (560, 1340), (620, 1400)],  # costa del golfo → Watson Bay
    [(812, 587), (860, 470), (930, 430)],
    [(640, 1046), (650, 1110), (690, 1180)],
    [(700, 527), (680, 610), (700, 680), (760, 720), (800, 700)],
]

# ── Rótulos (px oficiales) ──
CONDADOS = [(727, 403, 'LUMMOX COUNTY'), (619, 792, 'KELLY COUNTY'), (1022, 718, 'LEONARD COUNTY'),
            (1055, 1148, 'VICE-DALE COUNTY'), (601, 1462, 'MARIANA COUNTY')]
CIUDADES = [(447, 715, 'PORT GELLHORN', 17), (978, 1040, 'VICE CITY', 19), (1245, 978, 'VICE BEACH', 15), (817, 1371, 'HAMLET', 14),
            (826, 1140, 'VCIA', 15), (811, 714, 'Ambrosia', 11), (961, 792, 'Belville', 10), (420, 1055, 'Capri', 11),
            (631, 1405, 'Watson Bay', 10), (831, 1666, 'Key Lento', 11), (658, 1326, 'Grassrivers', 11), (359, 599, 'Draper Island', 10),
            (403, 1738, 'Mile Zero Air Station', 9.5), (478, 1710, 'Southwind', 9.5), (703, 283, 'Bonanza', 10), (555, 436, 'Grayson', 10),
            (963, 460, 'Millport', 10), (1080, 646, 'Waning Sands', 10)]
LUGARES = [  # rótulos pequeños
    (839, 230, 'Hyde Island'), (772, 262, 'Saint Attaway Islands'), (555, 313, 'Featherstone Islands'), (940, 292, 'Frampton Islands'),
    (754, 331, 'Moreau'), (931, 354, 'East Lummox County'), (727, 452, 'Mount Kalaga National Park'), (874, 505, 'North Leonard County'),
    (1132, 497, 'Little Hardin Island'), (1046, 530, 'Richard Barebone State Park'), (365, 510, 'Zephyr Islands'), (718, 560, 'North Kelly County'),
    (569, 590, 'Manifest Canyon'), (884, 627, 'Lake Leonida'), (1154, 670, 'Vinewood Beach'), (648, 688, 'Frogswater'),
    (360, 779, 'Wild Hog Point'), (207, 810, 'Sandbars'), (1132, 835, 'Leaf Links'), (672, 840, 'Emerald Springs'),
    (888, 866, 'South Leonard County'), (1061, 866, 'Decor District'), (1213, 866, 'Washington Island'), (275, 874, 'Crude Islands'),
    (437, 872, 'Gellhorn Raceway'), (514, 894, 'Gellhorn'), (701, 946, 'Buckskin Swamp'), (993, 929, 'La Perle'), (1121, 935, 'Rialto Islands'),
    (1050, 944, 'Bayside'), (953, 996, 'Rockridge'), (1020, 993, 'Crosstown'), (856, 999, 'Balsero'), (576, 1011, 'South Kelly County'),
    (965, 1066, 'Little Cuba'), (1025, 1068, 'Downtown'), (908, 1081, 'Salton'), (1260, 1045, 'Ocean Beach'), (256, 1098, 'Belpoint'),
    (1176, 1112, 'Port Vice City'), (984, 1190, 'Tequesta'), (1065, 1185, 'Tequesta Retreat'), (632, 1166, 'Breakwater Quarry'),
    (1264, 1190, 'Dalton Island'), (575, 1246, 'Big Pine'), (1166, 1250, 'Gloriana Key'), (819, 1266, 'Bluegrass'), (970, 1278, 'Peacock Bay'),
    (480, 1285, 'Bobcat Key'), (1061, 1285, 'Catalan Key'), (912, 1300, 'Southside'), (903, 1362, 'South Vice-Dale'), (986, 1478, 'Corsair Key'),
    (761, 1466, 'Pelican Valley'), (884, 1518, 'Shoeless Keys'), (318, 1659, 'Riquezas Keys'), (532, 1688, 'Permit Keys'),
    (657, 1722, 'Maroon Key'), (657, 1786, 'Abismo Key'), (650, 1072, 'West Vice-Dale County'), (1148, 1027, 'Starfish Island'),
    (1132, 974, 'Vespucci Island'), (1163, 947, 'Casanova Island'), (1093, 963, 'Catalan Island'), (1127, 1066, 'Waxman Island'),
    (1221, 912, 'Oldby Island'), (1167, 885, 'Penmarch Isle'), (743, 1534, 'Cottonmouth Lake'),
]
AGUAS = [(1277, 637, 'Atlantic Ocean', 17), (190, 1278, 'Gulf Of Leonida', 17), (435, 1878, 'Leonida Straits', 12), (637, 257, 'Okchiloha Bay', 8),
         (920, 232, 'Partridge Bay', 8), (480, 427, 'San Malo Bay', 8), (1083, 453, 'Millport Basin', 8), (370, 688, 'Draper Bay', 8),
         (330, 820, 'Borrachero Sound', 8), (317, 1013, 'Capri Sound', 8), (404, 1185, 'Bobcat Bight', 8), (1215, 1153, 'Catalan Bay', 8),
         (550, 1520, 'Leonida Bay', 8), (821, 1574, 'Gambit Bay', 7), (937, 1472, 'Peregrine Bay', 7), (556, 1108, 'Nehrling River', 7)]


def escudo(px, py, num, tipo):
    x, y = c(px, py)
    if tipo == 'i':
        return (f'<g transform="translate({x} {y})"><path d="M-6 -6 H6 V1 Q6 6 0 8 Q-6 6 -6 1 Z" fill="#2f5fb3" stroke="#fff" stroke-width="0.9"/>'
                f'<rect x="-6" y="-6" width="12" height="3" fill="#c8323c"/><text y="4" font-size="5.2" font-weight="800" fill="#fff" text-anchor="middle">{num}</text></g>')
    if tipo == 'f':
        return (f'<g transform="translate({x} {y})"><path d="M-5.5 -6 H5.5 Q6 2 0 7 Q-6 2 -5.5 -6 Z" fill="#fff" stroke="#222" stroke-width="0.8"/>'
                f'<text y="2.4" font-size="5" font-weight="800" fill="#111" text-anchor="middle">{num}</text></g>')
    return (f'<g transform="translate({x} {y})"><rect x="-6" y="-5" width="12" height="10" rx="2" fill="#fff" stroke="#222" stroke-width="0.8"/>'
            f'<text y="2.2" font-size="5" font-weight="800" fill="#111" text-anchor="middle">{num.strip()}</text></g>')


ESCUDOS = [(479, 757, '404', 'i'), (478, 987, '404', 'i'), (731, 1043, '404', 'i'), (610, 545, '297', 'i'), (830, 533, '297', 'i'),
           (1052, 583, '97', 'i'), (1093, 760, '97', 'i'), (990, 967, '97', 'i'), (945, 1205, '97', 'i'), (812, 587, '35', 'f'),
           (803, 789, '35', 'f'), (803, 1025, '35', 'f'), (899, 1323, '35', 'f'), (614, 898, '183', 'f'), (460, 1071, '183', 'f'),
           (586, 1218, '82', 'e'), (606, 447, '628', 'e'), (856, 337, '628', 'e'), (516, 825, '62', 'e'), (859, 812, '62', 'e'),
           (1024, 1113, '397', 'e'), (1012, 1385, '1A', 'e'), (908, 1555, '1A', 'e'), (720, 1745, '1A', 'e'), (550, 1745, '1A', 'e')]


def texto(px, py, t, tam, clase):
    x, y = c(px, py)
    return f'<text x="{x}" y="{y}" class="{clase}" font-size="{tam}">{t}</text>'


svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {ANCHO} {ALTO}" width="{ANCHO * 2}" height="{ALTO * 2}">
<defs>
  <radialGradient id="oceano" cx="0.5" cy="0.45" r="0.8">
    <stop offset="0" stop-color="#12b5d0"/><stop offset="0.7" stop-color="#05a6c6"/><stop offset="1" stop-color="#028fb0"/>
  </radialGradient>
  <linearGradient id="verde" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3f7c63"/><stop offset="0.45" stop-color="#4f8c6e"/><stop offset="0.8" stop-color="#5a9474"/><stop offset="1" stop-color="#6a9c79"/>
  </linearGradient>
  <radialGradient id="relieve" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#21493a" stop-opacity="0.85"/><stop offset="1" stop-color="#21493a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="luz" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#cfe6d4" stop-opacity="0.45"/><stop offset="1" stop-color="#cfe6d4" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="pantano" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#6f9a6a" stop-opacity="0.75"/><stop offset="1" stop-color="#6f9a6a" stop-opacity="0"/>
  </radialGradient>
  <pattern id="calles" width="3" height="3" patternUnits="userSpaceOnUse">
    <rect width="3" height="3" fill="#aab2ba"/><rect x="0.35" y="0.35" width="2.3" height="2.3" fill="#c3c9cf"/>
  </pattern>
  <pattern id="cultivo" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
    <rect width="2.5" height="5" fill="#7fa77d"/><rect x="2.5" width="2.5" height="5" fill="#6c9a72"/>
  </pattern>
  <pattern id="arboles" width="4" height="4" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="0.9" fill="#2c5a45" opacity="0.5"/><circle cx="3" cy="3" r="0.8" fill="#3c6e55" opacity="0.5"/>
  </pattern>
  <clipPath id="recorte"><path d="{TIERRA}"/></clipPath>
  <filter id="difuso" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="9"/></filter>
  <filter id="sombra"><feDropShadow dx="0" dy="0.5" stdDeviation="0.7" flood-color="#0b2430" flood-opacity="0.9"/></filter>
  <style>
    text {{ font-family: 'Arial Narrow', 'Roboto Condensed', 'Helvetica Neue', Arial, sans-serif; text-anchor: middle; }}
    .cond {{ font-weight: 800; fill: #fff; letter-spacing: 0.5px; filter: url(#sombra); }}
    .ciu {{ font-weight: 800; fill: #fff; filter: url(#sombra); }}
    .lug {{ font-weight: 700; fill: #fff; filter: url(#sombra); }}
    .agua {{ font-family: Georgia, serif; font-style: italic; fill: #0a5d74; }}
  </style>
</defs>

<rect width="{ANCHO}" height="{ALTO}" fill="url(#oceano)"/>
<!-- aguas someras alrededor de la costa -->
<path d="{TIERRA}" fill="none" stroke="#7fe0ea" stroke-width="44" stroke-opacity="0.22" filter="url(#difuso)"/>
<path d="{TIERRA}" fill="none" stroke="#a6eef2" stroke-width="14" stroke-opacity="0.35" filter="url(#difuso)"/>
<!-- tierra -->
<path d="{TIERRA}" fill="#e6dcbd" stroke="#efe6ca" stroke-width="2.2" stroke-linejoin="round"/>
<g clip-path="url(#recorte)">
  <rect width="{ANCHO}" height="{ALTO}" fill="url(#verde)"/>
  <path d="{TIERRA}" fill="none" stroke="#e3d6ae" stroke-width="2.4"/>
  <!-- Mount Kalaga: relieve -->
  <ellipse cx="{c(700, 470)[0]}" cy="{c(700, 470)[1]}" rx="240" ry="150" fill="url(#relieve)"/>
  <ellipse cx="{c(700, 470)[0]}" cy="{c(700, 470)[1]}" rx="230" ry="140" fill="url(#arboles)"/>
  <ellipse cx="{c(690, 430)[0]}" cy="{c(690, 430)[1]}" rx="120" ry="55" fill="url(#luz)" opacity="0.5"/>
  <ellipse cx="{c(560, 760)[0]}" cy="{c(560, 760)[1]}" rx="110" ry="140" fill="url(#relieve)" opacity="0.5"/>
  <!-- Ambrosia y Leonard: cultivos -->
  <ellipse cx="{c(900, 860)[0]}" cy="{c(900, 860)[1]}" rx="90" ry="45" fill="url(#cultivo)" opacity="0.45"/>
  <ellipse cx="{c(760, 760)[0]}" cy="{c(760, 760)[1]}" rx="60" ry="40" fill="url(#cultivo)" opacity="0.35"/>
  <!-- Grassrivers y Buckskin: humedales -->
  <ellipse cx="{c(650, 1380)[0]}" cy="{c(650, 1380)[1]}" rx="150" ry="140" fill="url(#pantano)"/>
  <ellipse cx="{c(700, 940)[0]}" cy="{c(700, 940)[1]}" rx="70" ry="50" fill="url(#pantano)"/>
  <ellipse cx="{c(640, 1190)[0]}" cy="{c(640, 1190)[1]}" rx="90" ry="60" fill="url(#cultivo)" opacity="0.3"/>
</g>
<!-- ciudades -->
<path d="{URBANO}" fill="url(#calles)" clip-path="url(#recorte)"/>
<!-- lagos, ríos y bahías interiores -->
<path d="{AGUA}" fill="#4cc2d6" stroke="#9fe6ee" stroke-width="0.6"/>
<!-- carreteras -->
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
  {''.join(f'<path d="{linea(r)}" stroke="#fff" stroke-width="0.8" stroke-opacity="0.85"/>' for r in LOCALES)}
  {''.join(f'<path d="{linea(r)}" stroke="#556" stroke-width="2.6" stroke-opacity="0.35"/><path d="{linea(r)}" stroke="#fff" stroke-width="1.4"/>' for r in ESTATALES.values())}
  {''.join(f'<path d="{linea(r)}" stroke="#556" stroke-width="3.2" stroke-opacity="0.4"/><path d="{linea(r)}" stroke="#fff" stroke-width="1.9"/>' for r in FEDERALES.values())}
  {''.join(f'<path d="{linea(r)}" stroke="#445" stroke-width="3.8" stroke-opacity="0.45"/><path d="{linea(r)}" stroke="#fff" stroke-width="2.4"/>' for r in INTERESTATALES.values())}
</g>
<!-- pistas del aeropuerto VCIA -->
<g stroke="#fff" stroke-width="2.2" stroke-linecap="round">
  <path d="M{c(735, 1097)[0]} {c(735, 1097)[1]} L{c(880, 1097)[0]} {c(880, 1097)[1]}"/><path d="M{c(740, 1110)[0]} {c(740, 1110)[1]} L{c(880, 1110)[0]} {c(880, 1110)[1]}"/>
  <path d="M{c(735, 1130)[0]} {c(735, 1130)[1]} L{c(870, 1212)[0]} {c(870, 1212)[1]}"/>
</g>
<g>{''.join(escudo(*e) for e in ESCUDOS)}</g>
<g>
  {''.join(texto(px, py, t, s, 'agua') for px, py, t, s in AGUAS)}
  {''.join(texto(px, py, t, 6, 'lug') for px, py, t in LUGARES)}
  {''.join(texto(px, py, t, s, 'ciu') for px, py, t, s in CIUDADES)}
  {''.join(texto(px, py, t, 20, 'cond') for px, py, t in CONDADOS)}
</g>
<g transform="translate({c(245, 1405)[0]} {c(245, 1405)[1]})" opacity="0.85">
  <circle r="24" fill="none" stroke="#0a5d74" stroke-width="1"/>
  <path d="M0 -26 L5 0 L0 26 L-5 0 Z" fill="#0a5d74"/><path d="M-26 0 L0 5 L26 0 L0 -5 Z" fill="#2a8aa3"/>
  <text y="-30" font-size="9" font-weight="800" fill="#0a5d74">N</text>
</g>
<text x="{ANCHO - 8}" y="{ALTO - 8}" font-size="7" fill="#0a5d74" style="text-anchor:end">Mapa ilustrado por fans · basado en el mapa oficial de Leonida · no oficial</text>
</svg>
'''
open(os.path.join(RAIZ, 'assets', 'leonida.svg'), 'w').write(svg)
print('ok', len(svg) // 1024, 'KB')
