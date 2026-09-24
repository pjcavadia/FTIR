/* Interfaz del asistente FTIR. Depende de: Plotly, FTIRProc, FTIR_BANDAS, FTIR_REFS, FTIR_EJEMPLOS. */
(function () {
  'use strict';
  const P = window.FTIRProc;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PALETA = ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#7A5195', '#E69F00', '#56B4E9', '#888888']; // Okabe–Ito
  const COLOR_MAT = { fibra: '#009E73', go: '#555555', epoxi: '#0072B2', artefacto: '#E69F00' };
  const NOMBRE_MAT = { fibra: 'Fibra natural', go: 'Óxido de grafeno', epoxi: 'Resina epóxica', artefacto: 'Artefacto' };
  const LS_KEY = 'fique-go-ftir-bandas-usuario';

  const S = { spectra: [], activo: null, sel: null, uid: 0, bandas: window.FTIR_BANDAS.slice(), refs: Object.assign({}, window.FTIR_REFS) };

  /* ---------- bandas del usuario (localStorage opcional) ---------- */
  function cargarUsuario() {
    try {
      const j = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      if (Array.isArray(j)) j.forEach(registrarBanda);
    } catch (e) { /* sin almacenamiento: se ignora */ }
  }
  function guardarUsuario() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S.bandas.filter((b) => b.usuario).map(({ usuario, ...r }) => r))); } catch (e) { /* ignorar */ }
  }
  function registrarBanda(b) {
    const min = Number(b.min), max = Number(b.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error('Cada banda necesita "min" y "max" numéricos.');
    const nb = { min: Math.min(min, max), max: Math.max(min, max), grupo: String(b.grupo || 'Sin descripción'), componente: String(b.componente || 'Usuario'),
      material: NOMBRE_MAT[b.material] ? b.material : 'fibra', clave: !!b.clave, refs: [], nota: String(b.nota || ''), usuario: true, refTexto: b.refTexto || '' };
    const key = 'U' + (b.refTexto || 'sin-ref');
    S.refs[key] = S.refs[key] || { corto: b.refTexto || 'Referencia del usuario (sin especificar)', completo: b.refTexto || 'Banda añadida por el usuario sin referencia.', url: '', verificado: 'Definida por el usuario.' };
    nb.refs = [key]; nb.refTexto = b.refTexto || '';
    S.bandas.push(nb);
  }

  /* ---------- ajustes ---------- */
  function ajustes() {
    return {
      base: $('base').value, suav: Number($('suav').value), norm: $('norm').value,
      xmin: Number($('xmin').value) || 400, xmax: Number($('xmax').value) || 4000,
      prom: Number($('prom').value) / 100, dist: Number($('dist').value) || 0, tol: Number($('tol').value),
      hombros: $('hombros').checked, apilar: $('apilar').checked, etiquetas: $('etiquetas').checked, sombrear: $('bandas').checked,
      materiales: Array.from(document.querySelectorAll('.mat:checked')).map((c) => c.value)
    };
  }

  /* ---------- pipeline por espectro ---------- */
  function procesar(sp, a) {
    const r = P.resample(sp.x, sp.y);
    const ab = P.toAbsorbance(r.y, sp.modo);
    sp.modoDet = ab.mode;
    let x = r.x, y = ab.y;
    const idx = []; for (let i = 0; i < x.length; i++) if (x[i] >= a.xmin && x[i] <= a.xmax) idx.push(i);
    if (idx.length < 20) return { x: [], y: [], picos: [], error: 'El rango elegido deja menos de 20 puntos.' };
    x = idx.map((i) => x[i]); y = idx.map((i) => y[i]);
    y = P.savgol(y, a.suav);
    y = P.baseline(x, y, a.base);
    y = P.normalize(y, a.norm);
    const rango = P.maxOf(y) - P.minOf(y) || 1;
    let picos = P.findPeaks(x, y, { minProm: a.prom * rango, minDist: a.dist });
    if (a.hombros) picos = picos.concat(P.findShoulders(x, y, r.h, Math.max(a.suav, 11), 0.08, picos, a.dist)).sort((p, q) => q.pos - p.pos);
    picos.forEach((p) => { p.match = P.match(p.pos, S.bandas, a.tol, a.materiales); });
    return { x, y, picos, rango, h: r.h };
  }

  /* ---------- render ---------- */
  let pendiente = false;
  function pedirRender() { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; render(); }); }

  function refSup(refs) {
    return refs.map((k) => { const r = S.refs[k]; return `<sup class="ref" title="${esc(r ? r.completo : k)}">${esc(k.startsWith('U') ? 'U' : k)}</sup>`; }).join('');
  }
  function chipAsign(m) {
    const b = m.banda;
    return `<span class="chip" title="${esc(b.grupo + ' · ' + b.min + '–' + b.max + ' cm⁻¹' + (b.nota ? ' — ' + b.nota : ''))}"><span style="color:${COLOR_MAT[b.material]}">●</span> ${esc(b.componente)}: ${esc(b.grupo)} <span class="d">Δ${m.d.toFixed(0)}</span>${refSup(b.refs)}</span>`;
  }

  function render() {
    const a = ajustes();
    $('suavV').textContent = a.suav < 5 ? 'desactivado' : a.suav;
    $('promV').textContent = (a.prom * 100).toFixed(1).replace('.0', '') + ' %';
    $('tolV').textContent = a.tol + ' cm⁻¹';
    S.spectra.forEach((sp) => { sp.res = procesar(sp, a); });
    renderLista();
    renderPlot(a);
    const act = S.spectra.find((s) => s.id === S.activo);
    renderPicos(act, a);
    renderEvid(act, a);
    renderManual(a);
    renderBase();
    renderRefs();
  }

  function renderLista() {
    const cont = $('lista');
    if (!S.spectra.length) { cont.innerHTML = '<p class="hint">Aún no hay espectros. Carga archivos o usa los ejemplos.</p>'; return; }
    cont.innerHTML = S.spectra.map((sp) => `
      <div class="spec" data-id="${sp.id}">
        <span class="dot" style="background:${sp.color}"></span>
        <span class="nm" title="${esc(sp.nombre)}"><label style="display:inline;margin:0"><input type="radio" name="act" value="${sp.id}" ${sp.id === S.activo ? 'checked' : ''}> ${esc(sp.nombre)}</label></span>
        <button class="small" data-del="${sp.id}" aria-label="Quitar">✕</button>
        <select data-modo="${sp.id}">
          <option value="auto" ${sp.modo === 'auto' ? 'selected' : ''}>Señal: auto (detectado: ${{ A: 'absorbancia', T: 'transmitancia 0–1', pT: '%T' }[sp.modoDet] || '…'})</option>
          <option value="A" ${sp.modo === 'A' ? 'selected' : ''}>Absorbancia</option>
          <option value="T" ${sp.modo === 'T' ? 'selected' : ''}>Transmitancia (0–1)</option>
          <option value="pT" ${sp.modo === 'pT' ? 'selected' : ''}>%Transmitancia</option>
        </select>
        ${sp.res && sp.res.error ? `<div class="err" style="grid-column:1/4">${esc(sp.res.error)}</div>` : ''}
      </div>`).join('');
  }

  function colores() {
    const cs = getComputedStyle(document.documentElement);
    const g = (v) => cs.getPropertyValue(v).trim();
    return { ink: g('--ink'), muted: g('--muted'), grid: g('--grid'), paper: g('--panel') };
  }

  function renderPlot(a) {
    const c = colores();
    const trazas = [], anot = [], shapes = [];
    const validos = S.spectra.filter((s) => s.res && s.res.x.length);
    const paso = a.apilar ? 1.12 * Math.max(...validos.map((s) => s.res.rango), 0.1) : 0;
    validos.forEach((sp, k) => {
      const off = k * paso;
      trazas.push({ x: sp.res.x, y: sp.res.y.map((v) => v + off), type: 'scattergl', mode: 'lines', name: sp.nombre, line: { color: sp.color, width: sp.id === S.activo ? 2.2 : 1.4 },
        hovertemplate: '%{x:.1f} cm⁻¹<br>A = %{customdata:.4f}<extra>' + esc(sp.nombre) + '</extra>', customdata: sp.res.y });
      if (sp.id === S.activo) {
        if (a.etiquetas) sp.res.picos.forEach((p) => {
          anot.push({ x: p.pos, y: p.height + off, text: p.pos.toFixed(0) + (p.tipo === 'hombro' ? ' (h)' : ''), textangle: -90, showarrow: false, yanchor: 'bottom', yshift: 4, font: { size: 10, color: sp.color } });
        });
        if (S.sel != null) shapes.push({ type: 'line', x0: S.sel, x1: S.sel, yref: 'paper', y0: 0, y1: 1, line: { color: c.muted, width: 1, dash: 'dot' } });
      }
    });
    if (a.sombrear) S.bandas.filter((b) => b.clave && a.materiales.includes(b.material)).forEach((b) => {
      shapes.push({ type: 'rect', xref: 'x', yref: 'paper', x0: Math.min(b.min, b.max) - 2, x1: Math.max(b.min, b.max) + 2, y0: 0, y1: 1, fillcolor: COLOR_MAT[b.material], opacity: 0.10, line: { width: 0 }, layer: 'below' });
    });
    const layout = {
      paper_bgcolor: c.paper, plot_bgcolor: c.paper, font: { color: c.ink, family: 'system-ui, sans-serif' },
      margin: { l: 60, r: 20, t: 20, b: 55 },
      xaxis: { title: 'Número de onda (cm⁻¹)', autorange: 'reversed', gridcolor: c.grid, zeroline: false, range: [a.xmax, a.xmin] },
      yaxis: { title: a.norm === 'none' ? 'Absorbancia (u.a.)' : 'Absorbancia normalizada (u.a.)', gridcolor: c.grid, zeroline: false, showticklabels: !a.apilar },
      legend: { orientation: 'h', y: 1.08 }, annotations: anot, shapes, hovermode: 'closest', dragmode: 'zoom'
    };
    if (!validos.length) {
      layout.annotations = [{ text: 'Carga uno o más espectros para empezar', showarrow: false, font: { size: 15, color: c.muted }, xref: 'paper', yref: 'paper', x: 0.5, y: 0.5 }];
      layout.xaxis.autorange = true; delete layout.xaxis.range;
    }
    Plotly.react('plot', trazas, layout, { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['select2d', 'lasso2d', 'toImage'] });
  }

  function renderPicos(sp, a) {
    const cont = $('pPicos');
    if (!sp || !sp.res || !sp.res.picos) { cont.innerHTML = '<p class="hint">Selecciona un espectro activo.</p>'; return; }
    const filas = sp.res.picos.map((p, i) => {
      const materiales = new Set(p.match.map((m) => m.banda.componente));
      const ambigua = materiales.size > 1 ? '<span class="tag" title="Varias especies absorben aquí: no asignes con un solo pico">solapada</span> ' : '';
      const top = p.match.slice(0, 4).map(chipAsign).join('');
      const mas = p.match.length > 4 ? `<span class="chip dim" title="${esc(p.match.slice(4).map((m) => m.banda.componente + ': ' + m.banda.grupo).join(' | '))}">+${p.match.length - 4} más</span>` : '';
      return `<tr class="pk" data-pos="${p.pos}"><td class="num">${i + 1}</td><td class="num"><b>${p.pos.toFixed(1)}</b></td><td class="num">${p.height.toFixed(3)}</td>
        <td class="num">${Number.isFinite(p.prom) ? p.prom.toFixed(3) : '—'}</td><td class="num">${Number.isFinite(p.fwhm) ? p.fwhm.toFixed(0) : '—'}</td><td>${p.tipo}</td>
        <td>${ambigua}${top || '<span class="hint">Sin coincidencias en la base con esta tolerancia</span>'}${mas}</td></tr>`;
    }).join('');
    cont.innerHTML = `<p class="hint" style="margin:0 0 8px">Espectro activo: <b>${esc(sp.nombre)}</b> · ${sp.res.picos.length} bandas · clic en una fila para marcarla en la gráfica. Δ = distancia (cm⁻¹) al rango de la banda de referencia; los superíndices son las referencias (pasa el cursor).</p>
      <div class="tblwrap"><table><thead><tr><th>#</th><th>cm⁻¹</th><th>Altura</th><th>Prominencia</th><th>FWHM</th><th>Tipo</th><th>Asignaciones candidatas</th></tr></thead><tbody>${filas || '<tr><td colspan="7">Sin picos: baja la prominencia mínima.</td></tr>'}</tbody></table></div>`;
  }

  function renderEvid(sp, a) {
    const cont = $('pEvid');
    if (!sp || !sp.res) { cont.innerHTML = ''; return; }
    const ev = P.evidencia(sp.res.picos, S.bandas, a.tol, a.materiales).filter((e) => e.componente !== 'Artefacto');
    cont.innerHTML = `<p class="hint" style="margin:0 0 10px">Para cada componente se cuenta cuántas de sus bandas <b>clave</b> aparecen en el espectro activo. Es una <b>pista cualitativa</b>, no una cuantificación: las bandas se solapan entre fibra, GO y epoxi. Espectro: <b>${esc(sp.nombre)}</b>.</p>
      <div class="grid2">${ev.map((e) => `<div class="ev"><h3><span style="color:${COLOR_MAT[e.material]}">●</span> ${esc(e.componente)} <span class="tag">${e.halladas.length}/${e.total} · ${e.fraccion >= 0.75 ? 'sólida' : e.fraccion >= 0.4 ? 'parcial' : 'débil'}</span></h3>
        <div class="bar"><i style="width:${(e.fraccion * 100).toFixed(0)}%"></i></div>
        <div style="margin-top:6px;font-size:12.5px">${e.halladas.map((h) => `<div class="ok">✓ ${h.pico.toFixed(0)} cm⁻¹ — ${esc(h.banda.grupo)}${refSup(h.banda.refs)}</div>`).join('')}
        ${e.faltan.map((h) => `<div class="no">✗ ${h.banda.min === h.banda.max ? h.banda.min : h.banda.min + '–' + h.banda.max} — ${esc(h.banda.grupo)}</div>`).join('')}</div></div>`).join('') || '<p>No hay bandas clave para los materiales seleccionados.</p>'}</div>`;
  }

  function renderManual(a) {
    const nums = ($('manualIn').value.match(/-?\d+(?:[.,]\d+)?/g) || []).map((s) => Number(s.replace(',', '.'))).filter((v) => v > 0);
    if (!nums.length) { $('manualOut').innerHTML = '<p class="hint">Ejemplo: 3340, 1735, 1510, 1245, 1050, 897</p>'; return; }
    $('manualOut').innerHTML = `<table><thead><tr><th>cm⁻¹</th><th>Asignaciones candidatas (±${a.tol} cm⁻¹)</th></tr></thead><tbody>${nums.map((v) => {
      const m = P.match(v, S.bandas, a.tol, a.materiales);
      return `<tr><td class="num"><b>${v}</b></td><td>${m.map(chipAsign).join('') || '<span class="hint">Sin coincidencias con esta tolerancia y materiales</span>'}</td></tr>`;
    }).join('')}</tbody></table>`;
  }

  function renderBase() {
    const q = $('filtroBase').value.trim().toLowerCase();
    const filas = S.bandas.filter((b) => !q || (b.min + ' ' + b.max + ' ' + b.grupo + ' ' + b.componente + ' ' + b.nota + ' ' + NOMBRE_MAT[b.material]).toLowerCase().includes(q))
      .sort((p, r) => r.max - p.max);
    $('baseOut').innerHTML = `<table><thead><tr><th>cm⁻¹</th><th>Grupo / modo</th><th>Componente</th><th>Material</th><th>Clave</th><th>Refs.</th><th>Nota</th></tr></thead><tbody>${filas.map((b) => `<tr>
      <td class="num">${b.min === b.max ? b.min : b.min + '–' + b.max}</td><td>${esc(b.grupo)}</td><td>${esc(b.componente)}${b.usuario ? ' <span class="tag">usuario</span>' : ''}</td>
      <td><span style="color:${COLOR_MAT[b.material]}">●</span> ${NOMBRE_MAT[b.material]}</td><td>${b.clave ? 'sí' : ''}</td><td>${refSup(b.refs)}</td><td>${esc(b.nota)}</td></tr>`).join('')}</tbody></table>`;
  }

  function renderRefs() {
    $('pRefs').innerHTML = `<div class="warn">Antes de citar en la tesis: abre cada referencia y confirma los valores. La base se armó leyendo estos artículos, pero puede haber errores de transcripción o diferencias entre materiales (madera, yute, cáñamo) y el fique. Falta incorporar referencias específicas de fique.</div>
      <ol style="padding-left:20px">${Object.keys(S.refs).map((k) => { const r = S.refs[k];
        return `<li style="margin-bottom:10px"><b>[${esc(k.startsWith('U') ? 'U' : k)}]</b> ${esc(r.completo)}${r.url ? ` <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url)}</a>` : ''}<br><span class="hint">Estado: ${esc(r.verificado)}</span></li>`; }).join('')}</ol>`;
  }

  /* ---------- carga de archivos ---------- */
  function agregar(nombre, x, y) {
    const id = ++S.uid;
    if (x[0] > x[x.length - 1]) { x = x.slice().reverse(); y = y.slice().reverse(); } // el motor trabaja en orden ascendente
    S.spectra.push({ id, nombre, x, y, modo: 'auto', color: PALETA[(S.spectra.length) % PALETA.length] });
    S.activo = id;
  }
  async function leerArchivos(files) {
    $('errores').innerHTML = '';
    for (const f of files) {
      try { const t = await f.text(); const d = P.parse(t); agregar(f.name.replace(/\.[^.]+$/, ''), d.x, d.y); }
      catch (e) { $('errores').insertAdjacentHTML('beforeend', `<div class="err"><b>${esc(f.name)}:</b> ${esc(e.message)}</div>`); }
    }
    pedirRender();
  }

  /* ---------- exportaciones ---------- */
  function descargar(nombre, contenido, tipo) {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportarCsv() {
    const sp = S.spectra.find((s) => s.id === S.activo); if (!sp || !sp.res) return;
    const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    const filas = [['espectro', 'cm-1', 'altura', 'prominencia', 'fwhm', 'tipo', 'asignaciones'].join(',')];
    sp.res.picos.forEach((p) => filas.push([q(sp.nombre), p.pos.toFixed(1), p.height.toFixed(4), Number.isFinite(p.prom) ? p.prom.toFixed(4) : '', Number.isFinite(p.fwhm) ? p.fwhm.toFixed(1) : '', p.tipo,
      q(p.match.map((m) => `${m.banda.componente}: ${m.banda.grupo} (d=${m.d.toFixed(0)}) [${m.banda.refs.join(',')}]`).join(' | '))].join(',')));
    descargar('picos_ftir_' + sp.nombre.replace(/\W+/g, '_') + '.csv', '﻿' + filas.join('\n'), 'text/csv;charset=utf-8');
  }

  /* ---------- eventos ---------- */
  function init() {
    cargarUsuario();
    const drop = $('drop'), inp = $('archivo');
    drop.addEventListener('click', () => inp.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
    inp.addEventListener('change', () => { leerArchivos(Array.from(inp.files)); inp.value = ''; });
    ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => leerArchivos(Array.from(e.dataTransfer.files)));
    $('btnEjemplos').addEventListener('click', () => { window.FTIR_EJEMPLOS.forEach((d) => agregar(d.nombre, d.x, d.y)); S.activo = S.spectra[S.spectra.length - 1].id; pedirRender(); });
    $('btnLimpiar').addEventListener('click', () => { S.spectra = []; S.activo = null; S.sel = null; $('errores').innerHTML = ''; pedirRender(); });
    $('lista').addEventListener('click', (e) => {
      const d = e.target.closest('[data-del]'); if (d) { S.spectra = S.spectra.filter((s) => s.id !== Number(d.dataset.del)); if (!S.spectra.some((s) => s.id === S.activo)) S.activo = S.spectra.length ? S.spectra[0].id : null; pedirRender(); }
    });
    $('lista').addEventListener('change', (e) => {
      if (e.target.name === 'act') { S.activo = Number(e.target.value); S.sel = null; pedirRender(); }
      if (e.target.dataset.modo) { const sp = S.spectra.find((s) => s.id === Number(e.target.dataset.modo)); if (sp) { sp.modo = e.target.value; pedirRender(); } }
    });
    ['base', 'suav', 'norm', 'xmin', 'xmax', 'prom', 'dist', 'tol', 'hombros', 'apilar', 'etiquetas', 'bandas'].forEach((id) => $(id).addEventListener('input', pedirRender));
    document.querySelectorAll('.mat').forEach((c) => c.addEventListener('change', pedirRender));
    $('manualIn').addEventListener('input', pedirRender);
    $('filtroBase').addEventListener('input', renderBase);
    $('pPicos').addEventListener('click', (e) => { const tr = e.target.closest('tr.pk'); if (tr) { S.sel = Number(tr.dataset.pos); pedirRender(); } });
    document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('.tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', p.id === b.dataset.p));
    }));
    $('impJson').addEventListener('change', async (e) => {
      try {
        const arr = JSON.parse(await e.target.files[0].text());
        if (!Array.isArray(arr)) throw new Error('El JSON debe ser una lista de bandas.');
        arr.forEach(registrarBanda); guardarUsuario(); pedirRender();
      } catch (err) { alert('No se pudo importar: ' + err.message); }
      e.target.value = '';
    });
    $('expPng').addEventListener('click', () => Plotly.downloadImage('plot', { format: 'png', width: 1600, height: 900, scale: 2, filename: 'ftir' }));
    $('expSvg').addEventListener('click', () => Plotly.downloadImage('plot', { format: 'svg', width: 1600, height: 900, filename: 'ftir' }));
    $('expCsv').addEventListener('click', exportarCsv);
    $('tema').addEventListener('click', (e) => {
      e.preventDefault(); const r = document.documentElement;
      const oscuro = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      r.dataset.theme = oscuro ? 'light' : 'dark'; pedirRender();
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', pedirRender);
    render();
  }
  init();
  window.FTIR_APP = { estado: S, render };
})();
