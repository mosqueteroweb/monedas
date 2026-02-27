# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

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
