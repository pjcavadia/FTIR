/* Base de bandas FTIR — cada entrada lleva su(s) referencia(s).
 * Campos: min/max (cm-1), grupo, componente, material, clave (banda diagnóstica), refs, nota.
 * Materiales: "fibra" | "go" | "epoxi" | "artefacto"
 * IMPORTANTE: los rangos se tomaron de los artículos citados (ver REFS). Verifica cada valor
 * contra el PDF original antes de citarlo en la tesis. Puedes agregar bandas propias desde la interfaz. */
window.FTIR_REFS = {
  P: {
    corto: 'Compilación FTIR de fibras naturales (U. Plymouth)',
    completo: 'FTIR spectral bands for natural fibres. Compilación en línea, University of Plymouth. La numeración [1]–[10] de su tabla remite a artículos originales; consúltalos allí antes de citarlos.',
    url: 'https://ecm-academics.plymouth.ac.uk/jsummerscales/mats347/FTIR_of_natural_fibres.htm',
    verificado: 'Tabla leída completa; fuentes primarias pendientes de revisar.'
  },
  J: {
    corto: 'Javier-Astete et al. (2021)',
    completo: 'Javier-Astete R., Jimenez-Davalos J., Zolla G. (2021). Determination of hemicellulose, cellulose, holocellulose and lignin content using FTIR in Calycophyllum spruceanum and Guazuma crinita. PLoS ONE 16(10): e0256559.',
    url: 'https://doi.org/10.1371/journal.pone.0256559',
    verificado: 'Bandas leídas del texto (madera, no fique).'
  },
  Z: {
    corto: 'Zhao, Ding & Yu (2018)',
    completo: 'Zhao H., Ding J., Yu H. (2018). Variation of mechanical and thermal properties in sustainable graphene oxide/epoxy composites. Scientific Reports 8, 16676.',
    url: 'https://doi.org/10.1038/s41598-018-34976-6',
    verificado: 'Bandas leídas del texto (epoxi bio-basado BFDE + GO).'
  },
  W: {
    corto: 'Effect of GO in a Bio-Epoxy Composite (2021)',
    completo: 'Effect of Graphene Oxide as a Reinforcement in a Bio-Epoxy Composite. Journal of Composites Science 2021, 5(3), 91.',
    url: 'https://doi.org/10.3390/jcs5030091',
    verificado: 'Bandas leídas del texto; falta confirmar la lista de autores para la cita formal.'
  },
  G: {
    corto: 'Conocimiento general (sin cita verificada)',
    completo: 'Valores de uso común en espectroscopía IR (CO2 atmosférico, cristal ATR de diamante). No se contrastaron con una fuente en esta versión: cítalos con un texto de referencia (p. ej. Socrates, Infrared and Raman Characteristic Group Frequencies) tras verificarlos.',
    url: '',
    verificado: 'NO verificado.'
  }
};

