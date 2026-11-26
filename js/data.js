/* Leonida Atlas — datos base del mapa.
 * Recopilado de guías públicas de la comunidad (primera semana del juego, nov 2026).
 * Cada punto se ubica por su zona (`ancla`): las coordenadas salen de la tabla ANCLAS
 * (mapa de 1000 x 1000) con un pequeño desplazamiento para que no se encimen.
 * Si conoces la posición exacta puedes poner `x` y `y` directamente en el punto.
 * estado: 'confirmado' = 2+ fuentes coinciden · 'una_fuente' = 1 guía · 'rumor' = sin verificar.
 */
const FUENTES = {
  XT: { nombre: 'GTA Xtreme — Autos ocultos', url: 'https://www.gta-xtreme.com/gta-6/locations/hidden-cars' },
  XC: { nombre: 'GTA Xtreme — Cartas', url: 'https://www.gta-xtreme.com/en/gta-6-collectible-card-locations' },
  TBM: { nombre: 'TheBestMods — Autos ocultos', url: 'https://thebestmods.com/gta-6/hidden-cars/' },
  BL: { nombre: 'The Big Lead — Coleccionables', url: 'https://www.thebiglead.com/gta-6-collectibles-guide-cards-styles-meteorite-chunks-landmark-scans/' },
  GS: { nombre: 'GTAScoop — Encuentros aleatorios', url: 'https://gtascoop.com/guides/gta-6-random-encounters/' },
  MM: { nombre: 'MapMaster — Eventos', url: 'https://mapmaster.io/games/grand-theft-auto-6/guides/Random%20Event' },
  AGW: { nombre: 'AllGTAWorld — Eventos', url: 'https://allgtaworld.com/guides/gta-6-random-events' },
  BDO: { nombre: 'TheBaseDotaku — Encuentros', url: 'https://thebasedotaku.com/guides/gta-6-random-world-events-and-encounters/' },
  V6: { nombre: 'Vice6Map', url: 'https://vice6map.com/' },
  G6M: { nombre: 'GTA6Maps (ubicaciones)', url: 'https://gta6maps.io/gta-6' },
};

const REGIONES = ['Vice City', 'Leonida Keys', 'Grassrivers', 'Port Gellhorn', 'Ambrosia', 'Mount Kalaga'];

/* Zonas del mapa: [x, y, radio de dispersión, región]. Posiciones aproximadas. */
const ANCLAS = {
  // Vice City (condado de Vice-Dale)
  'Downtown': [694, 494, 3, 'Vice City'], 'Bayside': [697, 486, 3, 'Vice City'], 'Tequesta': [692, 503, 3, 'Vice City'],
  'Tequesta Retreat': [698, 511, 2.5, 'Vice City'], 'Crosstown': [684, 489, 3, 'Vice City'], 'Little Cuba': [676, 499, 3, 'Vice City'],
  'La Perle': [683, 475, 3, 'Vice City'], 'Little Haiti': [679, 467, 3, 'Vice City'], 'Stockyard': [688, 481, 2.5, 'Vice City'],
  'Decor District': [690, 471, 2.5, 'Vice City'], 'Salton': [671, 484, 3, 'Vice City'], 'Southside': [668, 516, 4, 'Vice City'],
  'Rockridge': [670, 506, 3, 'Vice City'], 'Balsero': [662, 476, 3, 'Vice City'], 'VCIA': [655, 492, 4, 'Vice City'],
  'Griffin': [660, 462, 3, 'Vice City'], 'Peacock Bay': [686, 522, 3, 'Vice City'], 'Peacock Estates': [691, 529, 2.5, 'Vice City'],
  'Shoreline': [700, 492, 2, 'Vice City'], 'Hamlet': [645, 528, 5, 'Vice City'], 'Capri': [566, 736, 6, 'Grassrivers'],
  'Waning Sands': [703, 450, 4, 'Vice City'], 'Vinewood Beach': [716, 447, 3, 'Vice City'], 'Leaf Links': [709, 460, 3, 'Vice City'],
  'Belville': [630, 440, 5, 'Vice City'], 'Peregrine Bay': [680, 548, 4, 'Vice City'],
  'Port Vice City': [708, 500, 2, 'Vice City'], 'Rialto Islands': [708, 480, 3, 'Vice City'], 'Vespucci Island': [706, 476, 2, 'Vice City'],
  'Starfish Island': [711, 487, 2, 'Vice City'], 'Salton Memorial Island': [711, 483, 1.5, 'Vice City'], 'Casanova Island': [707, 470, 2, 'Vice City'],
  'Penmarch Isle': [705, 466, 2, 'Vice City'], 'Neptune Circle': [712, 478, 2, 'Vice City'],
  'Vice Beach': [722, 482, 3, 'Vice City'], 'Washington Beach': [721, 470, 3, 'Vice City'], 'Ocean Beach': [722, 495, 3, 'Vice City'],
  'Catalan Key': [712, 528, 3, 'Vice City'], 'Gloriana Key': [710, 516, 3, 'Vice City'],
  // Leonida Keys (condado de Mariana)
  'Key Lento': [848, 868, 8, 'Leonida Keys'], 'Abismo Key': [830, 905, 4, 'Leonida Keys'], 'Maroon Key': [812, 922, 4, 'Leonida Keys'],
  'Corsair Key': [870, 925, 4, 'Leonida Keys'], 'Gambit Bay': [790, 880, 8, 'Leonida Keys'], 'Shoeless Keys': [765, 895, 8, 'Leonida Keys'],
  'Permit Keys': [895, 948, 5, 'Leonida Keys'], 'Southwind': [882, 936, 4, 'Leonida Keys'], 'Mile Zero': [900, 942, 3, 'Leonida Keys'],
  'Mariana County': [800, 840, 14, 'Leonida Keys'], 'North Mariana County': [760, 780, 12, 'Leonida Keys'],
  // Grassrivers
  'Grassrivers': [480, 545, 35, 'Grassrivers'], 'Pelican Valley': [400, 592, 10, 'Grassrivers'], 'Gullet Marsh': [380, 605, 8, 'Grassrivers'],
  'Buckskin Swamp': [540, 565, 10, 'Grassrivers'], 'Cottonmouth Lake': [520, 500, 8, 'Grassrivers'], 'Wetman Bay': [610, 742, 8, 'Grassrivers'],
  'Watson Bay': [305, 598, 6, 'Grassrivers'], 'Belpoint': [528, 760, 4, 'Grassrivers'], 'Sandbars': [515, 778, 6, 'Grassrivers'],
  // Ambrosia (condado de Leonard)
  'Ambrosia': [522, 338, 6, 'Ambrosia'], 'Lake Leonida': [552, 320, 8, 'Ambrosia'], 'Leonard County': [590, 385, 14, 'Ambrosia'],
  // Port Gellhorn (condado de Kelly)
  'Port Gellhorn': [215, 415, 8, 'Port Gellhorn'], 'Wild Hog Point': [160, 385, 4, 'Port Gellhorn'], 'Kelly County': [300, 395, 20, 'Port Gellhorn'],
  'Historic Route 628': [330, 393, 8, 'Port Gellhorn'], 'Starlet Motel': [336, 391, 2, 'Port Gellhorn'], 'Frogswater': [300, 322, 8, 'Port Gellhorn'],
  'North Kelly County': [215, 280, 14, 'Port Gellhorn'], 'Millport': [270, 330, 6, 'Port Gellhorn'], 'Manifest Canyon': [300, 240, 10, 'Port Gellhorn'],
  'Gellhorn Raceway': [245, 402, 3, 'Port Gellhorn'],
  // Mount Kalaga (condado de Lummox)
  'Mount Kalaga': [405, 150, 10, 'Mount Kalaga'], 'Lummox County': [430, 185, 35, 'Mount Kalaga'], 'Moreau': [320, 190, 8, 'Mount Kalaga'],
  'West Kalaga': [300, 208, 8, 'Mount Kalaga'], 'Kalaga Reservoir': [330, 116, 4, 'Mount Kalaga'], 'Emerald Springs': [470, 242, 8, 'Mount Kalaga'],
  'East Lummox County': [600, 170, 20, 'Mount Kalaga'], 'Northern Ridge': [470, 112, 10, 'Mount Kalaga'], 'Hyde Island': [578, 84, 3, 'Mount Kalaga'],
};

