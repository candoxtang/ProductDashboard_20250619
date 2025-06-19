(function() {
    // Force register the plugin to prevent race conditions
    if (window.ChartDataLabels) {
        Chart.register(window.ChartDataLabels);
    }

    // --- CHART STYLING & CONFIG ---
    const CHART_UTILS = window.chartUtils;
    const { formatChartValue } = window.dateUtils;
    const { updateBarSelectionStyle, renderPaginationControls } = window.chartUtils;

    // This file now only handles Org Costing charts.
    // Manufacturing charts are handled in manufacturing-dashboard.js
    // Quality charts are handled in quality-dashboard.js
    
    // --- ORGANIZATIONAL COSTING ---
    let orgLevel1Chart, orgLevel2Chart, orgVarianceTrendChart, orgLevel3Chart, orgYieldTrendChart, orgScrapMesChart;
    let orgChartsInitialized = false;
    let orgLevel1Data = [];
    let orgL1CurrentPage = 0;
    let orgL1TotalPages = 0;
    const ORG_L1_PAGE_SIZE = 10;
    let orgSelectedProducts = [];
    let orgSelectedProcessAreas = [];

    // --- EVENT LISTENERS ---
    document.addEventListener('globalFiltersChanged', (event) => {
        if (orgChartsInitialized && document.getElementById('org-costing-overview')?.classList.contains('active')) {
             updateAllOrgCharts(event);
        }
    });

    // =================================================================================
    // ORGANIZATIONAL COSTING CHART FUNCTIONS
    // =================================================================================

    function initializeOrgCostingDashboard() {
        if (orgChartsInitialized) return;
        
        const createChart = (ctx, config) => ctx ? new Chart(ctx, config) : null;

        const trendChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatChartValue(context.raw, true)}` } },
                datalabels: {
                    display: true,
                    align: 'end',
                    anchor: 'end',
                    backgroundColor: (context) => context.dataset.borderColor,
                    borderRadius: 4,
                    color: 'white',
                    font: { weight: 'bold' },
                    padding: 4,
                    formatter: (value, context) => {
                        const lastIndex = context.chart.data.labels.length - 1;
                        return context.dataIndex === lastIndex ? context.dataset.label : null;
                    }
                }
            }
        };

        const yieldTrendOptions = {
            ...trendChartOptions,
                plugins: {
                 ...trendChartOptions.plugins,
                    tooltip: {
                    callbacks: { label: (c) => `${c.raw.toFixed(2)}%` }
                 }
             },
             scales: { y: { min: 84, max: 96, ticks: { callback: (v) => `${v.toFixed(1)}%` } } }
        };

        orgLevel1Chart = createChart(document.getElementById('org-costing-level1')?.getContext('2d'), { 
            type: 'bar',
            data: { datasets: [ { label: 'Planned', backgroundColor: CHART_UTILS.chartColors.planned }, { label: 'Actual', backgroundColor: CHART_UTILS.chartColors.actual } ] }, 
            options: { onClick: handleOrgLevel1Click, indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, datalabels: { display: false } }, scales: { x: { ticks: { callback: (v) => formatChartValue(v) } } } } 
        });
        orgLevel2Chart = createChart(document.getElementById('org-costing-level2')?.getContext('2d'), { type: 'bar', data: { datasets: [{ label: 'Variance' }] }, options: { onClick: handleOrgLevel2Click, indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { display: false } }, scales: { x: { ticks: { callback: (v) => formatChartValue(v) } } } } });
        orgVarianceTrendChart = createChart(document.getElementById('variance-trend-chart')?.getContext('2d'), { 
            type: 'line',
            options: { ...trendChartOptions, scales: { y: { ticks: { callback: (v) => formatChartValue(v) } } } } 
        });
        orgLevel3Chart = createChart(document.getElementById('org-costing-level3')?.getContext('2d'), { type: 'bar', data: { datasets: [{ label: 'Variance' }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { display: false } }, scales: { x: { ticks: { callback: (v) => formatChartValue(v) } } } } });
        orgYieldTrendChart = createChart(document.getElementById('org-costing-yield-trend')?.getContext('2d'), { type: 'line', options: yieldTrendOptions });
        orgScrapMesChart = createChart(document.getElementById('org-costing-scrap-mes')?.getContext('2d'), { type: 'bar', data: { datasets: [{ label: 'Scrap Cost (Variance > 0) ($K)' }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Scrap Cost ($ Thousands)' } } }, plugins: { legend: { display: false }, datalabels: { display: false } } } });

        orgChartsInitialized = true;
        updateAllOrgCharts();
    }
    
    function handleOrgLevel1Click(event, elements) {
        if (!elements.length) return;

        const nativeEvent = event.native;
        const clickedLabel = orgLevel1Chart.data.labels[elements[0].index];
        const isCtrlOrMetaClick = nativeEvent.ctrlKey || nativeEvent.metaKey;

        if (isCtrlOrMetaClick) {
            const index = orgSelectedProducts.indexOf(clickedLabel);
            if (index > -1) {
                if (orgSelectedProducts.length > 1) {
                    orgSelectedProducts.splice(index, 1);
                }
            } else {
                orgSelectedProducts.push(clickedLabel);
            }
        } else {
            orgSelectedProducts = [clickedLabel];
        }

        updateBarSelectionStyle(orgLevel1Chart, orgSelectedProducts);

        const l2Data = updateOrgLevel2Charts(orgSelectedProducts);
        updateOrgLevel3Chart(orgSelectedProducts, l2Data.selectedProcessAreas);
        updateOrgYieldTrendChart(orgSelectedProducts);
        updateOrgTopScrapMesChart(orgSelectedProducts);
    }
    
    function handleOrgLevel2Click(event, elements) {
        if (!elements.length) return;

        const nativeEvent = event.native;
        const clickedLabel = orgLevel2Chart.data.labels[elements[0].index];
        const isCtrlOrMetaClick = nativeEvent.ctrlKey || nativeEvent.metaKey;

        if (isCtrlOrMetaClick) {
            const index = orgSelectedProcessAreas.indexOf(clickedLabel);
            if (index > -1) {
                if (orgSelectedProcessAreas.length > 1) {
                    orgSelectedProcessAreas.splice(index, 1);
                }
            } else {
                orgSelectedProcessAreas.push(clickedLabel);
            }
        } else {
            orgSelectedProcessAreas = [clickedLabel];
        }

        updateBarSelectionStyle(orgLevel2Chart, orgSelectedProcessAreas);
        updateOrgLevel3Chart(orgSelectedProducts, orgSelectedProcessAreas);
        updateOrgYieldTrendChart(orgSelectedProducts);
        updateOrgTopScrapMesChart(orgSelectedProducts);
    }

    function handleOrgL1PageChange(newPage) {
        if (newPage >= 0 && newPage < orgL1TotalPages) {
            orgL1CurrentPage = newPage;
            renderOrgLevel1ChartPage();
        }
    }

    function renderOrgPaginationControls() {
        const container = document.getElementById('level-1-pagination');
        if (!container) return;
        orgL1TotalPages = Math.ceil(orgLevel1Data.length / ORG_L1_PAGE_SIZE);
        renderPaginationControls(container, orgL1CurrentPage, orgL1TotalPages, handleOrgL1PageChange);
    }

    function renderOrgLevel1ChartPage() {
        const pageStart = orgL1CurrentPage * ORG_L1_PAGE_SIZE;
        const pageEnd = pageStart + ORG_L1_PAGE_SIZE;
        const pageData = orgLevel1Data.slice(pageStart, pageEnd);

        orgLevel1Chart.data.labels = pageData.map(p => p.group);
        orgLevel1Chart.data.datasets[0].data = pageData.map(p => p.total_planned);
        orgLevel1Chart.data.datasets[1].data = pageData.map(p => p.total_actual);
        
        updateBarSelectionStyle(orgLevel1Chart, orgSelectedProducts);
        orgLevel1Chart.update();
        renderOrgPaginationControls();
    }
    
    function updateAllOrgCharts() {
        if (!orgChartsInitialized) return;

        const { trendData, barChartData } = window.dateUtils.getAggregatedData(window.globalFilters, 'product');

        orgLevel1Data = barChartData.sort((a,b) => b.total_actual - a.total_actual);
        
        orgL1CurrentPage = 0;
        orgSelectedProducts = orgLevel1Data.slice(0, ORG_L1_PAGE_SIZE).map(p => p.group);
        
        renderOrgLevel1ChartPage();
        const l2Data = updateOrgLevel2Charts(orgSelectedProducts); 
        updateOrgLevel3Chart(orgSelectedProducts, l2Data.selectedProcessAreas);
        updateOrgYieldTrendChart(orgSelectedProducts);
        updateOrgTopScrapMesChart(orgSelectedProducts);
    }

    function updateOrgLevel2Charts(forProducts) {
        const productsToFilter = forProducts || [];
        const customFilters = { ...window.globalFilters, selectedProducts: productsToFilter };
        
        const processAreaData = window.dateUtils.getAggregatedData(customFilters, 'processArea', 'product');
        const topProcessAreas = (processAreaData.barChartData || []).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 10);
        const currentSelectedAreas = topProcessAreas.map(p => p.group);

        orgLevel2Chart.data.labels = topProcessAreas.map(p => p.group);
        const level2Dataset = orgLevel2Chart.data.datasets[0];
        level2Dataset.data = topProcessAreas.map(p => p.variance);
        level2Dataset.originalBackgroundColor = topProcessAreas.map(p => p.variance >= 0 ? CHART_UTILS.chartColors.positive_variance : CHART_UTILS.chartColors.negative_variance);
        orgLevel2Chart.data.datasets[0].backgroundColor = level2Dataset.originalBackgroundColor;

        updateBarSelectionStyle(orgLevel2Chart, currentSelectedAreas);
        orgLevel2Chart.update();
        
        const productTrendData = window.dateUtils.getAggregatedData(customFilters, 'product', 'product');
        const trend = productTrendData.trendData;

        orgVarianceTrendChart.data.labels = trend.labels;
        orgVarianceTrendChart.data.datasets = trend.groups.slice(0, 5).map((group, i) => {
            const color = getProductColor(group.productName);
            const pointStyle = fabPointStyles[group.fab] || 'circle';
            const groupData = trend.datasets[group.displayName];
            const varianceData = groupData.actual.map((val, idx) => val - groupData.planned[idx]);

            return {
                label: group.displayName,
                data: varianceData,
                borderColor: color,
                backgroundColor: color,
                pointStyle: pointStyle,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.1,
                fill: false
            };
        });
        orgVarianceTrendChart.update();

        return { selectedProcessAreas: currentSelectedAreas };
    }
    
    function updateOrgLevel3Chart(forProducts, forProcessAreas) {
        if (!forProcessAreas || forProcessAreas.length === 0) {
            orgLevel3Chart.data.labels = [];
            orgLevel3Chart.data.datasets[0].data = [];
            orgLevel3Chart.update();
            return;
        }
        const customFilters = { ...window.globalFilters, selectedProducts: forProducts, selectedProcessAreas: forProcessAreas };
        const mesStepData = window.dateUtils.getAggregatedData(customFilters, 'mesStep', 'product');
        const topMesSteps = (mesStepData.barChartData || []).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 10);
        
        orgLevel3Chart.data.labels = topMesSteps.map(m => m.group);
        const level3Dataset = orgLevel3Chart.data.datasets[0];
        level3Dataset.data = topMesSteps.map(m => m.variance);
        level3Dataset.originalBackgroundColor = topMesSteps.map(p => p.variance >= 0 ? CHART_UTILS.chartColors.positive_variance : CHART_UTILS.chartColors.negative_variance);
        orgLevel3Chart.data.datasets[0].backgroundColor = level3Dataset.originalBackgroundColor;
        orgLevel3Chart.update();
    }
    
    function updateOrgYieldTrendChart(forProducts) {
        if (!orgYieldTrendChart) return;

        const productsToFilter = forProducts || [];
        const customFilters = { ...window.globalFilters, selectedProducts: productsToFilter };
        const productTrendData = window.dateUtils.getAggregatedData(customFilters, 'product', 'product');
        const trend = productTrendData.trendData;

        orgYieldTrendChart.data.labels = trend.labels;
        orgYieldTrendChart.data.datasets = trend.groups.slice(0, 5).map((group, i) => {
            const dataLength = trend.labels.length;
            let yieldData = new Array(dataLength);

            switch (group.productName) {
                case 'Product Alpha':
                    for (let j = 0; j < dataLength; j++) { yieldData[j] = 85.0 + Math.random() * 2.5; }
                    break;
                case 'Product Gamma':
                    for (let j = 0; j < dataLength; j++) { yieldData[j] = 94.0 + Math.random() * 1.0; }
                    break;
                case 'Product Delta':
                    for (let j = 0; j < dataLength; j++) { yieldData[j] = 91.0 - (j / dataLength) * 3; }
                    break;
                 case 'Product Epsilon':
                     for (let j = 0; j < dataLength; j++) { yieldData[j] = 92.5 + Math.sin(j / (dataLength / 4)) * 1.5; }
                    break;
                default:
                    for (let j = 0; j < dataLength; j++) { yieldData[j] = 88.0 + Math.random() * 5; }
            }
            const color = getProductColor(group.productName);
            const pointStyle = fabPointStyles[group.fab] || 'circle';

            return {
                label: group.displayName,
                data: yieldData,
                borderColor: color,
                backgroundColor: color,
                pointStyle: pointStyle,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.1,
                fill: false
            };
        });
        orgYieldTrendChart.update();
    }
    
    function updateOrgTopScrapMesChart(forProducts) {
        if (!orgScrapMesChart) return;
        const productsToFilter = forProducts || [];
        const customFilters = { ...window.globalFilters, selectedProducts: productsToFilter };
        const scrapData = window.dateUtils.getAggregatedData(customFilters, 'mesStep', 'product');

        const topScrap = (scrapData.barChartData || [])
            .filter(d => d.scrap_cost > 0)
            .sort((a,b) => b.scrap_cost - a.scrap_cost)
            .slice(0, 10);

        orgScrapMesChart.data.labels = topScrap.map(s => s.group);
        const dataset = orgScrapMesChart.data.datasets[0];
        dataset.data = topScrap.map(s => s.scrap_cost / 1000); // Display in $K
        dataset.backgroundColor = CHART_UTILS.chartColors.negative_variance;
        orgScrapMesChart.update();
    }

    function destroyAll() {
        CHART_UTILS.destroyChart(orgLevel1Chart);
        CHART_UTILS.destroyChart(orgLevel2Chart);
        CHART_UTILS.destroyChart(orgVarianceTrendChart);
        CHART_UTILS.destroyChart(orgLevel3Chart);
        CHART_UTILS.destroyChart(orgYieldTrendChart);
        CHART_UTILS.destroyChart(orgScrapMesChart);
        orgChartsInitialized = false;
    }


    // =================================================================================
    // PUBLIC API
    // =================================================================================
    window.charts = {
        initializeOrgCostingDashboard: initializeOrgCostingDashboard,
        destroyAll: destroyAll,
    };
})(); 