/* --- Date Utilities for Time Aggregation --- */
const dateUtils = {
    getWeek: (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    
    getLabels: (viewBy, dataPoints) => {
        const labels = [];
        const today = new Date();
        
        switch(viewBy) {
            case 'Day':
                for (let i = dataPoints - 1; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                }
                return labels;
            case 'Week':
                 for (let i = dataPoints - 1; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - (i * 7));
                    labels.push(`W${dateUtils.getWeek(date)}`);
                }
                return labels;
            case 'Month':
                for (let i = dataPoints - 1; i >= 0; i--) {
                    const date = new Date(today);
                    date.setMonth(today.getMonth() - i);
                    labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
                }
                return labels;
            case 'Quarter':
                 for (let i = dataPoints - 1; i >= 0; i--) {
                    const date = new Date(today);
                    date.setMonth(today.getMonth() - (i * 3));
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    labels.push(`Q${quarter} '${date.getFullYear().toString().slice(2)}`);
                }
                return labels;
            case 'Year':
                for (let i = dataPoints - 1; i >= 0; i--) {
                    labels.push(today.getFullYear() - i);
                }
                return labels;
            default:
                return [];
        }
    },

    aggregateData: (dailyData, viewBy) => {
        if (!dailyData || dailyData.length === 0) return { labels: [], values: [] };
        
        const aggregationMap = new Map();

        dailyData.forEach(point => {
            const date = new Date(point.date);
            let key;
            const year = date.getFullYear();

            switch(viewBy) {
                case 'Day': 
                    key = date.toISOString().split('T')[0];
                    break;
                case 'Week':
                    key = `${year}-W${dateUtils.getWeek(date)}`;
                    break;
                case 'Month':
                    key = `${year}-${date.getMonth()}`;
                    break;
                case 'Quarter':
                    key = `${year}-Q${Math.floor(date.getMonth() / 3) + 1}`;
                    break;
                case 'Year':
                    key = `${year}`;
                    break;
                default:
                    key = point.date;
            }

            if (!aggregationMap.has(key)) {
                aggregationMap.set(key, { sum: 0, count: 0 });
            }
            const current = aggregationMap.get(key);
            current.sum += point.value;
            current.count++;
        });

        const aggregatedValues = [];
        const finalLabels = [];
        
        const sortedKeys = Array.from(aggregationMap.keys()).sort((a, b) => {
            const dateA = new Date(a.split('-W')[0].split('-Q')[0]);
            const dateB = new Date(b.split('-W')[0].split('-Q')[0]);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            return a.localeCompare(b);
        });

        sortedKeys.forEach(key => {
            const { sum, count } = aggregationMap.get(key);
            const avg = sum / count;
            aggregatedValues.push(avg);
            
            if (viewBy === 'Week') finalLabels.push(key.split('-')[1]);
            else if (viewBy === 'Month') {
                const [year, month] = key.split('-');
                const d = new Date(year, month);
                finalLabels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
            }
            else if (viewBy === 'Quarter') finalLabels.push(key.split('-')[1] + ` '${new Date(key.split('-Q')[0]).getFullYear().toString().slice(2)}`);
            else if (viewBy === 'Day') finalLabels.push(new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            else finalLabels.push(key);
        });

        return { labels: finalLabels, values: aggregatedValues };
    }
};

function filterByViewBy(data, viewBy) {
    const now = new Date();
    let startDate = new Date(now);

    switch (viewBy) {
        case 'Day':
            startDate.setDate(now.getDate() - 1);
            break;
        case 'Week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'Month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'Quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'Year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            return data;
    }
    
    const startTime = startDate.getTime();
    return data.filter(d => {
        const itemDate = new Date(d.date).getTime();
        return itemDate >= startTime && itemDate <= now.getTime();
    });
}

/* --- Manufacturing Data Generation --- */
function generateManufacturingData(filters = {}) {
    const { 
        selectedFabs = orgCostingData.allFabs, 
        selectedProducts = orgCostingData.allProducts,
        viewBy = 'Month'
    } = filters;

    const productColors = { 'Product A': 'rgba(239, 83, 80, 0.8)', 'Product B': 'rgba(66, 165, 245, 0.8)', 'Product C': 'rgba(102, 187, 106, 0.8)' };
    const fabColors = { 'Fab Alpha': 'rgba(255, 99, 132, 0.7)', 'Fab Beta': 'rgba(54, 162, 235, 0.7)', 'Fab Gamma': 'rgba(75, 192, 192, 0.7)' };

    // --- Generate Trend Data ---
    const wipTrend = { labels: [], datasets: [] };
    const yieldTrend = { labels: [], datasets: [] };
    let trendLabels = [];

    selectedProducts.forEach((product, index) => {
        const productWip = orgCostingData.productWipTrend.filter(d => 
            d.product === product && selectedFabs.includes(d.fab)
        );
        const aggregatedWip = dateUtils.aggregateData(productWip, viewBy);
        if (index === 0) trendLabels = aggregatedWip.labels;

        wipTrend.datasets.push({
            label: product,
            data: aggregatedWip.values,
            borderColor: productColors[product] || '#cccccc',
            fill: false,
            tension: 0.4
        });

        const productYield = orgCostingData.yieldTrend.filter(d => 
            d.product === product && selectedFabs.includes(d.fab)
        );
        const aggregatedYield = dateUtils.aggregateData(productYield, viewBy);
        yieldTrend.datasets.push({
            label: product,
            data: aggregatedYield.values,
            borderColor: productColors[product] || '#cccccc',
            fill: false,
            tension: 0.4
        });
    });
    wipTrend.labels = trendLabels;
    yieldTrend.labels = trendLabels;


    // --- Generate Snapshot Data (Cycle Time & Production) ---
    const cycleTimeLabels = [];
    const cycleTimeData = [];

    selectedFabs.forEach(fab => {
        selectedProducts.forEach(product => {
            if (orgCostingData.costData.some(d => d.fab === fab && d.product === product)) {
                cycleTimeLabels.push(`${fab} - ${product}`);
                const mockDailyData = orgCostingData.productWipTrend.filter(d => d.fab === fab && d.product === product)
                                          .map(d => ({...d, value: d.value / 5 + 15})); // Base cycle time is ~20-50 days
                
                const aggregatedCycle = dateUtils.aggregateData(mockDailyData, viewBy);
                cycleTimeData.push(aggregatedCycle.values.length > 0 ? aggregatedCycle.values[aggregatedCycle.values.length - 1] : 0);
            }
        });
    });

    const cycleTime = {
        labels: cycleTimeLabels,
        datasets: [{
            label: 'Average Cycle Time (Days)',
            data: cycleTimeData,
            backgroundColor: cycleTimeLabels.map(label => fabColors[label.split(' - ')[0]] || '#dddddd')
        }]
    };
    
    const productionVolume = {
        labels: trendLabels,
        datasets: selectedProducts.map(product => {
            const productData = orgCostingData.productWipTrend.filter(d => 
                d.product === product && selectedFabs.includes(d.fab)
            );
            const aggregated = dateUtils.aggregateData(productData, viewBy);
            return {
                label: product,
                data: aggregated.values.map(v => v * (10 + Math.random() * 5)),
                backgroundColor: productColors[product] || '#cccccc'
            };
        })
    };

    return { wipTrend, yieldTrend, cycleTime, weeklyProduction: productionVolume };
}

/**
 * Generates detailed manufacturing data at the MES (Manufacturing Execution System) step level.
 * This data includes costs and metadata for individual lots as they move through production stages.
 * The variance values are derived from the daily summary data to ensure mathematical consistency.
 * @param {object} config - Configuration for data generation.
 * @param {number} config.lots - The number of lots to generate per product.
 * @param {Array<string>} config.products - The products to generate data for.
 * @param {Array<string>} config.fabs - The fabs to generate data for.
 * @returns {Array<object>} An array of MES step data records.
 */
function generateMesData({ lots = 50, products, fabs, technologies, processAreas, operations }) {
    const mesData = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // Generate data for the last 3 months
    const costStructure = window.appData.configData.costStructure;
    const dailySummary = window.appData.dailySummary;

    if (!dailySummary) {
        console.error("Daily summary data not available. Cannot generate consistent MES data.");
        return [];
    }

    const getStage = (processArea) => {
        if (processArea.startsWith('FEOL')) return 'FEOL';
        if (processArea.startsWith('BEOL')) return 'BEOL';
        if (['Wafer-Test', 'Final Test'].includes(processArea)) return 'Test';
        if (['Dicing', 'Die Attach', 'Wire Bonding', 'Escapsulation'].includes(processArea)) return 'Assembly & Packaging';
        return 'Other';
    };

    // Create a map of daily summary data for quick lookup
    const summaryMap = new Map();
    Object.values(dailySummary).forEach(entry => {
        const key = `${entry.date}_${entry.product}`;
        summaryMap.set(key, entry);
    });

    console.log(`Daily summary contains ${summaryMap.size} entries for MES data consistency.`);
    
    let summaryDataUsed = 0;
    let fallbackDataUsed = 0;

    for (const product of products) {
        for (let i = 1; i <= lots; i++) {
            const lotId = `L-${product.split(' ')[1].substring(0, 1)}${2400 + i}`;
            const fab = fabs[i % fabs.length];
            const technology = technologies[i % technologies.length];
            const operationCount = 20 + Math.floor(Math.random() * 30); // Each lot has 20-50 steps
            let current_date = new Date(startDate.getTime() + Math.random() * (new Date().getTime() - startDate.getTime()));

            // Find the corresponding daily summary entry for this product and date
            const dateString = current_date.toISOString().split('T')[0];
            const productDisplayName = `${product} (${fab})`;
            const summaryKey = `${dateString}_${productDisplayName}`;
            const summaryEntry = summaryMap.get(summaryKey);

            for (let j = 0; j < operationCount; j++) {
                const processArea = processAreas[j % processAreas.length];
                // Ensure the operation exists for the process area
                if (!operations[processArea] || operations[processArea].length === 0) continue;
                
                const operation = operations[processArea][j % operations[processArea].length];
                
                let plan_cost, actual_cost, variance;

                if (summaryEntry && summaryEntry.byProcessArea[processArea] && summaryEntry.byProcessArea[processArea].byMesStep[operation]) {
                    // Use the exact values from the daily summary to ensure consistency
                    const stepData = summaryEntry.byProcessArea[processArea].byMesStep[operation];
                    plan_cost = stepData.planned;
                    actual_cost = stepData.actual;
                    variance = stepData.variance;
                    summaryDataUsed++;
                } else {
                    // Fallback to original calculation if no summary data is available
                    const paDetails = costStructure[processArea];
                    const stepDetails = paDetails?.steps[operation];
                    const baseStepCost = 5000;
                    plan_cost = baseStepCost * (paDetails?.costWeight || 0.01) * (stepDetails?.costWeight || 0.01);
                    plan_cost *= (1 + (Math.random() - 0.5) * 0.2);
                    variance = plan_cost * (Math.random() - 0.4) * 0.5;
                    actual_cost = plan_cost + variance;
                    fallbackDataUsed++;
                }
                
                // 10% chance a lot is still in progress (WIP)
                const isWip = Math.random() < 0.1;
                
                const stage = getStage(processArea);
                
                mesData.push({
                    lot_id: lotId,
                    product: productDisplayName,
                    fab: fab,
                    technology: technology,
                    process_area: processArea,
                    stage: stage,
                    mes_operation: operation,
                    plan_cost: plan_cost,
                    actual_cost: actual_cost,
                    timestamp: new Date(current_date.getTime() + (j * 3600000)), // one hour per step
                    variance: isWip ? 0 : variance,
                    status: isWip ? 'WIP' : 'Complete'
                });

                // Increment date for the next step
                current_date.setHours(current_date.getHours() + (4 + Math.random() * 8));
            }
        }
    }
    
    console.log(`Generated ${mesData.length} MES records using daily summary variance data for consistency.`);
    console.log(`Summary data used: ${summaryDataUsed}`);
    console.log(`Fallback data used: ${fallbackDataUsed}`);
    return mesData;
}

/**
 * Generates lot-level manufacturing data for the detailed grid view.
 * Each lot represents a completed or in-progress manufacturing order with detailed metrics.
 * @param {object} config - Configuration for lot data generation
 * @returns {Array<object>} Array of lot records with SAP orders, costs, quantities, etc.
 */
function generateLotData({ products, fabs, technologies }) {
    const lotData = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Generate data for the last 6 months
    const endDate = new Date();
    
    let sapOrderCounter = 1000000;
    let lotIdCounter = 10001;
    
    // Get WIP data to align lot counts with WIP trends
    const wipData = window.appData?.productWipTrend;
    const dailySummary = window.appData?.dailySummary;
    
    if (!dailySummary) {
        console.error("Daily summary data not available for lot generation.");
        return [];
    }

    // Generate lots for each product over the time period
    for (const product of products) {
        const productDisplayName = `${product.name} (${product.fab})`;
        
        // Generate 3-8 lots per product per week over 6 months
        const totalWeeks = 26;
        const lotsPerWeek = 3 + Math.floor(Math.random() * 6);
        const totalLots = totalWeeks * lotsPerWeek;
        
        for (let i = 0; i < totalLots; i++) {
            const sapOrder = sapOrderCounter++;
            const lotId = `DEMOLOT${String(lotIdCounter++).padStart(5, '0')}`;
            
            // Random completion time within the 6-month period
            const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
            const completedTime = new Date(randomTime);
            const completedTimeStr = completedTime.toISOString();
            
            // Determine if lot is completed or still processing (align with WIP)
            const isCompleted = completedTime < new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // Completed if older than 1 week
            const status = isCompleted ? 'Completed' : 'Processing';
            
            // Standard planned quantity
            const plannedQty = 25;
            
            // Calculate scrap and completed quantities
            let scrapQty = 0;
            let completedQty = plannedQty;
            let wipQty = 0;
            
            if (isCompleted) {
                // For completed lots, calculate realistic scrap (0-15% scrap rate)
                const scrapRate = Math.random() * 0.15; // 0-15% scrap
                scrapQty = Math.floor(plannedQty * scrapRate);
                completedQty = plannedQty - scrapQty;
                wipQty = 0;
            } else {
                // For processing lots, no completed quantity yet
                completedQty = 0;
                scrapQty = 0;
                wipQty = plannedQty;
            }
            
            // Calculate yield
            const yield_ = isCompleted ? (completedQty / plannedQty) * 100 : 0;
            
            // Determine rework status (10% chance of rework)
            const rework = Math.random() < 0.1 ? 'Y' : 'N';
            
            // Get cost data from daily summary for this product and date
            const dateString = completedTime.toISOString().split('T')[0];
            const summaryKey = `${dateString}_${productDisplayName}`;
            const summaryEntries = Object.values(dailySummary).filter(entry => 
                entry.product === productDisplayName && 
                entry.date === dateString
            );
            
            // Calculate realistic costs based on technology node
            let basePlannedCost;
            switch (product.technology) {
                case '65nm':
                    basePlannedCost = 125000; // $125K for 65nm
                    break;
                case '45nm':
                    basePlannedCost = 250000; // $250K for 45nm
                    break;
                case '28nm':
                    basePlannedCost = 65000;  // $65K for 28nm
                    break;
                default:
                    basePlannedCost = 125000; // Default fallback
            }
            
            // Add some lot-to-lot variation in planned cost (±5%)
            const plannedCost = basePlannedCost * (0.95 + Math.random() * 0.1);
            
            // Calculate actual cost with reasonable variance (-10% to +15%)
            const varianceFactor = -0.1 + (Math.random() * 0.25); // -10% to +15%
            const costVariance = plannedCost * varianceFactor;
            const actualCost = plannedCost + costVariance;
            
            lotData.push({
                sapOrder: sapOrder,
                lotId: lotId,
                completedTime: completedTimeStr,
                status: status,
                product: productDisplayName,
                fab: product.fab,
                technology: product.technology,
                plannedQty: plannedQty,
                completedQty: completedQty,
                scrapQty: scrapQty,
                wipQty: wipQty,
                yield: Math.round(yield_ * 100) / 100, // Round to 2 decimal places
                rework: rework,
                plannedCost: Math.round(plannedCost),
                actualCost: Math.round(actualCost),
                costVariance: Math.round(costVariance)
            });
        }
    }
    
    // Sort by completion time (newest first)
    lotData.sort((a, b) => new Date(b.completedTime) - new Date(a.completedTime));
    
    console.log(`Generated ${lotData.length} lot records for detailed grid view.`);
    console.log(`Completed lots: ${lotData.filter(l => l.status === 'Completed').length}`);
    console.log(`Processing lots: ${lotData.filter(l => l.status === 'Processing').length}`);
    
    return lotData;
}

/* --- Quality Data Generation --- */
function generateQualityData(filters = {}) {
    const { 
        selectedFabs = orgCostingData.allFabs, 
        selectedProducts = orgCostingData.allProducts,
        viewBy = 'Month'
    } = filters;

    const productColors = { 'Product A': 'rgba(239, 83, 80, 0.8)', 'Product B': 'rgba(66, 165, 245, 0.8)', 'Product C': 'rgba(102, 187, 106, 0.8)' };

    // --- Trend Charts ---
    let trendLabels = [];
    const wipTrend = { labels: [], datasets: [] };
    const yieldTrend = { labels: [], datasets: [] };
    const firstPassYieldTrend = { labels: [], datasets: [] };

    selectedProducts.forEach((product, i) => {
        const productWip = orgCostingData.productWipTrend.filter(d => d.product === product && selectedFabs.includes(d.fab));
        const aggregatedWip = dateUtils.aggregateData(productWip, viewBy);
        if (i === 0) trendLabels = aggregatedWip.labels;
        wipTrend.datasets.push({ label: product, data: aggregatedWip.values, borderColor: productColors[product] || '#cccccc', fill: false, tension: 0.4 });

        const productYield = orgCostingData.yieldTrend.filter(d => d.product === product && selectedFabs.includes(d.fab));
        const aggregatedYield = dateUtils.aggregateData(productYield, viewBy);
        yieldTrend.datasets.push({ label: product, data: aggregatedYield.values, borderColor: productColors[product] || '#cccccc', fill: false, tension: 0.4 });
        
        const aggregatedFpy = dateUtils.aggregateData(productYield.map(d => ({...d, value: d.value * 0.95 })), viewBy); 
        firstPassYieldTrend.datasets.push({ label: `${product} FPY`, data: aggregatedFpy.values, borderColor: productColors[product] || '#cccccc', borderDash: [5, 5], fill: false, tension: 0.4 });
    });
    wipTrend.labels = trendLabels;
    yieldTrend.labels = trendLabels;
    firstPassYieldTrend.labels = trendLabels;
    
    const analysisLabels = [];
    const scrapUnitsData = [], scrapCostData = [], reworkUnitsData = [], reworkCostData = [];
    const scrapByMesStep = {}, reworkByMesStep = {};

    selectedFabs.forEach(fab => {
        selectedProducts.forEach(product => {
            if (!orgCostingData.costData.some(d => d.fab === fab && d.product === product)) return;
            const label = `${fab} - ${product}`;
            analysisLabels.push(label);

            const baseScrap = 20 + Math.random() * 50;
            const baseRework = 10 + Math.random() * 30;
            
            scrapUnitsData.push(baseScrap);
            scrapCostData.push(baseScrap * (150 + Math.random() * 50));
            reworkUnitsData.push(baseRework);
            reworkCostData.push(baseRework * (40 + Math.random() * 20));

            if (semiconductorStepsData && semiconductorStepsData.mes_steps) {
                scrapByMesStep[label] = [...semiconductorStepsData.mes_steps]
                    .sort(() => .5 - Math.random()).slice(0, 10)
                    .map(step => ({ step: step, count: Math.floor(Math.random() * 5 + 1), cost: Math.floor(Math.random() * 500 + 100) }));
                reworkByMesStep[label] = [...semiconductorStepsData.mes_steps]
                    .sort(() => .5 - Math.random()).slice(0, 10)
                    .map(step => ({ step: step, count: Math.floor(Math.random() * 3 + 1), cost: Math.floor(Math.random() * 200 + 50) }));
            }
        });
    });

    const scrapAnalysis = { 
        labels: analysisLabels, 
        datasets: [ 
            { label: 'Scrap Cost', data: scrapCostData, backgroundColor: 'rgba(239, 83, 80, 0.7)', yAxisID: 'yCost' },
            { label: 'Scrap Units', data: scrapUnitsData, backgroundColor: 'rgba(239, 83, 80, 0.4)', yAxisID: 'yUnits' }
        ] 
    };
    const reworkAnalysis = { 
        labels: analysisLabels, 
        datasets: [
            { label: 'Rework Cost', data: reworkCostData, backgroundColor: 'rgba(255, 167, 38, 0.7)', yAxisID: 'yCost' },
            { label: 'Rework Units', data: reworkUnitsData, backgroundColor: 'rgba(255, 167, 38, 0.4)', yAxisID: 'yUnits' }
        ] 
    };
    
    return { wipTrend, yieldTrend, firstPassYieldTrend, scrapAnalysis, reworkAnalysis, scrapByMesStep, reworkByMesStep };
}

/* --- Material Analysis Data Generation --- */
function generateMaterialAnalysisData(filters = {}) {
    const { 
        selectedFabs = orgCostingData.allFabs, 
        selectedTechNodes = orgCostingData.allTechNodes,
        selectedProducts = orgCostingData.allProducts 
    } = filters;

    // Filter cost data based on global filters
    const filteredCostData = orgCostingData.costData.filter(d =>
        selectedFabs.includes(d.fab) &&
        selectedTechNodes.includes(d.techNode) &&
        selectedProducts.includes(d.product)
    );

    // 1. Product Planned vs Actual Costs
    const productCosts = {
        labels: filteredCostData.map(d => `${d.fab} - ${d.product}`),
        datasets: [
            {
                label: 'Planned Cost',
                data: filteredCostData.map(d => d.plannedCost),
                backgroundColor: window.chartColors.planned,
                borderColor: window.chartColors.plannedHover,
                borderWidth: 0
            },
            {
                label: 'Actual Cost',
                data: filteredCostData.map(d => d.actualCost),
                backgroundColor: window.chartColors.actual,
                borderColor: window.chartColors.actualHover,
                borderWidth: 0
            }
        ]
    };
    
    // 2. Material Breakdown (Planned vs Actual)
// ... existing code ...

}

/* --- Cost Category (Traceability) Data Generation --- */
function generateCostCategoryData(filters = {}) {
     if (typeof semiconductorStepsData === 'undefined' || typeof sapComplexCosts === 'undefined') {
        console.error("Cost Category Data Generation Failed: Missing dependencies.");
        return [];
    }

    const { mes_steps, sap_steps } = semiconductorStepsData;
    const events = [];
    
    const sapPlannedCostMap = new Map();
    sap_steps.forEach(sapStep => {
        const costs = sapComplexCosts[sapStep] || {};
        sapPlannedCostMap.set(sapStep, Object.values(costs).reduce((sum, val) => sum + val, 0));
    });

    const coreProcessSteps = sap_steps.filter(s => !s.startsWith("SHARED"));
    const mesToSapMap = new Map();
    const sapAreaKeywords = ["FEOL", "BEOL", "TEST", "ASSY", "FNLTEST", "LOGISTICS"];
    let currentSapAreaIndex = 0;
    for (const mesStep of mes_steps) {
        if (currentSapAreaIndex < sapAreaKeywords.length - 1 && mesStep.toUpperCase().startsWith(sapAreaKeywords[currentSapAreaIndex + 1])) {
            currentSapAreaIndex++;
        }
        const currentSapArea = sapAreaKeywords[currentSapAreaIndex];
        const relevantSapStep = coreProcessSteps.find(s => s.startsWith(currentSapArea) && mesStep.toLowerCase().includes(s.split(' - ')[1].toLowerCase().split(' ')[0]))
            || coreProcessSteps.find(s => s.startsWith(currentSapArea));
        if (relevantSapStep) {
            mesToSapMap.set(mesStep, relevantSapStep);
        }
    }

    const getStageFromSapStep = (sapStep) => {
        if (!sapStep) return "Unknown";
        return sapStep.split(' - ')[0];
    };

    const products = orgCostingData.allProducts;
    const totalLots = 50;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    let eventCounter = 0;

    for (let i = 1; i <= totalLots; i++) {
        const lotId = `LOT-${2024000 + i}`;
        const product = products[i % products.length];
        const fab = orgCostingData.allFabs[i % orgCostingData.allFabs.length];
        const techNode = orgCostingData.allTechNodes[i % orgCostingData.allTechNodes.length];
        let unitsInLot = 25;

        mes_steps.forEach(mesStep => {
            if (unitsInLot <= 0) return;

            const processArea = mesToSapMap.get(mesStep) || "Unknown Process Area";
            const stage = getStageFromSapStep(processArea);
            
            const yieldAtStep = 0.98 + (Math.random() * 0.02);
            const unitsOut = Math.floor(unitsInLot * yieldAtStep);
            const scrapUnits = unitsInLot - unitsOut;

            const plannedCostPerUnit = (sapPlannedCostMap.get(processArea) || 50000) / 1000;
            const actualCostPerUnit = plannedCostPerUnit * (0.95 + Math.random() * 0.1);
            
            const eventTimestamp = new Date(startDate.getTime() + eventCounter * 60000 * 5);
            eventCounter++;

            events.push({
                lotId,
                product,
                fab,
                techNode,
                stage,
                processArea,
                mesOperation: mesStep,
                timestamp: eventTimestamp,
                unitsIn: unitsInLot,
                unitsOut,
                scrapUnits,
                yield: yieldAtStep,
                plannedCost: plannedCostPerUnit * unitsInLot,
                actualCost: actualCostPerUnit * unitsOut,
            });

            unitsInLot = unitsOut;
        });
    }
    
    return events;
}
