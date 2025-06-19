//
// Chart-Utils: A collection of shared functions for chart creation and manipulation
//

// --- Centralized Color Palette ---
const PALETTE = {
    blue: '#0d6efd',
    indigo: '#6610f2',
    purple: '#6f42c1',
    pink: '#d63384',
    red: '#dc3545',
    orange: '#fd7e14',
    yellow: '#ffc107',
    green: '#198754',
    teal: '#20c997',
    cyan: '#0dcaf0',
    gray: '#adb5bd',
    black: '#000000',
    white: '#ffffff'
};

const CHART_COLORS = {
    // Primary palette for most charts
    main: [
        PALETTE.blue,
        PALETTE.teal,
        PALETTE.orange,
        PALETTE.purple,
        PALETTE.yellow,
        PALETTE.cyan,
        PALETTE.indigo
    ],
    // Special colors
    planned: PALETTE.orange,
    actual: PALETTE.green,
    positive_variance: PALETTE.green,
    negative_variance: PALETTE.red,
    wip: PALETTE.orange,
    yield: PALETTE.teal,
    scrap: PALETTE.red,
    rework: PALETTE.yellow,
    selection: PALETTE.black,
    default_bar: PALETTE.blue,
    disabled: 'rgba(200, 200, 200, 0.65)'
};


// --- Centralized Number Formatting ---
const formatCost = (value, currency = 'USD', locale = 'en-US') => {
    if (value === null || value === undefined) return 'N/A';
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    } catch (e) {
        console.error("Error formatting cost:", e);
        return String(value);
    }
};

const formatNumber = (value, decimals = 0) => {
    if (value === null || value === undefined) return 'N/A';
    if (Math.abs(value) >= 1_000_000_000) {
        return (value / 1_000_000_000).toFixed(decimals) + 'B';
    }
    if (Math.abs(value) >= 1_000_000) {
        return (value / 1_000_000).toFixed(decimals) + 'M';
    }
    if (Math.abs(value) >= 1_000) {
        return (value / 1_000).toFixed(decimals) + 'K';
    }
    return value.toFixed(decimals);
};

// --- Chart-Specific Utilities ---

/**
 * Renders a bar chart selection by graying out unselected bars.
 * @param {Chart} chart - The Chart.js instance.
 * @param {string[]} selectedGroups - An array of label strings that should remain selected.
 */
function updateBarSelectionStyle(chart, selectedGroups, defaultColors, forceClear = false) {
    if (!chart || !chart.data || !chart.data.labels) return;

    chart.data.datasets.forEach((dataset, datasetIndex) => {
        // Ensure original colors are stored correctly as an array.
        if (!dataset.originalBackgroundColor || !Array.isArray(dataset.originalBackgroundColor)) {
            // If the provided background color is a single string, create an array from it.
            const bgColor = dataset.backgroundColor || defaultColors[datasetIndex];
            if (typeof bgColor === 'string') {
                dataset.originalBackgroundColor = chart.data.labels.map(() => bgColor);
            } else { // It's already an array
                dataset.originalBackgroundColor = [...bgColor];
            }
        }
        
        const originalColors = dataset.originalBackgroundColor;

        if (forceClear || selectedGroups.length === 0) {
            // Restore all original colors if clearing selection or if nothing is selected
             dataset.backgroundColor = [...originalColors];
        } else {
            // Apply disabled style to non-selected groups
            dataset.backgroundColor = chart.data.labels.map((label, index) => {
                return selectedGroups.includes(label) 
                    ? originalColors[index] || defaultColors[datasetIndex] // Fallback to default
                    : CHART_COLORS.disabled;
            });
        }
    });

    chart.update('none'); // Use 'none' for smooth updates
}

/**
 * Renders a standardized, 4-button pagination control.
 * @param {HTMLElement} container - The DOM element to render the controls into.
 * @param {number} currentPage - The current active page (0-indexed).
 * @param {number} totalPages - The total number of pages.
 * @param {function(number): void} onPageChange - Callback function executed with the new page number when a button is clicked.
 */
function renderPaginationControls(container, currentPage, totalPages, onPageChange) {
    if (!container) return;

    container.innerHTML = `
        <button data-page="first" title="First Page">«</button>
        <button data-page="prev" title="Previous Page">‹</button>
        <span class="page-info">Page ${currentPage + 1} of ${totalPages || 1}</span>
        <button data-page="next" title="Next Page">›</button>
        <button data-page="last" title="Last Page">»</button>
    `;

    const firstBtn = container.querySelector('button[data-page="first"]');
    const prevBtn = container.querySelector('button[data-page="prev"]');
    const nextBtn = container.querySelector('button[data-page="next"]');
    const lastBtn = container.querySelector('button[data-page="last"]');

    firstBtn.disabled = currentPage === 0;
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
    lastBtn.disabled = currentPage >= totalPages - 1;

    container.querySelector('button[data-page="first"]').onclick = () => onPageChange(0);
    container.querySelector('button[data-page="prev"]').onclick = () => onPageChange(currentPage - 1);
    container.querySelector('button[data-page="next"]').onclick = () => onPageChange(currentPage + 1);
    container.querySelector('button[data-page="last"]').onclick = () => onPageChange(totalPages - 1);
}

/**
 * Safely destroys a Chart.js instance if it exists.
 * @param {Chart} chartInstance - The chart instance to destroy.
 */
function destroyChart(chartInstance) {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}

window.chartUtils = (function() {
    'use strict';

    const chartColors = {
        main: ['#34568B', '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1', '#955251', '#B565A7', '#009B77', '#DD4124', '#45B8AC', '#EFC050', '#5B5EA6', '#9B2335', '#DFCFBE', '#55B4B0', '#E15D44', '#7FCDCD', '#BC243C', '#C3447A'],
        planned: 'rgba(54, 162, 235, 0.6)',
        actual: 'rgba(255, 99, 132, 0.6)',
        positive_variance: 'rgba(75, 192, 192, 0.6)', // Green
        negative_variance: 'rgba(255, 99, 132, 0.6)', // Red
        scrap: 'rgba(255, 159, 64, 0.8)',
        rework: 'rgba(153, 102, 255, 0.8)',
        scrap_mes: 'rgba(201, 203, 207, 0.8)',
        blue: '#34568B',
        orange: '#FF6F61',
        green: '#88B04B',
        red: '#FF6F61', // Using orange-red for consistency
    };

    const fabPointStyles = {
        'Fab A': 'triangle',
        'Fab B': 'rect',
        'Fab C': 'rectRot'
    };

    const productColors = {};
    let colorIndex = 0;

    function getProductColor(productName) {
        if (!productName) return chartColors.main[chartColors.main.length - 1];
        if (!productColors[productName]) {
            productColors[productName] = chartColors.main[colorIndex % chartColors.main.length];
            colorIndex++;
        }
        return productColors[productName];
    }

    return {
        colors: PALETTE,
        chartColors,
        formatCost,
        formatNumber,
        updateBarSelectionStyle,
        renderPaginationControls,
        destroyChart,
        fabPointStyles,
        getProductColor
    };

})(); 