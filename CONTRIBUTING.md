# Project Development Guide

This document outlines the key architectural patterns, data flow, and initialization sequences for the PDF Operational Product Costing dashboard. Adhering to these guidelines is crucial for maintaining stability and preventing common errors.

---

## 1. Project Structure

The application is a single-page dashboard. Its structure is defined by a few key files and a consistent pattern for each tab.

-   **`[index.html](mdc:index.html)`**: The main and only HTML file. It contains the static layout for all dashboard tabs and includes all necessary CSS and JavaScript files.
-   **`[css/style.css](mdc:css/style.css)`**: The single global stylesheet for the entire application.
-   **`[js/main.js](mdc:js/main.js)`**: Handles top-level logic, primarily tab switching and the critical chart initialization sequence.

### Tab-Specific Logic

Each major tab in the dashboard has its own dedicated JavaScript file that controls its unique behavior, data aggregation, and chart rendering.

-   **Organizational Costing Overview**: `[js/org-costing.js](mdc:js/org-costing.js)`
-   **Manufacturing & Production**: `[js/charts.js](mdc:js/charts.js)`
-   **Quality & Process**: `[js/quality-dashboard.js](mdc:js/quality-dashboard.js)`
-   **Material Analysis**: `[js/material-analysis.js](mdc:js/material-analysis.js)`
-   **Cost Category Analysis**: `[js/cost-category-analysis.js](mdc:js/cost-category-analysis.js)`
-   **Actual Cost Config**: `[js/cost-configuration.js](mdc:js/cost-configuration.js)`

---

## 2. Data Flow & Script Dependencies

The application's data generation and script loading order are critical. An incorrect order will lead to "missing dependency" or `undefined` errors. The correct loading order is defined at the bottom of `[index.html](mdc:index.html)`.

The dependency chain is as follows:

1.  **`[js/main.js](mdc:js/main.js)`**: Must be loaded first, as it provides the `ensureChartsAreReady` function used by all other chart scripts.
2.  **`[js/costing_data.js](mdc:js/costing_data.js)`**: Contains raw, static data (e.g., lists of MES/SAP steps). It has no dependencies.
3.  **`[js/cost-configuration.js](mdc:js/cost-configuration.js)`**: Depends on `costing_data.js`. It generates cost objects and makes some data globally available for other scripts.
4.  **`[js/data.js](mdc:js/data.js)`**: This is the main data aggregation and generation file. It **depends on `costing_data.js` and `cost-configuration.js`** and must be loaded after them. It exposes several large data objects (`orgCostingData`, `qualityData`, etc.) for the various dashboard tabs.
5.  **Tab-Specific Scripts**: All other scripts (`charts.js`, `org-costing.js`, etc.) can be loaded after the core data files.

---

## 3. Chart Initialization Sequence

To solve persistent race condition errors between our scripts and the Chart.js library loaded from a CDN, we established a mandatory initialization pattern.

### The `ensureChartsAreReady` Guard

**All chart-rendering logic must be wrapped in the `window.ensureChartsAreReady(callback)` function.**

This function, defined in `[js/main.js](mdc:js/main.js)`, guarantees that Chart.js and its datalabels plugin are fully loaded and registered before any code that creates a chart is executed. It prevents `TypeError` and `ReferenceError` issues on page load.

**Example Usage (from `[js/org-costing.js](mdc:js/org-costing.js)`):**
```javascript
document.addEventListener('DOMContentLoaded', function () {
    window.ensureChartsAreReady(() => {
        // All chart initialization and event listener setup
        // for this tab goes inside this callback.
        ...
    });
});
```
This pattern is the definitive solution to the initialization errors we encountered and must be used for any new chart-related features.

# Contributing to the Operational Product Costing Dashboard

This document outlines the key design principles, coding patterns, and formatting rules to ensure consistency and prevent regressions in the dashboard.

## 1. Page Layout and Sizing Principles

To avoid breaking the visual layout of the application, please adhere to the following rules for each specified page.

### 1.1. Organizational Costing Overview (`org-costing-overview`)