const GRUPOS = [
  { id: 'secretos', nombre: 'Secretos y botín' },
  { id: 'coleccion', nombre: 'Coleccionables' },
  { id: 'actividades', nombre: 'Eventos y actividades' },
  { id: 'negocios', nombre: 'Tiendas y negocios' },
  { id: 'servicios', nombre: 'Vehículos y servicios' },
  { id: 'lugares', nombre: 'Lugares' },
];

const CATEGORIAS = {
  escondite:     { nombre: 'Escondites (safehouses)', icono: '🏠', color: '#22c55e', grupo: 'secretos' },
  auto_raro:     { nombre: 'Autos raros y ocultos',   icono: '🏎️', color: '#f43f5e', grupo: 'secretos' },
  misterio:      { nombre: 'Easter eggs y misterios', icono: '👽', color: '#14b8a6', grupo: 'secretos' },
  carta:         { nombre: 'Cartas coleccionables',   icono: '🃏', color: '#a855f7', grupo: 'coleccion' },
  meteorito:     { nombre: 'Meteoritos',              icono: '☄️', color: '#fb7185', grupo: 'coleccion' },
  flamenco:      { nombre: 'Flamencos',               icono: '🦩', color: '#f472b6', grupo: 'coleccion' },
  escaneo:       { nombre: 'Escaneos WAiNK',          icono: '📷', color: '#38bdf8', grupo: 'coleccion' },
  aro:           { nombre: 'Aros de básquet',         icono: '🏀', color: '#f97316', grupo: 'coleccion' },
  salto:         { nombre: 'Saltos acrobáticos',      icono: '🛹', color: '#eab308', grupo: 'coleccion' },
  revista:       { nombre: 'Revistas, peinados y tatuajes', icono: '📖', color: '#c084fc', grupo: 'coleccion' },
  coleccionable: { nombre: 'Otros coleccionables',    icono: '💎', color: '#818cf8', grupo: 'coleccion' },
  evento:        { nombre: 'Eventos aleatorios',      icono: '⚡', color: '#facc15', grupo: 'actividades' },
  atraco:        { nombre: 'Atracos y robos',         icono: '💰', color: '#fb923c', grupo: 'actividades' },
  armas:         { nombre: 'Armas únicas',            icono: '🔫', color: '#ef4444', grupo: 'actividades' },
  ocio:          { nombre: 'Ocio y deportes',         icono: '🏟️', color: '#0ea5e9', grupo: 'actividades' },
  tienda:        { nombre: 'Tiendas y comercios',     icono: '🛒', color: '#3b82f6', grupo: 'negocios' },
  ropa:          { nombre: 'Ropa y moda',             icono: '👕', color: '#ec4899', grupo: 'negocios' },
  restaurante:   { nombre: 'Restaurantes y comida',   icono: '🍔', color: '#fdba74', grupo: 'negocios' },
  bar:           { nombre: 'Bares y vida nocturna',   icono: '🍸', color: '#d946ef', grupo: 'negocios' },
  banco:         { nombre: 'Bancos',                  icono: '🏦', color: '#10b981', grupo: 'negocios' },
  hotel:         { nombre: 'Hoteles y moteles',       icono: '🏨', color: '#8b5cf6', grupo: 'negocios' },
  taller:        { nombre: 'Talleres y autos',        icono: '🔧', color: '#94a3b8', grupo: 'servicios' },
  gasolinera:    { nombre: 'Gasolineras',             icono: '⛽', color: '#eab308', grupo: 'servicios' },
  transporte:    { nombre: 'Transporte',              icono: '✈️', color: '#06b6d4', grupo: 'servicios' },
  policia:       { nombre: 'Policía y gobierno',      icono: '🚓', color: '#1d4ed8', grupo: 'servicios' },
  emblematico:   { nombre: 'Lugares emblemáticos',    icono: '🗼', color: '#f59e0b', grupo: 'lugares' },
  naturaleza:    { nombre: 'Naturaleza',              icono: '🌴', color: '#16a34a', grupo: 'lugares' },
};

const yt = (id, t, autor) => ({ url: `https://www.youtube.com/watch?v=${id}${t ? `&t=${t}s` : ''}`, autor });

