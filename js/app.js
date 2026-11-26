/* Leonida Atlas — mapa interactivo. */
(() => {
  const $ = s => document.querySelector(s);
  const aLatLng = (x, y) => [MAPA_H - y, x];
  const deLatLng = ll => ({ x: ll.lng, y: MAPA_H - ll.lat });
  const esMovil = () => matchMedia('(max-width: 820px)').matches;

  /* ---------- Estado ---------- */
  const estado = {
    cats: new Set(Object.keys(CATEGORIAS)),
    estados: new Set(['confirmado', 'una_fuente', 'rumor', 'comunidad']),
    region: '', q: '', soloFavs: false, ocultarEncontrados: false,
    seleccionado: null, agregando: null,
  };
  const personal = JSON.parse(localStorage.getItem('atlas_personal') || '{"encontrados":[],"favoritos":[]}');
  const guardarPersonal = () => localStorage.setItem('atlas_personal', JSON.stringify(personal));
  let todos = POIS.map(p => ({ ...p }));
  const marcadores = new Map();

  /* ---------- Mapa ---------- */
  const limites = [[0, 0], [MAPA_H, MAPA_W]];
  const map = L.map('map', {
    crs: L.CRS.Simple, minZoom: -1.5, maxZoom: 4, zoomSnap: 0.25, zoomDelta: 0.5,
    maxBounds: [[-200, -200], [MAPA_H + 200, MAPA_W + 200]], attributionControl: true, zoomControl: !('ontouchstart' in window),
  });
  L.imageOverlay('assets/leonida.svg?v=2', limites).addTo(map);
  map.attributionControl.setPrefix(false).addAttribution('Mapa ilustrativo de fans · Datos: guías de la comunidad');
  map.fitBounds(limites);
  const escalaPins = () => {
    const z = map.getZoom();
    document.getElementById('map').dataset.z = z < 0.5 ? 'lejos' : z < 1.75 ? 'medio' : 'cerca';
    document.getElementById('map').classList.toggle('ver-rotulos', z >= 1.75);
  };
  map.on('zoomend', escalaPins); escalaPins();

  /* Rótulos de colonias y zonas (aparecen al acercarse) */
  const rotulos = L.layerGroup().addTo(map);
  for (const [nombre, [x, y, r]] of Object.entries(ANCLAS)) {
    if (r > 6) continue;
    L.marker(aLatLng(x, y), { interactive: false, keyboard: false, zIndexOffset: -1000,
      icon: L.divIcon({ className: 'rotulo', html: `<span>${esc(nombre)}</span>`, iconSize: [0, 0] }) }).addTo(rotulos);
  }

  function icono(p) {
    const c = CATEGORIAS[p.cat] || { icono: '📍', color: '#999' };
    const clases = ['pin', p.estado === 'rumor' ? 'rumor' : '', p.comunidad ? 'comunidad' : '',
      personal.encontrados.includes(p.id) ? 'hecho' : '', estado.seleccionado === p.id ? 'sel' : ''].join(' ');
    return L.divIcon({ className: '', html: `<div class="${clases}" style="--c:${c.color}"><span>${c.icono}</span></div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
  }

  function crearMarcador(p) {
    const m = L.marker(aLatLng(p.x, p.y), { icon: icono(p), title: p.nombre, riseOnHover: true, keyboard: true });
    m.on('click', () => abrirFicha(p.id, false));
    m.bindTooltip(esc(p.nombre), { direction: 'top', offset: [0, -14] });
    marcadores.set(p.id, m);
    return m;
  }

  /* ---------- Filtrado ---------- */
  function coincide(p) {
    if (!estado.cats.has(p.cat)) return false;
    if (!estado.estados.has(p.estado)) return false;
    if (estado.region && p.region !== estado.region) return false;
    if (estado.soloFavs && !personal.favoritos.includes(p.id)) return false;
    if (estado.ocultarEncontrados && personal.encontrados.includes(p.id)) return false;
    if (estado.q) {
      const txt = Moderacion.normalizar(`${p.nombre} ${p.zona || ''} ${p.region} ${p.desc || ''} ${(p.etiquetas || []).join(' ')} ${CATEGORIAS[p.cat]?.nombre || ''}`);
      if (!Moderacion.normalizar(estado.q).split(/\s+/).every(w => txt.includes(w))) return false;
    }
    return true;
  }

  function refrescar() {
    const visibles = todos.filter(coincide);
    const ids = new Set(visibles.map(p => p.id));
    for (const p of todos) {
      const m = marcadores.get(p.id) || crearMarcador(p);
      if (ids.has(p.id)) { m.setIcon(icono(p)); if (!map.hasLayer(m)) m.addTo(map); }
      else if (map.hasLayer(m)) map.removeLayer(m);
    }
    pintarLista(visibles);
    pintarConteosCategorias();
  }

  /* ---------- Panel de filtros ---------- */
  function pintarFiltros() {
    $('#f-region').insertAdjacentHTML('beforeend', REGIONES.map(r => `<option>${esc(r)}</option>`).join(''));
    $('#f-categorias').innerHTML = GRUPOS.map(g => `
      <div class="grupo"><div class="grupo-nombre">${esc(g.nombre)}</div><div class="fila-chips">
        ${Object.entries(CATEGORIAS).filter(([, c]) => c.grupo === g.id).map(([id, c]) =>
          `<button class="chip on" data-cat="${id}" style="--c:${c.color}"><span>${c.icono}</span>${esc(c.nombre)} <em data-cnt="${id}"></em></button>`).join('')}
      </div></div>`).join('');
  }
  function pintarConteosCategorias() {
    const base = todos.filter(p => estado.estados.has(p.estado) && (!estado.region || p.region === estado.region));
    for (const id of Object.keys(CATEGORIAS)) {
      const el = document.querySelector(`[data-cnt="${id}"]`);
      if (el) el.textContent = base.filter(p => p.cat === id).length;
    }
    document.querySelectorAll('[data-cat]').forEach(b => b.classList.toggle('on', estado.cats.has(b.dataset.cat)));
  }

  function pintarLista(visibles) {
    $('#conteo').textContent = `${visibles.length} de ${todos.length}`;
    const orden = [...visibles].sort((a, b) => (a.region + a.nombre).localeCompare(b.region + b.nombre, 'es'));
    $('#lista').innerHTML = orden.slice(0, 300).map(p => {
      const c = CATEGORIAS[p.cat];
      const hecho = personal.encontrados.includes(p.id), fav = personal.favoritos.includes(p.id);
      return `<li><button data-poi="${esc(p.id)}" class="${estado.seleccionado === p.id ? 'sel' : ''}">
        <span class="ico" style="--c:${c.color}">${c.icono}</span>
        <span class="txt"><b>${esc(p.nombre)}</b><small>${esc(p.zona || p.region)}</small></span>
        <span class="marcas">${p.videos?.length ? '🎬' : ''}${fav ? '★' : ''}${hecho ? '✓' : ''}${ESTADOS[p.estado].icono}</span>
      </button></li>`;
    }).join('') || '<li class="vacio">Nada con esos filtros. Prueba con “Todas” las categorías.</li>';
  }

  /* ---------- Ficha de detalle ---------- */
  function abrirFicha(id, volar = true) {
    const p = todos.find(x => x.id === id);
    if (!p) return;
    const anterior = estado.seleccionado;
    estado.seleccionado = id;
    [anterior, id].forEach(i => { const q = todos.find(x => x.id === i); if (q && marcadores.get(i)) marcadores.get(i).setIcon(icono(q)); });
    const c = CATEGORIAS[p.cat];
    const hecho = personal.encontrados.includes(p.id), fav = personal.favoritos.includes(p.id);
    const fuentes = (p.fuentes || []).map(f => FUENTES[f]).filter(Boolean);
    const f = $('#ficha');
    f.innerHTML = `
      <div class="ficha-cab">
        <span class="badge" style="--c:${c.color}">${c.icono} ${esc(c.nombre)}</span>
        <button class="cerrar" data-cerrar="ficha" aria-label="Cerrar">✕</button>
      </div>
      <h2>${esc(p.nombre)}</h2>
      <p class="zona">📍 ${esc(p.zona || '')}${p.zona ? ' · ' : ''}${esc(p.region)}</p>
      <p class="estado e-${p.estado}">${ESTADOS[p.estado].icono} ${ESTADOS[p.estado].txt}</p>
      ${(p.etiquetas || []).map(t => `<span class="etiqueta">${esc(t)}</span>`).join('')}
      ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}
      ${p.hora ? `<p class="dato">🕒 <b>Hora:</b> ${esc(p.hora)}</p>` : ''}
      ${p.requisitos ? `<p class="dato">🔑 <b>Requisitos:</b> ${esc(p.requisitos)}</p>` : ''}
      ${p.pasos?.length ? `<h3>Cómo conseguirlo</h3><ol class="pasos">${p.pasos.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
      ${p.videos?.length ? `<h3>Video</h3>${p.videos.map(v => htmlVideo(v.url, v.autor)).join('')}` : ''}
      <div class="ficha-acciones">
        <button class="btn ${hecho ? 'ok' : 'ghost'}" data-accion="hecho">${hecho ? '✓ Encontrado' : '○ Marcar encontrado'}</button>
        <button class="btn ${fav ? 'fav' : 'ghost'}" data-accion="fav">${fav ? '★ Favorito' : '☆ Favorito'}</button>
        <button class="btn ghost" data-accion="compartir">🔗 Compartir</button>
        <button class="btn ghost" data-accion="corregir">✎ Corregir / agregar video</button>
      </div>
      ${fuentes.length ? `<p class="fuentes">Fuente: ${fuentes.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.nombre)}</a>`).join(' · ')}</p>` : ''}
      ${p.comunidad ? `<p class="fuentes">Aportado por <b>${esc(p.apodo || 'anónimo')}</b> · ${esc(fechaCorta(p.created_at))}</p>` : ''}
    `;
    const estabaOculta = f.hidden;
    f.hidden = false;
    f.scrollTop = 0;
    if (estabaOculta) map.invalidateSize({ pan: false });
    activarVideos(f);
    if (esMovil()) cerrar('panel');
    if (volar) map.flyTo(aLatLng(p.x, p.y), Math.max(map.getZoom(), p.region === 'Vice City' ? 3 : 2), { duration: 0.6 });
    history.replaceState(null, '', `#poi=${encodeURIComponent(id)}`);
    pintarLista(todos.filter(coincide));
  }

  function cerrar(qué) {
    const el = document.getElementById(qué);
    if (qué === 'ficha') {
      const estabaVisible = !el.hidden;
      el.hidden = true;
      if (estabaVisible) map.invalidateSize({ pan: false });
      const prev = estado.seleccionado; estado.seleccionado = null;
      const q = todos.find(x => x.id === prev); if (q) marcadores.get(prev)?.setIcon(icono(q));
      history.replaceState(null, '', location.pathname + location.search);
    } else el.classList.remove('abierto');
  }

  $('#ficha').addEventListener('click', async e => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const id = estado.seleccionado, p = todos.find(x => x.id === id);
    const alternar = (lista) => { const i = personal[lista].indexOf(id); i >= 0 ? personal[lista].splice(i, 1) : personal[lista].push(id); guardarPersonal(); };
    if (b.dataset.accion === 'hecho') { alternar('encontrados'); refrescar(); abrirFicha(id, false); }
    if (b.dataset.accion === 'fav') { alternar('favoritos'); refrescar(); abrirFicha(id, false); }
    if (b.dataset.accion === 'compartir') {
      const url = `${location.origin}${location.pathname}#poi=${encodeURIComponent(id)}`;
      if (navigator.share) navigator.share({ title: p.nombre, text: `${p.nombre} — Leonida Atlas`, url }).catch(() => {});
      else { await navigator.clipboard?.writeText(url); toast('Link copiado'); }
    }
    if (b.dataset.accion === 'corregir') iniciarAgregar({ tipo: 'correccion', poi: p });
  });

  /* ---------- Agregar aporte ---------- */
  const dlg = $('#dlg-aporte'), form = $('#form-aporte');
  let marcadorTemporal = null;
  form.categoria.innerHTML = GRUPOS.map(g => `<optgroup label="${esc(g.nombre)}">${Object.entries(CATEGORIAS).filter(([, c]) => c.grupo === g.id)
    .map(([id, c]) => `<option value="${id}">${c.icono} ${esc(c.nombre)}</option>`).join('')}</optgroup>`).join('');

  function iniciarAgregar(opciones = {}) {
    estado.agregando = opciones;
    cerrar('ficha'); cerrar('panel');
    $('#modo-agregar').hidden = false;
    $('#modo-agregar span').textContent = opciones.tipo === 'correccion'
      ? `📍 Toca la ubicación correcta de “${opciones.poi.nombre}” (o el mismo punto si solo agregas info/video)`
      : '📍 Toca el mapa donde está el lugar';
    document.body.classList.add('agregando');
    if (opciones.poi) map.flyTo(aLatLng(opciones.poi.x, opciones.poi.y), Math.max(map.getZoom(), 2.5));
  }
  function terminarAgregar() {
    estado.agregando = null;
    $('#modo-agregar').hidden = true;
    document.body.classList.remove('agregando');
    if (marcadorTemporal) { map.removeLayer(marcadorTemporal); marcadorTemporal = null; }
  }

  map.on('click', e => {
    if (!estado.agregando) return;
    const { x, y } = deLatLng(e.latlng);
    if (x < 0 || y < 0 || x > MAPA_W || y > MAPA_H) return toast('Toca dentro del mapa');
    if (marcadorTemporal) map.removeLayer(marcadorTemporal);
    marcadorTemporal = L.marker(e.latlng, { icon: L.divIcon({ className: '', html: '<div class="pin nuevo"><span>📍</span></div>', iconSize: [30, 30], iconAnchor: [15, 15] }) }).addTo(map);
    const op = estado.agregando;
    form.reset();
    form.x.value = x.toFixed(1); form.y.value = y.toFixed(1);
    form.tipo.value = op.tipo || 'nuevo';
    form.poi_ref.value = op.poi?.id || '';
    $('#aporte-titulo').textContent = op.tipo === 'correccion' ? 'Corrección o info extra' : 'Agregar punto de interés';
    if (op.poi) { form.titulo.value = `Corrección: ${op.poi.nombre}`.slice(0, 80); form.categoria.value = op.poi.cat; }
    $('#cnt').textContent = '0';
    $('#aporte-error').hidden = true;
    dlg.showModal();
    setTimeout(() => (op.poi ? form.mensaje : form.titulo).focus(), 50);
  });

  form.mensaje.addEventListener('input', () => ($('#cnt').textContent = form.mensaje.value.length));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#aporte-error');
    const mostrar = m => { err.textContent = m; err.hidden = false; };
    err.hidden = true;
    const datos = Object.fromEntries(new FormData(form));
    if ((datos.titulo || '').trim().length < 3) return mostrar('El título necesita al menos 3 letras.');
    if ((datos.mensaje || '').trim().length < 10) return mostrar('Cuéntanos el truco con un poco más de detalle (mínimo 10 caracteres).');
    if (!form.reglas.checked) return mostrar('Confirma que tu aporte cumple las reglas.');
    const r = Moderacion.revisar(datos);
    if (r.bloqueado) return mostrar('Tu aporte tiene palabras o lenguaje no permitido. Corrígelo para poder enviarlo.');
    if (datos.video_url && !r.videoOk) return mostrar('El link de video debe ser https de YouTube, TikTok, X, Instagram, Facebook, Twitch o Kick.');
    const ultimo = +localStorage.getItem('atlas_ultimo_envio') || 0;
    const espera = window.ATLAS_CONFIG.ESPERA_ENTRE_ENVIOS_SEG * 1000 - (Date.now() - ultimo);
    if (espera > 0) return mostrar(`Espera ${Math.ceil(espera / 1000)} s antes de mandar otro aporte.`);
    const btn = $('#btn-enviar'); btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      await Store.enviar({ ...datos, x: +datos.x, y: +datos.y, banderas: r.banderas });
      localStorage.setItem('atlas_ultimo_envio', Date.now());
      dlg.close(); terminarAgregar();
      toast('¡Gracias! Tu aporte quedó en revisión. Se publica cuando un moderador lo aprueba.', 5000);
    } catch (ex) {
      mostrar('No se pudo enviar: ' + ex.message);
    } finally { btn.disabled = false; btn.textContent = 'Enviar a revisión'; }
  });

  dlg.addEventListener('close', () => { if (marcadorTemporal && estado.agregando) { map.removeLayer(marcadorTemporal); marcadorTemporal = null; } });

  /* ---------- Eventos de UI ---------- */
  $('#btn-agregar').addEventListener('click', () => iniciarAgregar());
  $('#cancelar-agregar').addEventListener('click', terminarAgregar);
  $('#btn-filtros').addEventListener('click', () => { cerrar('ficha'); $('#panel').classList.add('abierto'); });
  $('#btn-ayuda').addEventListener('click', () => $('#dlg-ayuda').showModal());
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-cerrar]'); if (c) cerrar(c.dataset.cerrar);
    const d = e.target.closest('[data-cerrar-dlg]'); if (d) d.closest('dialog').close();
    const li = e.target.closest('[data-poi]'); if (li) abrirFicha(li.dataset.poi);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (estado.agregando) terminarAgregar(); else cerrar('ficha'); } });

  let tq;
  $('#q').addEventListener('input', e => { clearTimeout(tq); tq = setTimeout(() => { estado.q = e.target.value.trim(); refrescar(); }, 150); });
  $('#f-region').addEventListener('change', e => {
    estado.region = e.target.value; refrescar();
    const pts = todos.filter(coincide);
    if (pts.length) map.flyToBounds(L.latLngBounds(pts.map(p => aLatLng(p.x, p.y))).pad(0.3), { duration: 0.6, maxZoom: 3 });
  });
  $('#f-categorias').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    const id = b.dataset.cat;
    estado.cats.has(id) ? estado.cats.delete(id) : estado.cats.add(id);
    refrescar();
  });
  $('#f-estado').addEventListener('click', e => {
    const b = e.target.closest('[data-estado]'); if (!b) return;
    const id = b.dataset.estado;
    estado.estados.has(id) ? estado.estados.delete(id) : estado.estados.add(id);
    b.classList.toggle('on'); refrescar();
  });
  $('#f-favs').addEventListener('click', e => { estado.soloFavs = !estado.soloFavs; e.target.classList.toggle('on'); refrescar(); });
  $('#f-ocultar').addEventListener('click', e => { estado.ocultarEncontrados = !estado.ocultarEncontrados; e.target.classList.toggle('on'); refrescar(); });
  $('#cat-todas').addEventListener('click', () => { estado.cats = new Set(Object.keys(CATEGORIAS)); refrescar(); });
  $('#cat-ninguna').addEventListener('click', () => { estado.cats.clear(); refrescar(); });

  /* ---------- Aportes aprobados de la comunidad ---------- */
  function regionCercana(x, y) {
    let mejor = POIS[0], d = Infinity;
    for (const p of POIS) { const dd = (p.x - x) ** 2 + (p.y - y) ** 2; if (dd < d) { d = dd; mejor = p; } }
    return mejor.region;
  }
  async function cargarComunidad() {
    try {
      const aprobados = await Store.listarAprobados();
      const extra = (aprobados || []).filter(a => CATEGORIAS[a.categoria]).map(a => ({
        id: 'c-' + a.id, nombre: a.titulo, cat: a.categoria, x: +a.x, y: +a.y, region: regionCercana(+a.x, +a.y),
        zona: `Aporte de ${a.apodo || 'la comunidad'}`, desc: a.mensaje, estado: 'comunidad', comunidad: true,
        apodo: a.apodo, created_at: a.created_at, videos: a.video_url ? [{ url: a.video_url, autor: a.apodo }] : [],
      }));
      todos = [...POIS.map(p => ({ ...p })), ...extra];
      refrescar();
      abrirDesdeHash();
    } catch (e) { console.warn('No se pudieron cargar aportes:', e); }
  }

  function abrirDesdeHash() {
    const m = location.hash.match(/poi=([^&]+)/);
    if (m) abrirFicha(decodeURIComponent(m[1]));
  }

  /* ---------- PWA ---------- */
  let promptInstalar;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); promptInstalar = e; $('#btn-instalar').hidden = false; });
  $('#btn-instalar').addEventListener('click', async () => { if (!promptInstalar) return; promptInstalar.prompt(); await promptInstalar.userChoice; promptInstalar = null; $('#btn-instalar').hidden = true; });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

  /* ---------- Inicio ---------- */
  pintarFiltros();
  refrescar();
  abrirDesdeHash();
  cargarComunidad();
  if (!localStorage.getItem('atlas_visto_ayuda')) { localStorage.setItem('atlas_visto_ayuda', '1'); setTimeout(() => $('#dlg-ayuda').showModal(), 600); }
})();
