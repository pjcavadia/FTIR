/* Procesamiento de espectros FTIR — funciones puras, sin dependencias.
 * Funciona en el navegador (window.FTIRProc) y en Node (module.exports) para pruebas. */
(function (root) {
  'use strict';
  const P = {};

  const median = (a) => {
    const s = Array.from(a).sort((x, y) => x - y);
    const n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  };
  const maxOf = (a) => { let m = -Infinity; for (let i = 0; i < a.length; i++) if (a[i] > m) m = a[i]; return m; };
  const minOf = (a) => { let m = Infinity; for (let i = 0; i < a.length; i++) if (a[i] < m) m = a[i]; return m; };
  P.median = median; P.maxOf = maxOf; P.minOf = minOf;

  /* ---------- Lectura de texto (CSV / TXT / DPT / DAT) ---------- */
  // Acepta separadores ; , tabulador o espacio; coma decimal; líneas de encabezado y comentarios.
  P.parse = function (text) {
    const lines = text.replace(/\r/g, '').split('\n');
    const pts = [];
    for (const raw of lines) {
      const l = raw.trim();
      if (!l || /^[#;%/]/.test(l)) continue;
      let parts;
      if (l.includes('\t')) parts = l.split('\t');
      else if (l.includes(';')) parts = l.split(';');
      else if (l.includes(',') && /^[-+]?\d+(\.\d+)?(e[-+]?\d+)?\s*,\s*[-+]?\d/i.test(l)) parts = l.split(',');
      else parts = l.split(/\s+/);
      if (parts.length < 2) continue;
      const cast = (s) => Number(String(s).trim().replace(',', '.'));
      const a = cast(parts[0]), b = cast(parts[1]);
      if (Number.isFinite(a) && Number.isFinite(b) && String(parts[0]).trim() !== '' && String(parts[1]).trim() !== '') pts.push([a, b]);
    }
    if (pts.length < 10) throw new Error('No se encontraron al menos 10 filas numéricas (columna 1 = cm⁻¹, columna 2 = señal).');
    pts.sort((p, q) => p[0] - q[0]);
    const x = [], y = [];
    for (const [a, b] of pts) { if (x.length && a === x[x.length - 1]) continue; x.push(a); y.push(b); }
    return { x, y };
  };

  /* ---------- Remuestreo uniforme (necesario para SG y derivadas) ---------- */
  P.resample = function (x, y, step) {
    const dxs = []; for (let i = 1; i < x.length; i++) dxs.push(x[i] - x[i - 1]);
    const h = step || Math.max(median(dxs), 0.05);
    const start = x[0], n = Math.floor((x[x.length - 1] - start) / h) + 1;
    const xr = new Array(n), yr = new Array(n);
    let j = 0;
    for (let i = 0; i < n; i++) {
      const xi = start + i * h; xr[i] = xi;
      while (j < x.length - 2 && x[j + 1] < xi) j++;
      const t = (xi - x[j]) / (x[j + 1] - x[j]);
      yr[i] = y[j] + Math.min(Math.max(t, 0), 1) * (y[j + 1] - y[j]);
    }
    return { x: xr, y: yr, h };
  };

  /* ---------- Conversión a absorbancia ---------- */
  P.detectMode = function (y) {
    const mx = maxOf(y), mn = minOf(y), md = median(y);
    if (mx > 5) return 'pT';                       // % transmitancia (0–100)
    if (mn >= 0 && mx <= 1.05 && md > 0.6) return 'T'; // transmitancia fracción
    return 'A';
  };
  P.toAbsorbance = function (y, mode) {
    const m = mode === 'auto' ? P.detectMode(y) : mode;
    if (m === 'A') return { y: y.slice(), mode: m };
    const div = m === 'pT' ? 100 : 1;
    return { y: y.map((v) => -Math.log10(Math.max(v / div, 1e-4))), mode: m };
  };

  /* ---------- Savitzky–Golay (orden 2/3) ---------- */
  function mirror(y, m) {
    const n = y.length, out = new Array(n + 2 * m);
    for (let i = 0; i < m; i++) { out[i] = y[Math.min(m - i, n - 1)]; out[n + m + i] = y[Math.max(n - 2 - i, 0)]; }
    for (let i = 0; i < n; i++) out[i + m] = y[i];
    return out;
  }
  P.savgol = function (y, w) {
    if (!w || w < 5) return y.slice();
    if (w % 2 === 0) w += 1;
    const m = (w - 1) / 2, den = (2 * m + 3) * (2 * m + 1) * (2 * m - 1);
    const c = []; for (let i = -m; i <= m; i++) c.push(3 * (3 * m * m + 3 * m - 1 - 5 * i * i) / den);
    const ext = mirror(y, m), out = new Array(y.length);
    for (let i = 0; i < y.length; i++) { let s = 0; for (let k = 0; k < w; k++) s += c[k] * ext[i + k]; out[i] = s; }
    return out;
  };
  // 2ª derivada SG (ajuste cuadrático); h = paso en cm⁻¹
  P.savgolD2 = function (y, w, h) {
    if (w < 7) w = 7; if (w % 2 === 0) w += 1;
    const m = (w - 1) / 2, den = (2 * m - 1) * (2 * m + 1) * (2 * m + 3) * m * (m + 1);
    const c = []; for (let i = -m; i <= m; i++) c.push(30 * (3 * i * i - m * (m + 1)) / den);
    const ext = mirror(y, m), out = new Array(y.length);
    for (let i = 0; i < y.length; i++) { let s = 0; for (let k = 0; k < w; k++) s += c[k] * ext[i + k]; out[i] = s / (h * h); }
    return out;
  };

  /* ---------- Línea base ---------- */
  P.baseline = function (x, y, type) {
    if (type === 'none') return y.slice();
    const n = y.length;
    if (type === 'linear') {
      const k = Math.max(3, Math.floor(n * 0.01));
      const avg = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += y[i]; return s / (b - a); };
      const y0 = avg(0, k), y1 = avg(n - k, n);
      return y.map((v, i) => v - (y0 + (y1 - y0) * (x[i] - x[0]) / (x[n - 1] - x[0])));
    }
    // 'rubber': envolvente convexa inferior (banda elástica)
    const hull = [];
    for (let i = 0; i < n; i++) {
      while (hull.length >= 2) {
        const a = hull[hull.length - 2], b = hull[hull.length - 1];
        const cross = (x[b] - x[a]) * (y[i] - y[a]) - (y[b] - y[a]) * (x[i] - x[a]);
        if (cross <= 0) hull.pop(); else break;
      }
      hull.push(i);
    }
    const base = new Array(n);
    for (let s = 0; s < hull.length - 1; s++) {
      const a = hull[s], b = hull[s + 1];
      for (let i = a; i <= b; i++) base[i] = y[a] + (y[b] - y[a]) * (x[i] - x[a]) / (x[b] - x[a]);
    }
    return y.map((v, i) => v - base[i]);
  };

  P.normalize = function (y, type) {
    if (type === 'max') { const m = maxOf(y) || 1; return y.map((v) => v / m); }
    if (type === 'minmax') { const a = minOf(y), b = maxOf(y); return y.map((v) => (v - a) / ((b - a) || 1)); }
    return y.slice();
  };

  /* ---------- Detección de picos por prominencia ---------- */
  P.findPeaks = function (x, y, opt) {
    const minProm = opt.minProm, minDist = opt.minDist || 0, n = y.length, cand = [];
    for (let i = 1; i < n - 1; i++) {
      if (!(y[i] > y[i - 1] && y[i] >= y[i + 1])) continue;
      let l = i, lmin = y[i]; while (l > 0 && y[l - 1] <= y[i]) { l--; if (y[l] < lmin) lmin = y[l]; }
      let r = i, rmin = y[i]; while (r < n - 1 && y[r + 1] <= y[i]) { r++; if (y[r] < rmin) rmin = y[r]; }
      const prom = y[i] - Math.max(lmin, rmin);
      if (prom < minProm) continue;
      // posición refinada (parábola de 3 puntos)
      const d = y[i - 1] - 2 * y[i] + y[i + 1];
      const off = d !== 0 ? 0.5 * (y[i - 1] - y[i + 1]) / d : 0;
      const pos = x[i] + Math.max(-1, Math.min(1, off)) * (x[i + 1] - x[i]);
      // ancho a media prominencia
      const lvl = y[i] - prom / 2;
      let a = i; while (a > l && y[a] > lvl) a--;
      let b = i; while (b < r && y[b] > lvl) b++;
      const xl = a < i && y[a + 1] !== y[a] ? x[a] + (lvl - y[a]) * (x[a + 1] - x[a]) / (y[a + 1] - y[a]) : x[a];
      const xr = b > i && y[b] !== y[b - 1] ? x[b - 1] + (lvl - y[b - 1]) * (x[b] - x[b - 1]) / (y[b] - y[b - 1]) : x[b];
      cand.push({ pos, height: y[i], prom, fwhm: Math.abs(xr - xl), idx: i, tipo: 'pico' });
    }
    cand.sort((p, q) => q.prom - p.prom);
    const kept = [];
    for (const c of cand) if (!kept.some((k) => Math.abs(k.pos - c.pos) < minDist)) kept.push(c);
    return kept.sort((p, q) => q.pos - p.pos);
  };

  // Hombros: mínimos de la 2ª derivada que no coinciden con un pico ya detectado.
  P.findShoulders = function (x, y, h, w, thresh, peaks, minDist) {
    const d2 = P.savgolD2(y, w, h), n = d2.length;
    let mx = 0; for (const v of d2) if (-v > mx) mx = -v;
    const out = [];
    for (let i = 1; i < n - 1; i++) {
      if (d2[i] < d2[i - 1] && d2[i] <= d2[i + 1] && -d2[i] >= thresh * mx) {
        if (peaks.some((p) => Math.abs(p.pos - x[i]) < Math.max(minDist, 6))) continue;
        out.push({ pos: x[i], height: y[i], prom: NaN, fwhm: NaN, idx: i, tipo: 'hombro' });
      }
    }
    return out;
  };

  /* ---------- Coincidencia con la base de bandas ---------- */
  P.distToBand = function (pos, b) {
    if (pos >= b.min && pos <= b.max) return 0;
    return Math.min(Math.abs(pos - b.min), Math.abs(pos - b.max));
  };
  P.match = function (pos, bandas, tol, materiales) {
    return bandas
      .filter((b) => !materiales || materiales.includes(b.material))
      .map((b) => ({ banda: b, d: P.distToBand(pos, b) }))
      .filter((m) => m.d <= tol)
      .sort((a, b) => a.d - b.d);
  };
  // Evidencia por componente: fracción de bandas "clave" con al menos un pico dentro de la tolerancia.
  P.evidencia = function (picos, bandas, tol, materiales) {
    const comps = {};
    for (const b of bandas) {
      if (!b.clave || (materiales && !materiales.includes(b.material))) continue;
      const c = comps[b.componente] || (comps[b.componente] = { componente: b.componente, material: b.material, total: 0, halladas: [], faltan: [] });
      c.total++;
      const hit = picos.find((p) => P.distToBand(p.pos, b) <= tol);
      (hit ? c.halladas : c.faltan).push({ banda: b, pico: hit ? hit.pos : null });
    }
    return Object.values(comps).map((c) => ({ ...c, fraccion: c.total ? c.halladas.length / c.total : 0 }))
      .sort((a, b) => b.fraccion - a.fraccion);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.FTIRProc = P;
})(typeof window !== 'undefined' ? window : globalThis);