const POIS = [
  /* ───────── ESCONDITES ───────── */
  { id: 'casa-jason', nombre: 'Casa de Jason', cat: 'escondite', ancla: 'Key Lento', desc: 'Primer escondite de Jason en los Cayos.', fuentes: ['V6', 'BL'], estado: 'confirmado' },
  { id: 'depto-lucia', nombre: 'Departamento de Lucía', cat: 'escondite', ancla: 'Crosstown', desc: 'Escondite de Lucía en Crosstown.', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'starlet-motel', nombre: 'Starlet Motel', cat: 'escondite', ancla: 'Starlet Motel', zona: 'Historic Route 628, condado de Kelly',
    desc: 'Motel del Capítulo 2. Ojo: hay cartas que se pierden si no las tomas antes de terminar ese capítulo.', fuentes: ['V6', 'XC'], estado: 'confirmado' },
  { id: 'y-vice-city', nombre: 'Y Vice City', cat: 'escondite', ancla: 'Washington Beach', desc: 'Hotel de Vice Beach marcado como escondite.', fuentes: ['V6'], estado: 'una_fuente' },

  /* ───────── AUTOS RAROS ───────── */
  { id: 'banshee-capri', nombre: 'Bravado Banshee', cat: 'auto_raro', ancla: 'Capri', zona: 'Capri — Sweetbay Inn, East Buckley Drive',
    desc: 'Estacionado en los cajones justo afuera del Sweetbay Inn.', hora: 'Aprox. 3:00 a.m. (hora del juego)',
    pasos: ['Ve a East Buckley Drive en Capri.', 'Revisa los cajones frente al Sweetbay Inn.', 'Si están vacíos, vuelve tarde en la noche.'], fuentes: ['XT'], estado: 'una_fuente' },
  { id: 'tempesta-ne3', nombre: 'Pegassi Tempesta (evento de la grúa)', cat: 'auto_raro', ancla: 'Decor District', zona: 'NE 3rd Street',
    desc: 'Evento: un dueño pelea con el de la grúa que se lleva su Tempesta. El daño reduce lo que paga Randy.', hora: 'Aprox. 1:00 p.m.',
    pasos: ['Pasa por NE 3rd Street al mediodía.', 'Amenaza al dueño hasta que se aleje.', 'Suelta el auto de la grúa con el aviso en pantalla.', 'Llévaselo a Randy en Balsero sin chocarlo.'],
    fuentes: ['XT', 'GS'], estado: 'confirmado', etiquetas: ['Lista de Randy', 'Evento'] },
  { id: 'infernus-policia', nombre: 'Pegassi Infernus', cat: 'auto_raro', ancla: 'Crosstown', zona: 'Comisaría de Crosstown, NW 9th Street — estacionamiento nivel 7',
    desc: 'En el piso 7 del estacionamiento de la comisaría de Crosstown.',
    pasos: ['Espera a que se abra la reja del estacionamiento y entra.', 'Sube por las rampas hasta el nivel 7.', 'Revisa si tiene rastreador antes de llevárselo a Randy.'],
    videos: [yt('Hb6ZJf7Bpg4', 110, 'MonkeyKingHero')], fuentes: ['XT'], estado: 'una_fuente', etiquetas: ['Lista de Randy'] },
  { id: 'vitello-waning', nombre: 'Pegassi Vitello', cat: 'auto_raro', ancla: 'Waning Sands', zona: 'Waning Sands — villa con reja en Flamingo Parkway',
    desc: 'Dentro del garaje más cercano a la casa (mirando desde la entrada, a la derecha).',
    pasos: ['Desde Belville ve al este por Flamingo Parkway.', 'Frente a la casa, mira a la derecha: es el garaje pegado a la casa.', 'Planea la salida antes de subirte.'], fuentes: ['XT'], estado: 'una_fuente' },
  { id: 'gauntlet-m7', nombre: 'Bravado Gauntlet Hellfire ("Devil\'s Rope")', cat: 'auto_raro', ancla: 'Hamlet', zona: 'Hamlet — deshuesadero M7 (Nova Auto Junkyard), Galerina Street',
    desc: 'Detrás de los contenedores, por el borde derecho del deshuesadero. Lo cuidan motociclistas.',
    pasos: ['Desde Boone Speedway ve al este por Galerina Street.', 'Entra por el tragaluz del garaje.', 'Abre la reja desde adentro para tener salida.', 'Sal con cuidado: hay motociclistas armados.'],
    videos: [yt('7_STpYnHfEE', 145, 'MonkeyKingHero')], fuentes: ['XT', 'TBM'], estado: 'confirmado' },
  { id: 'mamba-leaf', nombre: 'Mamba GT', cat: 'auto_raro', ancla: 'Leaf Links', zona: 'Mansión de Leaf Links',
    desc: 'Detrás del edificio, por el camino del lado derecho. Ligado a la misión de Randy "¡Dale Mamba!".',
    pasos: ['Toma el camino del lado derecho de la propiedad.', 'Entra a la casa principal con la Snap Gun.', 'La llave está en un tazón sobre la mesa detrás del sofá.', 'Regresa al auto y sal.'],
    requisitos: 'Misión de Randy "¡Dale Mamba!" + Snap Gun', fuentes: ['XT'], estado: 'una_fuente', etiquetas: ['Lista de Randy'] },
  { id: 'paragon-banana', nombre: 'Ascot Paragon', cat: 'auto_raro', ancla: 'Ocean Beach', zona: 'Ocean Beach — Banana Hole Main Bar, Shore Drive',
    desc: 'Estacionado justo afuera del Banana Hole Main Bar.', hora: 'Aprox. 6:00 p.m.', fuentes: ['XT'], estado: 'una_fuente' },
  { id: 'furia-peacock', nombre: 'Piccia Furia', cat: 'auto_raro', ancla: 'Peacock Estates', zona: 'Peacock Bay — villa en Palladia Lane',
    desc: 'Dentro del garaje de una villa con reja.',
    pasos: ['Toma el camino a la izquierda de la reja y brinca el seto.', 'Avanza entre el agua y el garaje.', 'Entra por la puerta lateral del garaje.', 'Abre la cortina antes de salir.'],
    videos: [yt('r6GoTOpMETg', 190, 'MonkeyKingHero')], fuentes: ['XT'], estado: 'una_fuente' },
  { id: 'toros-tequesta', nombre: 'Pegassi Toros', cat: 'auto_raro', ancla: 'Tequesta Retreat', zona: 'Tequesta Retreat — Pegassi Residences, Bayside Drive',
    desc: 'SUV estacionada en la entrada de Pegassi Residences.', hora: 'Aprox. 6:30 p.m.', videos: [yt('nOSkviR2Et0', 19, 'Gamer Guru')], fuentes: ['XT'], estado: 'una_fuente' },
  { id: 'growler-fig', nombre: 'Pfister Growler', cat: 'auto_raro', ancla: 'Ocean Beach', zona: 'Ocean Beach — estacionamiento de Fig Street',
    desc: 'En los cajones marcados de los pisos del estacionamiento.', hora: 'Aprox. 5:00 p.m.', fuentes: ['XT'], estado: 'una_fuente' },
  { id: 'penumbra-vespucci', nombre: "Maibatsu '97 Penumbra FF (el Eclipse de Paul Walker)", cat: 'auto_raro', ancla: 'Vespucci Island', zona: 'Vespucci Island, Rialto Islands',
    desc: 'En una villa grande al norte de la calle principal. TheBestMods lo ubica en Neptune Circle; las guías no coinciden.',
    pasos: ['Desde Vice Beach cruza al oeste el puente de Rialto Islands.', 'Brinca el seto y gira a la izquierda por la reja verde chica.', 'Entra por la puerta lateral junto al portón.', 'Si suena la alarma, usa el panel de la pared izquierda.', 'Abre el portón desde adentro.'],
    requisitos: 'Se registra con Moses (Watkins Auto Parts) desde el Capítulo 2', videos: [yt('g6pNfpij-JE', 20, 'Maka91Productions')], fuentes: ['XT', 'TBM'], estado: 'una_fuente' },
  { id: 'charred-toros', nombre: 'Charred Toros', cat: 'auto_raro', ancla: 'La Perle', zona: 'La Perle — casa de narcomenudeo', desc: 'Dentro de una "trap house". Sin rastreador.', fuentes: ['TBM'], estado: 'una_fuente' },
  { id: 'firebug-dominator', nombre: 'Firebug Dominator', cat: 'auto_raro', ancla: 'Port Gellhorn', zona: 'La Cascara Motel', desc: 'Lo cuida la pandilla Kolts. Sin rastreador.', fuentes: ['TBM'], estado: 'una_fuente' },
  { id: 'ruby-emerus', nombre: 'Royal Ruby Emerus', cat: 'auto_raro', ancla: 'Neptune Circle', zona: 'Neptune Circle — garaje de mansión', desc: 'Muy vigilado. Sin rastreador, con nitro. Aprox. $33,000.', fuentes: ['TBM'], estado: 'una_fuente' },
  { id: 'purple-emerus', nombre: 'Purple Drank Emerus', cat: 'auto_raro', ancla: 'Port Vice City', zona: 'Patio de contenedores', desc: 'Oportunidad de robo del Capítulo 3. Vigilado, con nitro.', requisitos: 'Capítulo 3', fuentes: ['TBM'], estado: 'una_fuente' },
  { id: 'copperheads-gauntlet', nombre: 'Copperheads Gauntlet', cat: 'auto_raro', ancla: 'Ambrosia', zona: 'Garaje en Ambrosia', desc: 'Alarma estándar. Desbloquea un vinil.', fuentes: ['TBM'], estado: 'una_fuente' },
  { id: 'brimstone-golfer', nombre: 'Vapid Brimstone Golfer (carrito de golf en llamas)', cat: 'auto_raro', ancla: 'Leaf Links', zona: 'Garaje de la casa a la izquierda tras el puente desde Washington Island',
    desc: 'The Big Lead lo ubica en Leaf Links (junto a dos aros de básquet); TheBestMods dice Penmarch Isle.', fuentes: ['BL', 'TBM'], estado: 'una_fuente' },
  { id: 'coquette-spiderweb', nombre: 'Invetero Coquette Spiderweb', cat: 'auto_raro', ancla: 'Key Lento', zona: 'Garaje de la casa de fiesta (esquina sureste)',
    desc: 'El teclado del garaje se abre con el código 092319. Ahí mismo hay una carta (Lionel Taber).', requisitos: 'Código 092319', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'drifter-elegy', nombre: 'Drifter Elegy', cat: 'auto_raro', ancla: 'Gellhorn Raceway', zona: 'Gellhorn Raceway — garaje', desc: 'Tiene rastreador: pásalo por Pay \'n\' Spray.', fuentes: ['TBM'], estado: 'una_fuente' },
  { id: 'royal-sanchez', nombre: 'Royal Sanchez (moto)', cat: 'auto_raro', ancla: 'North Mariana County', zona: 'Contenedor naranja', requisitos: 'Abridor de cajas', fuentes: ['TBM'], estado: 'una_fuente' },
  { id: 'caliente-picador', nombre: 'Caliente Picador', cat: 'auto_raro', ancla: 'North Mariana County', zona: 'Contenedor amarillo',
    pasos: ['Usa el bulldozer para empujar los otros contenedores.', 'Abre el contenedor amarillo.'], fuentes: ['TBM'], estado: 'una_fuente' },
  { id: 'bloodless-jugular', nombre: 'Bloodless Jugular', cat: 'auto_raro', ancla: 'Leonard County', zona: 'Garaje junto a una casa blanca', requisitos: 'Key Cloner (Capítulo 3)', fuentes: ['TBM'], estado: 'una_fuente' },

  /* ───────── CARTAS COLECCIONABLES ───────── */
  { id: 'carta-julian-cruz', nombre: 'Carta: Julian Cruz (Oro) — Vice City Flamingos', cat: 'carta', ancla: 'Little Cuba', zona: 'Edificio al sur de la tienda de Yasmani',
    pasos: ['Encuentra la tienda de Yasmani.', 'Entra al edificio de al lado, hacia el sur.', 'Sigue el pasillo largo hasta la oficina pequeña del lado norte.', 'La carta está en el tablero.'],
    videos: [yt('qNjp9xifVz4', 0, 'Tansel Plays')], fuentes: ['XC'], estado: 'una_fuente' },
  { id: 'carta-mateo', nombre: 'Carta: Mateo Caballero (Plata) — Vice City Flamingos', cat: 'carta', ancla: 'La Perle', zona: 'Casa al norte de Zenon\'s Pawn Shop, recámara', fuentes: ['XC'], estado: 'una_fuente' },
  { id: 'carta-ulysses', nombre: 'Carta: Ulysses Whitlock (Plata)', cat: 'carta', ancla: 'Tequesta', zona: 'Edificio con helipuerto al este de Grand Majestic Gym',
    pasos: ['Toma el elevador a la azotea.', 'Sube por la escalera de caracol hasta arriba.'], fuentes: ['XC'], estado: 'una_fuente' },
  { id: 'carta-anthony-poke', nombre: 'Carta: Anthony Poke II (Rojo) — Liberty City Wrath', cat: 'carta', ancla: 'Washington Beach', zona: 'Ajax Gym, Oldby Island',
    pasos: ['Sube las escaleras hasta las caminadoras.', 'Cruza la puerta que está detrás.', 'La carta está en el tablero del pasillo de arriba.'], videos: [yt('HJ71g6PDBvg', 0, 'GTA6xx')], fuentes: ['XC'], estado: 'una_fuente' },
  { id: 'carta-victor', nombre: 'Carta: Victor Maravilla — Los Santos Corkers', cat: 'carta', ancla: 'Starlet Motel', zona: 'Cocina del Starlet Motel, sobre el refrigerador',
    desc: '⚠ SE PIERDE: la cocina queda cerrada al terminar el Capítulo 2.', requisitos: 'Tómala antes de terminar el Capítulo 2', videos: [yt('QNoJY8o8WAA', 0, 'EmPee HQ')], fuentes: ['XC'], estado: 'una_fuente', etiquetas: ['Perdible'] },
  { id: 'carta-vicki', nombre: 'Carta: Vicki — Delight Dancers', cat: 'carta', ancla: 'Starlet Motel', zona: 'Oficina del Starlet Motel → baño, piso junto al inodoro',
    desc: '⚠ SE PIERDE: el área queda cerrada al terminar el Capítulo 2.', requisitos: 'Tómala antes de terminar el Capítulo 2', videos: [yt('DsXhrlimA5Y', 0, 'EmPee HQ')], fuentes: ['XC', 'BL'], estado: 'confirmado', etiquetas: ['Perdible'] },
  { id: 'carta-harley', nombre: 'Carta: Harley — Delight Dancers', cat: 'carta', ancla: 'Port Gellhorn', zona: 'Club Delights, pared este, asiento de la cabina',
    desc: 'La encuentras al seguir a Vicki a su trabajo (Cap. 2). El club se puede volver a visitar después.', videos: [yt('dNvl2L4EH4Y', 94, 'JFL VIDEOS')], fuentes: ['XC', 'BL'], estado: 'confirmado' },
  { id: 'carta-tracy', nombre: 'Carta: Tracy — Delight Dancers', cat: 'carta', ancla: 'Salton', zona: 'Edificio al este de la salida de la carrera Hit \'n\' Run VC',
    desc: 'Sube por la escalera de atrás al cuarto de la azotea. The Big Lead la ubica en la planta de agua de East Salton, último piso.', videos: [yt('dNvl2L4EH4Y', 62, 'JFL VIDEOS')], fuentes: ['XC', 'BL'], estado: 'una_fuente' },
  { id: 'carta-marquise', nombre: 'Carta: Marquise Bernard — Los Santos Panic', cat: 'carta', ancla: 'Key Lento', zona: 'Barril afuera de Kenton\'s Island Dreams',
    desc: 'Revisa el barril antes de entrar a la tienda de buceo.', videos: [yt('UYER0RmxtZE', 0, 'Respawn255')], fuentes: ['XC', 'BL'], estado: 'confirmado' },
  { id: 'carta-laki', nombre: 'Carta: Laki Maivia (Bronce) — Los Santos Pounders', cat: 'carta', ancla: 'Cottonmouth Lake', zona: 'Tráiler en la isla al sur/suroeste del lago',
    desc: 'Está en una caja fuerte. Combinación: 44017 (la pista está en las fotos/postales de la pared).', requisitos: 'Código 44017', videos: [yt('yzP6SO0Rys8', 6, 'Fuze | GTA 6')], fuentes: ['XC', 'BL'], estado: 'confirmado' },
  { id: 'carta-delord', nombre: 'Carta: Delord Nathan Alford — Vice City Manatees', cat: 'carta', ancla: 'Belville', zona: 'Lavandería abandonada (plaza al sur de The Thirsty Wolf)',
    desc: 'Entra por la escotilla del techo; la carta está en la repisa junto al perro (un Yorkshire que ladra). En la pared hay una caja fuerte con código 62412.', fuentes: ['XC', 'BL'], estado: 'confirmado' },
  { id: 'carta-kadisha', nombre: 'Carta: Kadisha (Rosa) — Jack of Hearts Dancers', cat: 'carta', ancla: 'VCIA', zona: 'Pawn City, tráiler del suroeste, en el colchón', videos: [yt('deway4CZA1U', 42, 'JFL VIDEOS')], fuentes: ['XC'], estado: 'una_fuente' },
  { id: 'carta-christel', nombre: 'Carta: Christel (Rojo) — Jack of Hearts Dancers', cat: 'carta', ancla: 'La Perle', zona: 'Azotea del edificio de Tyrone, parte suroeste', videos: [yt('deway4CZA1U', 4, 'JFL VIDEOS')], fuentes: ['XC'], estado: 'una_fuente' },
  { id: 'carta-brianna', nombre: 'Carta: Brianna Blue (Rojo) — Jack of Hearts Dancers', cat: 'carta', ancla: 'Pelican Valley', zona: 'Isla habitada al oeste de Gullet Marsh, edificio cuadrado (lado norte), repisa', videos: [yt('deway4CZA1U', 74, 'JFL VIDEOS')], fuentes: ['XC'], estado: 'una_fuente' },
  { id: 'carta-malena', nombre: 'Carta: Malena (Rojo) — Jack of Hearts Dancers', cat: 'carta', ancla: 'Belville', zona: 'Fila norte de casas, al oeste de la casa de Andy — escritorio de la recámara del fondo',
    desc: 'La casa tiene caballos falsos en el jardín. En la sala hay una revista con el maquillaje "Diamond Adorned Pink Cat Eye".', videos: [yt('deway4CZA1U', 126, 'JFL VIDEOS')], fuentes: ['XC', 'BL'], estado: 'confirmado' },
  { id: 'carta-kelly', nombre: 'Carta: Kelly (Morado) — Jack of Hearts Dancers', cat: 'carta', ancla: 'Tequesta', zona: 'Moteles en forma de C al oeste de Vice Seven Condominiums, arriba de los contenedores', videos: [yt('deway4CZA1U', 48, 'JFL VIDEOS')], fuentes: ['XC'], estado: 'una_fuente' },
  { id: 'carta-serena', nombre: 'Carta: Serena (Oro) — NINE1NINE Dancers', cat: 'carta', ancla: 'Peacock Estates', zona: 'Garaje de la finca más al sur (no está en el club)', videos: [yt('aJ64tOXDols', 82, 'JFL VIDEOS')], fuentes: ['XC'], estado: 'una_fuente' },
  { id: 'carta-wokester', nombre: 'Carta: Wokester (Azul) — Legends of Ratface', cat: 'carta', ancla: 'Key Lento', zona: 'Tienda The Wonder Whale, banca del lado noreste', videos: [yt('Eiyp9WgH5uI', 1, "Collector's Vault")], fuentes: ['XC'], estado: 'una_fuente' },
  { id: 'carta-thelma', nombre: 'Carta: Thelma — Delight Dancers', cat: 'carta', ancla: 'Key Lento', zona: 'Torre central: cuarto de control, un piso abajo de la cima', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'carta-braelynn', nombre: 'Carta: Braelynn (Rojo profundo) — NINE1NINE Dancers', cat: 'carta', ancla: 'North Kelly County', zona: 'Dentro del Observatorio Hoffman',
    pasos: ['Trepa al auto chocado.', 'Sube por el andamio.', 'Entra por la ventana abierta.'], fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'carta-dominic', nombre: 'Carta: Dominic Brizzolato (Oro) — Vice City Manatees', cat: 'carta', ancla: 'Catalan Key', zona: 'Vice City Oceanarium (al noreste de Catalan Key)',
    desc: 'Bajo la cúpula, dentro de la gran boca de tiburón, junto a la decoración de tortuga.', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'carta-makeek', nombre: 'Carta: Makeek River (Oro) — Vice City Manatees', cat: 'carta', ancla: 'Ocean Beach', zona: 'Garaje en la punta sur de Vice Beach',
    pasos: ['Unas tarimas bloquean la puerta: empújalas con un vehículo.', 'La carta está en una caja fuerte: ábrela con explosivos.'], fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'carta-leroy', nombre: 'Carta: Leroy Rook (Oro) — Vice City Narcos', cat: 'carta', ancla: 'Belville', zona: 'Caja fuerte en la recámara de la casa al sureste del campus Celerica', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'carta-ichiro', nombre: 'Carta: Ichiro Yamada (Plata) — Liberty City Swingers', cat: 'carta', ancla: 'Port Vice City', zona: 'Mesa en las bodegas de la terminal',
    desc: 'Pasas por ahí durante la misión "Doggie Bag".', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'carta-jesina', nombre: 'Carta: Jesina (Oro) — NINE1NINE Dancers', cat: 'carta', ancla: 'Vespucci Island', zona: 'Mansión del borde suroeste, cuarto de arriba con el perro', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'carta-cleo', nombre: 'Carta: Cleo — Delight Dancers', cat: 'carta', ancla: 'Kalaga Reservoir', zona: 'Edificio al sur de Kalaga Reservoir', fuentes: ['BL'], estado: 'una_fuente' },

  /* ───────── METEORITOS ───────── */
  { id: 'met-abismo', nombre: 'Meteorito junto al esqueleto de Abismo Key', cat: 'meteorito', ancla: 'Abismo Key', zona: 'Playa al sur del dirigible', desc: 'Junto al escaneo "Abismo Key Carcass". Brillan de noche.', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'met-avion', nombre: 'Meteorito en avión hundido', cat: 'meteorito', ancla: 'Corsair Key', zona: 'Bajo el agua, al este de la isla pequeña al este de Corsair Key', desc: 'Dentro del chasis del avión.', requisitos: 'Bucear', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'met-yate', nombre: 'Meteoritos en yate, helicóptero y carguero hundidos', cat: 'meteorito', ancla: 'Key Lento', zona: 'Bajo el agua, al este de Kenton\'s Island Dreams',
    pasos: ['Yate: a casi el doble de distancia al este de Kenton\'s, pasando la isla; el meteorito está debajo.', 'Helicóptero: directo al sur del yate, debajo del casco.', 'Carguero: al sureste del helicóptero, entre las algas; entra por el hoyo del costado.'], requisitos: 'Bucear', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'met-selkie', nombre: '5 meteoritos en Selkie Hole', cat: 'meteorito', ancla: 'Emerald Springs', zona: 'Punto de buceo en el borde oeste de Emerald Springs',
    desc: 'En los túneles submarinos. Del tercero en adelante: sal a una cueva y vuelve a sumergirte por el gran hoyo central. Usa el escáner.', fuentes: ['BL', 'XC'], estado: 'confirmado' },
  { id: 'met-killtelligence', nombre: 'Meteorito bajo la torre de Killtelligence', cat: 'meteorito', ancla: 'Mount Kalaga', zona: 'Rocas bajo la torre al sureste de Killtelligence Provisions',
    desc: 'En la cima de la torre hay una carta (Malena Rosa). Al pie: salto BASE y punto de meditación.', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'met-belville', nombre: 'Meteorito bajo la cama de un garaje', cat: 'meteorito', ancla: 'Belville', zona: 'Segunda casa desde la izquierda, sección media de la fila norte',
    desc: 'En el mismo garaje hay una carta (Illuminaughty Morado).', fuentes: ['BL', 'XC'], estado: 'confirmado' },
  { id: 'met-sands-of-time', nombre: 'Meteorito en el asilo Sands of Time', cat: 'meteorito', ancla: 'Vinewood Beach', zona: 'Escritorio de la planta baja, pasando la mesa de billar', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'met-belpoint', nombre: 'Fragmento de meteorito bajo el muelle de Belpoint', cat: 'meteorito', ancla: 'Belpoint', zona: 'Muelle del norte de la isla, al oeste de Capri', fuentes: ['BL'], estado: 'una_fuente' },

  /* ───────── FLAMENCOS ───────── */
  { id: 'fla-key-lento', nombre: 'Flamenco en la casa excéntrica', cat: 'flamenco', ancla: 'Key Lento', zona: 'Jardín de la casa excéntrica del centro', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'fla-halloween', nombre: 'Flamenco de la Halloween House', cat: 'flamenco', ancla: 'Capri', zona: 'Cuadrícula de seis calles al sur de Tortoise Lake', desc: 'La casa también es escaneo WAiNK.', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'fla-la-costa', nombre: 'Flamenco afuera de La Costa', cat: 'flamenco', ancla: 'Capri', zona: 'Dos cuadras abajo de Hair By Clair, suroeste de Capri', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'fla-abismo', nombre: 'Flamenco en la costa de Abismo Key', cat: 'flamenco', ancla: 'Abismo Key', zona: 'Costa sureste', fuentes: ['BL'], estado: 'una_fuente' },

  /* ───────── ESCANEOS WAiNK ───────── */
  { id: 'esc-wonder-whale', nombre: 'Escaneo: The Wonder Whale', cat: 'escaneo', ancla: 'Key Lento', zona: 'Escultura de ballena frente a la tienda, Sunbelt Hwy', fuentes: ['BL', 'GS'], estado: 'confirmado' },
  { id: 'esc-thicc-herbie', nombre: 'Escaneo: Thicc Herbie (el dirigible)', cat: 'escaneo', ancla: 'Maroon Key', zona: 'Escanéalo desde el mirador del oeste de Abismo Key', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'esc-funfair', nombre: 'Escaneo: Gellhorn Funfair', cat: 'escaneo', ancla: 'Port Gellhorn', zona: 'La rueda de la fortuna de la feria abandonada', desc: 'En un carrito chocón hay una carta de Right Wing.', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'esc-hoffman', nombre: 'Escaneo: Hoffman Observatory', cat: 'escaneo', ancla: 'North Kelly County', zona: 'Cima del pico del extremo oeste del norte de Kelly', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'esc-ruinas', nombre: 'Escaneo: Imperial Spanish Ruins', cat: 'escaneo', ancla: 'Mount Kalaga', zona: 'Cima del pico suroeste del parque', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'esc-selkie', nombre: 'Escaneo: Selkie Hole', cat: 'escaneo', ancla: 'Emerald Springs', zona: 'Baja las escaleras del punto de buceo', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'esc-pistola', nombre: 'Escaneo: Gimme All Your Oil (escultura de pistola)', cat: 'escaneo', ancla: 'Decor District', zona: 'Al sur del mall principal, noreste de Stockyard Speedshop', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'esc-large-lure', nombre: 'Escaneo: Large Lure', cat: 'escaneo', ancla: 'Ocean Beach', zona: 'Al sur de Lucciano\'s, extremo sur de Vice Beach', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'esc-blanco', nombre: 'Escaneo: Blanco Memorial', cat: 'escaneo', ancla: 'Salton Memorial Island', zona: 'Arriba de Starfish Island', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'esc-topiary', nombre: 'Escaneo: Belville Topiary', cat: 'escaneo', ancla: 'Belville', zona: 'Seto del jardín trasero de una casa al sureste del campus Celerica', fuentes: ['BL'], estado: 'una_fuente' },

  /* ───────── AROS / SALTOS / REVISTAS ───────── */
  { id: 'aro-leaf-links', nombre: 'Dos aros de básquet en Leaf Links', cat: 'aro', ancla: 'Leaf Links', zona: 'Casa a la izquierda tras el puente desde Washington Island', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'aro-starfish', nombre: 'Aro en Starfish Island', cat: 'aro', ancla: 'Starfish Island', zona: 'Jardín delantero de la mansión del centro-norte', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'aro-key-lento', nombre: 'Aro junto a Shrimp & Save', cat: 'aro', ancla: 'Key Lento', zona: 'Cancha al sur de Shrimp & Save, junto a la alberca', desc: 'En la misma cancha hay una carta (Remy Herbert, naranja).', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'salto-abismo', nombre: 'Salto: puente bajo Abismo Key – Key Lento', cat: 'salto', ancla: 'Abismo Key', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'salto-contenedor', nombre: 'Salto: contenedor detrás de la obra', cat: 'salto', ancla: 'Key Lento', zona: 'Junto al corralón de la policía', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'salto-mile-zero', nombre: 'Saltos: rampas de Mile Zero Air Station', cat: 'salto', ancla: 'Mile Zero', zona: 'Borde sur (rampa de arena) y esquina sureste', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'salto-cottonmouth', nombre: 'Salto: cruce del río al este de Cottonmouth Lake', cat: 'salto', ancla: 'Cottonmouth Lake', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'rev-trigger-happy', nombre: 'Revista Trigger Happy #99', cat: 'revista', ancla: 'Key Lento', zona: 'Casa en el centro-norte (hay que forzar la entrada)', desc: 'En la chimenea de la misma casa hay una carta (Dartanyon Pearson).', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'rev-goth-garnet', nombre: 'Maquillaje Goth Garnet', cat: 'revista', ancla: 'Hamlet', zona: 'Oficina trasera de una bodega arriba de la comisaría de Hamlet', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'rev-spiky-bun', nombre: 'Peinado Spiky Bun and Framing (Lucía)', cat: 'revista', ancla: 'Ocean Beach', zona: 'Azotea del rascacielos al sur de Vice Beach, sobre tres tiendas de ropa', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'rev-graffiti', nombre: 'Tatuaje Graffiti Point', cat: 'revista', ancla: 'Mount Kalaga', zona: 'Revista en lo alto de la torre de vigilancia contra incendios', fuentes: ['BL'], estado: 'una_fuente' },

  /* ───────── ARMAS ÚNICAS ───────── */
  { id: 'arma-patriarch', nombre: 'Pistola The Patriarch DRX', cat: 'armas', ancla: 'Kalaga Reservoir', zona: 'Bajo el agua, al sur de la presa, junto a un auto hundido', requisitos: 'Bucear', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'arma-nipper', nombre: 'Pistola Assassin Nipper', cat: 'armas', ancla: 'Permit Keys', zona: 'Barco espía abandonado, punta sur de la isla sureste', desc: 'Adentro también hay una nota vieja.', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'arma-gorse', nombre: 'Escopeta Smuggler Gorse 425', cat: 'armas', ancla: 'Permit Keys', zona: 'Junto a una lancha abandonada en la isla más al norte', fuentes: ['BL'], estado: 'una_fuente' },

  /* ───────── EVENTOS ALEATORIOS ───────── */
  { id: 'ev-perro-jetski', nombre: 'Evento: el perro en moto acuática', cat: 'evento', ancla: 'Gambit Bay', zona: 'Mar abierto, lejos de botes e islas',
    desc: 'Un perro con lentes en moto acuática te lleva a su isla, donde desentierra un tesoro. Una sola vez.', requisitos: 'Nadar solo ~5 minutos; escucha ladridos',
    pasos: ['Nada en mar abierto en Gambit Bay unos 5 minutos.', 'Súbete a la moto del perro y no te bajes.', 'En Dog Island lánzale la pelota: desentierra el botín.', 'Busca los lentes Sports Wrap junto al bote volteado.'],
    hora: 'Cualquier hora', fuentes: ['GS', 'AGW'], estado: 'confirmado', etiquetas: ['≈ $1,200'] },
  { id: 'ev-ovni', nombre: 'Evento: OVNI (trofeo "The Truth Is Out There")', cat: 'evento', ancla: 'Kelly County', x: 350, y: 380, zona: 'Camino de terracería al este de Port Gellhorn, cerca del Starlet Motel',
    hora: 'De noche, después de las 2:00 a.m.', requisitos: 'Después del Capítulo 1', fuentes: ['GS', 'MM'], estado: 'confirmado', etiquetas: ['Trofeo'] },
  { id: 'ev-bigfoot', nombre: 'Evento: avistamiento de Bigfoot (Skunk Ape)', cat: 'evento', ancla: 'Gambit Bay', zona: 'Puente de Old Fort Road, oeste de Gambit Bay',
    desc: 'Cuando escuches el rugido, síguelo hasta el "Tree Effigy" en el bosque al sur del puente; la primera vez Jason se desmaya. Forma parte de la búsqueda de Kirk (volante en el bar Skeeter\'s de Hamlet).', hora: 'De noche', fuentes: ['MM', 'GS'], estado: 'una_fuente' },
  { id: 'ev-drunk-jimmy', nombre: 'Evento: el viejo marinero (arpón)', cat: 'evento', ancla: 'Key Lento', zona: 'Entrada de un bar al suroeste de la casa de Jason',
    pasos: ['Ve entre 2 y 4 a.m.', 'Te pide todo tu dinero: rechaza (baja a $5).', 'Síguelo a la alberca; suelta el arma.', 'Toma el arpón Arras Bullhead.'], hora: '2:00–4:00 a.m.', fuentes: ['GS'], estado: 'una_fuente' },
  { id: 'ev-alan-janet', nombre: 'Evento: Alan busca a su esposa Janet', cat: 'evento', ancla: 'Key Lento', zona: 'Alan junto a su auto azul descompuesto',
    pasos: ['Llévalo al bar La Medusa.', 'El video del cantinero muestra a Janet en una pickup roja.', 'Ve al norte de Key Lento (Dolphin Dr) a la casa con la pickup Bison roja.', 'Janet no quiere irse; Alan te agradece.'], fuentes: ['GS', 'AGW'], estado: 'confirmado', etiquetas: ['$300'] },
  { id: 'ev-loros', nombre: 'Evento: los loros parlantes', cat: 'evento', ancla: 'Key Lento', zona: 'Patio detrás de Three Sheets Liquor', desc: 'Limpia a los guardias; un loro rojo te señala el dinero junto a su jaula.', fuentes: ['GS'], estado: 'una_fuente', etiquetas: ['≈ $1,300'] },
  { id: 'ev-tigre-van', nombre: 'Evento: la van atascada (con tigre)', cat: 'evento', ancla: 'Maroon Key', zona: 'Al sur de Maroon Key, rumbo al dirigible',
    desc: 'Empuja la van o sácala con un winch. Si abres las puertas traseras sale un tigre: ten la escopeta lista. Otras guías la ubican en Grassrivers.', fuentes: ['GS'], estado: 'una_fuente' },
  { id: 'ev-inmortal', nombre: 'Evento: el desconocido inmortal', cat: 'evento', ancla: 'Key Lento', zona: 'Visto desde la torre de radio cerca de la casa de Jason',
    desc: 'Si le disparas con el rifle de francotirador, corre hacia ti y las balas no lo detienen. Vencerlo (a golpes o tirándolo desde lo alto) paga $2,000 cada vez.', fuentes: ['GS'], estado: 'una_fuente', etiquetas: ['$2,000'] },
  { id: 'ev-pilotes', nombre: 'Evento: casa sobre pilotes tras un tiroteo', cat: 'evento', ancla: 'Corsair Key', zona: 'Casas sobre pilotes en el mar, al noreste de Corsair Key (la más al norte)',
    desc: 'Dinero y cocaína tirados; hay más efectivo bajo una tabla suelta del piso.', requisitos: 'Bote', fuentes: ['GS'], estado: 'una_fuente' },
  { id: 'ev-abismo-trato', nombre: 'Evento: trato de drogas en Abismo Key', cat: 'evento', ancla: 'Abismo Key', zona: 'Estacionamiento oeste, de noche',
    desc: 'El trato se pone feo: detén a los que corren al bote y saquea los dos vehículos y las bolsas junto a la bengala.', fuentes: ['MM'], estado: 'una_fuente' },
  { id: 'ev-sicario', nombre: 'Evento: el pasajero sicario', cat: 'evento', ancla: 'Little Cuba', zona: 'Empieza manejando como Jason; termina en Harborside Park (Vice Beach)',
    desc: 'Un hombre de traje se sube y dispara a dos hombres. Luego puedes asaltar un escondite cercano (dos estrellas) y llamar a Brian.', requisitos: 'Jugar como Jason', fuentes: ['GS'], estado: 'una_fuente' },
  { id: 'ev-botarga', nombre: 'Evento: persecución del hombre-zorro', cat: 'evento', ancla: 'Downtown', desc: 'De noche, un helicóptero persigue a un hombre en botarga de zorro. Llévalo a su escondite y elige: $15,000 o un SMG personalizado.', hora: 'De noche', fuentes: ['GS'], estado: 'una_fuente', etiquetas: ['$15,000'] },
  { id: 'ev-sillon', nombre: 'Evento: la mudanza del sillón → cacería en Hyde Island', cat: 'evento', ancla: 'Hyde Island',
    desc: 'Ayudar a una mujer con un sillón te noquea y despiertas en un contenedor en Hyde Island. Sobrevive al cazador con visión nocturna.', fuentes: ['GS'], estado: 'una_fuente', etiquetas: ['$30,000 + Island Poacher FF-50'] },
  { id: 'ev-kitty-litter', nombre: 'Evento: la patrulla al laboratorio Kitty Litter', cat: 'evento', ancla: 'Rockridge', zona: 'Patrulla en Crosstown → bodega en Rockridge (8th Avenue)',
    requisitos: 'Después de la misión "Here, Kitty Kitty"', desc: 'Tiroteo y explosión. Escríbele a Tyrone después.', fuentes: ['GS'], estado: 'una_fuente', etiquetas: ['$2,000'] },
  { id: 'ev-jackson', nombre: 'Evento: Jackson y los calzones antibalas', cat: 'evento', ancla: 'Griffin', zona: 'Griffin Shooting Range', requisitos: 'Sacar 3 oros en un reto del campo de tiro', fuentes: ['GS'], estado: 'una_fuente', etiquetas: ['$10,000'] },
  { id: 'ev-m7-recluta', nombre: 'Evento: M7 golpea a un recluta', cat: 'evento', ancla: 'Hamlet', zona: 'Cerca de la armería Big Shots',
    desc: 'Defiéndelo: te dice dónde está el escondite de M7 (Nova Auto Junkyard), con caja fuerte y un auto único.', fuentes: ['GS', 'BDO'], estado: 'confirmado' },
  { id: 'ev-manatee-motel', nombre: 'Evento: gritos en el Manatee Motel (tigre)', cat: 'evento', ancla: 'Hamlet', x: 625, y: 560, zona: 'Suroeste de Hamlet',
    desc: 'Un tigre ataca a pandilleros. Detrás: caja fuerte con +$1,000, cocaína y el rifle Kingfisher\'s Laird 350. Después llega un auto con más pandilleros.', fuentes: ['GS'], estado: 'una_fuente' },
  { id: 'ev-demanda', nombre: 'Evento: choque y demanda', cat: 'evento', ancla: 'Balsero', desc: 'Atestiguar paga ~$10,000; chantajear hasta ~$18,000.', requisitos: 'Jugar como Jason', fuentes: ['GS'], estado: 'una_fuente' },
  { id: 'ev-hombre-desnudo', nombre: 'Evento: el hombre desnudo (Gene)', cat: 'evento', ancla: 'Ocean Beach', desc: 'Cúbrelo de la policía y te da un reloj Novak Lauret.', hora: 'Por la tarde', requisitos: 'Capítulo 3 o 4 en adelante', fuentes: ['GS', 'MM'], estado: 'confirmado' },
  { id: 'ev-luchador', nombre: 'Evento: el luchador de la playa', cat: 'evento', ancla: 'Vice Beach', zona: 'Pasto junto al malecón, frente a un hotel Art Déco', desc: 'Apuesta de lucha: gana asfixiándolo hasta que se rinda.', hora: 'De día, a pie, como Jason', fuentes: ['GS'], estado: 'una_fuente', etiquetas: ['$1,000'] },
  { id: 'ev-sahara', nombre: 'Evento: el repartidor de Sahara', cat: 'evento', ancla: 'Little Cuba', zona: 'Camión de Sahara chocado en la carretera',
    desc: 'Haz tres entregas: Southside (te roban el paquete), Paterson Fruit Farm (petardo) y una mansión de Peacock Bay (tigres: vete con calma).', requisitos: 'Capítulo 3', fuentes: ['GS'], estado: 'una_fuente' },
  { id: 'ev-abogado', nombre: 'Evento: el abogado del contenedor', cat: 'evento', ancla: 'Crosstown', desc: 'Un indigente que dice ser abogado te pide pastillas Zombix. Repetible.', fuentes: ['GS'], estado: 'una_fuente' },
  { id: 'ev-beefslap', nombre: 'Evento: Beefslap y las manzanas', cat: 'evento', ancla: 'Frogswater', zona: 'Caminos al norte de Thrillbilly Mud Club', requisitos: 'Capítulo 2', desc: 'Premio: vale de Wasteland Off-Road para el taller de Port Gellhorn.', fuentes: ['GS', 'MM'], estado: 'confirmado' },
  { id: 'ev-caleb', nombre: 'Evento: la venganza del tractor de Caleb', cat: 'evento', ancla: 'Kelly County', x: 320, y: 360, zona: 'Entre el Starlet Motel y Frogswater', requisitos: 'Capítulo 2', desc: 'Premio: gorra Stanley Engines.', fuentes: ['GS', 'MM'], estado: 'confirmado' },
  { id: 'ev-oso-mina', nombre: 'Evento: turista y oso en la mina MacAlister', cat: 'evento', ancla: 'Moreau', zona: 'Mina de oro MacAlister, oeste de Moreau', fuentes: ['GS', 'MM'], estado: 'confirmado' },
  { id: 'ev-fantasma', nombre: 'Evento: el fantasma del paso a desnivel', cat: 'evento', ancla: 'Lummox County', zona: 'Paso a desnivel de Sassafrass Road', hora: 'De noche', fuentes: ['GS', 'MM'], estado: 'confirmado' },
  { id: 'ev-avioneta', nombre: 'Evento: avioneta estrellada con cocaína', cat: 'evento', ancla: 'Grassrivers', desc: 'Cocaína (~$1,000), botín y una pistola de bengalas.', fuentes: ['GS', 'MM'], estado: 'confirmado' },
  { id: 'ev-cigarro', nombre: 'Evento: un cigarro a cambio de un pitazo', cat: 'evento', ancla: 'La Perle', desc: 'Dale un cigarro a un desconocido y te marca un escondite de pandilla en el mapa.', fuentes: ['GS', 'AGW'], estado: 'rumor' },

  /* ───────── TALLERES Y AUTOS ───────── */
  { id: 'leonida-auto-world', nombre: 'Leonida Auto World (Randy)', cat: 'taller', ancla: 'Balsero', desc: 'Aquí entregas los autos de la Lista de Randy y le pides pistas.',
    requisitos: 'Se desbloquea con "Clonin\' Keys, Makin\' Gs" (Capítulo 3)', pasos: ['Completa "Clonin\' Keys, Makin\' Gs".', 'En el mapa: Robos > Randy\'s Wish List.', 'Pídele pistas a Randy y entrega los autos aquí.'], fuentes: ['XT', 'GS'], estado: 'confirmado', etiquetas: ['Lista de Randy'] },
  { id: 'watkins-auto', nombre: 'Watkins Auto Parts (Moses)', cat: 'taller', ancla: 'Port Gellhorn', desc: 'Moses registra autos robados sin rastreador. El primer registro es gratis.', requisitos: 'Capítulo 2',
    pasos: ['Escanea el auto con WAiNK: rastreador, valor y costo.', 'Sin rastreador: tráelo con Moses.', 'Con rastreador o alarma: primero Pay \'n\' Spray (Capítulo 3).'], fuentes: ['XT', 'TBM'], estado: 'confirmado' },
  { id: 'euroform', nombre: 'Euroform Automotive', cat: 'taller', ancla: 'Little Cuba', desc: 'Los exóticos robados obtienen título limpio o les instalan rastreador.', fuentes: ['V6', 'G6M'], estado: 'confirmado' },

  /* ───────── TIENDAS / NEGOCIOS ───────── */
  { id: 'evergreen-mall', nombre: 'Evergreen Mall', cat: 'tienda', ancla: 'Waning Sands', fuentes: ['V6'], estado: 'una_fuente' },
  { id: 'diamond-dawgs', nombre: 'Diamond Dawgs (joyería)', cat: 'tienda', ancla: 'Ocean Beach', zona: 'SW 4th St', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'electric-fang', nombre: 'Electric Fang Tattoo', cat: 'tienda', ancla: 'Stockyard', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'wonder-whale-tienda', nombre: 'The Wonder Whale (ropa y recuerdos)', cat: 'ropa', ancla: 'Key Lento', zona: 'Sunbelt Hwy', fuentes: ['GS', 'BL'], estado: 'confirmado' },
  { id: 'a1-fashions', nombre: 'A1 Fashions', cat: 'ropa', ancla: 'Southside', zona: 'El Joven Blvd', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'fleeca-vb', nombre: 'Fleeca', cat: 'banco', ancla: 'Ocean Beach', zona: 'SW 4th St', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'hobbs-milford', nombre: 'Hobbs Milford', cat: 'banco', ancla: 'Ocean Beach', zona: 'SW 4th St', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'lombank', nombre: 'Lombank', cat: 'banco', ancla: 'Tequesta', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'conch-king', nombre: 'Conch King', cat: 'restaurante', ancla: 'La Perle', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'lucky-plucker', nombre: 'Lucky Plucker', cat: 'restaurante', ancla: 'Port Gellhorn', fuentes: ['V6'], estado: 'una_fuente' },
  { id: 'bite-house', nombre: 'Bite House', cat: 'restaurante', ancla: 'Watson Bay', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'effluvia', nombre: 'Effluvia', cat: 'bar', ancla: 'Ocean Beach', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'nine1nine', nombre: 'NINE1NINE', cat: 'bar', ancla: 'Downtown', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'the-vault', nombre: 'The Vault', cat: 'bar', ancla: 'Downtown', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'jack-of-hearts', nombre: 'Jack of Hearts (club)', cat: 'bar', ancla: 'Crosstown', fuentes: ['G6M', 'XC'], estado: 'confirmado' },
  { id: 'rusty-anchor', nombre: 'The Rusty Anchor', cat: 'bar', ancla: 'Key Lento', zona: 'Costa noroeste, con muelle', fuentes: ['V6', 'GS'], estado: 'confirmado' },
  { id: 'la-medusa', nombre: 'La Medusa', cat: 'bar', ancla: 'Key Lento', zona: 'Frente al mar', fuentes: ['GS', 'BL'], estado: 'confirmado' },
  { id: 'skeeters', nombre: "Skeeter's (bar)", cat: 'bar', ancla: 'Hamlet', desc: 'Aquí está el volante de Kirk sobre el Skunk Ape.', fuentes: ['GS'], estado: 'una_fuente' },
  { id: 'delights', nombre: 'Delights (club)', cat: 'bar', ancla: 'Port Gellhorn', desc: 'Club donde trabaja Vicki (Capítulo 2). Hay una carta adentro.', fuentes: ['XC', 'BL'], estado: 'confirmado' },
  { id: 'banana-hole', nombre: 'Banana Hole Main Bar', cat: 'bar', ancla: 'Ocean Beach', zona: 'Shore Drive', fuentes: ['XT'], estado: 'una_fuente' },

  { id: 'akio-hotel', nombre: 'Akio Hotel', cat: 'hotel', ancla: 'Tequesta Retreat', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'clarissa', nombre: 'Clarissa Hotel', cat: 'hotel', ancla: 'Downtown', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'ocean-view', nombre: 'Ocean View Hotel', cat: 'hotel', ancla: 'Ocean Beach', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'vice-regal', nombre: 'Vice Regal Hotel', cat: 'hotel', ancla: 'Washington Beach', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'la-cascara', nombre: 'La Cascara Motel', cat: 'hotel', ancla: 'Port Gellhorn', fuentes: ['TBM', 'G6M'], estado: 'confirmado' },
  { id: 'manatee-motel', nombre: 'Manatee Motel', cat: 'hotel', ancla: 'Hamlet', x: 627, y: 562, zona: 'Suroeste de Hamlet', fuentes: ['GS', 'XC'], estado: 'confirmado' },

  /* ───────── SERVICIOS ───────── */
  { id: 'alpha-gas', nombre: 'Alpha Gas Station', cat: 'gasolinera', ancla: 'Historic Route 628', fuentes: ['V6'], estado: 'una_fuente' },
  { id: 'xero-gas', nombre: 'Xero Gas Station', cat: 'gasolinera', ancla: 'Ambrosia', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'vcia', nombre: 'Vice City International Airport (VCIA)', cat: 'transporte', ancla: 'VCIA', desc: 'Incluye la torre de control y el letrero de Vice City.', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'watson-airport', nombre: 'Watson Bay Airport', cat: 'transporte', ancla: 'Watson Bay', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'gellhorn-train', nombre: 'Estación de tren de Port Gellhorn', cat: 'transporte', ancla: 'Port Gellhorn', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'mile-zero', nombre: 'Mile Zero Air Station', cat: 'transporte', ancla: 'Mile Zero', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'kentons', nombre: "Kenton's Island Dreams (buceo)", cat: 'transporte', ancla: 'Key Lento', zona: 'Muelle', fuentes: ['GS', 'XC'], estado: 'confirmado' },

  { id: 'vbpd', nombre: 'Vice Beach Police Department', cat: 'policia', ancla: 'Ocean Beach', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'crosstown-pd', nombre: 'Comisaría de Crosstown', cat: 'policia', ancla: 'Crosstown', zona: 'NW 9th Street', fuentes: ['XT'], estado: 'una_fuente' },
  { id: 'ambrosia-pd', nombre: 'Ambrosia Police Department', cat: 'policia', ancla: 'Ambrosia', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'prision-hamlet', nombre: 'Prisión de Hamlet', cat: 'policia', ancla: 'Hamlet', fuentes: ['V6', 'BL'], estado: 'confirmado' },

  /* ───────── OCIO ───────── */
  { id: 'sahara-arena', nombre: 'Sahara Arena', cat: 'ocio', ancla: 'Shoreline', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'fleeca-field', nombre: 'Fleeca Field (estadio)', cat: 'ocio', ancla: 'Rockridge', fuentes: ['V6'], estado: 'una_fuente' },
  { id: 'galina-opera', nombre: 'Galina Ballet Opera House', cat: 'ocio', ancla: 'Bayside', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'leaf-links-golf', nombre: 'Leaf Links Golf Club', cat: 'ocio', ancla: 'Leaf Links', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'boone-speedway', nombre: 'Boone Speedway', cat: 'ocio', ancla: 'Hamlet', fuentes: ['XT', 'BL'], estado: 'confirmado' },
  { id: 'griffin-range', nombre: 'Griffin Shooting Range', cat: 'ocio', ancla: 'Griffin', fuentes: ['GS'], estado: 'una_fuente' },
  { id: 'oceanarium', nombre: 'Vice City Oceanarium', cat: 'ocio', ancla: 'Catalan Key', fuentes: ['BL', 'GS'], estado: 'confirmado' },
  { id: 'gellhorn-raceway', nombre: 'Gellhorn Raceway', cat: 'ocio', ancla: 'Gellhorn Raceway', fuentes: ['TBM', 'G6M'], estado: 'confirmado' },
  { id: 'thrillbilly', nombre: 'Thrillbilly Mud Club', cat: 'ocio', ancla: 'Frogswater', fuentes: ['GS', 'G6M'], estado: 'confirmado' },

  /* ───────── EMBLEMÁTICOS / NATURALEZA ───────── */
  { id: 'dirigible', nombre: 'Dirigible (Thicc Herbie)', cat: 'emblematico', ancla: 'Maroon Key', fuentes: ['V6', 'BL'], estado: 'confirmado' },
  { id: 'faro-catalan', nombre: 'Faro de Catalan Key', cat: 'emblematico', ancla: 'Catalan Key', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'palaestra', nombre: 'Palaestra Tower', cat: 'emblematico', ancla: 'Bayside', zona: 'Catalan Blvd', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'hoffman', nombre: 'Observatorio Hoffman', cat: 'emblematico', ancla: 'North Kelly County', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'ingenio', nombre: 'Ingenio azucarero Allied Crystal', cat: 'emblematico', ancla: 'Ambrosia', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'fuzzard', nombre: 'Fuzzard Power Station', cat: 'emblematico', ancla: 'Peregrine Bay', fuentes: ['V6', 'G6M'], estado: 'confirmado' },
  { id: 'gellhorn-funfair', nombre: 'Feria abandonada de Gellhorn', cat: 'emblematico', ancla: 'Port Gellhorn', fuentes: ['BL'], estado: 'una_fuente' },
  { id: 'monte-kalaga', nombre: 'Mount Kalaga (cima)', cat: 'naturaleza', ancla: 'Mount Kalaga', x: 405, y: 148, fuentes: ['V6'], estado: 'una_fuente' },
  { id: 'selkie-hole', nombre: 'Selkie Hole (punto de buceo)', cat: 'naturaleza', ancla: 'Emerald Springs', fuentes: ['BL', 'XC'], estado: 'confirmado' },
  { id: 'lago-leonida', nombre: 'Lago Leonida', cat: 'naturaleza', ancla: 'Lake Leonida', x: 552, y: 318, fuentes: ['G6M', 'BL'], estado: 'confirmado' },
];

/* Coloca cada punto en el mapa a partir de su zona. */
(function ubicarPuntos() {
  const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
  for (const p of POIS) {
    const a = ANCLAS[p.ancla];
    if (!a) { console.warn('Zona sin ancla:', p.ancla, p.id); continue; }
    if (!p.region) p.region = a[3];
    if (!p.zona) p.zona = p.ancla;
    else if (!p.zona.includes(p.ancla)) p.zona = `${p.ancla} — ${p.zona}`;
    if (p.x == null || p.y == null) {
      const ang = hash(p.id) * Math.PI * 2, r = a[2] * Math.sqrt(hash(p.id + '·'));
      p.x = Math.round((a[0] + Math.cos(ang) * r) * 10) / 10;
      p.y = Math.round((a[1] + Math.sin(ang) * r) * 10) / 10;
    }
  }
})();