-   **Layout:** The main chart area (`.org-chart-container`) uses a responsive CSS Grid: `grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));`.
-   **Behavior:** This allows the three main analysis panels to wrap gracefully on smaller screens, preventing horizontal overflow. New top-level panels added to this page should be placed within this container to maintain responsiveness.

### 1.2. Quality & Process (`quality`)

-   **Layout:** This page uses a row-based flexbox layout. Each major horizontal section is a `<div class="quality-row">`.
-   **Structure:**
    -   **Row 1 (Trends):** Contains three charts, each wrapped in a `<div class="quality-card quality-card-third">`. The `flex-basis` for this class is `calc(33.333% - 1rem)`.
    -   **Rows 2 & 3 (Analysis):** Contain two components each, wrapped in `<div class="quality-card quality-card-half">`. The `flex-basis` for this class is `calc(50% - 0.75rem)`.
-   **Responsiveness:** On smaller screens (`@media (max-width: 992px)`), `.quality-row` is set to `flex-direction: column` to stack the components vertically.

### 1.3. Cost Category Analysis (`cost-category-analysis`)

-   **Layout:** The page is a flexbox column (`.category-analysis-container`) designed to prioritize the details grid.
-   **Sizing:**
    -   The top charts container (`#analysis-charts-grid`) has a reduced height (`min-height: 250px` on its chart containers).
    -   The details grid container (`.details-grid-container`) is set to `flex-grow: 1` to consume all remaining vertical space. The actual table content scrolls (`overflow-y: auto`) while the headers and filter bar remain fixed.
-   **Goal:** This ensures the data grid is always maximized, providing the largest possible viewing area without page-level scrolling.

## 2. Chart Formatting Rules

### 2.1. Trend Charts (Line Charts)

-   **Legends:** **DO NOT** use standard legends (`legend: { display: false }`).
-   **Labels:** All trend charts MUST use on-trace labels via the `chartjs-plugin-datalabels`.
-   **Configuration:** The label should be placed in the **middle** of the line, not at the end. It should be centered with a semi-transparent white background to ensure readability.
-   **Example `datalabels` config:**
    ```javascript
    datalabels: {
        formatter: (value, context) => {
            const midPoint = Math.floor(context.dataset.data.length / 2);
            return context.dataIndex === midPoint ? context.dataset.label : null;
        },
        align: 'center',
        anchor: 'center',
        font: { weight: 'bold' },
        color: (context) => context.dataset.borderColor,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 4,
        padding: 4
    }
    ```

## 3. Data Grid Standards

The "Cost Category Analysis" details view is the standard for data grids.

-   **Filtering:** The grid should have a text input with the ID `#details-grid-filter`. The filtering logic should be case-insensitive and check against all values in a row.
-   **Sorting:** Table headers (`<th>`) should be clickable to trigger sorting.
    -   Clicking a new column sorts it in ascending (`asc`) order.
    -   Clicking the same column again toggles the direction (`asc` -> `desc`).
    -   The current sort state (column and direction) should be visually indicated with an icon (e.g., ▲ or ▼).
-   **Number Formatting:** All numeric data, especially currency and units, should be formatted for readability. Use a helper function to standardize the formatting.
    -   **Example:**
        ```javascript
        function formatCell(value, header) {
            if (header.toLowerCase().includes('cost') || header.toLowerCase().includes('variance')) {
                return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
            }
            if (header.toLowerCase().includes('unit')) {
                return value.toLocaleString();
            }
            return value;
        }
        ```

## 4. JavaScript and Initialization

-   **Lazy Initialization:** Each tab's primary JavaScript should be initialized via a `MutationObserver` that watches for the `active` class on the tab's main content `div`. This prevents charts from trying to render in hidden tabs, which causes errors.
-   **Data Separation:** Keep data generation logic (e.g., in `js/data.js` and `js/costing_data.js`) separate from the chart rendering and page logic (e.g., `js/org-costing.js`, `js/quality-dashboard.js`, etc.). This makes the code easier to maintain and debug. 