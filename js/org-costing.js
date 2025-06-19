(function() { // IIFE to encapsulate scope
    'use strict';
    
    // This check is important. If the script is somehow loaded twice, we don't want to redefine everything.
    if (window.orgCosting) {
        return;
    }

    console.log("Org Costing script loaded. Waiting for dataReady to initialize.");

    // --- Module-level state ---
    let charts = { level1: null, level2: null, varianceTrend: null, level3: null, yieldTrend: null, scrapMes: null };
    let isInitialized = false;
    let isDataReady = false;

    let level1Data = [];
    let selectedProducts = [];
    let selectedProcessAreas = [];
    
    const fabPointStyles = { 'Fab A': 'triangle', 'Fab B': 'rect', 'Fab C': 'rectRot' };

    // --- Pagination State & Handlers ---
    const L1_PAGE_SIZE = 10;
    let l1CurrentPage = 0;
    let l1TotalPages = 0;

    function handleL1PageChange(newPage) {
        if (newPage >= 0 && newPage < l1TotalPages) {
            l1CurrentPage = newPage;
            renderLevel1ChartPage();
        }
    }

    // --- Core Lifecycle Functions ---
    function initialize() {
        if (isInitialized) {
            console.log("Org Costing: Already initialized.");
            return;
        }
        console.log("Org Costing: Initializing dashboard.");
        
        const tabId = 'org-costing-overview';
        const tab = document.getElementById(tabId);
        if (!tab) {
            console.error("Org Costing: Could not find tab element #" + tabId);
            return;
        }

        try {
            setupCharts();
            console.log("Org Costing: Charts setup complete.");
            
            isInitialized = true;
            document.addEventListener('globalFiltersChanged', updateAllOrgCharts);
            console.log("Org Costing: Initialization complete and event listener added.");

            // If data is already ready, update charts immediately. Otherwise, wait for dataReady event.
            if (isDataReady) {
                console.log("Org Costing: Data is ready, updating charts now.");
                updateAllOrgCharts();
            } else {
                console.log("Org Costing: Initialization complete, waiting for data to be ready.");
            }
        } catch (error) {
            console.error("Org Costing: CRITICAL ERROR during initialization.", error);
            isInitialized = false; // Reset on failure
        }
    }
    
    function destroyCharts() {
        if (!isInitialized) return;
        console.log("Destroying Org Costing charts.");
        
        Object.values(charts).forEach(window.chartUtils.destroyChart);
        charts = { level1: null, level2: null, varianceTrend: null, level3: null, yieldTrend: null, scrapMes: null };
        
        isInitialized = false;
        document.removeEventListener('globalFiltersChanged', updateAllOrgCharts);
    }

    // --- Chart Click Handlers ---
    function handleLevel1Click(event, elements) {
        if (!elements.length) return;
        const { native } = event;
        const clickedLabel = charts.level1.data.labels[elements[0].index];
        const isCtrlOrMetaClick = native.ctrlKey || native.metaKey;

        if (isCtrlOrMetaClick) {
            const index = selectedProducts.indexOf(clickedLabel);
            if (index > -1) {
                if (selectedProducts.length > 1) selectedProducts.splice(index, 1);
            } else {
                selectedProducts.push(clickedLabel);
            }
        } else {
            selectedProducts = [clickedLabel];
        }

        window.chartUtils.updateBarSelectionStyle(charts.level1, selectedProducts);
        const l2Data = updateLevel2Charts(selectedProducts);
        updateLevel3Chart(selectedProducts, l2Data.selectedProcessAreas);
        updateYieldTrendChart(selectedProducts);
        updateTopScrapMesChart(selectedProducts);
    }

    function handleLevel2Click(event, elements) {
        if (!elements.length) return;
        const { native } = event;
        const clickedLabel = charts.level2.data.labels[elements[0].index];
        const isCtrlOrMetaClick = native.ctrlKey || native.metaKey;

        if (isCtrlOrMetaClick) {
            const index = selectedProcessAreas.indexOf(clickedLabel);
            if (index > -1) {
                if (selectedProcessAreas.length > 1) selectedProcessAreas.splice(index, 1);
            } else {
                selectedProcessAreas.push(clickedLabel);
            }
        } else {
            selectedProcessAreas = [clickedLabel];
        }

        window.chartUtils.updateBarSelectionStyle(charts.level2, selectedProcessAreas);
        updateLevel3Chart(selectedProducts, selectedProcessAreas);
    }

    // --- Chart Rendering & Update Logic ---
    function renderLevel1ChartPage() {
        if (!charts.level1) return;
        const pageStart = l1CurrentPage * L1_PAGE_SIZE;
        const pageEnd = pageStart + L1_PAGE_SIZE;
        const pageData = level1Data.slice(pageStart, pageEnd);

        charts.level1.data.labels = pageData.map(p => p.group);
        charts.level1.data.datasets[0].data = pageData.map(p => p.total_planned);
        charts.level1.data.datasets[1].data = pageData.map(p => p.total_actual);
        
        window.chartUtils.updateBarSelectionStyle(charts.level1, selectedProducts);
        charts.level1.update();
        window.chartUtils.renderPaginationControls(document.getElementById('level-1-pagination'), l1CurrentPage, l1TotalPages, handleL1PageChange);
    }

    function updateAllOrgCharts() {
        if (!isInitialized || !isDataReady) {
            console.log("Org Costing: Skipping update, not initialized or data not ready.", { isInitialized, isDataReady });
            return;
        }
        console.log("Org Costing: Starting updateAllOrgCharts.");

        try {
            const { dateUtils } = window;
            
            // DEBUG: Check today's data
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            console.log(`DEBUG: System today date object:`, today);
            console.log(`DEBUG: System timezone offset:`, today.getTimezoneOffset());
            console.log(`DEBUG: System today ISO string:`, today.toISOString());
            console.log(`DEBUG: System today date string:`, todayString);
            
            const dailySummary = window.appData?.dailySummary || {};
            const todayKeys = Object.keys(dailySummary).filter(key => key.startsWith(todayString));
            console.log(`DEBUG: Today (${todayString}) has ${todayKeys.length} entries in dailySummary`);
            
            // Show sample of available dates
            const allKeys = Object.keys(dailySummary);
            const sampleKeys = allKeys.slice(0, 10);
            console.log(`DEBUG: Sample dailySummary keys:`, sampleKeys);
            
            const allDates = [...new Set(allKeys.map(key => key.split('|')[0]))].sort();
            console.log(`DEBUG: Available dates range:`, allDates.slice(0, 5), '...', allDates.slice(-5));
            
            // DEBUG: Check date range for Day view
            const dayRange = dateUtils.getBarChartDateRange('Day');
            const startString = dayRange.startDate.toISOString().split('T')[0];
            const endString = dayRange.endDate.toISOString().split('T')[0];
            console.log(`DEBUG: Day view date range: ${startString} to ${endString}`);
            console.log(`DEBUG: Global filters:`, window.globalFilters);
            
            const { trendData, barChartData } = dateUtils.getAggregatedData(window.globalFilters, 'product');
            console.log("Org Costing: Aggregated data received.", { trendData, barChartData });
            console.log(`DEBUG: barChartData has ${barChartData.length} products`);
            
            level1Data = barChartData.sort((a,b) => b.total_actual - a.total_actual);
            l1TotalPages = Math.ceil(level1Data.length / L1_PAGE_SIZE);
            console.log(`Org Costing: Level 1 data processed. Total pages: ${l1TotalPages}`);
            
            l1CurrentPage = 0;
            selectedProducts = level1Data.map(p => p.group);
            console.log(`Org Costing: Default products selected (${selectedProducts.length} products).`, selectedProducts);
            
            renderLevel1ChartPage();
            console.log("Org Costing: Level 1 chart rendered.");
            const l2Data = updateLevel2Charts(selectedProducts); 
            console.log("Org Costing: Level 2 charts updated.");
            updateLevel3Chart(selectedProducts, l2Data.selectedProcessAreas);
            console.log("Org Costing: Level 3 chart updated.");
            updateYieldTrendChart(selectedProducts);
            console.log("Org Costing: Yield trend chart updated.");
            updateTopScrapMesChart(selectedProducts);
            console.log("Org Costing: Top scrap MES chart updated.");
            console.log("Org Costing: updateAllOrgCharts completed successfully.");
        } catch (error) {
            console.error("Org Costing: CRITICAL ERROR during updateAllOrgCharts.", error);
        }
    }

    function updateLevel2Charts(forProducts) {
        if (!charts.level2 || !charts.varianceTrend) return;
        const { dateUtils, chartUtils } = window;
        const productsToFilter = forProducts || [];
        const customFilters = { ...window.globalFilters, selectedProducts: productsToFilter };
        
        const processAreaData = dateUtils.getAggregatedData(customFilters, 'processArea', 'product');
        const topProcessAreas = (processAreaData.barChartData || []).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 10);
        selectedProcessAreas = topProcessAreas.map(p => p.group);

        charts.level2.data.labels = topProcessAreas.map(p => p.group);
        const level2Dataset = charts.level2.data.datasets[0];
        level2Dataset.data = topProcessAreas.map(p => p.variance);
        level2Dataset.backgroundColor = topProcessAreas.map(p => p.variance >= 0 ? chartUtils.chartColors.positive_variance : chartUtils.chartColors.negative_variance);

        chartUtils.updateBarSelectionStyle(charts.level2, selectedProcessAreas);
        charts.level2.update();
        
        const processAreaTrendData = dateUtils.getAggregatedData(customFilters, 'processArea', 'product');
        const trend = processAreaTrendData.trendData;

        charts.varianceTrend.data.labels = trend.labels;
        charts.varianceTrend.data.datasets = trend.groups.slice(0, 5).map((group, index) => {
            const color = window.chartUtils.getProcessAreaColor(group.displayName) || window.chartUtils.chartColors.processAreaColors[index % window.chartUtils.chartColors.processAreaColors.length];
            const pointStyle = 'circle';
            const groupData = trend.datasets[group.displayName];
            const varianceData = groupData.actual.map((val, idx) => val - groupData.planned[idx]);
            const randomLabelIndex = Math.floor(Math.random() * varianceData.length);

            return { 
                label: group.displayName, 
                data: varianceData, 
                borderColor: color, 
                backgroundColor: color, 
                pointStyle: pointStyle, 
                pointRadius: 6, 
                pointHoverRadius: 8, 
                tension: 0.1, 
                fill: false,
                randomLabelIndex: randomLabelIndex
            };
        });
        charts.varianceTrend.update();

        return { selectedProcessAreas };
    }
    
    function updateLevel3Chart(forProducts, forProcessAreas) {
        if (!charts.level3) return;
        if (!forProcessAreas || forProcessAreas.length === 0) {
            clearLevel3Chart();
            return;
        }
        const { dateUtils, chartUtils } = window;
        const customFilters = { ...window.globalFilters, selectedProducts: forProducts, selectedProcessAreas: forProcessAreas };
        const mesStepData = dateUtils.getAggregatedData(customFilters, 'mesStep', 'product');
        const topMesSteps = (mesStepData.barChartData || []).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 10);
        
        charts.level3.data.labels = topMesSteps.map(m => m.group);
        const level3Dataset = charts.level3.data.datasets[0];
        level3Dataset.data = topMesSteps.map(m => m.variance);
        level3Dataset.backgroundColor = topMesSteps.map(p => p.variance >= 0 ? chartUtils.chartColors.positive_variance : chartUtils.chartColors.negative_variance);
        charts.level3.update();
    }

    function updateYieldTrendChart(forProducts) {
        if (!charts.yieldTrend) return;
        const { dateUtils } = window;
        const productsToFilter = forProducts || [];
        const customFilters = { ...window.globalFilters, selectedProducts: productsToFilter };
        const productTrendData = dateUtils.getAggregatedData(customFilters, 'product', 'product');
        const trend = productTrendData.trendData;

        charts.yieldTrend.data.labels = trend.labels;
        charts.yieldTrend.data.datasets = trend.groups.slice(0, 5).map((group) => {
            const dataLength = trend.labels.length;
            let yieldData = new Array(dataLength).fill(0);
            const baseYield = window.appData.configData.products.find(p => p.displayName === group.displayName)?.baseYield || 0.9;
            const volatility = Math.random() * 0.05;

            for (let j = 0; j < dataLength; j++) {
                yieldData[j] = (baseYield + (Math.random() - 0.5) * volatility) * 100;
            }
           
            const color = window.chartUtils.getProductColor(group.displayName);
            const pointStyle = fabPointStyles[group.fab] || 'circle';
            const randomLabelIndex = Math.floor(Math.random() * yieldData.length);

            return {
                label: group.displayName,
                data: yieldData,
                borderColor: color,
                backgroundColor: color,
                pointStyle: pointStyle,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.1,
                fill: false,
                randomLabelIndex: randomLabelIndex
            };
        });
        charts.yieldTrend.update();
    }

    function updateTopScrapMesChart(forProducts) {
        if (!charts.scrapMes) return;
        const { dateUtils, chartUtils } = window;
        const productsToFilter = forProducts || [];
        const customFilters = { ...window.globalFilters, selectedProducts: productsToFilter };
        const scrapData = dateUtils.getAggregatedData(customFilters, 'mesStep', 'product');

        const topScrapSteps = (scrapData.barChartData || []).filter(d => d.variance > 0).sort((a, b) => b.variance - a.variance).slice(0, 15);

        charts.scrapMes.data.labels = topScrapSteps.map(d => d.group);
        charts.scrapMes.data.datasets[0].data = topScrapSteps.map(d => d.variance);
        charts.scrapMes.data.datasets[0].backgroundColor = chartUtils.chartColors.negative_variance;
        charts.scrapMes.update();
    }

    function clearLevel3Chart() {
        if (!charts.level3) return;
        charts.level3.data.labels = [];
        charts.level3.data.datasets[0].data = [];
        charts.level3.update();
    }
    
    // --- Chart Instantiation ---
    function setupCharts() {
        if (window.ChartDataLabels) {
            Chart.register(window.ChartDataLabels);
        }
        const createChart = (id, config) => {
            const ctx = document.getElementById(id)?.getContext('2d');
            if (!ctx) {
                console.error("Could not find canvas with id:", id);
                return null;
            }
            return new Chart(ctx, config);
        };
        const { formatNumber, chartColors } = window.chartUtils;

        const baseBarOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatNumber(context.raw, 2)}` } },
                datalabels: { display: false }
            },
            scales: {
                x: { stacked: false },
                y: { stacked: false, ticks: { callback: (v) => formatNumber(v, 2) } }
            }
        };

        const horizontalBarOptions = {
            ...baseBarOptions,
            indexAxis: 'y',
            plugins: {
                ...baseBarOptions.plugins,
                legend: { display: false },
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'end',
                    formatter: (value) => formatNumber(value, 2),
                    color: '#333'
                }
            },
            scales: {
                x: { stacked: false, ticks: { callback: (v) => formatNumber(v, 2) } },
                y: { stacked: false }
            }
        };

        const trendChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false },
                datalabels: {
                    display: (context) => context.dataIndex === context.dataset.randomLabelIndex,
                    align: 'top',
                    backgroundColor: (context) => context.dataset.backgroundColor,
                    borderRadius: 4,
                    color: 'white',
                    font: { weight: 'bold' },
                    formatter: (value, context) => context.dataset.label.split(' (')[0],
                    padding: 6
                }
            },
            scales: { y: { beginAtZero: false, ticks: { callback: (v) => formatNumber(v, 2) } } }
        };

        charts.level1 = createChart('org-costing-level1', { 
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Planned', data: [] }, { label: 'Actual', data: [] }] },
            options: { ...horizontalBarOptions, onClick: handleLevel1Click } 
        });
        charts.level2 = createChart('org-costing-level2', { 
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Variance', data: [] }] },
            options: { ...horizontalBarOptions, onClick: handleLevel2Click } 
        });
        charts.varianceTrend = createChart('variance-trend-chart', {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: trendChartOptions
        });
        charts.level3 = createChart('org-costing-level3', { 
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Variance', data: [] }] },
            options: horizontalBarOptions 
        });
        charts.yieldTrend = createChart('yield-trend-chart', {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: { ...trendChartOptions, scales: { ...trendChartOptions.scales, y: { ...trendChartOptions.scales.y, ticks: { callback: (v) => `${v.toFixed(2)}%` } } } }
        });
        charts.scrapMes = createChart('scrap-mes-chart', {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Scrap Cost', data: [] }] },
            options: horizontalBarOptions
        });
    }

    // --- Event Listener ---
    document.addEventListener('dataReady', () => {
        console.log("Org Costing: dataReady event received.");
        isDataReady = true;
        // If the module has already been initialized, trigger an update.
        if (isInitialized) {
            console.log("Org Costing: Module is initialized, calling updateAllOrgCharts.");
            updateAllOrgCharts();
        }
    });

    // --- Public API ---
    window.orgCosting = {
        setupDashboard: initialize,
        destroyCharts: destroyCharts
    };

})(); // End of IIFE