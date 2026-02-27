# React + Vite + PWA Coin Catalog

Este es un proyecto de Catálogo de Monedas PWA (Progressive Web App) construido con React, Vite, Tailwind CSS, Dexie.js (IndexedDB) y la API de GitHub Models (Llama 3.2 Vision) para análisis de imágenes.

## Historial de Desarrollo y Planes

A continuación se detalla el historial de cambios, Pull Requests y planes ejecutados durante el desarrollo del proyecto:

### 1. Configuración Inicial y Despliegue (Fases 1-4)
**Objetivo:** Crear una SPA "mobile-first" instalable como PWA para catalogar monedas, 100% estática y alojada en GitHub Pages.
- **Cambios:**
    - Inicialización de proyecto Vite con React y Tailwind CSS.
    - Configuración de `vite-plugin-pwa` para soporte offline e instalación.
    - Implementación de base de datos local Dexie.js (`CoinCatalog`).
    - Creación de vistas: Home (grid), AddCoin (captura de cámara), CoinDetail, Settings.
    - Integración inicial de Gemini para extracción de datos.
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
    - Se actualizó `src/utils/gemini.js` para usar `gemini-1.5-pro`.

## Changelog

### 2025-05-18 - Feature: Data Management (Export/Import/Reset)

**Description:**
Implemented functionality to export the entire coin database (including images) to a compressed ZIP file, import data from ZIP backups with deduplication, and reset the database with a safety confirmation.

**Plan:**
1.  **Created `src/utils/dataUtils.js`:**
    *   Implemented `exportDatabase` using `jszip`.
    *   Implemented `importDatabase` with deduplication logic.
    *   Implemented `clearDatabase` for resetting data.
2.  **Updated `src/db.js`:**
    *   Updated database version to 2 with `uuid` index.
3.  **Updated `src/pages/Settings.jsx`:**
    *   Added buttons for "Exportar", "Importar", and "Restablecer Base de Datos".
    *   Implemented progress indicators and confirmation modals.

### 2025-05-18 - Feature: Auto-crop coin images using AI detection

**Description:**
Enhanced the coin addition process by automatically detecting the coin's bounding box and cropping the image.

**Plan:**
1.  **Modified AI Logic:**
    *   Added `detectCoinBoundingBox` function.
    *   Initially used Gemma 3 27B IT, but later migrated to Llama 3.2 Vision via GitHub Models.
2.  **Created `src/utils/imageProcessing.js`:**
    *   Implemented `cropImage` utility.
3.  **Updated `src/pages/AddCoin.jsx`:**
    *   Integrated detection and cropping steps into the coin analysis workflow.

### 2025-05-18 - Improvement: Switch to GitHub Models (Llama 3.2 Vision)

**Description:**
Replaced Google Gemini with **Llama 3.2 11B Vision Instruct** via GitHub Models to improve image cropping accuracy and metadata extraction.

**Plan:**
1.  **Refactor `src/utils/aiModel.js`:**
    *   Replaced `gemini.js` with `aiModel.js`.
    *   Updated API calls to use the OpenAI-compatible endpoint (`https://models.inference.ai.azure.com`).
    *   Updated prompt engineering to support Llama 3.2 Vision's response format.
2.  **Update Settings:**
    *   Changed "Google Gemini API Key" to "GitHub Personal Access Token" in `src/pages/Settings.jsx`.
    *   Updated local storage key to `GITHUB_TOKEN`.
3.  **Clean Up:**
    *   Removed legacy Gemini code.
    *   Updated all imports in `AddCoin.jsx` and `CoinDetail.jsx`.

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
