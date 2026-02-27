# React + Vite + PWA Coin Catalog

Este es un proyecto de Catálogo de Monedas PWA (Progressive Web App) construido con React, Vite, Tailwind CSS, Dexie.js (IndexedDB) y la API de Google Gemini para análisis de imágenes.

## Historial de Desarrollo y Planes

A continuación se detalla el historial de cambios, Pull Requests y planes ejecutados durante el desarrollo del proyecto:

### 1. Configuración Inicial y Despliegue (Fases 1-4)
**Objetivo:** Crear una SPA "mobile-first" instalable como PWA para catalogar monedas, 100% estática y alojada en GitHub Pages.
- **Cambios:**
    - Inicialización de proyecto Vite con React y Tailwind CSS.
    - Configuración de `vite-plugin-pwa` para soporte offline e instalación.
    - Implementación de base de datos local Dexie.js (`CoinCatalog`).
    - Creación de vistas: Home (grid), AddCoin (captura de cámara), CoinDetail, Settings.
    - Integración de `gemini-1.5-flash` para extracción de datos (País, Año, Denominación, Ceca).
    - Configuración de GitHub Actions (`deploy.yml`) para despliegue automático a `gh-pages`.
    - Ajuste de `base: '/monedas/'` en `vite.config.js`.

### 2. Fix: Error de Modelo Gemini (v1.0.0)
**Problema:** La API devolvía un error "model not found" al usar `gemini-1.5-flash`.
- **Plan:** Actualizar el nombre del modelo a una versión válida en la API v1beta.
- **Cambios:**
    - Se cambió el modelo en `src/utils/gemini.js` a `gemini-1.5-flash-latest`.
    - Se actualizó el texto del botón de valoración a "Comprobar Valor Especial" para mayor claridad.

### 3. Mejora: Upgrade a Gemini 1.5 Pro (v1.0.1)
**Solicitud:** El usuario comentó que el modelo Flash era "muy antiguo" y quería mejorar la precisión.
- **Plan:** Usar un modelo más capaz para el análisis de imágenes desgastadas.
- **Cambios:**
    - Se actualizó `src/utils/gemini.js` para usar `gemini-1.5-pro`, el modelo más inteligente disponible en la capa gratuita de Google AI Studio.

### 4. Fix: Problemas de Caché PWA y Cambio a Gemini 2.0 Flash (v1.0.1)
**Problema:** La aplicación en móviles seguía usando la versión antigua (modelo 1.5) debido al Service Worker, a pesar de los cambios en el código.
- **Plan:** Forzar la actualización del Service Worker y probar un modelo más rápido.
- **Cambios:**
    - Configuración de `vite-plugin-pwa`: `registerType: 'autoUpdate'`, `skipWaiting: true`, `clientsClaim: true`.
    - Se cambió temporalmente a `gemini-2.0-flash` como intento de mejora.
    - Se añadió un indicador de versión en `Settings.jsx` (v1.0.1) para depuración.

### 5. Configuración de Modelo Específico: Gemini 3 Flash (v1.0.2)
**Solicitud:** El usuario solicitó explícitamente usar `gemini-3-flash`.
- **Cambios:**
    - Actualización de la llamada a la API en `gemini.js` para usar el identificador `gemini-3-flash`.
    - Actualización del indicador de versión a v1.0.2.

### 6. Configuración de Modelo Específico: Gemini 3.1 Flash Image Preview (v1.0.3)
**Solicitud:** El usuario encontró y solicitó usar el modelo `gemini-3.1-flash-image-preview`.
- **Cambios:**
    - Actualización de `gemini.js` al nuevo identificador de modelo.
    - Actualización del indicador de versión a v1.0.3.

### 7. Configuración de Modelo Específico: Gemini 3 Flash Preview (v1.0.4)
**Solicitud:** El usuario solicitó usar `gemini-3-flash-preview` por tener "más tokens".
- **Cambios:**
    - Actualización final de `gemini.js` al modelo `gemini-3-flash-preview`.
    - Actualización del indicador de versión a v1.0.4.

---

## Cómo Ejecutar Localmente

1. Clonar el repositorio.
2. `npm install`
3. `npm run dev`

## Cómo Desplegar

El despliegue es automático mediante GitHub Actions al hacer push a la rama `main`. Asegúrate de que en la configuración del repositorio > Pages, la fuente esté configurada como "GitHub Actions".
