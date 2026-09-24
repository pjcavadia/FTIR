# Fique-GO · Herramientas de caracterización

Herramientas interactivas (HTML + JavaScript, sin servidor) para analizar los espectros de la tesis sobre encofrado permanente de fibra de fique + resina + óxido de grafeno (GO). Todo se procesa en el navegador: los datos no se suben a ningún lado.

| Carpeta | Técnica | Estado |
|---|---|---|
| `ftir/` | FTIR: detección de picos, asignación de grupos funcionales, comparación de espectros | Listo (v0.1) |
| `uvvis/`, `drx/`, `raman/`, `xps/` | — | Pendientes |

## Uso local

Abre `index.html` con doble clic (funciona sin internet) o, si prefieres un servidor local: `python3 -m http.server` y visita `http://localhost:8000`.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (p. ej. `fique-go-espectroscopia`) y sube esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "Herramientas de caracterización: FTIR v0.1"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/fique-go-espectroscopia.git
   git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
3. En un par de minutos estará en `https://TU_USUARIO.github.io/fique-go-espectroscopia/`.

## FTIR

Carga uno o varios espectros (CSV/TXT con columna 1 = número de onda en cm⁻¹, columna 2 = señal; acepta `;`, coma, tabulador o espacio, y coma decimal). Si tu equipo exporta en formato propio (`.spa`, `.spc`, `.jdx`), expórtalo antes a CSV/TXT.

Flujo: conversión a absorbancia (si hace falta) → suavizado Savitzky–Golay → línea base (banda elástica o lineal) → normalización → detección de picos por prominencia (y hombros opcionales por 2ª derivada) → asignación contra la base de bandas `ftir/data/bandas.js`, con tolerancia ajustable.

Salidas: tabla de picos con asignaciones candidatas y referencias, evidencia cualitativa por componente (cuántas bandas clave aparecen), consulta manual de números de onda, exportación a PNG/SVG y CSV de picos.

`ftir/data/ejemplos/` contiene CSV **sintéticos** (no son mediciones) para probar el formato.

## Base de bandas y referencias

Cada banda de `ftir/data/bandas.js` indica su referencia. Fuentes usadas en la v0.1:

- **[P]** *FTIR spectral bands for natural fibres*, University of Plymouth (compilación en línea). <https://ecm-academics.plymouth.ac.uk/jsummerscales/mats347/FTIR_of_natural_fibres.htm>
- **[J]** Javier-Astete R., Jimenez-Davalos J., Zolla G. (2021). *Determination of hemicellulose, cellulose, holocellulose and lignin content using FTIR in Calycophyllum spruceanum and Guazuma crinita*. PLoS ONE 16(10): e0256559. <https://doi.org/10.1371/journal.pone.0256559>
- **[Z]** Zhao H., Ding J., Yu H. (2018). *Variation of mechanical and thermal properties in sustainable graphene oxide/epoxy composites*. Sci. Rep. 8, 16676. <https://doi.org/10.1038/s41598-018-34976-6>
- **[W]** *Effect of Graphene Oxide as a Reinforcement in a Bio-Epoxy Composite*. J. Compos. Sci. 2021, 5(3), 91. <https://doi.org/10.3390/jcs5030091> (falta confirmar autores para la cita formal)
- **[G]** Valores generales (CO₂, cristal ATR de diamante): **sin fuente verificada**.

### Advertencias

- Los valores se extrajeron de los textos citados, pero **deben verificarse contra los PDF originales** antes de citarlos en la tesis.
- [P] y [J] tratan yute, cáñamo, lino, sisal y maderas, **no fique**. Falta añadir referencias específicas de *Furcraea* (fique).
- Un solo pico rara vez identifica un compuesto (O–H, C–O y C=O se solapan entre fibra, GO y epoxi). La herramienta propone candidatos; la asignación final es del investigador.
- Puedes añadir tus propias bandas (con su referencia) desde la pestaña *Base de bandas → Importar bandas (.json)*; se guardan en tu navegador.

## Estructura

```
index.html                 página de inicio
assets/css/estilo.css      estilos compartidos
assets/vendor/plotly.min.js  Plotly 4.1.1 (plotly.js-dist-min), licencia MIT
ftir/
  index.html
  js/procesamiento.js      lectura, línea base, suavizado, picos, coincidencias (sin dependencias)
  js/app.js                interfaz
  data/bandas.js           base de bandas con referencias
  data/ejemplos.js         espectros sintéticos de demostración
  data/ejemplos/*.csv      los mismos, como archivos
```
