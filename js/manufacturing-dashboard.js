(function() { // IIFE to encapsulate scope
    'use strict';

    if (window.manufacturingDashboard) {
        return;
    }

    console.log("Manufacturing Dashboard script loaded. Waiting for dataReady to initialize.");
    
    // --- Module-level state ---
    let charts = {};
    let isInitialized = false;
    let isDataReady = false;

    // State for pagination
    let processTimeData = [];
    let processTimeCurrentPage = 0;
    const PROCESS_TIME_PAGE_SIZE = 10;
    let mesTimeData = [];
    let mesTimeCurrentPage = 0;
    const MES_TIME_PAGE_SIZE = 10;
    let cycleTimeData = [];
    let cycleTimeCurrentPage = 0;
    const CYCLE_TIME_PAGE_SIZE = 10;
    let mfgPlannedCostData = [];
    let mfgPlannedCostCurrentPage = 0;
    const MFG_PLANNED_COST_PAGE_SIZE = 10;
    
    // State for selections
    let mfgSelectedProducts = [];
    let mfgSelectedProcessAreas = [];
    let mfgVarianceByAreaData = [];
    let mfgVarianceByAreaCurrentPage = 0;
    const MFG_VARIANCE_BY_AREA_PAGE_SIZE = 10;
    
    // --- Core Lifecycle Functions ---
    function initialize() {
        if (isInitialized) {
            console.log("Manufacturing Dashboard: Already initialized.");
            return;
        }
        console.log("Manufacturing Dashboard: Initializing.");

        try {
            setupCharts();
            console.log("Manufacturing Dashboard: Charts setup complete.");
            
            isInitialized = true;
            document.addEventListener('globalFiltersChanged', updateAllManufacturingCharts);
            console.log("Manufacturing Dashboard: Initialization complete, event listeners added.");

            if (isDataReady) {
                console.log("Manufacturing Dashboard: Data is ready, updating charts now.");
                updateAllManufacturingCharts();
            } else {
                console.log("Manufacturing Dashboard: Waiting for dataReady event.");
            }
        } catch (error) {
            console.error("Manufacturing Dashboard: CRITICAL ERROR during initialization.", error);
            isInitialized = false;
        }
    }
    
    function destroyCharts() {
        if (!isInitialized) return;
        console.log("Manufacturing Dashboard: Destroying charts.");
        
        Object.values(charts).forEach(window.chartUtils.destroyChart);
        charts = {};
        isInitialized = false;
        document.removeEventListener('globalFiltersChanged', updateAllManufacturingCharts);
    }
    
    // --- Chart Instantiation ---
    function setupCharts() {
        const createChart = (id, config) => {
            const ctx = document.getElementById(id)?.getContext('2d');
            if (!ctx) return null;
            const chartInstance = Chart.getChart(ctx);
            if (chartInstance) {
                chartInstance.destroy();
            }
            return new Chart(ctx, config);
        };
        
        const { formatChartValue } = window.dateUtils;
        const commonLineOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatChartValue(v, false) } }, x: { ticks: { autoSkip: true, maxTicksLimit: 10 } } } };
        
        const horizontalBarOptions = { 
            indexAxis: 'y',
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { display: false }, 
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'end',
                    formatter: (value) => window.chartUtils.formatNumber(value, 2),
                    color: '#333'
                }
            }, 
            scales: { 
                x: { beginAtZero: true, ticks: { callback: (v) => formatChartValue(v, true) } },
                y: { type: 'category' } // Explicitly set y-axis to category
            }
        };

        const timeVarianceBarOptions = {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: true, position: 'bottom' }, 
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'end',
                    color: '#333',
                    font: {
                        weight: 'bold'
                    },
                    formatter: (value) => window.chartUtils.formatNumber(value, 1)
                },
                title: { display: false }
            },
            scales: {
                x: { beginAtZero: true, title: { display: true, text: 'Average Time (Hours)' } },
                y: { type: 'category' }
            }
        };

        const singleBarVarianceOptions = {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false }, 
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'end',
                    formatter: (value) => value.toFixed(1) + '%',
                    color: '#333'
                },
                title: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Variance (%)' },
                    ticks: { callback: (v) => `${v}%` }
                },
                y: { type: 'category' }
            }
        };

        charts.wipTrend = createChart('manufacturingWipTrendChart', { type: 'line', options: commonLineOptions });
        charts.yieldByArea = createChart('mfgYieldByAreaChart', { type: 'line', options: { ...commonLineOptions, scales: { ...commonLineOptions.scales, y: { ...commonLineOptions.scales.y, min: 90, max: 100, ticks: { callback: (v) => `${v.toFixed(1)}%` } } } } });
        charts.processTimeVariance = createChart('processTimeVarianceChart', { type: 'bar', options: singleBarVarianceOptions });
        charts.mesTimeVarianceChart = createChart('mesTimeVarianceChart', { type: 'bar', data: { datasets: [ { label: 'Planned', backgroundColor: window.chartUtils.chartColors.planned }, { label: 'Actual', backgroundColor: window.chartUtils.chartColors.actual } ] }, options: timeVarianceBarOptions });
        charts.plannedVsActualCost = createChart('mfgPlannedVsActualCostChart', { type: 'bar', data: { datasets: [ { label: 'Planned', backgroundColor: window.chartUtils.chartColors.planned }, { label: 'Actual', backgroundColor: window.chartUtils.chartColors.actual } ] }, options: { ...horizontalBarOptions, onClick: handleMfgPlannedCostClick, plugins: { ...horizontalBarOptions.plugins, legend: { display: true, position: 'top' } } } });
        charts.varianceByArea = createChart('mfgVarianceByAreaChart', { type: 'bar', data: { datasets: [{ label: 'Variance' }] }, options: { ...horizontalBarOptions, onClick: handleMfgVarianceAreaClick } });
    }

    // --- Chart Update Logic ---
    function updateAllManufacturingCharts(event = {}) {
        if (!isInitialized || !isDataReady) {
            return;
        }
        console.log("Manufacturing Dashboard: Updating all charts.", { event });
        
        updateWipTrendChart();
        updateMfgPlannedCostChart(event);
        updateMesTimeChart();
        updateProcessTimeChart();
        updateMfgVarianceByAreaChart();
        updateMfgYieldByAreaChart();
        console.log("Manufacturing Dashboard: All chart update functions called.");
    }
    
    function updateWipTrendChart() {
        if (!charts.wipTrend) {
            console.error("CRITICAL: WIP Trend chart not initialized.");
            return;
        }
    
        const trendData = window.appData?.productWipTrend;
        if (!trendData || !trendData.labels || !trendData.datasets) {
            console.error("CRITICAL: Invalid trendData structure for WIP chart.");
            return;
        }
    
        const { selectedFabs, selectedProducts, aggregationLevel } = window.globalFilters;
        const { getPeriodKeyFunction, formatDateLabel, getTrendDateRange } = window.dateUtils;

        const dateRange = getTrendDateRange(aggregationLevel);
    
        // 1. Filter datasets by selected products and fabs
        const filteredDatasets = trendData.datasets.filter(d => {
            const fabName = d.fab;
            const productName = d.label.split(' (')[0];
            const fabMatch = selectedFabs.length === 0 || selectedFabs.includes(fabName);
            const productMatch = selectedProducts.length === 0 || selectedProducts.includes(productName);
            return fabMatch && productMatch;
        });
    
        // 2. Aggregate data based on the aggregation level
        const getPeriodKey = getPeriodKeyFunction(aggregationLevel);
        const aggregatedData = {}; // { periodKey: { datasetLabel: { sum: 0, count: 0 }, ... } }
        const allPeriodKeys = new Set();
    
        filteredDatasets.forEach(dataset => {
            trendData.labels.forEach((dateString, index) => {
                const date = new Date(dateString);
                if (date >= dateRange.startDate && date <= dateRange.endDate) {
                    const periodKey = getPeriodKey(date);
                    allPeriodKeys.add(periodKey);
    
                    if (!aggregatedData[periodKey]) aggregatedData[periodKey] = {};
                    if (!aggregatedData[periodKey][dataset.label]) {
                        aggregatedData[periodKey][dataset.label] = { sum: 0, count: 0, dateObj: date };
                    }
                    aggregatedData[periodKey][dataset.label].sum += dataset.data[index];
                    aggregatedData[periodKey][dataset.label].count++;
                }
            });
        });
    
        const sortedPeriodKeys = Object.keys(aggregatedData).sort((a, b) => aggregatedData[a][Object.keys(aggregatedData[a])[0]].dateObj - aggregatedData[b][Object.keys(aggregatedData[b])[0]].dateObj);

        // 3. Format for Chart.js
        const chartLabels = sortedPeriodKeys.map(key => formatDateLabel(aggregatedData[key][Object.keys(aggregatedData[key])[0]].dateObj, aggregationLevel));
        const chartDatasets = filteredDatasets.map(dataset => {
            const data = sortedPeriodKeys.map(key => {
                const periodData = aggregatedData[key]?.[dataset.label];
                return periodData && periodData.count > 0 ? periodData.sum / periodData.count : 0;
            });
            
            const color = window.chartUtils.getProductColor(dataset.label);
            const fab = dataset.fab || 'N/A';
            const pointStyle = window.chartUtils.fabPointStyles[fab] || 'circle';

            return {
                label: dataset.label,
                data: data,
                borderColor: color,
                backgroundColor: color,
                fill: false,
                tension: 0.1,
                pointStyle: pointStyle,
                pointRadius: 5,
                pointHoverRadius: 7
            };
        });
    
        charts.wipTrend.data.labels = chartLabels;
        charts.wipTrend.data.datasets = chartDatasets;
        charts.wipTrend.update();
    }

    // --- Pagination Logic & Chart-specific Updates ---
    function updateProcessTimeChart() {
        if (!charts.processTimeVariance) return;
        const selectedProductNames = mfgSelectedProducts.map(p => p.split(" (")[0]);
        const sourceData = window.appData?.processTimeData || [];
        
        const filteredData = sourceData.filter(d => 
            (window.globalFilters.selectedFabs.length === 0 || window.globalFilters.selectedFabs.includes(d.fab)) &&
            (selectedProductNames.length === 0 || selectedProductNames.includes(d.product))
        );

        const aggregated = filteredData.reduce((acc, curr) => {
            if (!acc[curr.mesStep]) {
                acc[curr.mesStep] = { planned: 0, actual: 0, count: 0 };
            }
            acc[curr.mesStep].planned += curr.plannedTime;
            acc[curr.mesStep].actual += curr.actualTime;
            acc[curr.mesStep].count++;
            return acc;
        }, {});

        processTimeData = Object.entries(aggregated).map(([mesStep, data]) => {
            const avgPlanned = data.count > 0 ? data.planned / data.count : 0;
            const avgActual = data.count > 0 ? data.actual / data.count : 0;
            const variance = avgPlanned > 0 ? ((avgActual - avgPlanned) / avgPlanned) * 100 : 0;
            return { mesStep, variance };
        }).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
        
        processTimeCurrentPage = 0;
        renderProcessTimePage();
    }

    function renderProcessTimePage() {
        if (!charts.processTimeVariance) return;
        const { renderPaginationControls } = window.chartUtils;
        const pageStart = processTimeCurrentPage * PROCESS_TIME_PAGE_SIZE;
        const pageEnd = pageStart + PROCESS_TIME_PAGE_SIZE;
        const pageData = processTimeData.slice(pageStart, pageEnd);

        charts.processTimeVariance.data.labels = pageData.map(d => d.mesStep);
        charts.processTimeVariance.data.datasets =  [{
            label: 'Variance %',
            data: pageData.map(d => d.variance),
            backgroundColor: pageData.map(d => d.variance > 0 ? window.chartUtils.chartColors.negative_variance : window.chartUtils.chartColors.positive_variance)
        }];
        charts.processTimeVariance.update();

        const totalPages = Math.ceil(processTimeData.length / PROCESS_TIME_PAGE_SIZE);
        renderPaginationControls(document.getElementById('process-time-pagination'), processTimeCurrentPage, totalPages, (newPage) => {
            if (newPage >= 0 && newPage < totalPages) {
                processTimeCurrentPage = newPage;
                renderProcessTimePage();
            }
        });
    }

    function updateMesTimeChart() {
        if (!charts.mesTimeVarianceChart) {
            console.error("CRITICAL: MES Time chart not initialized, skipping update.");
            return;
        }
        const selectedProductNames = mfgSelectedProducts.map(p => p.split(" (")[0]);
        const sourceData = window.appData?.processTimeData || [];
        
        const filteredData = sourceData.filter(d => 
            (window.globalFilters.selectedFabs.length === 0 || window.globalFilters.selectedFabs.includes(d.fab)) &&
            (selectedProductNames.length === 0 || selectedProductNames.includes(d.product))
        );

        // Aggregate data by MES step
        const aggregated = filteredData.reduce((acc, curr) => {
            if (!acc[curr.mesStep]) {
                acc[curr.mesStep] = { planned: 0, actual: 0, count: 0 };
            }
            acc[curr.mesStep].planned += curr.plannedTime;
            acc[curr.mesStep].actual += curr.actualTime;
            acc[curr.mesStep].count++;
            return acc;
        }, {});

        mesTimeData = Object.entries(aggregated).map(([mesStep, data]) => {
            const avgPlanned = data.count > 0 ? data.planned / data.count : 0;
            const avgActual = data.count > 0 ? data.actual / data.count : 0;
            const variance = avgActual - avgPlanned;
            return { mesStep, avgPlanned, avgActual, variance };
        }).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
        
        mesTimeCurrentPage = 0;
        renderMesTimePage();
        
        // When the product cost chart updates, it may change the selected products, so we re-render the dependent charts
        updateMfgVarianceByAreaChart();
        updateMfgYieldByAreaChart();
    }

    function renderMesTimePage() {
        if (!charts.mesTimeVarianceChart) return;
        const { renderPaginationControls } = window.chartUtils;
        const pageStart = mesTimeCurrentPage * MES_TIME_PAGE_SIZE;
        const pageEnd = pageStart + MES_TIME_PAGE_SIZE;
        const pageData = mesTimeData.slice(pageStart, pageEnd);

        charts.mesTimeVarianceChart.data.labels = pageData.map(d => d.mesStep);
        // Convert seconds to hours for display
        charts.mesTimeVarianceChart.data.datasets[0].data = pageData.map(d => d.avgPlanned / 3600);
        charts.mesTimeVarianceChart.data.datasets[1].data = pageData.map(d => d.avgActual / 3600);
        charts.mesTimeVarianceChart.update();

        const totalPages = Math.ceil(mesTimeData.length / MES_TIME_PAGE_SIZE);
        renderPaginationControls(document.getElementById('mes-time-pagination'), mesTimeCurrentPage, totalPages, (newPage) => {
            if (newPage >= 0 && newPage < totalPages) {
                mesTimeCurrentPage = newPage;
                renderMesTimePage();
            }
        });
    }

    function updateCycleTimeChart() {
        console.log("START: updateCycleTimeChart");
        if (!charts.cycleTimeVariance) {
            console.error("CRITICAL: Cycle Time chart not initialized, skipping update.");
            return;
        }
        const selectedProductNames = mfgSelectedProducts.map(p => p.split(" (")[0]);
        const sourceData = window.appData?.cycleTimeData || [];

        console.log("FILTERING: Cycle Time Data", {
            selectedFabs: window.globalFilters.selectedFabs,
            selectedProductNames: selectedProductNames,
            sourceDataSample: sourceData.slice(0, 5)
        });

        cycleTimeData = sourceData
            .filter(d => 
                (window.globalFilters.selectedFabs.length === 0 || window.globalFilters.selectedFabs.includes(d.fab)) &&
                (selectedProductNames.length === 0 || selectedProductNames.includes(d.product))
            )
            .sort((a, b) => {
                const varianceA = a.actualCycleTime - a.plannedCycleTime;
                const varianceB = b.actualCycleTime - b.plannedCycleTime;
                return Math.abs(varianceB) - Math.abs(varianceA);
            });
        
        console.log(`RESULT: Filtered Cycle Time data. Found ${cycleTimeData.length} records.`);
        cycleTimeCurrentPage = 0;
        renderCycleTimePage();
        console.log("END: updateCycleTimeChart");
    }

    function renderCycleTimePage() {
        console.log("RENDER: Cycle Time page.", { currentPage: cycleTimeCurrentPage });
        if (!charts.cycleTimeVariance) return;
        const { renderPaginationControls } = window.chartUtils;
        const pageStart = cycleTimeCurrentPage * CYCLE_TIME_PAGE_SIZE;
        const pageEnd = pageStart + CYCLE_TIME_PAGE_SIZE;
        const pageData = cycleTimeData.slice(pageStart, pageEnd);
        console.log("DATA: Cycle Time page data.", { pageData: pageData.slice(0, 5) });
        charts.cycleTimeVariance.data.labels = pageData.map(d => d.lotId);
        charts.cycleTimeVariance.data.datasets[0].data = pageData.map(d => d.plannedCycleTime);
        charts.cycleTimeVariance.data.datasets[1].data = pageData.map(d => d.actualCycleTime);

        charts.cycleTimeVariance.update();
        const totalPages = Math.ceil(cycleTimeData.length / CYCLE_TIME_PAGE_SIZE);
        renderPaginationControls(document.getElementById('cycle-time-pagination'), cycleTimeCurrentPage, totalPages, (newPage) => {
            if (newPage >= 0 && newPage < totalPages) {
                cycleTimeCurrentPage = newPage;
                renderCycleTimePage();
            }
        });
        console.log("END: renderCycleTimePage");
    }

    function handleMfgPlannedCostClick(event, elements) {
        console.log("ACTION: Planned Cost chart clicked.", { elements });
        if (!elements || elements.length === 0) return;
        const { updateBarSelectionStyle } = window.chartUtils;
        const clickedIndex = elements[0].index;
        const pageIndex = mfgPlannedCostCurrentPage * MFG_PLANNED_COST_PAGE_SIZE;
        const clickedLabel = mfgPlannedCostData[pageIndex + clickedIndex]?.group;
        if (!clickedLabel) return;
        const isCtrlOrMetaClick = event.native.ctrlKey || event.native.metaKey;

        if (isCtrlOrMetaClick) {
            const index = mfgSelectedProducts.indexOf(clickedLabel);
            if (index > -1) {
                if (mfgSelectedProducts.length > 1) mfgSelectedProducts.splice(index, 1);
            } else {
                mfgSelectedProducts.push(clickedLabel);
            }
        } else {
            if (mfgSelectedProducts.includes(clickedLabel) && mfgSelectedProducts.length === 1) {
                mfgSelectedProducts = mfgPlannedCostData.map(d => d.group);
            } else {
                mfgSelectedProducts = [clickedLabel];
            }
        }
        
        updateBarSelectionStyle(charts.plannedVsActualCost, mfgSelectedProducts);
        updateMfgVarianceByAreaChart();
        updateMfgYieldByAreaChart();
    }

    function renderMfgPlannedCostPage() {
        console.log("RENDER: planned cost page.", { currentPage: mfgPlannedCostCurrentPage });
        if (!charts.plannedVsActualCost) return;
        const { renderPaginationControls } = window.chartUtils;
        const pageStart = mfgPlannedCostCurrentPage * MFG_PLANNED_COST_PAGE_SIZE;
        const pageEnd = pageStart + MFG_PLANNED_COST_PAGE_SIZE;
        const pageData = mfgPlannedCostData.slice(pageStart, pageEnd);
        console.log("DATA: Planned Cost page data.", { pageData: pageData.slice(0,5) });

        charts.plannedVsActualCost.data.labels = pageData.map(d => d.group);
        charts.plannedVsActualCost.data.datasets[0].data = pageData.map(p => p.planned);
        charts.plannedVsActualCost.data.datasets[1].data = pageData.map(p => p.actual);
        window.chartUtils.updateBarSelectionStyle(charts.plannedVsActualCost, mfgSelectedProducts);
        charts.plannedVsActualCost.update();

        const totalPages = Math.ceil(mfgPlannedCostData.length / MFG_PLANNED_COST_PAGE_SIZE);
        console.log("Manufacturing Dashboard: Planned cost pagination.", { totalPages });
        renderPaginationControls(document.getElementById('mfg-planned-cost-pagination'), mfgPlannedCostCurrentPage, totalPages, (newPage) => {
            if (newPage >= 0 && newPage < totalPages) {
                mfgPlannedCostCurrentPage = newPage;
                renderMfgPlannedCostPage();
            }
        });
        console.log("END: renderMfgPlannedCostPage");
    }

    function updateMfgPlannedCostChart(event = {}) {
        if (!charts.plannedVsActualCost) return;

        const { selectedFabs, selectedTechnologies, selectedProducts } = window.globalFilters;
        const sourceData = window.appData?.dailyCostData || [];

        const filteredData = sourceData.filter(d => 
            (selectedFabs.length === 0 || selectedFabs.includes(d.fab)) &&
            (selectedTechnologies.length === 0 || selectedTechnologies.includes(d.technology)) &&
            (selectedProducts.length === 0 || selectedProducts.includes(d.productName))
        );

        const aggregatedByProduct = filteredData.reduce((acc, curr) => {
            if (!acc[curr.product]) {
                acc[curr.product] = { planned: 0, actual: 0 };
            }
            acc[curr.product].planned += curr.total_planned;
            acc[curr.product].actual += curr.total_actual;
            return acc;
        }, {});

        mfgPlannedCostData = Object.entries(aggregatedByProduct).map(([product, data]) => ({
            group: product,
            planned: data.planned,
            actual: data.actual
        })).sort((a, b) => b.actual - a.actual);
        
        if (event.type === 'globalFiltersChanged' || mfgSelectedProducts.length === 0) {
            console.log("Manufacturing Dashboard: Global filters changed or no products selected. Resetting product selection.");
            mfgSelectedProducts = mfgPlannedCostData.map(d => d.group);
        }

        mfgPlannedCostCurrentPage = 0;
        renderMfgPlannedCostPage();
    }

    function handleMfgVarianceAreaClick(event, elements) {
        console.log("ACTION: Variance Area chart clicked.", { elements });
        if (!elements || elements.length === 0) return;
        const clickedIndex = elements[0].index;
        const clickedLabel = charts.varianceByArea.data.labels[clickedIndex];
        const isCtrlOrMetaClick = event.native.ctrlKey || event.native.metaKey;
        if (isCtrlOrMetaClick) {
            const index = mfgSelectedProcessAreas.indexOf(clickedLabel);
            if (index > -1) {
                if (mfgSelectedProcessAreas.length > 1) mfgSelectedProcessAreas.splice(index, 1);
            } else {
                mfgSelectedProcessAreas.push(clickedLabel);
            }
        } else {
            mfgSelectedProcessAreas = [clickedLabel];
        }
        window.chartUtils.updateBarSelectionStyle(charts.varianceByArea, mfgSelectedProcessAreas);
    }

    function renderMfgVarianceByAreaPage() {
        if (!charts.varianceByArea) return;
        const { renderPaginationControls } = window.chartUtils;
        const pageStart = mfgVarianceByAreaCurrentPage * MFG_VARIANCE_BY_AREA_PAGE_SIZE;
        const pageEnd = pageStart + MFG_VARIANCE_BY_AREA_PAGE_SIZE;
        const pageData = mfgVarianceByAreaData.slice(pageStart, pageEnd);
        
        charts.varianceByArea.data.labels = pageData.map(d => d.group);
        charts.varianceByArea.data.datasets[0].data = pageData.map(d => d.variance);
        charts.varianceByArea.data.datasets[0].backgroundColor = pageData.map(d => d.variance > 0 ? window.chartUtils.chartColors.negative_variance : window.chartUtils.chartColors.positive_variance);
        charts.varianceByArea.update();

        const totalPages = Math.ceil(mfgVarianceByAreaData.length / MFG_VARIANCE_BY_AREA_PAGE_SIZE);
        renderPaginationControls(document.getElementById('mfg-variance-area-pagination'), mfgVarianceByAreaCurrentPage, totalPages, (newPage) => {
            if (newPage >= 0 && newPage < totalPages) {
                mfgVarianceByAreaCurrentPage = newPage;
                renderMfgVarianceByAreaPage();
            }
        });
    }

    function updateMfgVarianceByAreaChart() {
        console.log("START: updateMfgVarianceByAreaChart");
        if (!charts.varianceByArea) return;
        
        const varianceData = window.dateUtils.getAggregatedData(
            { ...window.globalFilters, selectedProducts: mfgSelectedProducts },
            'processArea',
            'product'
        );
        console.log("DATA: Variance by Area data received.", { varianceData });

        mfgVarianceByAreaData = (varianceData.barChartData || [])
            .sort((a,b) => Math.abs(b.variance) - Math.abs(a.variance));
        
        mfgVarianceByAreaCurrentPage = 0;
        renderMfgVarianceByAreaPage();
        console.log("END: updateMfgVarianceByAreaChart");
    }

    function updateMfgYieldByAreaChart() {
        if (!charts.yieldByArea) {
            console.error("Yield chart not initialized.");
            return;
        }
        console.log("--- START: updateMfgYieldByAreaChart ---");

        const { dateUtils, chartUtils } = window;
        const { selectedFabs } = window.globalFilters;
        const sourceData = window.appData?.processAreaYieldData || [];
        const mfgSelectedProductNames = mfgSelectedProducts.map(p => p.split(' (')[0]);
        console.log("1. Filtering based on:", { selectedFabs, mfgSelectedProductNames });
        console.log(`2. Source data has ${sourceData.length} records.`);

        const filteredData = sourceData.filter(d => {
            const productName = d.product.split(' (')[0];
            const fabName = d.product.match(/\(([^)]+)\)/)?.[1];
            const fabMatch = selectedFabs.length === 0 || selectedFabs.includes(fabName);
            const productMatch = mfgSelectedProductNames.length === 0 || mfgSelectedProductNames.includes(productName);
            return fabMatch && productMatch;
        });
        console.log(`3. Filtered data has ${filteredData.length} records.`);

        if (filteredData.length === 0) {
            charts.yieldByArea.data.labels = [];
            charts.yieldByArea.data.datasets = [];
            charts.yieldByArea.update();
            console.log("--- END: updateMfgYieldByAreaChart (no data after filtering) ---");
            return;
        }

        const { getPeriodKeyFunction, formatDateLabel, getTrendDateRange } = dateUtils;
        const aggregationLevel = window.globalFilters.aggregationLevel || 'Month';
        const dateRange = getTrendDateRange(aggregationLevel);
        const getPeriodKey = getPeriodKeyFunction(aggregationLevel);
        
        const aggregatedData = filteredData.reduce((acc, curr) => {
            const date = new Date(curr.date);
            if (date < dateRange.startDate || date > dateRange.endDate) return acc;
            
            const periodKey = getPeriodKey(date);
            if (!acc[periodKey]) acc[periodKey] = { dateObj: date, areas: {} };

            if (!acc[periodKey].areas[curr.processArea]) {
                acc[periodKey].areas[curr.processArea] = { yieldSum: 0, count: 0 };
            }

            acc[periodKey].areas[curr.processArea].yieldSum += curr.yield;
            acc[periodKey].areas[curr.processArea].count++;
            return acc;
        }, {});
        console.log("4. Aggregated data structure:", aggregatedData);
        
        const sortedPeriodKeys = Object.keys(aggregatedData).sort((a, b) => aggregatedData[a].dateObj - aggregatedData[b].dateObj);
        const allProcessAreas = [...new Set(filteredData.map(d => d.processArea))];
        console.log("5. Found unique process areas:", allProcessAreas);

        charts.yieldByArea.data.labels = sortedPeriodKeys.map(key => formatDateLabel(aggregatedData[key].dateObj, aggregationLevel));
        charts.yieldByArea.data.datasets = allProcessAreas.map((areaName, index) => {
            const data = sortedPeriodKeys.map(key => {
                const periodData = aggregatedData[key].areas[areaName];
                return (periodData && periodData.count > 0) ? (periodData.yieldSum / periodData.count) : null;
            });
            const color = chartUtils.chartColors.main[index % chartUtils.chartColors.main.length];
            return {
                label: areaName,
                data: data,
                borderColor: color,
                backgroundColor: color,
                fill: false,
                tension: 0.1,
            };
        });
        
        console.log("6. Final chart datasets:", charts.yieldByArea.data.datasets);
        charts.yieldByArea.update();
        console.log("--- END: updateMfgYieldByAreaChart (update successful) ---");
    }
    
    // --- Event Listener for Data ---
    document.addEventListener('dataReady', () => {
        console.log("Manufacturing Dashboard: dataReady event received.");
        isDataReady = true;
        if (isInitialized) {
            console.log("Manufacturing Dashboard: Module is initialized, calling updateAllManufacturingCharts.");
            updateAllManufacturingCharts();
        }
    });

    // --- Public API ---
    window.manufacturingDashboard = {
        initialize: initialize,
        destroyCharts: destroyCharts
    };
})();