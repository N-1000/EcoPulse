# Imágenes estáticas — Tangara 2026

Esta carpeta guarda las imágenes que se muestran tal cual en la interfaz.
Vite las sirve desde la raíz del sitio, así que un archivo aquí llamado
`foto.jpg` se referencia en el código como `/images/foto.jpg`.

## Imagen del banner principal (hero)

- **Nombre exacto:** `hero-mural.jpg`
- **Ruta final:** `public/images/hero-mural.jpg`
- **Dónde aparece:** banner "Así está el aire en Cali hoy" de la página de inicio.

En cuanto coloques el archivo con ese nombre, el banner usará tu foto
automáticamente (no hay que tocar código). Mientras el archivo no exista, se
muestra una recreación artística en SVG como respaldo.

Recomendaciones para que se vea bien:
- Formato horizontal y panorámico (la del mural del Túnel Mundialista va perfecta).
- Ancho ≥ 1600 px para que no se vea pixelada en pantallas grandes.
- Formatos aceptados: `.jpg`, `.png` o `.webp` (si usas otro nombre/extensión,
  actualiza la ruta en `src/components/dashboard/HeroBanner.tsx`).

> Nota: si tu imagen ya trae incrustado el logo "Inteligencia Ambiental Urbana /
> Cali - Valle del Cauca", el logo que la app dibuja encima se oculta solo para
> no duplicarlo.

## Cómo agregar otras imágenes

1. Copia el archivo en esta carpeta (`public/images/`).
2. Referéncialo en el código como `/images/tu-archivo.ext`.
