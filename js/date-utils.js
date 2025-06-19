window.dateUtils = (function() {
    'use strict';

    /**
     * Gets the start date for a given time aggregation period.
     * @param {string} viewBy - The aggregation period ('Day', 'Week', 'Month', 'Quarter', 'Year').
     * @returns {{startDate: Date}} - An object containing the start date.
     */
    function getAggregationPeriod(viewBy) {
        const now = new Date();
        const startDate = new Date();
        
        switch (viewBy) {
            case 'Day':   startDate.setMonth(now.getMonth() - 3); break;
            case 'Week':  startDate.setMonth(now.getMonth() - 6); break;
            case 'Month': startDate.setFullYear(now.getFullYear() - 1); break;
            case 'Quarter': startDate.setFullYear(now.getFullYear() - 3); break;
            case 'Year':  startDate.setFullYear(now.getFullYear() - 10); break;
            default:      startDate.setFullYear(now.getFullYear() - 1);
        }
        return { startDate };
    }

    /**
     * Formats a number for display in charts, with rules for K/M scaling.
     * @param {number} value The number to format.
     * @param {boolean} isCurrency Whether to prepend a dollar sign.
     * @returns {string} The formatted string.
     */
    function formatChartValue(value, isCurrency = true) {
        if (value === null || typeof value === 'undefined' || isNaN(value)) {
            return 'N/A';
        }
        const sign = isCurrency ? '$' : '';
        const absValue = Math.abs(value);

        if (absValue >= 1000000) {
            return `${sign}${(value / 1000000).toFixed(2)}M`;
        }
        if (absValue >= 10000) { // Use K for values over 10k for better readability
            return `${sign}${(value / 1000).toFixed(2)}K`;
        }
        // For values less than 10k, show as an integer.
        return `${sign}${value.toFixed(0)}`;
    }

    /**
     * Converts a string from Title Case or sentence case to camelCase.
     * @param {string} str The input string.
     * @returns {string} The camelCased string.
     */
    function camelCase(str) {
        if (!str) return '';
        // Handles strings like "Process Area" -> "processArea"
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    }

    /**
     * Aggregates time-series data by a specified period.
     * @param {Array<{date: string, value: number}>} data - Array of data points.
     * @param {string} period - Aggregation period ('Day', 'Week', 'Month', 'Quarter', 'Year').
     * @returns {{labels: Array<string>, values: Array<number>}} - Aggregated labels and values.
     */
    function aggregateData(data, period) {
        if (!data || data.length === 0) {
            return { labels: [], values: [] };
        }

        const aggregated = {};
        const getPeriodKey = getPeriodKeyFunction(period);

        data.forEach(item => {
            const date = new Date(item.date);
            const key = getPeriodKey(date);
            if (!aggregated[key]) {
                aggregated[key] = { sum: 0, count: 0, dateObj: date };
            }
            aggregated[key].sum += item.value;
            aggregated[key].count++;
        });
        
        const sortedKeys = Object.keys(aggregated).sort((a, b) => aggregated[a].dateObj - aggregated[b].dateObj);

        const labels = sortedKeys;
        const values = sortedKeys.map(key => aggregated[key].sum); // Using sum, can be changed to / count for avg

        return { labels, values };
    }

    /**
     * Returns a function that generates a string key for a given date based on the period.
     * @param {string} period - The aggregation period.
     * @returns {function(Date): string} - The key generation function.
     */
    function getPeriodKeyFunction(period) {
        switch (period) {
            case 'Day':
                return (date) => date.toISOString().split('T')[0];
            case 'Week':
                return (date) => {
                    const firstDayOfWeek = new Date(date);
                    firstDayOfWeek.setDate(date.getDate() - date.getDay());
                    return firstDayOfWeek.toISOString().split('T')[0];
                };
            case 'Month':
                return (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            case 'Quarter':
                return (date) => `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
            case 'Year':
                return (date) => `${date.getFullYear()}`;
            default:
                return (date) => date.toISOString().split('T')[0];
        }
    }

    /**
     * @param {string} aggregationLevel 'Day', 'Week', 'Month', 'Quarter', 'Year'
     * @returns {{startDate: Date, endDate: Date, interval: string}}
     */
    function getTrendDateRange(aggregationLevel) {
        const endDate = new Date();
        let startDate = new Date();
        let interval = 'day';

        switch (aggregationLevel) {
            case 'Day':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case 'Week':
                startDate.setDate(endDate.getDate() - (26 * 7));
                interval = 'week';
                break;
            case 'Month':
                startDate.setFullYear(endDate.getFullYear() - 1);
                interval = 'month';
                break;
            case 'Quarter':
                startDate.setFullYear(endDate.getFullYear() - 3);
                interval = 'quarter';
                break;
            case 'Year':
                startDate.setFullYear(endDate.getFullYear() - 10);
                interval = 'year';
                break;
            default:
                startDate.setFullYear(endDate.getFullYear() - 1);
                interval = 'month';
        }
        return { startDate, endDate, interval };
    }

    /**
     * Formats time range for display in the UI
     * @param {string} aggregationLevel 'Day', 'Week', 'Month', 'Quarter', 'Year'
     * @returns {string} Formatted time range string
     */
    function formatTimeRangeDisplay(aggregationLevel) {
        const today = new Date();
        
        switch (aggregationLevel) {
            case 'Day':
                // Use same date calculation as filtering logic
                const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
                const todayDate = new Date(todayDateString + 'T00:00:00'); // Avoid timezone issues
                const formattedToday = todayDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                });
                return `Today (${formattedToday})`;
            case 'Week':
                const { startDate: weekStart, endDate: weekEnd } = getBarChartDateRange(aggregationLevel);
                const formatDate = (date) => {
                    return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                    });
                };
                return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
            case 'Month':
                const { startDate: monthStart } = getBarChartDateRange(aggregationLevel);
                return monthStart.toLocaleDateString('en-US', { 
                    month: 'long',
                    year: monthStart.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                });
            case 'Quarter':
                const { startDate: quarterStart } = getBarChartDateRange(aggregationLevel);
                const quarter = Math.floor(quarterStart.getMonth() / 3) + 1;
                const yearSuffix = quarterStart.getFullYear() !== today.getFullYear() ? ` ${quarterStart.getFullYear()}` : '';
                return `Q${quarter}${yearSuffix}`;
            case 'Year':
                const { startDate: yearStart } = getBarChartDateRange(aggregationLevel);
                return `${yearStart.getFullYear()}`;
            default:
                const { startDate: defaultStart } = getBarChartDateRange(aggregationLevel);
                return defaultStart.toLocaleDateString('en-US', { 
                    month: 'long',
                    year: defaultStart.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                });
        }
    }

    /**
     * Calculates the date range for the last complete time period, for use in bar charts.
     * @param {string} aggregationLevel 'Day', 'Week', 'Month', 'Quarter', 'Year'
     * @returns {{startDate: Date, endDate: Date}}
     */
    function getBarChartDateRange(aggregationLevel) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        let startDate, endDate;

        switch (aggregationLevel) {
            case 'Year':
                // Current year from January 1st to today
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today);
                break;
            case 'Quarter':
                // Current quarter from first day to today
                const currentQuarter = Math.floor(today.getMonth() / 3);
                startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
                endDate = new Date(today);
                break;
            case 'Month':
                // Current month from first day to today
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today);
                break;
            case 'Week':
                // Current week from Sunday to today
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay()); // This Sunday
                endDate = new Date(today);
                break;
            case 'Day':
            default:
                // Today's data (current day) - use date string for consistent comparison
                const todayDateString = today.toISOString().split('T')[0]; // Get YYYY-MM-DD
                startDate = new Date(todayDateString);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(todayDateString);
                endDate.setHours(23, 59, 59, 999);
                break;
        }
        return { startDate, endDate };
    }

    /**
     * Formats a date object into a string label based on the aggregation level.
     * @param {Date} date The date to format.
     * @param {string} aggregationLevel 'Day', 'Week', 'Month', 'Quarter', 'Year'.
     * @returns {string} The formatted date label.
     */
    function formatDateLabel(date, aggregationLevel) {
        if (!date instanceof Date || isNaN(date)) return '';
        
        switch (aggregationLevel) {
            case 'Week':
                const weekNumber = Math.ceil((((date - new Date(date.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
                return `W${weekNumber} '${date.getFullYear().toString().slice(-2)}`;
            case 'Month':
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            case 'Quarter':
                return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
            case 'Year':
                return date.getFullYear().toString();
            case 'Day':
            default:
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    /**
     * The main data processing engine for the dashboard.
     * Filters and aggregates the pre-summarized daily data based on global filter settings.
     * This version is significantly faster as it works on a much smaller, pre-aggregated dataset.
     * @param {{aggregationLevel: string, selectedFabs: string[], selectedTechnologies: string[], selectedProducts: string[], selectedProcessAreas?: string[]}} filters
     * @param {string} aggregateBy The key to group data by (e.g., 'product', 'processArea', 'mesStep')
     * @param {string} productFilterField The field to use for product filtering ('productName' or 'product').
     * @returns {Object} An object containing aggregated data for trends and bar charts.
     */
    function getAggregatedData(filters, aggregateBy = 'product', productFilterField = 'productName') {
        if (!window.appData || !window.appData.dailySummary) {
            console.error("Data not ready or missing.");
            return { trendData: { labels: [], datasets: {}, groups: [] }, barChartData: [] };
        }

        const { aggregationLevel, selectedFabs, selectedTechnologies, selectedProducts, selectedProcessAreas } = filters;
        
        // For lot and stage analysis, we need to use different data sources
        if (aggregateBy === 'lot') {
            return getAggregatedLotData(filters);
        } else if (aggregateBy === 'stage') {
            return getAggregatedStageData(filters);
        }
        
        const source = Object.values(window.appData.dailySummary);

        // 1. Get date ranges for Trend and Bar charts separately
        const trendDateRange = getTrendDateRange(aggregationLevel);
        const barChartDateRange = getBarChartDateRange(aggregationLevel);

        // 2. Apply global dimension filters
        const dimensionFiltered = source.filter(d =>
            (selectedFabs.length === 0 || selectedFabs.includes(d.fab)) &&
            (selectedTechnologies.length === 0 || selectedTechnologies.includes(d.technology)) &&
            (selectedProducts.length === 0 || selectedProducts.includes(d[productFilterField]))
        );

        // 3. Filter data for the Trend chart based on its specific date range
        const trendDateFiltered = dimensionFiltered.filter(d => {
            const itemDate = new Date(d.date);
            return itemDate >= trendDateRange.startDate && itemDate <= trendDateRange.endDate;
        });

        // 4. Group and aggregate data for the trend charts
        const getGroupKey = getPeriodKeyFunction(aggregationLevel);
        
        const trendGroups = {};
        const groups = new Map(); // Using a Map to store metadata

        trendDateFiltered.forEach(summaryEntry => {
            const timeKey = getGroupKey(new Date(summaryEntry.date));
            if (!trendGroups[timeKey]) trendGroups[timeKey] = {};

            const processEntry = (groupKey, metadata) => {
                if (!trendGroups[timeKey][groupKey]) {
                    trendGroups[timeKey][groupKey] = { planned: 0, actual: 0, variance: 0 };
                }
                if (!groups.has(groupKey)) {
                    groups.set(groupKey, metadata);
                }
                return trendGroups[timeKey][groupKey];
            };
            
            if (aggregateBy === 'product') {
                const metadata = { fab: summaryEntry.fab, productName: summaryEntry.productName };
                const entry = processEntry(summaryEntry.product, metadata);
                entry.planned += summaryEntry.total_planned;
                entry.actual += summaryEntry.total_actual;
                entry.variance += summaryEntry.total_variance;
            } else if (aggregateBy === 'processArea') {
                 for (const [paName, paData] of Object.entries(summaryEntry.byProcessArea)) {
                    const entry = processEntry(paName, {}); // No metadata for this aggregation
                    entry.planned += paData.planned;
                    entry.actual += paData.actual;
                    entry.variance += paData.variance;
                 }
            } else if (aggregateBy === 'mesStep') {
                for (const [paName, paData] of Object.entries(summaryEntry.byProcessArea)) {
                    if (!selectedProcessAreas || selectedProcessAreas.includes(paName)) {
                        for (const [stepName, stepData] of Object.entries(paData.byMesStep)) {
                            const entry = processEntry(stepName, {}); // No metadata for this aggregation
                            entry.planned += stepData.planned;
                            entry.actual += stepData.actual;
                            entry.variance += stepData.variance;
                        }
                    }
                }
            } else if (aggregateBy === 'date') { 
                 const entry = processEntry('Total', {});
                 entry.planned += summaryEntry.total_planned;
                 entry.actual += summaryEntry.total_actual;
                 entry.variance += summaryEntry.total_variance;
            }
        });

        // 5. Filter data for the Bar chart using its specific date range
        const barChartDateFiltered = dimensionFiltered.filter(d => {
            // For Day aggregation, use direct string comparison to avoid timezone issues
            if (aggregationLevel === 'Day') {
                const todayString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                return d.date === todayString;
            } else {
                // For other aggregations, use date range comparison
                const itemDate = new Date(d.date);
                return itemDate >= barChartDateRange.startDate && itemDate <= barChartDateRange.endDate;
            }
        });
        
        // DEBUG: Log filtering results for Day aggregation
        if (aggregationLevel === 'Day') {
            console.log(`DEBUG getAggregatedData: aggregationLevel=Day`);
            console.log(`DEBUG: source entries = ${source.length}`);
            console.log(`DEBUG: after dimension filter = ${dimensionFiltered.length}`);
            console.log(`DEBUG: after date filter = ${barChartDateFiltered.length}`);
            console.log(`DEBUG: date range = ${barChartDateRange.startDate.toISOString()} to ${barChartDateRange.endDate.toISOString()}`);
            
            const todayString = new Date().toISOString().split('T')[0];
            
            // Check if today's data exists in source before filtering
            const todayInSource = source.filter(d => d.date === todayString);
            console.log(`DEBUG: entries for today in source (${todayString}) = ${todayInSource.length}`);
            
            // Check if today's data exists after dimension filtering
            const todayAfterDimFilter = dimensionFiltered.filter(d => d.date === todayString);
            console.log(`DEBUG: entries for today after dimension filter (${todayString}) = ${todayAfterDimFilter.length}`);
            
            const todayEntries = barChartDateFiltered.filter(d => d.date === todayString);
            console.log(`DEBUG: entries for today after date filter (${todayString}) = ${todayEntries.length}`);
            
            if (todayInSource.length > 0 && todayAfterDimFilter.length === 0) {
                console.log(`DEBUG: Today's data was filtered out by dimension filters!`);
                console.log(`DEBUG: Dimension filters:`, {selectedFabs, selectedTechnologies, selectedProducts});
                console.log(`DEBUG: Sample today entry that was filtered:`, todayInSource[0]);
            }
            
            if (todayEntries.length > 0) {
                console.log(`DEBUG: Sample today entry after all filters:`, todayEntries[0]);
            }
            
            // Show what dates we do have
            const uniqueDates = [...new Set(barChartDateFiltered.map(d => d.date))].sort();
            console.log(`DEBUG: Available dates after filtering:`, uniqueDates);
        }

        // 6. Calculate data for Bar charts using the correctly filtered data
        const barChartGroups = {};
        barChartDateFiltered.forEach(summaryEntry => {
            const processEntry = (groupKey) => {
                if (!barChartGroups[groupKey]) {
                    barChartGroups[groupKey] = { group: groupKey, total_planned: 0, total_actual: 0, variance: 0, scrap_cost: 0, count: 0 };
                }
                return barChartGroups[groupKey];
            };

            if (aggregateBy === 'product' || aggregateBy === 'productName') {
                const groupName = aggregateBy === 'product' ? summaryEntry.product : summaryEntry.productName;
                const entry = processEntry(groupName);
                entry.total_planned += summaryEntry.total_planned;
                entry.total_actual += summaryEntry.total_actual;
                entry.variance += summaryEntry.total_variance;
                entry.scrap_cost += summaryEntry.scrap_cost || 0;
                entry.count++;
            } else if (aggregateBy === 'processArea') {
                const totalPlannedForEntry = Object.values(summaryEntry.byProcessArea).reduce((sum, pa) => sum + pa.planned, 0);
                if (totalPlannedForEntry > 0) {
                    for (const [paName, paData] of Object.entries(summaryEntry.byProcessArea)) {
                        const entry = processEntry(paName);
                        entry.total_planned += paData.planned;
                        entry.total_actual += paData.actual;
                        entry.variance += paData.variance;
                        const proportion = paData.planned / totalPlannedForEntry;
                        entry.scrap_cost += (summaryEntry.scrap_cost || 0) * proportion;
                        entry.count++;
                    }
                }
            } else if (aggregateBy === 'mesStep') {
                const totalPlannedForEntry = Object.values(summaryEntry.byProcessArea).reduce((sum, pa) => sum + pa.planned, 0);
                if (totalPlannedForEntry > 0) {
                    for (const [paName, paData] of Object.entries(summaryEntry.byProcessArea)) {
                        if (!selectedProcessAreas || selectedProcessAreas.length === 0 || selectedProcessAreas.includes(paName)) {
                            const totalPlannedForPA = Object.values(paData.byMesStep).reduce((sum, step) => sum + step.planned, 0);
                            if (totalPlannedForPA > 0) {
                                for (const [stepName, stepData] of Object.entries(paData.byMesStep)) {
                                    const entry = processEntry(stepName);
                                    entry.total_planned += stepData.planned;
                                    entry.total_actual += stepData.actual;
                                    entry.variance += stepData.variance;
                                    const paProportion = paData.planned / totalPlannedForEntry;
                                    const stepProportion = stepData.planned / totalPlannedForPA;
                                    entry.scrap_cost += (summaryEntry.scrap_cost || 0) * paProportion * stepProportion;
                                    entry.count++;
                                }
                            }
                        }
                    }
                }
            }
        });

        const barChartData = Object.values(barChartGroups);

        // 5. Format data for return
        const trendData = formatTrendData(trendGroups, groups, aggregationLevel);

        return { trendData, barChartData };
    }

    /**
     * @param {string} aggregationLevel - The aggregation level to format labels correctly.
     * @returns {{labels: string[], datasets: Object, groups: Object[]}}
     */
    function formatTrendData(trend, groups, aggregationLevel) {
        const sortedTimeKeys = Object.keys(trend).sort((a,b) => new Date(a) - new Date(b));
        const labels = sortedTimeKeys.map(key => formatDateLabel(new Date(key), aggregationLevel));
        const datasets = {};
        
        groups.forEach((metadata, groupKey) => {
            datasets[groupKey] = {
                planned: sortedTimeKeys.map(timeKey => trend[timeKey][groupKey]?.planned || 0),
                actual: sortedTimeKeys.map(timeKey => trend[timeKey][groupKey]?.actual || 0)
            };
        });

        return {
            labels,
            datasets,
            groups: Array.from(groups.keys()).map(g => ({
                displayName: g,
                ...(groups.get(g) || {}) // Add metadata like fab, productName
            })),
        };
    }

    /**
     * Gets aggregated data for the most recent complete period for bar charts.
     */
     function getBarChartData(data, aggregationLevel, aggregateBy) {
        // This function is deprecated and no longer used. 
        // The logic has been integrated into getAggregatedData.
        return { data: [], startDate: null, endDate: null };
     }

    /**
     * Aggregates data by individual lots for lot-level analysis
     */
    function getAggregatedLotData(filters) {
        if (!window.appData || !window.appData.lotData) {
            console.error("Lot data not available for aggregation.");
            return { trendData: { labels: [], datasets: {}, groups: [] }, barChartData: [] };
        }

        const { aggregationLevel, selectedFabs, selectedTechnologies, selectedProducts } = filters;
        const lotData = window.appData.lotData;

        // Get date ranges
        const trendDateRange = getTrendDateRange(aggregationLevel);
        const barChartDateRange = getBarChartDateRange(aggregationLevel);

        // Apply global filters
        const filteredLots = lotData.filter(lot => {
            const lotDate = new Date(lot.completedTime);
            const productName = lot.product.split(' (')[0]; // Extract base product name
            
            return (selectedFabs.length === 0 || selectedFabs.includes(lot.fab)) &&
                   (selectedTechnologies.length === 0 || selectedTechnologies.includes(lot.technology)) &&
                   (selectedProducts.length === 0 || selectedProducts.includes(productName));
        });

        // For trend data - aggregate lots by time period
        const trendFiltered = filteredLots.filter(lot => {
            const lotDate = new Date(lot.completedTime);
            return lotDate >= trendDateRange.startDate && lotDate <= trendDateRange.endDate;
        });

        const getGroupKey = getPeriodKeyFunction(aggregationLevel);
        const trendGroups = {};
        const groups = new Map();

        trendFiltered.forEach(lot => {
            const timeKey = getGroupKey(new Date(lot.completedTime));
            if (!trendGroups[timeKey]) trendGroups[timeKey] = {};

            const lotKey = `${lot.lotId} (${lot.product})`;
            if (!trendGroups[timeKey][lotKey]) {
                trendGroups[timeKey][lotKey] = { planned: 0, actual: 0, variance: 0 };
            }
            if (!groups.has(lotKey)) {
                groups.set(lotKey, { fab: lot.fab, technology: lot.technology, product: lot.product });
            }

            const entry = trendGroups[timeKey][lotKey];
            entry.planned += lot.plannedCost;
            entry.actual += lot.actualCost;
            entry.variance += lot.costVariance;
        });

        // For bar chart data - show individual lots for the selected time period
        const barChartFiltered = filteredLots.filter(lot => {
            const lotDate = new Date(lot.completedTime);
            return lotDate >= barChartDateRange.startDate && lotDate <= barChartDateRange.endDate;
        });

        const barChartData = barChartFiltered.map(lot => ({
            group: `${lot.lotId} (${lot.product})`,
            total_planned: lot.plannedCost,
            total_actual: lot.actualCost,
            variance: lot.costVariance,
            scrap_cost: 0, // Lots don't have separate scrap cost tracking
            count: 1,
            absVariance: Math.abs(lot.costVariance),
            lotId: lot.lotId,
            product: lot.product,
            fab: lot.fab,
            technology: lot.technology
        }));

        const trendData = formatTrendData(trendGroups, groups, aggregationLevel);
        return { trendData, barChartData };
    }

    /**
     * Aggregates data by manufacturing stages (FEOL, BEOL, Test, Assembly)
     */
    function getAggregatedStageData(filters) {
        if (!window.appData || !window.appData.mesData) {
            console.error("MES data not available for stage aggregation.");
            return { trendData: { labels: [], datasets: {}, groups: [] }, barChartData: [] };
        }

        const { aggregationLevel, selectedFabs, selectedTechnologies, selectedProducts } = filters;
        const mesData = window.appData.mesData;

        // Get date ranges
        const trendDateRange = getTrendDateRange(aggregationLevel);
        const barChartDateRange = getBarChartDateRange(aggregationLevel);

        // Apply global filters
        const filteredMes = mesData.filter(mes => {
            const mesDate = new Date(mes.timestamp);
            const productName = mes.product.split(' (')[0]; // Extract base product name
            
            return mes.status === 'Complete' &&
                   (selectedFabs.length === 0 || selectedFabs.includes(mes.fab)) &&
                   (selectedTechnologies.length === 0 || selectedTechnologies.includes(mes.technology)) &&
                   (selectedProducts.length === 0 || selectedProducts.includes(productName));
        });

        // For trend data - aggregate by time period and stage
        const trendFiltered = filteredMes.filter(mes => {
            const mesDate = new Date(mes.timestamp);
            return mesDate >= trendDateRange.startDate && mesDate <= trendDateRange.endDate;
        });

        const getGroupKey = getPeriodKeyFunction(aggregationLevel);
        const trendGroups = {};
        const groups = new Map();

        trendFiltered.forEach(mes => {
            const timeKey = getGroupKey(new Date(mes.timestamp));
            if (!trendGroups[timeKey]) trendGroups[timeKey] = {};

            const stageKey = mes.stage;
            if (!trendGroups[timeKey][stageKey]) {
                trendGroups[timeKey][stageKey] = { planned: 0, actual: 0, variance: 0 };
            }
            if (!groups.has(stageKey)) {
                groups.set(stageKey, {});
            }

            const entry = trendGroups[timeKey][stageKey];
            entry.planned += mes.plan_cost;
            entry.actual += mes.actual_cost;
            entry.variance += mes.variance;
        });

        // For bar chart data - aggregate by stage for the selected time period
        const barChartFiltered = filteredMes.filter(mes => {
            const mesDate = new Date(mes.timestamp);
            return mesDate >= barChartDateRange.startDate && mesDate <= barChartDateRange.endDate;
        });

        const stageGroups = {};
        barChartFiltered.forEach(mes => {
            const stageKey = mes.stage;
            if (!stageGroups[stageKey]) {
                stageGroups[stageKey] = { group: stageKey, total_planned: 0, total_actual: 0, variance: 0, scrap_cost: 0, count: 0 };
            }

            const entry = stageGroups[stageKey];
            entry.total_planned += mes.plan_cost;
            entry.total_actual += mes.actual_cost;
            entry.variance += mes.variance;
            entry.count++;
        });

        const barChartData = Object.values(stageGroups);
        const trendData = formatTrendData(trendGroups, groups, aggregationLevel);
        return { trendData, barChartData };
    }

    function getMesStepVariance(processArea, selectedProducts) {
        if (!processArea) {
            return { labels: [], datasets: [] };
        }

        const filters = {
            ...window.globalFilters,
            selectedProducts: selectedProducts
        };

        // The raw data is already at the MES step level, so we just filter and aggregate.
        const relevantData = window.appData.rawDailyData.filter(d => 
            filters.selectedProducts.includes(d.product) &&
            d.processArea === processArea
        );
        
        const aggregatedByMes = {};
        relevantData.forEach(d => {
            if (!aggregatedByMes[d.mesStep]) {
                aggregatedByMes[d.mesStep] = { variance: 0 };
            }
            aggregatedByMes[d.mesStep].variance += d.variance;
        });
        
        const resultData = Object.entries(aggregatedByMes)
            .map(([label, values]) => ({ label, variance: values.variance }))
            .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
            .slice(0, 10);

        return {
            labels: resultData.map(s => s.label),
            datasets: [{
                label: `Variance for ${processArea}`,
                data: resultData.map(s => s.variance),
                backgroundColor: (context) => context.raw >= 0 ? window.chartUtils.colors.positive : window.chartUtils.colors.negative,
            }]
        };
    }

    // Return the public API
    return {
        getAggregationPeriod,
        formatChartValue,
        camelCase,
        aggregateData,
        getPeriodKeyFunction,
        getTrendDateRange,
        getBarChartDateRange,
        formatTimeRangeDisplay,
        formatDateLabel,
        getAggregatedData,
        getBarChartData,
        getMesStepVariance
    };
})();

// console.log("Date Utils loaded and 'dateUtilsReady' event fired."); 