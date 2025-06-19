# Product Costing Dashboard

## Overview

This project is a single-page web application for visualizing product costing and manufacturing data. It is built with vanilla HTML, CSS, and JavaScript, and uses the Chart.js library for creating interactive charts. The application is designed to be entirely client-side, with all data being dynamically generated in the browser.

## Features

-   **Multiple Dashboards**: Includes views for Manufacturing KPIs, Organizational Costing, and Quality.
-   **Interactive Charts**: All charts are interactive, with tooltips and clickable elements for drilling down into data.
-   **Global Filtering**: Users can filter the entire application view by Fab, Technology, Product, and date range.
-   **Dynamic Data Aggregation**: The application automatically aggregates data based on the selected time period (Day, Week, Month, Quarter, Year).
-   **Client-Side Data**: All data is generated in the browser, making the project highly portable and easy to run without a backend.

## Getting Started

To run this project, you do not need any build steps or dependencies. Simply open the `index.html` file in a modern web browser.

For the best experience, it is recommended to run the project from a local web server to avoid any potential issues with browser security policies regarding local file access. A simple way to do this is with Python:

```bash
# If you have Python 3
python -m http.server
```

Or with Node.js (if you have `http-server` installed):

```bash
npx http-server
```

Then navigate to `http://localhost:8000` (or the appropriate port) in your browser.

## Project Structure

-   `/docs`: Contains all project documentation, including architecture and data flow diagrams.
-   `/css`: Contains the main stylesheet (`style.css`).
-   `/js`: Contains all JavaScript logic, separated into modules for data, utilities, and chart-specific code.
-   `index.html`: The main entry point of the application.

## Development

For development guidelines, including information about the event-driven architecture, data flow, and styling conventions, please refer to the documents in the `/docs` directory. 