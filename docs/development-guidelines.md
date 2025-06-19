# Development Guidelines

This document provides guidelines and best practices for developing and maintaining the Product Costing Dashboard.

## Core Principles

-   **Follow the Existing Architecture**: Before adding new features, understand the established architectural layers (Data, Utility, Presentation) and the event-driven data flow. New code should fit within this structure.
-   **No Backend, No Build Step**: The project is intentionally simple. Do not add any server-side dependencies or complex build tools unless absolutely necessary.
-   **Modularity**: Keep code in its appropriate file. Data generation belongs in `data-source.js`, shared chart helpers go in `chart-utils.js`, date logic goes in `date-utils.js`, and dashboard-specific logic belongs in its own file (e.g., `js/charts.js`).

## The Event-Driven Model

This is the most important concept to understand.

1.  **NEVER access `window.appData` directly on page load.** It will be undefined.
2.  **ALWAYS wrap your code in a `dataReady` event listener.** This is the only safe way to ensure the data you need exists.

**Correct Implementation:**
```javascript
document.addEventListener('dataReady', () => {
    // Your code here. It's now safe to use window.appData
    const wipData = window.appData.productWipTrend;
    // ... initialize charts ...
});
```

## Adding or Modifying Charts

-   **Use the Utilities**: Do not write custom logic for aggregation, date filtering, or color selection if a utility function already exists in `date-utils.js` or `chart-utils.js`.
-   **Follow Design Rules**: Adhere to the rules in `.cursor/rules/styling-and-design.mdc`.
    -   Use the shared color palette from `chart-utils.js`.
    -   Use the `getProductColor` pattern for consistent product colors.
    -   Use the `fabPointStyles` for consistent fab shapes.
    -   **Trend charts must not have legends.**
-   **Performance**: Be mindful of performance. The `getAggregatedData` function is designed to be fast, but avoid creating complex, multi-level loops in the presentation layer.

## Coding Style

-   **JavaScript**: Follow modern ES6+ syntax. Use `const` by default and `let` only when a variable needs to be reassigned.
-   **Formatting**: Maintain a consistent code style. Use 4-space indentation for JavaScript and 2-space for HTML/CSS.
-   **Commenting**: Add comments to explain *why* something is done, not *what* is being done. The code should be self-explanatory for the "what".

## Global Filters

The global filter bar is managed by `js/global-filters.js`. When a filter changes, it dispatches a `globalFiltersChanged` custom event. Any component that needs to update based on these filters should listen for this event.

**Example:**
```javascript
document.addEventListener('globalFiltersChanged', () => {
    // Re-render or update charts based on the new window.globalFilters object
    updateAllMyCharts();
});
```

By following these guidelines, we can ensure the project remains clean, maintainable, and easy for future developers to understand. 