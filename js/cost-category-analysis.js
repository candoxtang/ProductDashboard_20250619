(function() { // IIFE to encapsulate scope
    'use strict';

    if (window.costCategoryAnalysis) {
        return;
    }
    
    console.log("Cost Category Analysis Script loaded. Waiting for enhancedDataReady to initialize.");

    // --- Module-level state ---
    let mainChart = null;
    let detailChart = null;
    let isInitialized = false;
    let currentAnalyzeBy = 'product';
    
    // Chart pagination
    let mainCurrentPage = 1;
    let detailCurrentPage = 1;
    let selectedDetailKeys = [];
    let isInitialLoad = true;
    
    // Grid state
    let gridData = [];
    let filteredGridData = [];
    let gridCurrentPage = 1;
    let gridSortField = 'completedTime';
    let gridSortDirection = 'desc';
    let gridSearchTerm = '';
    let gridStatusFilter = '';

    
    const ITEMS_PER_PAGE = 10;
    const DETAIL_ITEMS_PER_PAGE = 10;
    const GRID_ITEMS_PER_PAGE = 25;

    // --- Core Lifecycle Functions ---
    function initialize() {
        if (isInitialized) return;
        console.log("Cost Category Analysis: Initializing...");

        const categorySelect = document.getElementById('category-select');
        if (!categorySelect) {
            console.error("Cost Category Analysis: Could not find #category-select dropdown. Aborting initialization.");
            return;
        }

        try {
            setupCharts();
            setupGrid();
            console.log("Cost Category Analysis: Chart objects created.");
            
            // Set up event listeners
            document.getElementById('category-select').addEventListener('change', (e) => {
                currentAnalyzeBy = e.target.value;
                mainCurrentPage = 1;
                isInitialLoad = true;
                updateVisuals();
            });
            
            setupGridEventListeners();
            
            // Add global filter change listener
            document.addEventListener('globalFiltersChanged', function(event) {
                if (isInitialized && window.main && window.main.getCurrentTab() === 'cost-category-analysis') {
                    console.log("Cost Category Analysis: Global filters changed, updating visuals and grid");
                    isInitialLoad = true; // Reset selection when filters change
                    updateVisuals();
                    if (gridData.length > 0) {
                        updateGrid();
                    }
                }
            });
            
            // Add aggregation level change listener (View by dropdown)
            const aggregationSelect = document.getElementById('aggregation-select');
            if (aggregationSelect) {
                aggregationSelect.addEventListener('change', function() {
                    if (isInitialized && window.main && window.main.getCurrentTab() === 'cost-category-analysis') {
                        console.log("Cost Category Analysis: Aggregation level changed, updating visuals");
                        isInitialLoad = true; // Reset selection when time period changes
                        updateVisuals();
                    }
                });
            }
            
            console.log("Cost Category Analysis: Initialization complete, event listeners added.");

            isInitialized = true;
            
            if(window.appData && window.appData.mesData) {
                console.log("Cost Category Analysis: Data was already available on initialization.");
                isInitialLoad = true;
                currentAnalyzeBy = categorySelect.value;
                updateVisuals();
            }
            
            // Also check if lot data is available for the grid
            if(window.appData && window.appData.lotData) {
                console.log("Cost Category Analysis: Lot data was already available on initialization.");
                gridData = [...window.appData.lotData];
                updateGrid();
            }

        } catch (error) {
            console.error("Cost Category Analysis: CRITICAL ERROR during initialization.", error);
            isInitialized = false;
        }
    }
    
    function destroyCharts() {
        if (!isInitialized) return;
        console.log("Cost Category Analysis: Destroying charts.");
        window.chartUtils.destroyChart(mainChart);
        window.chartUtils.destroyChart(detailChart);
        mainChart = null;
        detailChart = null;
        isInitialized = false;
    }
    
    // --- Data Processing & Chart Updates ---
    function updateVisuals() {
        if (!isInitialized || !window.dateUtils) {
            console.log("Cost Category Analysis: Skipping update, not initialized or dateUtils not ready.");
            return;
        }
        console.log(`Cost Category Analysis: Updating visuals for '${currentAnalyzeBy}' on page ${mainCurrentPage}.`);

        // Use the same data aggregation logic as org costing
        const { dateUtils } = window;
        const { trendData, barChartData } = dateUtils.getAggregatedData(window.globalFilters, currentAnalyzeBy);
        
        console.log("Cost Category Analysis: Aggregated data received.", { currentAnalyzeBy, barChartData });
        
        if (!barChartData || barChartData.length === 0) {
            console.warn("Cost Category Analysis: No data after filtering. Displaying empty chart.");
            // Reset both charts safely
            mainChart.data = { labels: [], datasets: [{ data: [] }, { data: [] }] };
            mainChart.update();
            updateDetailChart(true); // Clears the detail chart
            
            // Clear pagination with standard controls
            const { renderPaginationControls } = window.chartUtils;
            renderPaginationControls(document.getElementById('cca-pagination'), 0, 1, () => {});
            return;
        }

        // Sort by largest absolute variance for lot analysis, otherwise by total actual cost
        let sortedData = [...barChartData];
        if (currentAnalyzeBy === 'lot') {
            // For lot analysis, sort by absolute variance (largest variance first)
            sortedData.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
        } else if (currentAnalyzeBy === 'processArea' || currentAnalyzeBy === 'stage') {
            // For process area and stage, sort by absolute variance
            sortedData.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
        } else {
            // For product analysis, sort by total actual cost
            sortedData.sort((a, b) => b.total_actual - a.total_actual);
        }

        // Paginate the data
        const totalItems = sortedData.length;
        const start = (mainCurrentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedData = sortedData.slice(start, end);

        console.log(`Showing page ${mainCurrentPage} of ${Math.ceil(totalItems / ITEMS_PER_PAGE)}, items ${start + 1}-${Math.min(end, totalItems)} of ${totalItems}`);

        const chartData = {
            labels: paginatedData.map(d => d.group),
            datasets: [{
                label: 'Planned Cost ($)',
                data: paginatedData.map(d => d.total_planned),
                backgroundColor: window.chartUtils.chartColors.planned,
                borderColor: window.chartUtils.chartColors.planned,
                borderWidth: 1
            }, {
                label: 'Actual Cost ($)',
                data: paginatedData.map(d => d.total_actual),
                backgroundColor: window.chartUtils.chartColors.actual,
                borderColor: window.chartUtils.chartColors.actual,
                borderWidth: 1
            }]
        };
        
        const chartTitle = document.getElementById('cca-chart-title');
        if(chartTitle) {
            const analyzeByOption = document.querySelector(`#category-select option[value="${currentAnalyzeBy}"]`);
            const analyzeByText = analyzeByOption ? analyzeByOption.textContent : currentAnalyzeBy;
            chartTitle.textContent = `Plan vs Actual by ${analyzeByText}`;
        }
        
        mainChart.data = chartData;
        mainChart.options.indexAxis = 'y';
        mainChart.update();
        
        // On initial load, select all items on the current page.
        if (isInitialLoad && paginatedData.length > 0) {
            selectedDetailKeys = paginatedData.map(d => d.group);
            isInitialLoad = false;
        }
        
        // Apply selection styling
        window.chartUtils.updateBarSelectionStyle(mainChart, selectedDetailKeys);
        
        // Use standard pagination controls from chart-utils
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const { renderPaginationControls } = window.chartUtils;
        renderPaginationControls(document.getElementById('cca-pagination'), mainCurrentPage - 1, totalPages, (newPage) => {
            if (newPage >= 0 && newPage < totalPages) {
                mainCurrentPage = newPage + 1; // Convert back to 1-based indexing
                isInitialLoad = true; // Reselect all when page changes
                updateVisuals();
            }
        });

        // Update the detail chart based on the current selection.
        updateDetailChart();
        
        // Update the grid to reflect the current selection
        if (gridData.length > 0) {
            updateGrid();
        }
    }

    function updateDetailChart(clear = false) {
        const detailTitleEl = document.getElementById('cca-detail-chart-title');

        if (clear) {
            detailTitleEl.textContent = 'MES Operation Variance';
            detailChart.data.labels = [];
            detailChart.data.datasets[0].data = [];
            detailChart.update();
            // Clear pagination with standard controls
            const { renderPaginationControls } = window.chartUtils;
            renderPaginationControls(document.getElementById('cca-detail-pagination'), 0, 1, () => {});
            return;
        }
        
        const hasSelection = selectedDetailKeys && selectedDetailKeys.length > 0;

        if (!hasSelection) {
            detailTitleEl.textContent = 'MES Operation Variance (No selection)';
            detailChart.data.labels = [];
            detailChart.data.datasets[0].data = [];
            detailChart.update();
            // Clear pagination with standard controls
            const { renderPaginationControls } = window.chartUtils;
            renderPaginationControls(document.getElementById('cca-detail-pagination'), 0, 1, () => {});
            return;
        }
        
        console.log(`Updating detail chart for ${selectedDetailKeys.length} selected keys, page: ${detailCurrentPage}`);

        if (!window.appData || !window.appData.mesData) {
            console.error("MES data not available for detail chart");
            return;
        }

        const { selectedFabs, selectedTechnologies, selectedProducts } = window.getGlobalFilters();
        
        // Map the currentAnalyzeBy to the correct MES data field
        const mainAggregationKey = {
            'product': 'product',
            'lot': 'lot_id', 
            'stage': 'stage',
            'processArea': 'process_area'
        }[currentAnalyzeBy];

        const filteredData = window.appData.mesData.filter(d => {
            const globalFilterPass = d.status === 'Complete' &&
                (selectedFabs.length === 0 || selectedFabs.includes(d.fab)) &&
                (selectedTechnologies.length === 0 || selectedTechnologies.includes(d.technology)) &&
                (selectedProducts.length === 0 || selectedProducts.includes(d.product.split(' (')[0]));
            
            if (!globalFilterPass) return false;

            // Handle different analyze-by modes
            if (currentAnalyzeBy === 'product') {
                const productDisplayName = d.product; // e.g., "Product Alpha (Fab A)"
                return selectedDetailKeys.includes(productDisplayName);
            } else if (currentAnalyzeBy === 'lot') {
                // For lot analysis, extract lot ID from the selection (format: "LOTID (Product)")
                const selectedLotIds = selectedDetailKeys.map(key => key.split(' (')[0]);
                return selectedLotIds.includes(d.lot_id);
            } else if (currentAnalyzeBy === 'stage') {
                return selectedDetailKeys.includes(d.stage);
            } else if (currentAnalyzeBy === 'processArea') {
                return selectedDetailKeys.includes(d.process_area);
            }
            
            return false;
        });

        const opMap = new Map();
        filteredData.forEach(d => {
            const key = d.mes_operation;
            if (!opMap.has(key)) {
                opMap.set(key, { planned: 0, actual: 0 });
            }
            const current = opMap.get(key);
            current.planned += d.plan_cost;
            current.actual += d.actual_cost;
        });

        const aggregatedOps = Array.from(opMap.entries()).map(([key, costs]) => ({
            key: key,
            variance: costs.actual - costs.planned,
            planned: costs.planned,
            actual: costs.actual,
            absVariance: Math.abs(costs.actual - costs.planned)
        }));

        // Sort by absolute variance (highest impact first, regardless of positive/negative)
        aggregatedOps.sort((a, b) => b.absVariance - a.absVariance);

        const totalItems = aggregatedOps.length;
        const start = (detailCurrentPage - 1) * DETAIL_ITEMS_PER_PAGE;
        const end = start + DETAIL_ITEMS_PER_PAGE;
        const paginatedOps = aggregatedOps.slice(start, end);

        // Log the current page ranking for debugging
        console.log(`[Detail Chart] Showing MES operations ranked ${start + 1}-${Math.min(end, totalItems)} by absolute variance:`);
        paginatedOps.forEach((op, i) => {
            const rank = start + i + 1;
            const sign = op.variance >= 0 ? '+' : '';
            console.log(`  ${rank}. ${op.key}: ${sign}${window.chartUtils.formatNumber(op.variance)} (abs: ${window.chartUtils.formatNumber(op.absVariance)})`);
        });

        detailChart.data.labels = paginatedOps.map(d => d.key);
        detailChart.data.datasets[0].data = paginatedOps.map(d => d.variance);
        detailChart.data.datasets[0].backgroundColor = paginatedOps.map(d => d.variance >= 0 ? window.chartUtils.chartColors.positive_variance : window.chartUtils.chartColors.negative_variance);

        let title;
        if (selectedDetailKeys.length === 1) {
            title = `Top MES Operations by Cost Variance - ${selectedDetailKeys[0]}`;
        } else {
            title = `Top MES Operations by Cost Variance Impact`;
        }
        detailTitleEl.textContent = title;

        detailChart.update();

        // Validation: Check if MES operation variances add up to product variances
        const totalMesVariance = aggregatedOps.reduce((sum, op) => sum + op.variance, 0);
        if (currentAnalyzeBy === 'product') {
            const { dateUtils } = window;
            const { barChartData } = dateUtils.getAggregatedData(window.globalFilters, 'product');
            const selectedProductVariances = barChartData
                .filter(d => selectedDetailKeys.includes(d.group))
                .reduce((sum, d) => sum + (d.total_actual - d.total_planned), 0);
            
            const varianceDifference = Math.abs(totalMesVariance - selectedProductVariances);
            if (varianceDifference > 1000) { // Allow for small rounding differences
                console.warn(`[Validation] MES variance (${window.chartUtils.formatNumber(totalMesVariance)}) doesn't match product variance (${window.chartUtils.formatNumber(selectedProductVariances)}). Difference: ${window.chartUtils.formatNumber(varianceDifference)}`);
            }
        }

        // Use standard pagination controls from chart-utils
        const totalPages = Math.ceil(totalItems / DETAIL_ITEMS_PER_PAGE);
        const { renderPaginationControls } = window.chartUtils;
        renderPaginationControls(document.getElementById('cca-detail-pagination'), detailCurrentPage - 1, totalPages, (newPage) => {
            if (newPage >= 0 && newPage < totalPages) {
                detailCurrentPage = newPage + 1; // Convert back to 1-based indexing
                updateDetailChart();
            }
        });
    }



    function handleMainChartClick(event, elements) {
        const oldSelection = [...selectedDetailKeys];

        if (elements.length) {
            const clickedLabel = mainChart.data.labels[elements[0].index];
            const isCtrlOrCmd = event.ctrlKey || event.metaKey;

            if (isCtrlOrCmd) {
                // Add or remove from selection
                const index = selectedDetailKeys.indexOf(clickedLabel);
                if (index > -1) {
                    selectedDetailKeys.splice(index, 1);
                } else {
                    selectedDetailKeys.push(clickedLabel);
                }
            } else {
                // Single select logic
                if (selectedDetailKeys.length === 1 && selectedDetailKeys[0] === clickedLabel) {
                    // If clicking the only selected item, deselect it
                    selectedDetailKeys = [];
                } else {
                    // Otherwise, select only the clicked item
                    selectedDetailKeys = [clickedLabel];
                }
            }
        } else {
            // Clicked background, clear selection
            selectedDetailKeys = [];
        }

        // Check if selection has actually changed
        if (oldSelection.toString() !== selectedDetailKeys.toString()) {
            detailCurrentPage = 1;
            updateDetailChart();
            window.chartUtils.updateBarSelectionStyle(mainChart, selectedDetailKeys);
        }
    }

    // --- Chart Instantiation ---
    function setupCharts() {
        const mainCtx = document.getElementById('ccaPlannedVsActualChart')?.getContext('2d');
        const detailCtx = document.getElementById('ccaMesVarianceChart')?.getContext('2d');

        if (!mainCtx || !detailCtx) {
            console.error("Failed to get context for one or more CCA charts");
            return;
        }

        mainChart = new Chart(mainCtx, {
            type: 'bar',
            data: { 
                labels: [], 
                datasets: [{
                    label: 'Planned Cost ($)',
                    data: [],
                    backgroundColor: window.chartUtils.chartColors.planned,
                    borderColor: window.chartUtils.chartColors.planned,
                    borderWidth: 1
                }, {
                    label: 'Actual Cost ($)',
                    data: [],
                    backgroundColor: window.chartUtils.chartColors.actual,
                    borderColor: window.chartUtils.chartColors.actual,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: false
                    },
                    legend: { 
                        display: true, 
                        position: 'top' 
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${window.chartUtils.formatNumber(context.raw)}`
                        }
                    },
                    datalabels: { display: false }
                },
                scales: {
                    x: { 
                        ticks: { callback: (v) => window.chartUtils.formatNumber(v, true) }, 
                        stacked: false 
                    },
                    y: { 
                        stacked: false 
                    }
                },
                onClick: (event, elements) => {
                    // Access the native event for modifier keys
                    const nativeEvent = event.native || event;
                    handleMainChartClick(nativeEvent, elements);
                }
            }
        });

        detailChart = new Chart(detailCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cost Variance',
                    data: [],
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Variance: ${window.chartUtils.formatNumber(context.raw)}`
                        }
                    },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'end',
                        formatter: (value) => window.chartUtils.formatNumber(value),
                        font: { size: 10 }
                    }
                },
                scales: {
                    x: { ticks: { callback: (v) => window.chartUtils.formatNumber(v, true) } }
                }
            }
        });
    }

    // --- Grid Setup and Management ---
    function setupGrid() {
        // Load initial grid data
        if (window.appData && window.appData.lotData) {
            gridData = [...window.appData.lotData];
            console.log(`Grid loaded with ${gridData.length} lots`);
            updateGrid();
        }
    }

    function setupGridEventListeners() {
        // Search functionality
        document.getElementById('lot-search').addEventListener('input', (e) => {
            gridSearchTerm = e.target.value.toLowerCase();
            gridCurrentPage = 1;
            updateGrid();
        });

        // Status filter
        document.getElementById('status-filter').addEventListener('change', (e) => {
            gridStatusFilter = e.target.value;
            gridCurrentPage = 1;
            updateGrid();
        });



        // Column sorting
        document.querySelectorAll('#lot-grid th[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                if (gridSortField === field) {
                    gridSortDirection = gridSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    gridSortField = field;
                    gridSortDirection = 'asc';
                }
                updateGrid();
            });
        });

        // Global filter changes should update grid
        document.addEventListener('globalFiltersChanged', () => {
            updateGrid();
        });

        // Enhanced data ready event
        document.addEventListener('enhancedDataReady', () => {
            if (window.appData && window.appData.lotData) {
                gridData = [...window.appData.lotData];
                console.log(`Grid updated with ${gridData.length} lots from enhanced data`);
                updateGrid();
            }
            // Also update charts
            isInitialLoad = true;
            updateVisuals();
        });
    }



    function updateGrid() {
        if (!gridData.length) {
            return;
        }

        // Apply filters
        const globalFilters = window.getGlobalFilters();
        
        filteredGridData = gridData.filter(lot => {
            const matchesSearch = !gridSearchTerm || 
                lot.lotId.toLowerCase().includes(gridSearchTerm) ||
                lot.sapOrder.toString().includes(gridSearchTerm) ||
                lot.product.toLowerCase().includes(gridSearchTerm);
            
            const matchesStatus = !gridStatusFilter || lot.status === gridStatusFilter;

            // Apply global filters
            const matchesGlobalFab = globalFilters.selectedFabs.length === 0 || globalFilters.selectedFabs.includes(lot.fab);
            const matchesGlobalTech = globalFilters.selectedTechnologies.length === 0 || globalFilters.selectedTechnologies.includes(lot.technology);
            const matchesGlobalProduct = globalFilters.selectedProducts.length === 0 || 
                globalFilters.selectedProducts.includes(lot.product.split(' (')[0]);

            // Filter by currently selected items in the main chart (if any are selected)
            let matchesSelectedItems = true;
            if (selectedDetailKeys && selectedDetailKeys.length > 0) {
                if (currentAnalyzeBy === 'product') {
                    // For product analysis, filter lots to show only selected products
                    matchesSelectedItems = selectedDetailKeys.includes(lot.product);
                } else if (currentAnalyzeBy === 'lot') {
                    // For lot analysis, extract lot IDs from selected keys (format: "LOTID (Product)")
                    const selectedLotIds = selectedDetailKeys.map(key => key.split(' (')[0]);
                    matchesSelectedItems = selectedLotIds.includes(lot.lotId);
                } else if (currentAnalyzeBy === 'stage') {
                    // For stage analysis, we need to map lots to stages via MES data
                    // Get the stages for this lot from MES data
                    const lotMesData = window.appData?.mesData?.filter(mes => mes.lot_id === lot.lotId) || [];
                    const lotStages = [...new Set(lotMesData.map(mes => mes.stage))];
                    matchesSelectedItems = selectedDetailKeys.some(stage => lotStages.includes(stage));
                } else if (currentAnalyzeBy === 'processArea') {
                    // For process area analysis, map lots to process areas via MES data
                    const lotMesData = window.appData?.mesData?.filter(mes => mes.lot_id === lot.lotId) || [];
                    const lotProcessAreas = [...new Set(lotMesData.map(mes => mes.process_area))];
                    matchesSelectedItems = selectedDetailKeys.some(area => lotProcessAreas.includes(area));
                }
            }

            const passes = matchesSearch && matchesStatus && 
                   matchesGlobalFab && matchesGlobalTech && matchesGlobalProduct && matchesSelectedItems;
            
            // Debug first few lots if no data passes filters
            if (gridData.indexOf(lot) < 3 && filteredGridData.length === 0) {
                console.log(`[DEBUG] Lot ${lot.lotId}: search=${matchesSearch}, status=${matchesStatus}, fab=${matchesGlobalFab}, tech=${matchesGlobalTech}, globalProduct=${matchesGlobalProduct}, selected=${matchesSelectedItems}, passes=${passes}`);
            }
            
            return passes;
        });
        


        // Apply sorting
        filteredGridData.sort((a, b) => {
            let aVal = a[gridSortField];
            let bVal = b[gridSortField];

            // Handle different data types
            if (gridSortField === 'completedTime') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return gridSortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return gridSortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Update sort indicators
        document.querySelectorAll('#lot-grid th[data-sort]').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.getAttribute('data-sort') === gridSortField) {
                header.classList.add(`sort-${gridSortDirection}`);
            }
        });

        // Calculate pagination
        const totalItems = filteredGridData.length;
        const totalPages = Math.ceil(totalItems / GRID_ITEMS_PER_PAGE);
        gridCurrentPage = Math.min(gridCurrentPage, totalPages || 1);

        const startIndex = (gridCurrentPage - 1) * GRID_ITEMS_PER_PAGE;
        const endIndex = startIndex + GRID_ITEMS_PER_PAGE;
        const pageData = filteredGridData.slice(startIndex, endIndex);

        // Update grid display
        renderGridData(pageData);
        updateGridPagination(totalItems, totalPages);
        
        // Update grid header to show active filtering
        updateGridHeader();
    }

    function renderGridData(data) {
        const tbody = document.getElementById('lot-grid-body');
        if (!tbody) {
            console.error('Grid tbody element not found!');
            return;
        }
        tbody.innerHTML = '';

        if (data.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="14" style="text-align: center; padding: 20px; color: #666;">No lots found matching current filters</td>';
            tbody.appendChild(row);
            return;
        }

        data.forEach(lot => {
            const row = document.createElement('tr');
            
            const statusClass = lot.status === 'Completed' ? 'status-completed' : 'status-processing';
            const varianceClass = lot.costVariance >= 0 ? 'variance-positive' : 'variance-negative';
            const completedTime = new Date(lot.completedTime).toLocaleString();
            
            row.innerHTML = `
                <td>${lot.sapOrder}</td>
                <td>${lot.lotId}</td>
                <td>${completedTime}</td>
                <td><span class="${statusClass}">${lot.status}</span></td>
                <td>${lot.product}</td>
                <td>${lot.plannedQty}</td>
                <td>${lot.completedQty}</td>
                <td>${lot.scrapQty}</td>
                <td>${lot.wipQty}</td>
                <td>${lot.yield.toFixed(1)}%</td>
                <td>${lot.rework}</td>
                <td>${window.chartUtils.formatNumber(lot.plannedCost)}</td>
                <td>${window.chartUtils.formatNumber(lot.actualCost)}</td>
                <td><span class="${varianceClass}">${window.chartUtils.formatNumber(lot.costVariance)}</span></td>
            `;
            
            tbody.appendChild(row);
        });
    }

    function updateGridHeader() {
        const gridHeader = document.querySelector('.grid-section .grid-header h2');
        if (!gridHeader) return;
        
        let headerText = 'Lot Manufacturing Details';
        
        if (selectedDetailKeys && selectedDetailKeys.length > 0) {
            const analyzeByOption = document.querySelector(`#category-select option[value="${currentAnalyzeBy}"]`);
            const analyzeByText = analyzeByOption ? analyzeByOption.textContent : currentAnalyzeBy;
            
            if (currentAnalyzeBy === 'product') {
                const selectedCount = selectedDetailKeys.length;
                headerText += ` (Filtered by ${selectedCount} selected ${analyzeByText.toLowerCase()}${selectedCount > 1 ? 's' : ''})`;
            } else if (currentAnalyzeBy === 'lot') {
                const selectedCount = selectedDetailKeys.length;
                headerText += ` (Filtered by ${selectedCount} selected ${analyzeByText.toLowerCase()}${selectedCount > 1 ? 's' : ''})`;
            } else if (currentAnalyzeBy === 'stage') {
                const selectedCount = selectedDetailKeys.length;
                headerText += ` (Filtered by ${selectedCount} selected ${analyzeByText.toLowerCase()}${selectedCount > 1 ? 's' : ''})`;
            } else if (currentAnalyzeBy === 'processArea') {
                const selectedCount = selectedDetailKeys.length;
                headerText += ` (Filtered by ${selectedCount} selected ${analyzeByText.toLowerCase()}${selectedCount > 1 ? 's' : ''})`;
            }
        }
        
        gridHeader.textContent = headerText;
    }

    function updateGridPagination(totalItems, totalPages) {
        const startItem = totalItems === 0 ? 0 : (gridCurrentPage - 1) * GRID_ITEMS_PER_PAGE + 1;
        const endItem = Math.min(gridCurrentPage * GRID_ITEMS_PER_PAGE, totalItems);
        
        document.getElementById('grid-info').textContent = 
            `Showing ${startItem}-${endItem} of ${totalItems} lots`;

        const paginationContainer = document.getElementById('grid-pagination-controls');
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '&laquo; Previous';
        prevBtn.disabled = gridCurrentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (gridCurrentPage > 1) {
                gridCurrentPage--;
                updateGrid();
            }
        });
        paginationContainer.appendChild(prevBtn);

        // Page numbers (show current page and a few around it)
        const startPage = Math.max(1, gridCurrentPage - 2);
        const endPage = Math.min(totalPages, gridCurrentPage + 2);

        if (startPage > 1) {
            const firstBtn = createPageButton(1);
            paginationContainer.appendChild(firstBtn);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.margin = '0 0.5rem';
                paginationContainer.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = createPageButton(i);
            if (i === gridCurrentPage) {
                pageBtn.style.backgroundColor = '#007bff';
                pageBtn.style.color = 'white';
            }
            paginationContainer.appendChild(pageBtn);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.margin = '0 0.5rem';
                paginationContainer.appendChild(ellipsis);
            }
            const lastBtn = createPageButton(totalPages);
            paginationContainer.appendChild(lastBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = 'Next &raquo;';
        nextBtn.disabled = gridCurrentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (gridCurrentPage < totalPages) {
                gridCurrentPage++;
                updateGrid();
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    function createPageButton(pageNum) {
        const btn = document.createElement('button');
        btn.textContent = pageNum;
        btn.addEventListener('click', () => {
            gridCurrentPage = pageNum;
            updateGrid();
        });
        return btn;
    }

    // --- Public API ---
    window.costCategoryAnalysis = {
        initialize,
        destroyCharts,
    };

})();