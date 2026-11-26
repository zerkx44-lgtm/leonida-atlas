/* Filtro de contenido para aportes de usuarios.
 * Nada se publica en automático: todo llega al panel como "pendiente".
 * Este filtro (1) rechaza de entrada lo claramente grosero u ofensivo y
 * (2) marca con banderas lo sospechoso para que el moderador lo vea primero.
 * La base de datos repite la revisión (supabase/schema.sql), así que saltarse
 * este archivo no sirve para publicar nada.
 */
const Moderacion = (() => {
  // Raíces: se comparan contra el INICIO de cada palabra ya normalizada.
  const GROSERIAS = [
    // Español (MX / LatAm / ES)
    'pendej', 'chinga', 'chingu', 'verga', 'vergu', 'culer', 'cabron', 'cabrona', 'puta', 'puto', 'putit', 'putaz',
    'mamon', 'mamada', 'pinche', 'joto', 'maricon', 'marica', 'zorra', 'perra', 'mierda', 'cagad', 'culo', 'ojete',
    'pito', 'panocha', 'chichis', 'nalgas', 'cogid', 'follar', 'gilipoll', 'hijueput',
    'hijodeput', 'malparid', 'gonorrea', 'huevon', 'guevon', 'retrasad', 'subnormal',
    'imbecil', 'estupid', 'idiota', 'baboso', 'mensote', 'tarad', 'lameculos', 'prostitu',
    // Inglés
    'fuck', 'fuk', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'bastard',
    'nigg', 'fagg', 'retard', 'motherf', 'porn', 'xxx', 'nude',
  ];
  // Abreviaturas: solo cuentan como palabra completa.
  const EXACTAS = ['ctm', 'ptm', 'alv', 'hdp', 'vrg', 'wtf', 'stfu', 'fuk', 'fag', 'cono', 'mamar'];
  // Palabras que empiezan igual pero son inocentes (evita falsos positivos).
  const PERMITIDAS = ['puertas', 'puerta', 'putter', 'culebra', 'cultura', 'dickens', 'cocktail', 'cockpit', 'pitonisa', 'pitufo', 'pitaya',
    'piton', 'pitones', 'peritaje', 'perrita', 'perro', 'perros', 'culminar', 'culpa', 'culpable'];
  // Se buscan también "pegadas" (p.e. "p e n d e j o" o "pen.dejo").
  const FUERTES_PEGADAS = ['pendejo', 'chingad', 'hijodeputa', 'hijueputa', 'verga', 'maricon', 'culero', 'motherfuck', 'fuck', 'nigga'];

  const LEET = { '4': 'a', '@': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '5': 's', '$': 's', '7': 't', '8': 'b' };

  function normalizar(texto) {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[4@31!05$78]/g, c => LEET[c])
      .replace(/(.)\1{2,}/g, '$1$1'); // "puuuuto" → "puuto"
  }
  const sinRepetidas = s => s.replace(/(.)\1+/g, '$1');

  function revisar({ titulo = '', mensaje = '', apodo = '', video_url = '' }) {
    const textoLibre = `${titulo} ${mensaje} ${apodo}`;
    const norm = normalizar(textoLibre);
    const palabras = norm.split(/[^a-zñ]+/).filter(Boolean);
    const encontradas = new Set();

    for (const p of palabras) {
      const variantes = [p, sinRepetidas(p)];
      for (const v of variantes) {
        if (PERMITIDAS.includes(v)) continue;
        const hit = EXACTAS.includes(v) ? v : GROSERIAS.find(g => v.startsWith(g));
        if (hit) encontradas.add(hit);
      }
    }
    const pegado = sinRepetidas(norm.replace(/[^a-zñ]/g, ''));
    for (const f of FUERTES_PEGADAS) if (pegado.includes(f)) encontradas.add(f);

    const banderas = [];
    if (/https?:\/\/|www\.|\.com\b/i.test(`${titulo} ${mensaje}`)) banderas.push('link en el texto');
    if (/\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b|\+\d{8,}/.test(textoLibre)) banderas.push('posible teléfono');
    if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(textoLibre)) banderas.push('posible correo');
    const letras = mensaje.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ]/g, '');
    if (letras.length > 15 && letras === letras.toUpperCase()) banderas.push('todo en mayúsculas');
    if (/(.)\1{6,}/.test(textoLibre)) banderas.push('caracteres repetidos');
    if (/\b(whatsapp|telegram|onlyfans|gana dinero|bitcoin|crypto|casino|apuesta)\b/i.test(textoLibre)) banderas.push('posible spam');

    let videoOk = true;
    if (video_url) videoOk = videoPermitido(video_url);

    return {
      bloqueado: encontradas.size > 0,
      groserias: [...encontradas],
      banderas,
      videoOk,
    };
  }

  function videoPermitido(url) {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:') return false;
      const host = u.hostname.replace(/^(www\.|m\.|vm\.|mobile\.)/, '');
      return window.ATLAS_CONFIG.VIDEO_DOMINIOS.some(d => host === d || host.endsWith('.' + d));
    } catch { return false; }
  }

  return { revisar, videoPermitido, normalizar };
})();
