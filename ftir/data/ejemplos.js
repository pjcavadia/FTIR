/* Espectros SINTÉTICOS de demostración (NO son mediciones reales).
 * Se construyen con suma de gaussianas en posiciones tomadas de la base de bandas, solo para probar la herramienta. */
(function (root) {
  'use strict';
  function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
  function gauss(x, c, a, w) { return a * Math.exp(-0.5 * Math.pow((x - c) / w, 2)); }
  function build(nombre, picos, seed, ruido, pend) {
    const r = rng(seed), x = [], y = [];
    for (let v = 4000; v >= 400; v -= 2) {
      let s = 0.02 + pend * (v - 400) / 3600;
      for (const [c, a, w] of picos) s += gauss(v, c, a, w);
      s += (r() - 0.5) * 2 * ruido;
      x.push(v); y.push(Math.max(s, 0));
    }
    return { nombre, x, y };
  }
  const fibraCruda = [[3340, 0.55, 150], [2900, 0.22, 45], [1735, 0.10, 14], [1635, 0.12, 20], [1508, 0.06, 10], [1425, 0.14, 14], [1372, 0.16, 12], [1316, 0.11, 10], [1245, 0.13, 14], [1160, 0.30, 12], [1105, 0.30, 12], [1055, 0.75, 22], [1030, 0.85, 12], [897, 0.14, 10], [665, 0.10, 30]];
  const fibraNaOH = [[3340, 0.58, 150], [2900, 0.22, 45], [1635, 0.10, 20], [1425, 0.15, 14], [1372, 0.17, 12], [1316, 0.12, 10], [1160, 0.32, 12], [1105, 0.31, 12], [1055, 0.78, 22], [1030, 0.90, 12], [897, 0.18, 10], [665, 0.10, 30]];
  const go = [[3400, 0.40, 170], [1725, 0.28, 18], [1622, 0.40, 28], [1225, 0.26, 32], [1053, 0.55, 30]];
  const epoxi = [[3397, 0.10, 90], [3050, 0.04, 18], [2925, 0.20, 40], [1607, 0.24, 10], [1580, 0.07, 8], [1508, 0.55, 9], [1248, 0.60, 14], [1183, 0.35, 10], [1035, 0.65, 16], [915, 0.20, 8], [827, 0.35, 8]];
  const compuesto = [[3380, 0.32, 140], [2925, 0.16, 40], [1730, 0.07, 14], [1720, 0.05, 12], [1607, 0.14, 10], [1508, 0.35, 9], [1425, 0.05, 14], [1372, 0.05, 12], [1248, 0.36, 14], [1160, 0.10, 12], [1055, 0.40, 22], [1030, 0.42, 12], [827, 0.20, 8]];
  root.FTIR_EJEMPLOS = [
    build('SINTÉTICO · Fique crudo', fibraCruda, 11, 0.004, 0.02),
    build('SINTÉTICO · Fique tratado NaOH', fibraNaOH, 12, 0.004, 0.02),
    build('SINTÉTICO · Óxido de grafeno', go, 13, 0.004, 0.03),
    build('SINTÉTICO · Resina epóxica', epoxi, 14, 0.004, 0.015),
    build('SINTÉTICO · Compuesto fique+epoxi+GO', compuesto, 15, 0.004, 0.02)
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = root.FTIR_EJEMPLOS;
})(typeof window !== 'undefined' ? window : globalThis);
