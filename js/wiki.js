/* Leonida Atlas — wiki de personajes, animales y vehículos. */
(() => {
  const $ = s => document.querySelector(s);
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const fuente = k => WIKI_FUENTES[k] || (typeof FUENTES !== 'undefined' && FUENTES[k]);
  const poiPorId = id => (typeof POIS !== 'undefined' ? POIS.find(p => p.id === id) : null);

  const estado = { tab: 'personajes', q: '', f: {} };
  const COLORES = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#84cc16'];
  const colorDe = s => COLORES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORES.length];
  const iniciales = n => n.replace(/["'(].*?["')]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  /* ───── Definición de cada pestaña ───── */
  const TABS = {
    personajes: {
      datos: PERSONAJES,
      texto: p => `${p.nombre} ${p.desc} ${p.juego || ''} ${p.aparece || ''} ${p.voz || ''} ${p.region} ${GRUPOS_PERSONAJES[p.grupo]}`,
      filtros: [{ id: 'grupo', nombre: 'Grupo', opciones: GRUPOS_PERSONAJES, campo: p => p.grupo }],
      tarjeta: p => `
        <span class="avatar" style="--c:${colorDe(p.id)}">${esc(iniciales(p.nombre))}</span>
        <span class="t-cuerpo"><b>${esc(p.nombre)}</b>
          <small>${esc(GRUPOS_PERSONAJES[p.grupo])} · ${esc(p.region)}</small>
          <small class="t-desc">${esc(p.desc)}</small></span>
        ${p.spoiler ? '<span class="sello">Spoiler</span>' : ''}`,
      ficha: p => `
        <div class="f-cab"><span class="avatar grande" style="--c:${colorDe(p.id)}">${esc(iniciales(p.nombre))}</span>
          <div><h2>${esc(p.nombre)}</h2><p class="tenue">${esc(GRUPOS_PERSONAJES[p.grupo])} · ${esc(p.region)}</p></div></div>
        <p class="desc">${esc(p.desc)}</p>
        ${dato('🎮 En el juego', p.juego)}${dato('📍 Aparece en', p.aparece)}${dato('🎙️ Voz', p.voz)}
        ${p.spoiler ? `<details class="spoiler"><summary>⚠ Mostrar spoiler</summary><p>${esc(p.spoiler)}</p></details>` : ''}`,
    },
    animales: {
      datos: ANIMALES,
      texto: a => `${a.nombre} ${a.en} ${a.habitat} ${a.regiones} ${a.nota} ${TIPOS_ANIMAL[a.tipo]}`,
      filtros: [
        { id: 'tipo', nombre: 'Tipo', opciones: TIPOS_ANIMAL, campo: a => a.tipo },
        { id: 'marca', nombre: 'Característica', opciones: { cazable: '🎯 Se puede cazar', peligroso: '⚠ Peligroso', raro: '✨ Variante rara' }, campo: a => ['cazable', 'peligroso', 'raro'].filter(k => a[k]) },
      ],
      tarjeta: a => `
        <span class="emoji-grande" aria-hidden="true">${a.emoji}</span>
        <span class="t-cuerpo"><b>${esc(a.nombre)}</b><small><i>${esc(a.en)}</i></small>
          <small>📍 ${esc(a.regiones)}</small>
          <span class="insignias">${a.peligroso ? '<span class="ins rojo">⚠ Peligroso</span>' : ''}${a.cazable ? '<span class="ins">🎯 Cazable</span>' : ''}${a.raro ? '<span class="ins oro">✨ Raro</span>' : ''}</span></span>`,
      ficha: a => `
        <div class="f-cab"><span class="emoji-grande xl">${a.emoji}</span>
          <div><h2>${esc(a.nombre)}</h2><p class="tenue"><i>${esc(a.en)}</i> · ${esc(TIPOS_ANIMAL[a.tipo])}</p></div></div>
        <span class="insignias">${a.peligroso ? '<span class="ins rojo">⚠ Peligroso</span>' : '<span class="ins">Inofensivo</span>'}${a.cazable ? '<span class="ins">🎯 Cazable</span>' : '<span class="ins">No se caza</span>'}${a.raro ? '<span class="ins oro">✨ Variante rara</span>' : ''}</span>
        ${dato('🌿 Hábitat', a.habitat)}${dato('📍 Dónde', a.regiones)}${a.cazable ? dato('🔫 Arma recomendada', a.arma) : ''}
        ${a.nota ? `<p class="desc">${esc(a.nota)}</p>` : ''}`,
    },
    vehiculos: {
      datos: VEHICULOS,
      texto: v => `${v.nombre} ${v.marca} ${MARCAS[v.marca] || ''} ${v.real} ${v.donde} ${v.nota} ${CLASES_VEHICULO[v.clase]}`,
      filtros: [
        { id: 'clase', nombre: 'Clase', opciones: CLASES_VEHICULO, campo: v => v.clase },
        { id: 'extra', nombre: 'Mostrar', opciones: { mapa: '📍 Con ubicación en el mapa', randy: '📋 Lista de Randy', filtracion: '🕵️ Solo de la filtración' },
          campo: v => [v.poi && 'mapa', /Randy/.test(v.nota + v.donde) && 'randy', v.estado === 'l' && 'filtracion'].filter(Boolean) },
      ],
      tarjeta: v => `
        <span class="emoji-grande" aria-hidden="true">${CLASES_VEHICULO[v.clase].split(' ')[0]}</span>
        <span class="t-cuerpo"><b>${esc(v.nombre)}</b>
          <small>${esc(v.marca)}${MARCAS[v.marca] ? ` <span class="tenue">(≈ ${esc(MARCAS[v.marca])})</span>` : ''}</small>
          <small>🚘 ${esc(v.real)}</small>
          ${v.donde !== '—' ? `<small class="t-desc">📍 ${esc(v.donde)}</small>` : ''}</span>
        ${v.estado === 'l' ? '<span class="sello">Filtración</span>' : v.estado === 'd' ? '<span class="sello gris">En disputa</span>' : ''}`,
      ficha: v => `
        <div class="f-cab"><span class="emoji-grande xl">${CLASES_VEHICULO[v.clase].split(' ')[0]}</span>
          <div><h2>${esc(v.nombre)}</h2><p class="tenue">${esc(CLASES_VEHICULO[v.clase].replace(/^\S+\s/, ''))}</p></div></div>
        ${v.estado === 'l' ? '<p class="aviso-f">🕵️ Este vehículo solo aparece en la filtración de 2022; no se ha visto en el juego.</p>' : ''}
        ${v.estado === 'd' ? '<p class="aviso-f gris">Las guías no coinciden en algunos datos de este vehículo.</p>' : ''}
        ${dato('🏭 Marca', `${v.marca}${MARCAS[v.marca] ? ` (se inspira en ${MARCAS[v.marca]})` : ''}`)}
        ${dato('🚘 Auto real', v.real)}${dato('📍 Dónde conseguirlo', v.donde !== '—' ? v.donde : '')}${dato('💵 Registro / venta', v.precio !== '—' ? v.precio : '')}
        ${v.nota ? `<p class="desc">${esc(v.nota)}</p>` : ''}`,
      extra: () => `
        <h2 class="extra-titulo">Cómo funcionan los autos en GTA VI</h2>
        <div class="guia-autos">${GUIA_AUTOS.map(([t, d]) => `<article><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}</div>
        <h2 class="extra-titulo">Marcas del juego y su inspiración real</h2>
        <div class="marcas">${Object.entries(MARCAS).sort().map(([m, r]) => `<button class="chip mini" data-buscar="${esc(m)}"><b>${esc(m)}</b>&nbsp;→ ${esc(r)}</button>`).join('')}</div>`,
    },
  };

  const dato = (t, v) => (v ? `<p class="dato"><b>${esc(t)}:</b> ${esc(v)}</p>` : '');

  /* ───── Render ───── */
  function pintarFiltros() {
    const t = TABS[estado.tab];
    $('#filtros').innerHTML = t.filtros.map(f => `
      <div class="fila-chips" data-filtro="${f.id}">
        <span class="etq">${esc(f.nombre)}:</span>
        <button class="chip mini ${!estado.f[f.id] ? 'on' : ''}" data-valor="">Todos</button>
        ${Object.entries(f.opciones).map(([k, n]) => {
          const n2 = t.datos.filter(d => [].concat(f.campo(d)).includes(k)).length;
          return n2 ? `<button class="chip mini ${estado.f[f.id] === k ? 'on' : ''}" data-valor="${esc(k)}">${esc(n)} <em>${n2}</em></button>` : '';
        }).join('')}
      </div>`).join('');
  }

  function filtrados() {
    const t = TABS[estado.tab];
    const q = norm(estado.q).split(/\s+/).filter(Boolean);
    return t.datos.filter(d => {
      for (const f of t.filtros) if (estado.f[f.id] && ![].concat(f.campo(d)).includes(estado.f[f.id])) return false;
      if (q.length) { const txt = norm(t.texto(d)); if (!q.every(w => txt.includes(w))) return false; }
      return true;
    });
  }

  function pintar() {
    const t = TABS[estado.tab];
    const lista = filtrados();
    $('#conteo').textContent = `${lista.length} de ${t.datos.length}`;
    $('#grid').innerHTML = lista.map(d => `<button class="tarjeta" data-id="${esc(d.id)}">${t.tarjeta(d)}</button>`).join('')
      || '<p class="vacio">No hay resultados. Prueba con otra búsqueda o quita los filtros.</p>';
    $('#extra').innerHTML = t.extra && !estado.q && !Object.values(estado.f).some(Boolean) ? t.extra() : '';
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === estado.tab));
  }

  function abrir(id) {
    const t = TABS[estado.tab];
    const d = t.datos.find(x => x.id === id);
    if (!d) return;
    const poi = d.poi && poiPorId(d.poi);
    const fuentes = (d.fuentes || []).map(fuente).filter(Boolean);
    $('#ficha-contenido').innerHTML = `
      <button class="cerrar f-cerrar" data-cerrar-dlg aria-label="Cerrar">✕</button>
      ${t.ficha(d)}
      <div class="f-acciones">
        ${poi ? `<a class="btn primario" href="./#poi=${encodeURIComponent(poi.id)}">🗺️ Ver en el mapa: ${esc(poi.nombre)}</a>` : ''}
        <button class="btn ghost" data-compartir>🔗 Compartir</button>
      </div>
      ${fuentes.length ? `<p class="fuentes">Fuente: ${fuentes.map(f => `<a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.nombre)}</a>`).join(' · ')}</p>` : ''}`;
    const dlg = $('#dlg-ficha');
    if (!dlg.open) dlg.showModal();
    history.replaceState(null, '', `#${estado.tab}/${encodeURIComponent(id)}`);
  }

  function cambiarTab(tab) {
    estado.tab = tab; estado.f = {};
    pintarFiltros(); pintar();
    history.replaceState(null, '', `#${tab}`);
  }

  /* ───── Eventos ───── */
  document.addEventListener('click', async e => {
    const tab = e.target.closest('[data-tab]'); if (tab) return cambiarTab(tab.dataset.tab);
    const tarjeta = e.target.closest('.tarjeta'); if (tarjeta) return abrir(tarjeta.dataset.id);
    const fv = e.target.closest('[data-valor]');
    if (fv) { estado.f[fv.closest('[data-filtro]').dataset.filtro] = fv.dataset.valor || null; pintarFiltros(); pintar(); return; }
    const marca = e.target.closest('[data-buscar]');
    if (marca) { $('#q').value = marca.dataset.buscar; estado.q = marca.dataset.buscar; pintar(); scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (e.target.closest('[data-cerrar-dlg]')) { $('#dlg-ficha').close(); return; }
    if (e.target.closest('[data-compartir]')) {
      const url = location.href;
      if (navigator.share) navigator.share({ title: document.title, url }).catch(() => {});
      else { await navigator.clipboard?.writeText(url); e.target.textContent = '✓ Link copiado'; }
    }
  });
  $('#dlg-ficha').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  $('#dlg-ficha').addEventListener('close', () => history.replaceState(null, '', `#${estado.tab}`));
  let tq;
  $('#q').addEventListener('input', e => { clearTimeout(tq); tq = setTimeout(() => { estado.q = e.target.value.trim(); pintar(); }, 120); });

  /* ───── Inicio ───── */
  for (const k of Object.keys(TABS)) $('#n-' + k).textContent = TABS[k].datos.length;
  function desdeHash() {
    const [tabHash, idHash] = decodeURIComponent(location.hash.slice(1)).split('/');
    const tab = TABS[tabHash] ? tabHash : 'personajes';
    if (tab !== estado.tab || !$('#grid').children.length) { estado.tab = tab; estado.f = {}; pintarFiltros(); pintar(); }
    if (idHash) abrir(idHash);
  }
  estado.tab = '';
  desdeHash();
  window.addEventListener('hashchange', desdeHash);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
