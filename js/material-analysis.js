(function() {
    'use strict';

    if (window.materialAnalysis) {
        return; // Script already loaded
    }

    let charts = {
        materialFamilyCostChart: null,
        productMaterialVarianceChart: null,
        topMesMaterialVarianceChart: null
    };

    let isInitialized = false;
    let selectedMaterialFamilies = [];
    let productVarianceCurrentPage = 1;
    let mesVarianceCurrentPage = 1;
    const ITEMS_PER_PAGE = 10;

    // Declare utilities from chartUtils, to be assigned on initialization
    let formatCost, formatNumber, updateBarSelectionStyle, chartColors, renderPaginationControls;

    function initialize() {
        // This function will be called when the tab is activated or data is ready.
        // It ensures that initialization only runs once.
        if (isInitialized) {
            applyFiltersAndRedraw();
            return;
        }

        // Dependency Check
        if (typeof window.chartUtils === 'undefined' || typeof window.appData === 'undefined') {
            return;
        }
        
        // Assign utils now that we know they exist
        ({ formatCost, formatNumber, updateBarSelectionStyle, chartColors, renderPaginationControls } = window.chartUtils);

        try {
            setupCharts();
            isInitialized = true;
            window.addEventListener('globalFiltersChanged', applyFiltersAndRedraw);
            applyFiltersAndRedraw(); // Initial data load
        } catch (error) {
            console.error("Material Analysis: CRITICAL ERROR during initialization.", error);
            isInitialized = false; // Allow re-initialization on error
        }
    }

    function setupCharts() {
        console.log("[M.A. LOG] Setting up charts...");
        charts.materialFamilyCostChart = createChart('materialFamilyCostChart', getBarOptions('Material Family Costs (vs Planned)'));
        charts.productMaterialVarianceChart = createChart('productMaterialVarianceChart', getVarianceOptions('Top 10 Product Variance by Material'));
        charts.topMesMaterialVarianceChart = createChart('topMesMaterialVarianceChart', getVarianceOptions('Top 10 Material Variance by MES Step'));
        
        console.log("[M.A. LOG] Chart setup complete.");
    }
    
    function applyFiltersAndRedraw() {
        if (!isInitialized) return;
        console.log("[M.A. LOG] Redrawing all charts...");
        updateMaterialFamilyChart();
        updateProductMaterialVarianceChart();
        updateTopMesMaterialVarianceChart();
    }
    
    function handleMaterialFamilyClick(event, elements) {
        if (!charts.materialFamilyCostChart || !elements.length) return;
        
        const index = elements[0].index;
        const family = charts.materialFamilyCostChart.data.labels[index];

        const familyIndex = selectedMaterialFamilies.indexOf(family);
        if (familyIndex > -1) {
            selectedMaterialFamilies.splice(familyIndex, 1);
        } else {
            selectedMaterialFamilies.push(family);
        }
        productVarianceCurrentPage = 1;
        mesVarianceCurrentPage = 1;
        applyFiltersAndRedraw();
    }

    function updateMaterialFamilyChart() {
        if (!charts.materialFamilyCostChart) return;
        const filters = window.getGlobalFilters();
        
        let data = window.appData.materialFamilyCostData || [];
        
        let filteredData = data.filter(d =>
            (filters.selectedProducts.length === 0 || filters.selectedProducts.some(p => d.product.startsWith(p))) &&
            (filters.selectedFabs.length === 0 || filters.selectedFabs.includes(d.fab)) &&
            (filters.selectedTechnologies.length === 0 || filters.selectedTechnologies.includes(d.technology))
        );

        const aggregated = filteredData.reduce((acc, curr) => {
            if (!acc[curr.materialFamily]) {
                acc[curr.materialFamily] = { planned: 0, actual: 0 };
            }
            acc[curr.materialFamily].planned += (curr.plannedCost || 0);
            acc[curr.materialFamily].actual += (curr.actualCost || 0);
            return acc;
        }, {});

        const labels = Object.keys(aggregated).sort((a, b) => aggregated[b].actual - aggregated[a].actual);
        const plannedCosts = labels.map(label => aggregated[label].planned);
        const actualCosts = labels.map(label => aggregated[label].actual);

        updateChart(charts.materialFamilyCostChart, labels, [plannedCosts, actualCosts]);
        
        const defaultColors = [chartColors.planned, chartColors.actual];
        if (selectedMaterialFamilies.length > 0) {
            updateBarSelectionStyle(charts.materialFamilyCostChart, selectedMaterialFamilies, defaultColors, false);
        } else {
            // Force a clear selection styling when no families are selected
            updateBarSelectionStyle(charts.materialFamilyCostChart, [], defaultColors, true);
        }
    }
    
    function updateProductMaterialVarianceChart() {
        if (!charts.productMaterialVarianceChart) return;
        const filters = window.getGlobalFilters();
        const data = window.appData.materialFamilyCostData || [];
        
        let filteredData = data.filter(d =>
            (filters.selectedFabs.length === 0 || filters.selectedFabs.includes(d.fab)) &&
            (filters.selectedTechnologies.length === 0 || filters.selectedTechnologies.includes(d.technology)) &&
            (selectedMaterialFamilies.length === 0 || selectedMaterialFamilies.includes(d.materialFamily))
        );

        let varianceByProduct = filteredData.reduce((acc, d) => {
            const productName = d.product.split(' (')[0];
            const variance = d.actualCost - d.plannedCost;
            if (!acc[productName]) {
                acc[productName] = 0;
            }
            acc[productName] += variance;
            return acc;
        }, {});

        const sortedVariances = Object.entries(varianceByProduct).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
        const totalPages = Math.ceil(sortedVariances.length / ITEMS_PER_PAGE);
        productVarianceCurrentPage = Math.max(1, Math.min(productVarianceCurrentPage, totalPages || 1));
        const paginatedData = sortedVariances.slice((productVarianceCurrentPage - 1) * ITEMS_PER_PAGE, productVarianceCurrentPage * ITEMS_PER_PAGE);
        const labels = paginatedData.map(([name]) => name);
        const variances = paginatedData.map(([, variance]) => variance);
        const backgroundColors = variances.map(v => v >= 0 ? 'rgba(255, 99, 132, 0.7)' : 'rgba(75, 192, 192, 0.7)');

        updateChart(charts.productMaterialVarianceChart, labels, [variances], backgroundColors);
        renderPaginationControls(document.getElementById('product-material-variance-pagination'), productVarianceCurrentPage - 1, totalPages, (newPage) => {
            productVarianceCurrentPage = newPage + 1;
            updateProductMaterialVarianceChart();
        });
    }

    function updateTopMesMaterialVarianceChart() {
        if (!charts.topMesMaterialVarianceChart) return;
        const filters = window.getGlobalFilters();
        const data = window.appData.materialCostByMesStepData || [];

        let filteredData = data.filter(d =>
            (filters.selectedProducts.length === 0 || filters.selectedProducts.some(p => d.product.startsWith(p))) &&
            (filters.selectedFabs.length === 0 || filters.selectedFabs.includes(d.fab)) &&
            (filters.selectedTechnologies.length === 0 || filters.selectedTechnologies.includes(d.technology)) &&
            (selectedMaterialFamilies.length === 0 || selectedMaterialFamilies.includes(d.materialFamily))
        );

        let varianceByStep = filteredData.reduce((acc, d) => {
            const variance = d.actualCost - d.plannedCost;
            if (!acc[d.mesStep]) {
                acc[d.mesStep] = 0;
            }
            acc[d.mesStep] += variance;
            return acc;
        }, {});

        const sortedVariances = Object.entries(varianceByStep).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
        const totalPages = Math.ceil(sortedVariances.length / ITEMS_PER_PAGE);
        mesVarianceCurrentPage = Math.max(1, Math.min(mesVarianceCurrentPage, totalPages || 1));
        const paginatedData = sortedVariances.slice((mesVarianceCurrentPage - 1) * ITEMS_PER_PAGE, mesVarianceCurrentPage * ITEMS_PER_PAGE);
        const labels = paginatedData.map(([name]) => name);
        const variances = paginatedData.map(([, variance]) => variance);
        const backgroundColors = variances.map(v => v >= 0 ? 'rgba(255, 99, 132, 0.7)' : 'rgba(75, 192, 192, 0.7)');

        updateChart(charts.topMesMaterialVarianceChart, labels, [variances], backgroundColors);
        renderPaginationControls(document.getElementById('mes-material-variance-pagination'), mesVarianceCurrentPage - 1, totalPages, (newPage) => {
            mesVarianceCurrentPage = newPage + 1;
            updateTopMesMaterialVarianceChart();
        });
    }
    
    function getBarOptions(title) {
        return {
            type: 'bar',
            data: { labels: [], datasets: [
                { label: 'Planned Cost', data: [], backgroundColor: '#6c757d' },
                { label: 'Actual Cost', data: [], backgroundColor: '#007bff' }
            ]},
            options: { 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false,
                onClick: handleMaterialFamilyClick,
                scales: { x: { ticks: { callback: (value) => formatNumber(value) } }, y: { beginAtZero: true } },
                plugins: { 
                    legend: { display: true, position: 'top' }, 
                    tooltip: { enabled: true, callbacks: {
                        label: (c) => `${c.dataset.label}: ${formatCost(c.raw)}`
                    }},
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: '#555',
                        font: { weight: 'bold' },
                        formatter: (value) => formatNumber(value, 1),
                    }
                }
            }
        };
    }
    
    function getVarianceOptions(title) {
         return {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Cost Variance', data: [], backgroundColor: [] }]},
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                scales: { x: { ticks: { callback: (value) => formatNumber(value) }}},
                plugins: { legend: { display: false }, tooltip: { callbacks: {
                    label: (context) => `Variance: ${formatCost(context.raw)}`
                }},
                datalabels: { anchor: 'end', align: 'end', color: '#555', font: { weight: 'bold' },
                    formatter: (value) => formatNumber(value, 1),
                }}
            }
        };
    }

    function updateChart(chart, labels, datasetsData, backgroundColors) {
        if (!chart) return;
        chart.data.labels = labels;
        datasetsData.forEach((data, index) => {
            chart.data.datasets[index].data = data;
        });
        if (backgroundColors && chart.data.datasets[0]) {
            chart.data.datasets[0].backgroundColor = backgroundColors;
        }
        chart.update();
    }
    
    function createChart(canvasId, options) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) {
            console.error(`Canvas context not found for ID: ${canvasId}`);
            return null;
        }
        return new Chart(ctx, options);
    }

    function destroyCharts() {
        if (charts.materialFamilyCostChart) {
            window.chartUtils.destroyChart(charts.materialFamilyCostChart);
            charts.materialFamilyCostChart = null;
        }
        if (charts.productMaterialVarianceChart) {
            window.chartUtils.destroyChart(charts.productMaterialVarianceChart);
            charts.productMaterialVarianceChart = null;
        }
        if (charts.topMesMaterialVarianceChart) {
            window.chartUtils.destroyChart(charts.topMesMaterialVarianceChart);
            charts.topMesMaterialVarianceChart = null;
        }
        isInitialized = false;
        window.removeEventListener('globalFiltersChanged', applyFiltersAndRedraw);
    }

    // Expose the public interface immediately.
    window.materialAnalysis = {
        initialize: initialize,
        destroyCharts: destroyCharts
    };

    // --- Event-driven Initialization ---
    // Listen for the dataReady event to bootstrap the module.
    document.addEventListener('dataReady', () => {
        // If the tab is already active when data loads, initialize immediately.
        if (document.getElementById('material-analysis')?.classList.contains('active')) {
            initialize();
        }
    });

    // Listen for tab changes to initialize when the tab becomes active.
    document.addEventListener('tabChanged', (event) => {
        if (event.detail.activeTab === 'material-analysis' && !isInitialized) {
            initialize();
        }
    });

})();