window.FTIR_BANDAS = [
  /* ================= FIBRA NATURAL (celulosa / hemicelulosa / lignina) ================= */
  { min: 3100, max: 3600, grupo: 'O–H estiramiento (enlaces de H intra/intermoleculares)', componente: 'Polisacáridos (celulosa/hemicelulosa)', material: 'fibra', clave: false, refs: ['P'], nota: 'Banda ancha; también aparece con agua adsorbida, lignina y GO. No es diagnóstica por sí sola.' },
  { min: 2860, max: 2960, grupo: 'C–H estiramiento (CH, CH₂)', componente: 'Polisacáridos (celulosa/hemicelulosa)', material: 'fibra', clave: false, refs: ['P'], nota: 'P lista 2955–2935 (C–H), 2900, 2887 y 2862 (CH₂).' },
  { min: 2846, max: 2854, grupo: 'CH₂ simétrico (ceras)', componente: 'Ceras / pectinas', material: 'fibra', clave: false, refs: ['P'], nota: 'Reportado en ceras de cáñamo (2850).' },
  { min: 1724, max: 1740, grupo: 'C=O (acetilo, ácido carboxílico, éster no conjugado)', componente: 'Hemicelulosa', material: 'fibra', clave: true, refs: ['P', 'J'], nota: 'Tiende a disminuir o desaparecer con tratamiento alcalino (NaOH). En J: 1730–1733 (hemicelulosa).' },
  { min: 1620, max: 1650, grupo: 'H–O–H flexión (agua adsorbida)', componente: 'Agua adsorbida', material: 'fibra', clave: true, refs: ['P'], nota: 'P: 1635, 1630–1650, 1623.' },
  { min: 1590, max: 1610, grupo: 'Anillo aromático', componente: 'Lignina', material: 'fibra', clave: false, refs: ['P', 'J'], nota: 'P: 1595; J: 1603.' },
  { min: 1502, max: 1518, grupo: 'C=C aromático (esqueleto)', componente: 'Lignina', material: 'fibra', clave: true, refs: ['P', 'J'], nota: 'P: 1502–1506; J: 1508–1518. Puede desaparecer en fibras deslignificadas.' },
  { min: 1452, max: 1462, grupo: 'C–H deformación / CH₂ flexión / O–H en el plano', componente: 'Polisacáridos + lignina', material: 'fibra', clave: false, refs: ['P'], nota: '' },
  { min: 1420, max: 1432, grupo: 'CH₂ flexión simétrica / COO⁻', componente: 'Celulosa / pectinas', material: 'fibra', clave: false, refs: ['P'], nota: 'Sensible a cristalinidad de la celulosa (P: 1423–1425).' },
  { min: 1362, max: 1376, grupo: 'C–H flexión en el plano', componente: 'Celulosa', material: 'fibra', clave: true, refs: ['P', 'J'], nota: 'P: 1362–1375; J: 1371–1373 (holocelulosa).' },
  { min: 1330, max: 1340, grupo: 'C–O anillo aromático / O–H deformación en el plano', componente: 'Celulosa / lignina', material: 'fibra', clave: false, refs: ['P'], nota: 'Asignación ambigua entre autores.' },
  { min: 1312, max: 1320, grupo: 'CH₂ aleteo (wagging) / balanceo (rocking)', componente: 'Celulosa', material: 'fibra', clave: true, refs: ['P', 'J'], nota: 'P: 1314–1317; J: 1318.' },
  { min: 1270, max: 1280, grupo: 'Anillo guayacilo (lignina)', componente: 'Lignina', material: 'fibra', clave: false, refs: ['P'], nota: 'Citado para yute y sisal.' },
  { min: 1236, max: 1252, grupo: 'C–O de acetilo / C–O aril', componente: 'Hemicelulosa', material: 'fibra', clave: true, refs: ['P', 'J'], nota: 'P: 1240–1250; J: 1239–1244. También C–O aril de lignina (1240). Se solapa con epoxi (1248).' },
  { min: 1198, max: 1206, grupo: 'C–O–C simétrico / O–H en el plano', componente: 'Celulosa / hemicelulosa', material: 'fibra', clave: false, refs: ['P'], nota: '' },
  { min: 1148, max: 1164, grupo: 'C–O–C asimétrico (puente glicosídico)', componente: 'Celulosa', material: 'fibra', clave: true, refs: ['P', 'J'], nota: 'P: 1150–1162; J: 1150–1152.' },
  { min: 1097, max: 1107, grupo: 'C–O–C estiramiento (glicosídico)', componente: 'Holocelulosa', material: 'fibra', clave: false, refs: ['P', 'J'], nota: 'P: 1105; J: 1099–1104.' },
  { min: 1044, max: 1062, grupo: 'C–O / C–OH estiramiento (alcohol secundario; anillo)', componente: 'Celulosa', material: 'fibra', clave: true, refs: ['P'], nota: 'Se solapa con GO (1050–1057).' },
  { min: 1018, max: 1034, grupo: 'C–O–C / C–OH primario', componente: 'Celulosa', material: 'fibra', clave: true, refs: ['P', 'J'], nota: 'P: 1020–1025; J: 1024–1032.' },
  { min: 890, max: 902, grupo: 'Enlace β-glicosídico (C1–H deformación)', componente: 'Celulosa', material: 'fibra', clave: true, refs: ['P', 'J'], nota: 'P: 895–900; J: 897. Su intensidad se relaciona con la cristalinidad (P).' },
  { min: 826, max: 834, grupo: 'C–H aromático fuera del plano', componente: 'Lignina', material: 'fibra', clave: false, refs: ['P'], nota: 'Citado en yute (830). Se solapa con epoxi (827).' },
  { min: 650, max: 700, grupo: 'O–H fuera del plano', componente: 'Polisacáridos (celulosa/hemicelulosa)', material: 'fibra', clave: false, refs: ['P'], nota: 'P: 662–670 (C–OH).' },

  /* ================= ÓXIDO DE GRAFENO ================= */
  { min: 3400, max: 3600, grupo: 'O–H estiramiento (hidroxilo)', componente: 'Óxido de grafeno', material: 'go', clave: true, refs: ['W'], nota: 'W también reporta ~3200 (agua adsorbida).' },
  { min: 1720, max: 1745, grupo: 'C=O (–COOH)', componente: 'Óxido de grafeno', material: 'go', clave: true, refs: ['W', 'Z'], nota: 'Z: 1725 en GO; baja a ~1720 al formarse enlace C–O con la resina (evidencia de injerto covalente).' },
  { min: 1618, max: 1626, grupo: 'C=C esqueleto grafítico / agua adsorbida', componente: 'Óxido de grafeno', material: 'go', clave: true, refs: ['W'], nota: 'W: 1620–1622.' },
  { min: 1200, max: 1237, grupo: 'C–OH de grupos carboxílicos', componente: 'Óxido de grafeno', material: 'go', clave: true, refs: ['W'], nota: 'Se solapa con hemicelulosa (1240).' },
  { min: 1050, max: 1057, grupo: 'C–O / C–C esqueleto (carbonilo, carboxilo, epoxi)', componente: 'Óxido de grafeno', material: 'go', clave: true, refs: ['W'], nota: 'Se solapa fuertemente con la celulosa (1044–1062).' },
  { min: 636, max: 644, grupo: 'Deformación simétrica del anillo epóxido (GO)', componente: 'Óxido de grafeno', material: 'go', clave: false, refs: ['W'], nota: '' },

  /* ================= RESINA EPÓXICA ================= */
  { min: 3390, max: 3405, grupo: 'O–H estiramiento (hidroxilo)', componente: 'Resina epóxica', material: 'epoxi', clave: false, refs: ['W'], nota: 'W: 3397.' },
  { min: 3045, max: 3055, grupo: 'C–H del anillo oxirano', componente: 'Resina epóxica', material: 'epoxi', clave: false, refs: ['W'], nota: 'W: 3050.' },
  { min: 1600, max: 1612, grupo: 'Anillo bencénico', componente: 'Resina epóxica', material: 'epoxi', clave: true, refs: ['W'], nota: 'W: 1607. Se solapa con lignina (1590–1610).' },
  { min: 1576, max: 1584, grupo: 'Anillo bencénico', componente: 'Resina epóxica', material: 'epoxi', clave: false, refs: ['W'], nota: 'W: 1580.' },
  { min: 1504, max: 1512, grupo: 'Anillo bencénico', componente: 'Resina epóxica', material: 'epoxi', clave: true, refs: ['W'], nota: 'W: 1508. Se solapa con lignina (1502–1518).' },
  { min: 1244, max: 1252, grupo: 'Estiramiento simétrico del anillo epóxido / éter aril', componente: 'Resina epóxica', material: 'epoxi', clave: true, refs: ['W'], nota: 'W: 1248. Se solapa con hemicelulosa (1240–1250).' },
  { min: 1252, max: 1260, grupo: 'C–O–C formado en el injerto GO–resina', componente: 'Injerto GO–epoxi', material: 'epoxi', clave: false, refs: ['Z'], nota: 'Z: 1256. Indicio de enlace covalente.' },
  { min: 1076, max: 1084, grupo: 'Éter (BFDE, epoxi bio-basado)', componente: 'Resina epóxica', material: 'epoxi', clave: false, refs: ['Z'], nota: 'Z: 1080; específico de la resina BFDE.' },
  { min: 910, max: 920, grupo: 'Anillo oxirano (epóxido)', componente: 'Resina epóxica', material: 'epoxi', clave: true, refs: ['Z'], nota: 'Z: 915. Desaparece al reaccionar/curar (o con GO): sirve para seguir el curado.' },
  { min: 930, max: 940, grupo: 'C–O del grupo epoxi', componente: 'Resina epóxica', material: 'epoxi', clave: false, refs: ['W'], nota: 'W: 935.' },
  { min: 824, max: 830, grupo: 'C–H aromático fuera del plano', componente: 'Resina epóxica', material: 'epoxi', clave: true, refs: ['W'], nota: 'W: 827.' },
  { min: 790, max: 800, grupo: 'Anillo furano / éter (BFDE)', componente: 'Resina epóxica', material: 'epoxi', clave: false, refs: ['Z'], nota: 'Z: 795; específico de BFDE.' },

  /* ================= ARTEFACTOS ================= */
  { min: 2325, max: 2380, grupo: 'CO₂ atmosférico', componente: 'Artefacto', material: 'artefacto', clave: false, refs: ['G'], nota: 'Restar fondo (background) nuevo. NO es de la muestra.' },
  { min: 1900, max: 2300, grupo: 'Absorción del cristal ATR de diamante', componente: 'Artefacto', material: 'artefacto', clave: false, refs: ['G'], nota: 'Débil y ancha; depende del equipo. NO es de la muestra.' }
];
