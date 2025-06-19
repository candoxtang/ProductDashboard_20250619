/**
 * @file quality-dashboard.js
 * @description Manages all charts for the Quality & Process tab.
 * This version adds the "Rework Cost Trend" chart and fixes initialization bugs.
 */
(function() {
    'use strict';

    const qualityTab = document.getElementById('quality');
    if (!qualityTab) {
        console.warn("Quality dashboard script loaded, but 'quality' tab element not found. Exiting.");
        return;
    }

    let charts = {
        totalScrapCost: null,
        scrapCostTrend: null,
        topScrapMes: null,
        reworkCostTrend: null,
        reworkPercentageTrend: null,
        topReworkMes: null
    };
    let isInitialized = false;

    /**
     * Main initialization function, called by main.js
     */
    function initialize() {
        if (isInitialized) return;
        
        console.log("Quality Dashboard: Initializing.");
        
        const createChart = (id, type, options) => {
            const ctx = document.getElementById(id)?.getContext('2d');
            if (!ctx) return null;
            // Before creating a new chart, ensure any old one is destroyed.
            if (charts[id] && typeof charts[id].destroy === 'function') {
                charts[id].destroy();
            }
            return new Chart(ctx, { type, data: {}, options });
        };
        
        const sharedOptions = { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: false
                },
                legend: {
                    display: false // RULE: No legends on bar or trend charts.
                }
            }
        };

        const trendOptions = {
            ...sharedOptions,
            plugins: {
                ...sharedOptions.plugins,
                legend: {
                    display: false // Redundant, but ensures rule is followed.
                }
            }
        };

        charts.totalScrapCost = createChart('totalScrapCostChart', 'bar', { ...sharedOptions, indexAxis: 'y' });
        charts.scrapCostTrend = createChart('scrapCostTrendChart', 'line', trendOptions);
        charts.topScrapMes = createChart('topScrapMesChart', 'bar', { ...sharedOptions, indexAxis: 'y' });
        charts.reworkCostTrend = createChart('reworkCostTrendChart', 'line', trendOptions);
        charts.reworkPercentageTrend = createChart('reworkPercentageTrendChart', 'line', {
            ...trendOptions,
            scales: {
                y: {
                    ticks: {
                        callback: (value) => `${value.toFixed(1)}%`
                    }
                }
            },
            plugins: {
                ...trendOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.raw.toFixed(2)}%`
                    }
                }
            }
        });

        charts.topReworkMes = createChart('topReworkMesChart', 'bar', {
            ...sharedOptions,
            indexAxis: 'y',
            plugins: {
                ...sharedOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: (context) => `Rework Cost: $${window.chartUtils.formatNumber(context.raw, 0)}`
                    }
                }
            }
        });

        isInitialized = true;
        console.log("Quality Dashboard: Initialized successfully.");
        updateAllQualityCharts();

        // Listen for filter changes only AFTER initialization
        document.addEventListener('globalFiltersChanged', updateAllQualityCharts);
    }

    /**
     * Destroys all charts to prevent canvas memory leaks.
     */
    function destroyCharts() {
        if (!isInitialized) return;
        console.log("Destroying Quality Dashboard charts.");
        for (const chartKey in charts) {
            if (charts[chartKey] && typeof charts[chartKey].destroy === 'function') {
                charts[chartKey].destroy();
            }
        }
        charts = {};
        isInitialized = false;
        // IMPORTANT: Remove the listener to prevent it from running when the tab is inactive
        document.removeEventListener('globalFiltersChanged', updateAllQualityCharts);
    }

    function updateAllQualityCharts() {
        if (!isInitialized) {
            console.log("Quality Dashboard: Skipping update, not initialized.");
            return;
        }
        console.log("Quality Dashboard: Updating all charts.");

        updateTotalScrapCostChart();
        updateScrapCostTrendChart();
        updateTopScrapMesChart();
        updateReworkCostTrendChart();
        updateReworkPercentageTrendChart();
        updateTopReworkMesChart();
    }

    function updateTotalScrapCostChart() {
        const { getAggregatedData } = window.dateUtils;
        const productData = getAggregatedData(window.globalFilters, 'product', 'productName');
        const sortedData = (productData.barChartData || []).sort((a, b) => b.scrap_cost - a.scrap_cost).slice(0, 15);
        
        charts.totalScrapCost.data = {
            labels: sortedData.map(d => d.group),
            datasets: [{
                label: 'Total Scrap Cost',
                data: sortedData.map(d => d.scrap_cost),
                backgroundColor: sortedData.map((d, i) => window.chartUtils.chartColors.main[i % window.chartUtils.chartColors.main.length])
            }]
        };
        charts.totalScrapCost.update();
    }

    function updateScrapCostTrendChart() {
        const { labels, datasets } = aggregateScrapTrendData(window.globalFilters);
        const colorPalette = window.chartUtils.chartColors.main;

        charts.scrapCostTrend.data = {
            labels: labels,
            datasets: Object.keys(datasets).map((key, index) => ({
                label: key,
                data: datasets[key],
                borderColor: colorPalette[index % colorPalette.length],
                tension: 0.1,
                fill: false
            }))
        };
        charts.scrapCostTrend.update();
    }

    function updateTopScrapMesChart() {
        const { getAggregatedData } = window.dateUtils;
        const mesData = getAggregatedData(window.globalFilters, 'mesStep');
        const sortedMesData = (mesData.barChartData || [])
            .filter(d => d.scrap_cost > 0)
            .sort((a, b) => b.scrap_cost - a.scrap_cost)
            .slice(0, 10);

        charts.topScrapMes.data = {
            labels: sortedMesData.map(d => d.group),
            datasets: [{
                label: 'Scrap Cost',
                data: sortedMesData.map(d => d.scrap_cost),
                backgroundColor: window.chartUtils.chartColors.negative_variance
            }]
        };
        charts.topScrapMes.update();
    }
    
    /**
     * A dedicated aggregator for the scrap cost trend data.
     * @param {object} filters - The global filter object.
     * @returns {object} - Data formatted for a Chart.js line chart.
     */
    function aggregateScrapTrendData(filters) {
        const { getPeriodKeyFunction, formatDateLabel } = window.dateUtils;
        const { selectedProducts, selectedFabs, selectedTechnologies } = filters;
        const data = Object.values(window.appData.dailySummary || {});

        const filteredData = data.filter(d => {
            const productMatch = selectedProducts.length === 0 || selectedProducts.includes(d.productName);
            const fabMatch = selectedFabs.length === 0 || selectedFabs.includes(d.fab);
            const techMatch = selectedTechnologies.length === 0 || selectedTechnologies.includes(d.technology);
            return productMatch && fabMatch && techMatch;
        });

        const getPeriod = getPeriodKeyFunction(filters.aggregationLevel);
        const trendData = {}; 
        const allProducts = new Set();

        filteredData.forEach(d => {
            if (!d.scrap_cost) return;

            const period = getPeriod(new Date(d.date));
            const product = d.productName;
            allProducts.add(product);
            
            if (!trendData[period]) trendData[period] = {};
            if (!trendData[period][product]) trendData[period][product] = 0;
            
            trendData[period][product] += d.scrap_cost;
        });

        const labels = Object.keys(trendData).sort((a, b) => new Date(a) - new Date(b));
        const datasets = {};

        allProducts.forEach(product => {
            datasets[product] = labels.map(label => trendData[label][product] || 0);
        });
        
        const result = {
            labels: labels.map(l => formatDateLabel(new Date(l), filters.aggregationLevel)),
            datasets
        };
        return result;
    }

    /**
     * A dedicated aggregator for rework data, which has a simpler structure.
     * @param {object} filters - The global filter object.
     * @returns {object} - Data formatted for a Chart.js line chart.
     */
    function aggregateReworkData(filters) {
        const { getPeriodKeyFunction, formatDateLabel } = window.dateUtils;
        const { selectedProducts, selectedFabs } = filters;
        const data = window.appData.reworkData || [];

        const filteredData = data.filter(d => {
            if (!d.productFab) return false;
            const fabMatch = selectedFabs.length === 0 || selectedFabs.some(fab => d.productFab.includes(fab));
            const productMatch = selectedProducts.length === 0 || selectedProducts.some(prod => d.productFab.includes(prod));
            return fabMatch && productMatch;
        });

        const getPeriod = getPeriodKeyFunction(filters.aggregationLevel);
        const trendData = {}; // { period: { productFab: value, ... }, ... }
        const allProductFabs = new Set();

        filteredData.forEach(d => {
            const period = getPeriod(new Date(d.date));
            const product = d.productFab; // Keep "Product Alpha (Fab A)" for the legend
            allProductFabs.add(product);
            
            if (!trendData[period]) trendData[period] = {};
            if (!trendData[period][product]) trendData[period][product] = 0;
            
            trendData[period][product] += d.value;
        });

        const labels = Object.keys(trendData).sort((a, b) => new Date(a) - new Date(b));
        const datasets = {};

        allProductFabs.forEach(product => {
            datasets[product] = labels.map(label => trendData[label][product] || 0); // Use 0 instead of null
        });
        
        return {
            labels: labels.map(l => formatDateLabel(new Date(l), filters.aggregationLevel)),
            datasets
        };
    }

    function aggregateReworkPercentageData(filters) {
        const { getPeriodKeyFunction, formatDateLabel } = window.dateUtils;
        const { selectedProducts, selectedFabs } = filters;
        const data = window.appData.reworkData || [];

        const filteredData = data.filter(d => {
            if (!d.productFab) return false;
            const fabMatch = selectedFabs.length === 0 || selectedFabs.some(fab => d.productFab.includes(fab));
            const productMatch = selectedProducts.length === 0 || selectedProducts.some(prod => d.productFab.includes(prod));
            return fabMatch && productMatch;
        });

        const getPeriod = getPeriodKeyFunction(filters.aggregationLevel);
        const trendData = {}; // { period: { productFab: { units: x, wip: y }, ... }, ... }
        const allProductFabs = new Set();

        filteredData.forEach(d => {
            const period = getPeriod(new Date(d.date));
            const product = d.productFab;
            allProductFabs.add(product);
            
            if (!trendData[period]) trendData[period] = {};
            if (!trendData[period][product]) {
                trendData[period][product] = { reworkUnits: 0, totalWip: 0 };
            }
            
            trendData[period][product].reworkUnits += d.units;
            trendData[period][product].totalWip += d.wip;
        });

        const labels = Object.keys(trendData).sort((a, b) => new Date(a) - new Date(b));
        const datasets = {};

        allProductFabs.forEach(product => {
            datasets[product] = labels.map(label => {
                const periodData = trendData[label][product];
                if (!periodData || periodData.totalWip === 0) {
                    return 0;
                }
                return (periodData.reworkUnits / periodData.totalWip) * 100;
            });
        });
        
        return {
            labels: labels.map(l => formatDateLabel(new Date(l), filters.aggregationLevel)),
            datasets
        };
    }

    function updateReworkCostTrendChart() {
        if (!charts.reworkCostTrend) return;
        
        const { labels, datasets } = aggregateReworkData(window.globalFilters);
        const colorPalette = window.chartUtils.chartColors.main;
        
        charts.reworkCostTrend.data = {
            labels: labels,
            datasets: Object.keys(datasets).map((key, index) => ({
                label: key,
                data: datasets[key],
                borderColor: colorPalette[index % colorPalette.length],
                tension: 0.1,
                fill: false
            }))
        };
        charts.reworkCostTrend.update();
    }

    function updateReworkPercentageTrendChart() {
        if (!charts.reworkPercentageTrend) return;
        
        const { labels, datasets } = aggregateReworkPercentageData(window.globalFilters);
        const colorPalette = [...window.chartUtils.chartColors.main].reverse(); // Use main palette but reversed
        
        charts.reworkPercentageTrend.data = {
            labels: labels,
            datasets: Object.keys(datasets).map((key, index) => ({
                label: key,
                data: datasets[key],
                borderColor: colorPalette[index % colorPalette.length],
                tension: 0.1,
                fill: false
            }))
        };
        charts.reworkPercentageTrend.update();
    }

    function updateTopReworkMesChart() {
        if (!charts.topReworkMes) return;

        const data = window.appData.reworkByMesStepData || [];
        const { selectedProducts, selectedFabs } = window.globalFilters;

        const filteredData = data.filter(d => {
            if (!d.productFab) return false;
            const fabMatch = selectedFabs.length === 0 || selectedFabs.some(fab => d.productFab.includes(fab));
            const productMatch = selectedProducts.length === 0 || selectedProducts.some(prod => d.productFab.includes(prod));
            return fabMatch && productMatch;
        });

        const aggregated = filteredData.reduce((acc, item) => {
            if (!acc[item.step]) {
                acc[item.step] = 0;
            }
            acc[item.step] += item.cost;
            return acc;
        }, {});

        const sortedData = Object.entries(aggregated)
            .map(([step, cost]) => ({ step, cost }))
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 10);

        charts.topReworkMes.data = {
            labels: sortedData.map(d => d.step),
            datasets: [{
                label: 'Top Rework Cost by MES Step',
                data: sortedData.map(d => d.cost),
                backgroundColor: window.chartUtils.chartColors.rework
            }]
        };
        charts.topReworkMes.update();
    }

    // Expose only the necessary functions to the global scope
    window.dashboardCharts = {
        initializeQualityCharts: initialize,
        destroyAll: destroyCharts
    };
})(); 