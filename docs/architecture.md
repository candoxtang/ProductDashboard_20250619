# Application Architecture

This document describes the architecture of the Product Costing Dashboard.

## Core Philosophy

The application is designed as a **client-side, single-page application (SPA)**. It has no server-side backend and requires no build process. The architecture prioritizes simplicity, modularity, and a clear separation of concerns between data, utilities, and UI rendering. The application is event-driven.

## Architectural Layers

The application can be broken down into three main layers:

### 1. Data Layer

The data layer is responsible for generating and providing all the data needed for the application.

-   **`js/data-source.js`**: This is the heart of the data layer. It programmatically generates realistic mock data for all dashboards. Upon completion, it populates the global `window.appData` object and dispatches the `dataReady` event, which signals the rest of the application to initialize.
-   **`js/data-generators.js`**: Contains supplemental functions for generating more complex datasets, like WIP trends and scrap data.
-   **`js/new_costing_data.js`**: This file contains large, static data structures (like MES step definitions) that are used as inputs for the data generation process.

### 2. Utility Layer

The utility layer provides shared, reusable functions that are used by the presentation layer to process data and render charts.

-   **`js/date-utils.js`**: Contains functions for all date-related operations, data aggregation, and filtering based on user selections from the global filter bar.
-   **`js/chart-utils.js`**: Contains helper functions specifically for charts, including a shared color palette, number formatters, and functions to apply consistent styling and manage chart instances.

### 3. Presentation Layer

The presentation layer is responsible for rendering the UI, including all charts and interactive elements for each dashboard tab.

-   **`index.html`**: The single HTML file that defines the skeleton of the application, including the navigation tabs and the `<canvas>` elements that will contain the charts.
-   **`css/style.css`**: Provides the visual styling for the application.
-   **Dashboard-Specific Scripts**: Each dashboard tab has its own dedicated JavaScript file that controls its UI and logic. These scripts listen for the `dataReady` and `globalFiltersChanged` events, and then use the utility layer to process and display data.
    -   `js/main.js`: The main controller. It handles top-level UI like tab switching and calls the `initialize` function for the appropriate dashboard module when a tab is selected.
    -   `js/global-filters.js`: Manages the state of the global filter bar and dispatches the `globalFiltersChanged` event.
    -   `js/org-costing.js`: Manages the "Organizational Costing Overview" dashboard.
    -   `js/manufacturing-dashboard.js` (formerly `charts.js`): Manages the "Manufacturing & Production" dashboard.
    -   `js/quality-dashboard.js`: Manages the "Quality & Process" dashboard.
    -   `js/material-analysis.js`: Manages the "Material Analysis" dashboard.
    -   `js/cost-category-analysis.js`: Manages the "Cost Category Analysis" dashboard.

## Communication

The layers communicate in a unidirectional, event-driven flow. The **Data Layer** generates data and fires the `dataReady` event. The **Presentation Layer** modules listen for this event, and then use the **Utility Layer** to transform the raw data into charts and UI elements. When the user interacts with filters, the `globalFiltersChanged` event is fired, and the Presentation Layer modules react by updating their state. This approach decouples the components and ensures that no part of the application attempts to render before the data is available. 