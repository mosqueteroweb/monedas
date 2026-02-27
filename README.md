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

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Changelog

### 2025-05-18 - Feature: Data Management (Export/Import/Reset)

**Description:**
Implemented functionality to export the entire coin database (including images) to a compressed ZIP file, import data from ZIP backups with deduplication, and reset the database with a safety confirmation.

**Plan:**
1.  **Created `src/utils/dataUtils.js`:**
    *   Implemented `exportDatabase` using `jszip` to create a ZIP containing JSON data and Base64-encoded images.
    *   Implemented `importDatabase` to parse the ZIP, extract data, and insert new records into Dexie.js.
    *   Implemented deduplication logic using a new `uuid` field to avoid importing existing coins.
    *   Implemented `clearDatabase` for resetting data.
    *   Added progress reporting callback for long-running operations.

2.  **Updated `src/db.js`:**
    *   Updated database version to 2.
    *   Added `uuid` field to the schema as a unique index.
    *   Added migration script to backfill `uuid` for existing records using `crypto.randomUUID()`.

3.  **Updated `src/pages/Settings.jsx`:**
    *   Added "Gestión de Datos" section.
    *   Added buttons for "Exportar", "Importar", and "Restablecer Base de Datos".
    *   Implemented `isLoading` state and progress bar for export/import actions.
    *   Created a custom confirmation modal for the reset action, requiring the user to type "Borrar".

4.  **Refactoring & Fixes:**
    *   Fixed linting issue in `src/utils/gemini.js` (unused variable).
    *   Fixed `useEffect` dependency and state update issue in `src/components/CoinCard.jsx`.

**PR Title:** Add data export/import with compression and deduplication
**PR Description:** This PR introduces comprehensive data management features to the Settings page. Users can now export their entire coin collection (including images) into a compressed ZIP file. The import functionality allows restoring these backups while automatically preventing duplicates using a new unique `uuid` field added to the database schema. Additionally, a "Reset Database" option is provided with a safety confirmation modal requiring the user to type "Borrar". Progress indicators have been added to enhance the user experience during long-running operations.
