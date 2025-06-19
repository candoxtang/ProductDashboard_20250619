(function() {
    'use strict';

    console.log("Data source script loaded. Generating app data...");

    const FABS = ['Fab A', 'Fab B', 'Fab C'];
    const TECHNOLOGIES = ['65nm', '45nm', '28nm'];
    const PRODUCTS = [
        { id: 1, name: 'Product Alpha', displayName: 'Product Alpha (Fab A)', fab: 'Fab A', technology: '65nm', baseCost: 1_200_000, baseYield: 0.93, baseWip: 450, personality: { volatility: 1.8, eventMagnitude: 1.5, cost_multiplier: 1.1 } },
        { id: 2, name: 'Product Alpha', displayName: 'Product Alpha (Fab B)', fab: 'Fab B', technology: '65nm', baseCost: 1_250_000, baseYield: 0.92, baseWip: 500, personality: { volatility: 1.9, eventMagnitude: 1.4, cost_multiplier: 1.15 } },
        { id: 3, name: 'Product Beta',  displayName: 'Product Beta (Fab A)',  fab: 'Fab A', technology: '65nm', baseCost: 1_500_000, baseYield: 0.98, baseWip: 200, personality: { volatility: 0.8, eventMagnitude: 1.0, cost_multiplier: 0.95 } },
        { id: 4, name: 'Product Gamma', displayName: 'Product Gamma (Fab B)', fab: 'Fab B', technology: '45nm', baseCost: 900_000,   baseYield: 0.99, baseWip: 150, personality: { volatility: 0.5, eventMagnitude: 0.8, cost_multiplier: 0.90 } },
        { id: 5, name: 'Product Gamma', displayName: 'Product Gamma (Fab C)', fab: 'Fab C', technology: '45nm', baseCost: 950_000,   baseYield: 0.985, baseWip: 180, personality: { volatility: 0.6, eventMagnitude: 0.9, cost_multiplier: 0.92 } },
        { id: 6, name: 'Product Delta', displayName: 'Product Delta (Fab C)', fab: 'Fab C', technology: '45nm', baseCost: 1_800_000, baseYield: 0.96, baseWip: 300, personality: { volatility: 1.2, eventMagnitude: 1.2, cost_multiplier: 1.05 } },
        { id: 7, name: 'Product Epsilon',displayName: 'Product Epsilon (Fab A)',fab: 'Fab A', technology: '28nm', baseCost: 1_100_000, baseYield: 0.97, baseWip: 220, personality: { volatility: 1.0, eventMagnitude: 1.0, cost_multiplier: 1.0 } },
        { id: 8, name: 'Product Zeta',  displayName: 'Product Zeta (Fab B)',  fab: 'Fab B', technology: '28nm', baseCost: 1_300_000, baseYield: 0.94, baseWip: 350, personality: { volatility: 1.5, eventMagnitude: 1.1, cost_multiplier: 1.2 } },
        { id: 9, name: 'Product Omega', displayName: 'Product Omega (Fab C)', fab: 'Fab C', technology: '28nm', baseCost: 2_000_000, baseYield: 0.91, baseWip: 600, personality: { volatility: 2.0, eventMagnitude: 2.0, cost_multiplier: 1.3 } }
    ];

    const MATERIAL_FAMILIES = [
        'Substrates/Wafers', 'Gases & Wet Chemicals', 'Photoresists & Solvents',
        'Dielectrics & Barriers', 'Metals & Conductors', 'Dopants', 'CMP',
        'Photomasks', 'Packaging Materials', 'Support/Ancillaries'
    ];

    const MATERIAL_FAMILY_COST_WEIGHTS = {
        'Substrates/Wafers': 0.35,
        'Photomasks': 0.20,
        'Gases & Wet Chemicals': 0.10,
        'CMP': 0.08,
        'Packaging Materials': 0.07,
        'Dielectrics & Barriers': 0.05,
        'Metals & Conductors': 0.05,
        'Photoresists & Solvents': 0.04,
        'Support/Ancillaries': 0.03,
        'Dopants': 0.03
    };

    const COST_STRUCTURE = {
        'FEOL-Wafer Preparation': {
            costWeight: 0.08,
            steps: {
                'Ingot Growth (Czochralski/Float-Zone)': { costWeight: 0.15 },
                'Ingot Slicing and Shaping': { costWeight: 0.15 },
                'Wafer Lapping & Grinding': { costWeight: 0.20 },
                'Surface Polishing (CMP)': { costWeight: 0.20 },
                'Edge Trimming & Profiling': { costWeight: 0.10 },
                'Wafer Cleaning (RCA/SC-1/SC-2)': { costWeight: 0.10 },
                'Final Surface Inspection': { costWeight: 0.10 }
            }
        },
        'FEOL-Oxidation': {
            costWeight: 0.05,
            steps: {
                'Furnace Loading & Setup': { costWeight: 0.15 },
                'Dry Thermal Oxidation (O2)': { costWeight: 0.40 },
                'Wet Thermal Oxidation (H2O)': { costWeight: 0.35 },
                'Furnace Unloading & Cooldown': { costWeight: 0.10 }
            }
        },
        'FEOL-Photolithography': {
            costWeight: 0.13,
            steps: {
                'Dehydration Bake & Vapor Prime': { costWeight: 0.05 },
                'Adhesion Promoter Application (HMDS)': { costWeight: 0.05 },
                'Photoresist Coating (Spin Coat)': { costWeight: 0.15 },
                'Soft Bake': { costWeight: 0.10 },
                'Mask Alignment & Stepper Exposure': { costWeight: 0.35 },
                'Post-Exposure Bake (PEB)': { costWeight: 0.10 },
                'Developing': { costWeight: 0.10 },
                'Hard Bake': { costWeight: 0.05 }
            }
        },
        'FEOL-Etching': {
            costWeight: 0.10,
            steps: {
                'Descum / Pre-Etch Clean': { costWeight: 0.10 },
                'Hard Mask Open Etch': { costWeight: 0.20 },
                'Dielectric Etch (RIE/Plasma)': { costWeight: 0.30 },
                'Silicon Etch (Deep RIE)': { costWeight: 0.15 },
                'Photoresist Ashing/Stripping': { costWeight: 0.15 },
                'Post-Etch Wet Clean': { costWeight: 0.10 }
            }
        },
        'FEOL-Doping': {
            costWeight: 0.07,
            steps: {
                'Implanter Source Setup': { costWeight: 0.15 },
                'Ion Implantation (P-type/N-type)': { costWeight: 0.65 },
                'Dose & Uniformity Monitoring': { costWeight: 0.20 }
            }
        },
        'FEOL-RTP': {
            costWeight: 0.04,
            steps: {
                'Dopant Activation Anneal': { costWeight: 0.50 },
                'Silicide Formation (Salicide)': { costWeight: 0.50 }
            }
        },
        'FEOL-CMP': {
            costWeight: 0.06,
            steps: {
                'Slurry Preparation & Delivery': { costWeight: 0.15 },
                'Shallow Trench Isolation (STI) CMP': { costWeight: 0.40 },
                'Polysilicon Gate CMP': { costWeight: 0.25 },
                'Post-CMP Wafer Cleaning': { costWeight: 0.20 }
            }
        },
        'BEOL-DEP': {
            costWeight: 0.08,
            steps: {
                'Chamber Conditioning & Degas': { costWeight: 0.10 },
                'Adhesion/Barrier Layer Deposition (Ta/TaN)': { costWeight: 0.20 },
                'Copper Seed Layer Deposition (PVD)': { costWeight: 0.25 },
                'Copper Bulk Fill (ECD)': { costWeight: 0.30 },
                'Post-Deposition Anneal': { costWeight: 0.15 }
            }
        },
        'BEOL-Litho-Etch': {
            costWeight: 0.07,
            steps: {
                'Metal Layer Resist Coating': { costWeight: 0.25 },
                'Metal Layer Mask Exposure': { costWeight: 0.40 },
                'Metal Layer Etching (Dual Damascene)': { costWeight: 0.35 }
            }
        },
        'BEOL-Dielectric Deposition': {
            costWeight: 0.05,
            steps: {
                'PECVD Chamber Prep': { costWeight: 0.20 },
                'Inter-Metal Dielectric (IMD) Deposition (Low-k)': { costWeight: 0.60 },
                'Film Quality & Thickness Check': { costWeight: 0.20 }
            }
        },
        'BEOL-CMP': {
            costWeight: 0.04,
            steps: {
                'Copper CMP': { costWeight: 0.40 },
                'Barrier/Dielectric CMP': { costWeight: 0.35 },
                'Final Post-CMP Cleaning': { costWeight: 0.25 }
            }
        },
        'Wafer-Test': {
            costWeight: 0.05,
            steps: {
                'Probe Card Setup & Verification': { costWeight: 0.20 },
                'Wafer Loading & Alignment': { costWeight: 0.10 },
                'Parametric Testing (Wafer Sort)': { costWeight: 0.40 },
                'Die Binning & Inking': { costWeight: 0.20 },
                'Wafer Map Generation': { costWeight: 0.10 }
            }
        },
        'Dicing': {
            costWeight: 0.02,
            steps: {
                'Wafer Backgrinding': { costWeight: 0.30 },
                'Wafer Mounting on Tape Frame': { costWeight: 0.20 },
                'Blade/Laser Dicing': { costWeight: 0.40 },
                'Post-Dice Inspection': { costWeight: 0.10 }
            }
        },
        'Die Attach': {
            costWeight: 0.02,
            steps: {
                'Epoxy/Solder Paste Dispense': { costWeight: 0.40 },
                'Pick-and-Place Die Mounting': { costWeight: 0.40 },
                'Curing Oven': { costWeight: 0.20 }
            }
        },
        'Wire Bonding': {
            costWeight: 0.03,
            steps: {
                'Package Plasma Cleaning': { costWeight: 0.20 },
                'Ball/Wedge Wire Bonding': { costWeight: 0.60 },
                'Bond Pull & Shear Test': { costWeight: 0.20 }
            }
        },
        'Escapsulation': {
            costWeight: 0.02,
            steps: {
                'Molding Compound Preparation': { costWeight: 0.30 },
                'Transfer Molding / Encapsulation': { costWeight: 0.70 }
            }
        },
        'Final Test': {
            costWeight: 0.02,
            steps: {
                'Package Loading into Handler': { costWeight: 0.15 },
                'System Level Test (SLT)': { costWeight: 0.45 },
                'Burn-in Stress Test': { costWeight: 0.25 },
                'Final Inspection & Packaging': { costWeight: 0.15 }
            }
        }
    };

    const PROCESS_AREAS = [ "Lithography", "Etch", "Deposition", "Implant", "CMP", "Metrology", "Diffusion", "BEOL", "Test", "Assembly" ];

    function getEvolvingVariance(mesStep, productPersonality) {
        return (Math.random() - 0.5) * 0.50 * productPersonality.volatility;
    }

    function getProductVariance(product, date) {
        const time = date.getTime();
        const { personality } = product;

        if (product.id === 1) {
            const start = new Date('2023-07-01').getTime();
            const end = new Date('2023-10-01').getTime();
            if (time >= start && time < end) {
                const duration = end - start;
                const progress = (time - start) / duration;
                const oscillation = Math.sin(progress * Math.PI);
                const variance = 0.35 * oscillation * personality.eventMagnitude;
                return { variancePercent: variance, primaryCause: ['FEOL-Etching', 'BEOL-Litho-Etch'] };
            }
        }
        if (product.id === 4) {
            const start = new Date('2024-01-15').getTime();
            if (time >= start) {
                return { variancePercent: -0.18 * personality.eventMagnitude, primaryCause: ['Wire Bonding', 'Final Test'] };
            }
        }
        if (product.id === 9) {
            const start = new Date('2023-03-01').getTime();
            const end = new Date('2023-05-01').getTime();
            if (time >= start && time < end) {
                 const duration = end - start;
                const progress = (time - start) / duration;
                const oscillation = Math.sin(progress * Math.PI * 2);
                const variance = 0.45 * oscillation * personality.eventMagnitude;
                return { variancePercent: variance, primaryCause: ['BEOL-DEP'] };
            }
        }
        if (product.id === 6) {
            const start = new Date('2023-11-01').getTime();
            const end = new Date('2024-02-01').getTime();
            if (time >= start && time < end) {
                return { variancePercent: -0.22 * personality.eventMagnitude, primaryCause: ['FEOL-Doping', 'FEOL-RTP'] };
            }
        }
        return { variancePercent: 0, primaryCause: [] };
    }

    function preSummarizeData() {
        console.time('Data Generation & Summarization');
        
        // --- START: More Realistic Scrap Cost Modeling ---
        let cumulativeCost = 0;
        const mesStepCosts = (window.semiconductorStepsData?.mes_steps || []).map(step => {
            // Assign a base cost to each step, with higher costs for complex operations
            let baseStepCost = 500 + Math.random() * 2000;
            if (step.includes("Photo")) baseStepCost += 5000;
            if (step.includes("Etch")) baseStepCost += 4000;
            if (step.includes("CMP")) baseStepCost += 3000;
            if (step.includes("Implant")) baseStepCost += 6000;
            if (step.includes("Deposition")) baseStepCost += 3500;
            if (step.includes("Test")) baseStepCost += 2500;
            if (step.includes("Assembly") || step.includes("Package")) baseStepCost += 1500;
            
            cumulativeCost += baseStepCost;
            return { step, cost: baseStepCost, cumulativeCost: cumulativeCost };
        });
        // --- END: More Realistic Scrap Cost Modeling ---

        const dailySummary = {};
        const productWip = {};
        const wipLabels = new Set();
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 2);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];

            for (const product of PRODUCTS) {
                const dailyPlannedTotal = product.baseCost * (1 + (Math.random() - 0.5) * 0.15);
                const dailyYield = product.baseYield - (Math.random() * 0.15);
                
                // --- START: New, Corrected Realistic Scrap Calculation ---
                const yieldLossPercentage = 1 - dailyYield;
                // Assume scrap occurs uniformly, so the average loss is ~50% of final value. Add some noise.
                const averageScrapPointFactor = (Math.random() * 0.4) + 0.3; // Random factor between 0.3 and 0.7
                const totalDailyScrapCost = dailyPlannedTotal * yieldLossPercentage * averageScrapPointFactor;
                // --- END: New, Corrected Realistic Scrap Calculation ---

                const productVarianceInfo = getProductVariance(product, d);
                const eventVariance = dailyPlannedTotal * productVarianceInfo.variancePercent;
                const totalVarianceAmount = eventVariance; // Scrap is now separate

                const summaryKey = `${dateString}|${product.id}`;
                const summaryEntry = {
                    date: dateString, 
                    fab: product.fab, 
                    technology: product.technology, 
                    product: product.displayName,
                    productName: product.name,
                    productId: product.id,
                    total_planned: 0,
                    total_actual: 0,
                    variance: 0,
                    scrap_cost: totalDailyScrapCost, // Apply new realistic cost
                    byProcessArea: {}
                };
                
                for (const [processAreaName, processAreaDetails] of Object.entries(COST_STRUCTURE)) {
                    const paKey = processAreaName;
                    const paEntry = {
                        planned: 0, actual: 0, variance: 0, byMesStep: {}
                    };
                    
                    const processAreaPlannedCost = dailyPlannedTotal * processAreaDetails.costWeight;
                    
                    let processAreaMacroVariance = 0;
                    if (productVarianceInfo.primaryCause.includes(processAreaName)) {
                        const numCausePAs = productVarianceInfo.primaryCause.length || 1;
                        processAreaMacroVariance = (totalVarianceAmount / numCausePAs);
                    }
                    
                    for (const [mesStepName, mesStepDetails] of Object.entries(processAreaDetails.steps)) {
                        const planned_cost = processAreaPlannedCost * mesStepDetails.costWeight;
                        
                        const micro_variance = planned_cost * getEvolvingVariance(mesStepName, product.personality);
                        const macro_variance_share = processAreaMacroVariance * mesStepDetails.costWeight;
                        const variance = macro_variance_share + micro_variance;
                        const actual_cost = planned_cost + variance;
                        
                        paEntry.byMesStep[mesStepName] = { planned: planned_cost, actual: actual_cost, variance };
                        paEntry.planned += planned_cost;
                        paEntry.actual += actual_cost;
                        paEntry.variance += variance;
                    }
                    
                    summaryEntry.byProcessArea[paKey] = paEntry;
                    summaryEntry.total_planned += paEntry.planned;
                    summaryEntry.total_actual += paEntry.actual;
                    summaryEntry.total_variance += paEntry.variance;
                }
                dailySummary[summaryKey] = summaryEntry;

                // Simple WIP trend calculation (e.g., lots started vs lots completed)
                if (!productWip[product.displayName]) {
                    productWip[product.displayName] = { fab: product.fab, data: [] };
                }
                const lotsStarted = Math.floor(Math.random() * 8) + 5; // 5-12 lots start
                const lotsCompleted = Math.floor(Math.random() * 8) + 5; // 5-12 lots complete, to balance WIP
                const wipChange = lotsStarted - lotsCompleted;
                const lastWip = productWip[product.displayName].data.slice(-1)[0] || product.baseWip;
                productWip[product.displayName].data.push(Math.max(20, lastWip + wipChange));
                wipLabels.add(dateString);
            }
        }
        
        const summaryArray = Object.values(dailySummary);

        const sortedLabels = Array.from(wipLabels).sort();
        const productWipTrend = {
            labels: sortedLabels,
            datasets: Object.entries(productWip).map(([productName, wipData]) => ({
                label: productName,
                data: wipData.data.slice(-sortedLabels.length), // Ensure data aligns with labels
                fab: wipData.fab
            }))
        };

        console.log(`Generated and summarized ${summaryArray.length} daily records.`);
        console.timeEnd('Data Generation & Summarization');
        return { dailySummary, summaryArray, mesStepCosts, productWipTrend };
    }

    const generateSemiconductorStepsData = () => {
        const mes_steps = Object.values(COST_STRUCTURE).flatMap(pa => Object.keys(pa.steps));
        return {
            mes_steps: mes_steps,
        };
    };

    // --- Generate MES Step Performance Profiles ---
    const generateMesStepPerformanceProfiles = () => {
        const mesSteps = window.semiconductorStepsData.mes_steps;
        const stepProfiles = {};
        const numProblemSteps = 8;
        const numStarSteps = 6;
        const stepsCopy = [...mesSteps];

        for (let i = 0; i < numProblemSteps; i++) {
            if (stepsCopy.length === 0) break;
            const index = Math.floor(Math.random() * stepsCopy.length);
            const stepName = stepsCopy.splice(index, 1)[0];
            stepProfiles[stepName] = (Math.random() * 0.25) + 0.15;
        }

        for (let i = 0; i < numStarSteps; i++) {
            if (stepsCopy.length === 0) break;
            const index = Math.floor(Math.random() * stepsCopy.length);
            const stepName = stepsCopy.splice(index, 1)[0];
            stepProfiles[stepName] = -((Math.random() * 0.20) + 0.10);
        }

        stepsCopy.forEach(stepName => {
            stepProfiles[stepName] = (Math.random() - 0.5) * 0.06;
        });

        return stepProfiles;
    }

    // --- Generate Process Time Data ---
    const generateProcessTimeData = (stepProfiles) => {
        console.log("Generating Process Time variance data...");
        const processTimeData = [];
        const mesSteps = window.semiconductorStepsData.mes_steps;

        // Define realistic planned times in seconds for each step category
        const mesStepTimes = {
            "default": 1800, // 30 minutes
            "Inspection": 600, // 10 minutes
            "Metrology": 900, // 15 minutes
            "Cleaning": 2700, // 45 minutes
            "Photolithography": 7200, // 2 hours
            "Etch": 5400, // 1.5 hours
            "Deposition": 6300, // 1.75 hours
            "CMP": 4500, // 1.25 hours
            "Implantation": 8100, // 2.25 hours
            "Annealing": 10800, // 3 hours
            "Test": 3600, // 1 hour
            "Assembly": 18000 // 5 hours
        };

        const getPlannedTimeForStep = (stepName) => {
            for (const key in mesStepTimes) {
                if (stepName.toLowerCase().includes(key.toLowerCase())) {
                    return mesStepTimes[key];
                }
            }
            return mesStepTimes.default;
        };

        const numDays = 365;
        const today = new Date();

        for (let i = 0; i < numDays; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            PRODUCTS.forEach(product => {
                mesSteps.forEach(step => {
                    const plannedTime = getPlannedTimeForStep(step);
                    const baselineVariance = stepProfiles[step];
                    
                    const dailyNoise = (Math.random() - 0.5) * 0.05;
                    const finalVariance = baselineVariance + dailyNoise;

                    const actualTime = Math.round(plannedTime * (1 + finalVariance));

                    processTimeData.push({
                        date: dateString,
                        product: product.name,
                        fab: product.fab,
                        technology: product.technology,
                        mesStep: step,
                        plannedTime: plannedTime,
                        actualTime: actualTime
                    });
                });
            });
        }
        console.log(`Generated ${processTimeData.length} process time records.`);
        return { processTimeData, getPlannedTimeForStep };
    };

    const generateCycleTimeData = (getPlannedTimeForStep, stepProfiles) => {
        const completedLotsData = [];
        const mesSteps = window.semiconductorStepsData.mes_steps;
        const productSpecs = {
            "Product Alpha": { plannedCycleTime: 75, route: mesSteps.slice(0, 150) },
            "Product Beta":  { plannedCycleTime: 60, route: mesSteps.slice(100, 220) },
            "Product Gamma": { plannedCycleTime: 85, route: mesSteps.slice(30, 180) },
            "Product Delta": { plannedCycleTime: 65, route: mesSteps.slice(0, 80).concat(mesSteps.slice(150, 200)) },
            "Product Omega": { plannedCycleTime: 90, route: mesSteps }
        };

        for (const productName in productSpecs) {
            const spec = productSpecs[productName];
            spec.plannedProcessTimeSum = spec.route.reduce((sum, step) => sum + getPlannedTimeForStep(step), 0);
            spec.plannedQueueTime = (spec.plannedCycleTime * 24 * 60) - spec.plannedProcessTimeSum;
        }

        // Add yield profiles for process areas
        const processAreaYields = {};
        const processAreas = Object.keys(COST_STRUCTURE);
        processAreas.forEach(pa => {
            // Assign a baseline yield between 95% and 99.8%
            processAreaYields[pa] = 0.95 + (Math.random() * 0.048);
        });

        const numDays = 365;
        const today = new Date();

        for (let i = 0; i < numDays; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            PRODUCTS.forEach(product => {
                const spec = productSpecs[product.name];
                if (!spec) return;

                let actualProcessTimeSum = 0;
                spec.route.forEach(step => {
                    const planned = getPlannedTimeForStep(step);
                    const variance = stepProfiles[step] || 0;
                    actualProcessTimeSum += planned * (1 + variance);
                });

                // Re-balanced variance to show a mix of positive and negative outcomes
                const queueTimeVariance = (Math.random() - 0.5) * 0.5; // up to +/- 25%
                const actualQueueTime = spec.plannedQueueTime * (1 + queueTimeVariance);

                const actualCycleTimeMinutes = actualProcessTimeSum + actualQueueTime;
                const actualCycleTimeDays = actualCycleTimeMinutes / (24 * 60);

                const lotsCompleted = Math.floor(Math.random() * 5) + 1;
                for (let j = 0; j < lotsCompleted; j++) {
                    const lotNoise = 1 + (Math.random() - 0.5) * 0.05;
                    completedLotsData.push({
                        date: dateString,
                        fab: product.fab,
                        technology: product.technology,
                        product: product.name,
                        lotId: `${dateString.slice(5, 10)}-${product.name.slice(0, 2).toUpperCase()}-${j + 1}`,
                        plannedCycleTime: spec.plannedCycleTime,
                        actualCycleTime: actualCycleTimeDays * lotNoise,
                    });
                }
            });
        }
        return { completedLotsData, processAreaYields };
    };

    const generateProcessAreaYieldData = () => {
        const data = [];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 2);

        const baseYields = PROCESS_AREAS.reduce((acc, area) => {
            acc[area] = 0.98 - (Math.random() * 0.05); // Base yield between 93% and 98%
            return acc;
        }, {});

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            for (const product of PRODUCTS) {
                for (const area of PROCESS_AREAS) {
                    // Add some noise based on product personality
                    const noise = (Math.random() - 0.5) * 0.02 * product.personality.volatility;
                    let yieldValue = baseYields[area] + noise;
                    
                    // Add a small daily trend component to make it less static
                    const dayOfYear = (d - new Date(d.getFullYear(), 0, 0)) / 86400000;
                    const trend = Math.sin(dayOfYear / 365 * Math.PI * 2 + area.length) * 0.01;
                    yieldValue += trend;

                    // Ensure yield is within a realistic range
                    yieldValue = Math.max(0.90, Math.min(0.995, yieldValue));

                    data.push({
                        date: dateString,
                        product: product.displayName,
                        processArea: area,
                        yield: yieldValue * 100 // Store as percentage
                    });
                }
            }
        }
        return data;
    };

    function initializeDataSource() {
        window.appData = {}; // Initialize appData object
        const startTime = performance.now();
        
        const semiconductorStepsData = generateSemiconductorStepsData();
        window.appData.semiconductorStepsData = semiconductorStepsData;

        // Generate summary data
        const { dailySummary, summaryArray, mesStepCosts, productWipTrend } = preSummarizeData();
        const dailyCostData = Object.values(summaryArray);

        const stepProfiles = generateMesStepPerformanceProfiles();
        
        const { processTimeData, getPlannedTimeForStep } = generateProcessTimeData(stepProfiles);
        window.appData.processTimeData = processTimeData;

        const { completedLotsData, processAreaYields } = generateCycleTimeData(getPlannedTimeForStep, stepProfiles);
        window.appData.cycleTimeData = completedLotsData;

        const materialFamilyCostData = generateMaterialFamilyCostData(dailyCostData);
        const materialCostByMesStepData = generateMaterialCostByMesStepData(materialFamilyCostData);
        const processAreaYieldData = generateProcessAreaYieldData();

        window.appData = {
            configData: {
                fabs: FABS,
                technologies: TECHNOLOGIES,
                products: [...new Set(PRODUCTS.map(p => p.name))], // Unique base names for filter
                fullProducts: PRODUCTS, // Full product objects for data generation
                processAreas: Object.keys(COST_STRUCTURE),
                mes_steps: semiconductorStepsData.mes_steps,
                costStructure: COST_STRUCTURE
            },
            dailySummary: dailySummary,
            productWipTrend: productWipTrend,
            dailyCostData: dailyCostData,
            semiconductorStepsData: semiconductorStepsData,
            processTimeData: processTimeData,
            cycleTimeData: completedLotsData,
            materialFamilyCostData,
            materialCostByMesStepData,
            processAreaYieldData: processAreaYieldData,
            processAreaYields: processAreaYields,
            mesStepCosts: mesStepCosts
        };
        console.log("Dispatching dataReady event.", window.appData);
        document.dispatchEvent(new CustomEvent('dataReady', { detail: { appData: window.appData } }));

        const endTime = performance.now();
        console.log(`Data Generation & Summarization: ${endTime - startTime} ms`);

        // --- NEW: Generate Rework Data ---
        (function generateReworkData() {
            console.log("Generating realistic rework data based on WIP...");
            const reworkRecords = [];
            const REWORK_COST_PER_UNIT = 50; // An assumed cost per unit of rework

            if (!window.appData || !window.appData.productWipTrend) {
                console.error("WIP trend data not available for rework generation.");
                window.appData.reworkData = [];
                return;
            }

            const wip = window.appData.productWipTrend;
            const dates = wip.labels;

            wip.datasets.forEach(productDataset => {
                // Extract product name from label like "Product Alpha (Fab A)"
                const productNameMatch = productDataset.label.match(/^(.*) \(/);
                if (!productNameMatch) return;
                const productName = productNameMatch[1];
                
                productDataset.data.forEach((wipCount, dayIndex) => {
                    if (wipCount > 0) {
                        const date = dates[dayIndex];
                        let reworkPercentage = 0.05; // Average 5% rework

                        // Add variability
                        reworkPercentage += (Math.random() - 0.5) * 0.04; // Varies between 3% and 7%

                        // Add occasional spikes
                        if (Math.random() < 0.03) { // 3% chance of a spike
                            reworkPercentage += (Math.random() * 0.10) + 0.05; // Spike adds 5% to 15% more
                        }
                        
                        // Ensure rework percentage is realistic (e.g., > 0.5%)
                        reworkPercentage = Math.max(0.005, reworkPercentage);

                        const reworkedUnits = Math.round(wipCount * reworkPercentage);
                        
                        // Let's make the cost per unit have some variance as well
                        const costPerUnit = REWORK_COST_PER_UNIT * (1 + (Math.random() - 0.5) * 0.2);
                        const reworkCost = reworkedUnits * costPerUnit;

                        if (reworkCost > 0) {
                             reworkRecords.push({
                                date: date,
                                productFab: productDataset.label, // e.g., "Product Alpha (Fab A)"
                                value: reworkCost,
                                units: reworkedUnits,
                                wip: wipCount,
                            });
                        }
                    }
                });
            });

            window.appData.reworkData = reworkRecords;
            console.log(`Generated ${reworkRecords.length} realistic rework records.`);
        })();

        // --- NEW: Generate Rework Data by MES Step ---
        (function generateReworkDetailData() {
            console.log("Generating rework detail data by MES step...");
            const reworkByMesStepData = [];
            const allMesSteps = window.semiconductorStepsData?.mes_steps || [];
            const mesStepCostMap = new Map((window.appData.mesStepCosts || []).map(s => [s.step, s.cost]));

            if (allMesSteps.length === 0 || !window.appData.reworkData) {
                console.error("Cannot generate rework detail data: missing MES steps or rework data.");
                window.appData.reworkByMesStepData = [];
                return;
            }

            window.appData.reworkData.forEach(reworkEvent => {
                // 1. Determine how many MES steps were affected (1 to 5)
                const stepsToReworkCount = Math.floor(Math.random() * 5) + 1;
                
                // 2. Find a random starting point in the main MES step list
                const startIdx = Math.floor(Math.random() * (allMesSteps.length - stepsToReworkCount));
                const reworkSequence = allMesSteps.slice(startIdx, startIdx + stepsToReworkCount);
                
                // 3. Distribute the total rework cost across the selected steps
                const sequenceWithCosts = reworkSequence.map(step => ({
                    step,
                    cost: mesStepCostMap.get(step) || 1000 // Default cost if not found
                }));
                
                const totalIntrinsicCost = sequenceWithCosts.reduce((sum, s) => sum + s.cost, 0);
                
                if (totalIntrinsicCost > 0) {
                    sequenceWithCosts.forEach(stepInfo => {
                        const proportion = stepInfo.cost / totalIntrinsicCost;
                        const distributedCost = reworkEvent.value * proportion;

                        reworkByMesStepData.push({
                            step: stepInfo.step,
                            cost: distributedCost,
                            date: reworkEvent.date,
                            productFab: reworkEvent.productFab
                        });
                    });
                }
            });
            
            window.appData.reworkByMesStepData = reworkByMesStepData;
            console.log(`Generated ${reworkByMesStepData.length} detailed rework records by MES step.`);
        })();
    }

    function generateMaterialFamilyCostData(dailyCostData) {
        const materialFamilyCostData = [];
        
        // Define material families and their approximate cost contribution to the total material budget.
        // These are relative weights and will be normalized.
        const materialFamilyDistribution = {
            'Substrates/Wafers': 25,
            'Photomasks': 20,
            'Gases & Wet Chemicals': 12,
            'Metals & Conductors': 10,
            'CMP': 8,
            'Dielectrics & Barriers': 7,
            'Packaging Materials': 6,
            'Photoresists & Solvents': 5,
            'Support/Ancillaries': 4,
            'Dopants': 3,
        };
        const totalDistribution = Object.values(materialFamilyDistribution).reduce((sum, v) => sum + v, 0);

        // Assume materials constitute a variable portion of the total cost, e.g., 40-55%
        const BASE_MATERIAL_COST_RATIO = 0.45;

        dailyCostData.forEach(dailyData => {
            // Base planned and actual costs for the product on a given day
            const totalActualProductCost = dailyData.total_actual;
            const totalPlannedProductCost = dailyData.total_planned;

            // The 'personality' of a product can influence its material cost ratio
            const productPersonality = PRODUCTS.find(p => p.displayName === dailyData.product)?.personality || { volatility: 1.0, cost_multiplier: 1.0 };
            const productSpecificMaterialRatio = BASE_MATERIAL_COST_RATIO * (productPersonality.cost_multiplier || 1.0);
            
            // Calculate total material cost for the day
            const dailyMaterialPlannedCost = totalPlannedProductCost * productSpecificMaterialRatio;

            // The actual material cost should be based on the actual product cost.
            let dailyMaterialActualCost;

            if (totalActualProductCost > 0) {
                // Start with the same ratio from the actual total cost
                const baseActualMaterialCost = totalActualProductCost * productSpecificMaterialRatio;

                // Now apply variances based on performance
                const rework_impact = (dailyData.rework_cost && totalActualProductCost) ? 1 + (dailyData.rework_cost / totalActualProductCost) * 2 : 1;
                const random_fluctuation = 1 + (Math.random() - 0.5) * 0.05;

                dailyMaterialActualCost = baseActualMaterialCost * rework_impact * random_fluctuation;

            } else {
                // If there is no actual cost, there is no actual material cost
                dailyMaterialActualCost = 0;
            }
            
            // Cap the actual cost to be a realistic portion of the total actual cost
            if (totalActualProductCost > 0) {
                dailyMaterialActualCost = Math.min(dailyMaterialActualCost, totalActualProductCost * 0.75);
            }


            for (const [family, percentage] of Object.entries(materialFamilyDistribution)) {
                const proportion = percentage / totalDistribution;
                
                const plannedCost = dailyMaterialPlannedCost * proportion;
                const actualCost = dailyMaterialActualCost * proportion;

                materialFamilyCostData.push({
                    date: dailyData.date,
                    fab: dailyData.fab,
                    technology: dailyData.technology,
                    product: dailyData.product,
                    materialFamily: family,
                    plannedCost: plannedCost,
                    actualCost: actualCost,
                });
            }
        });
        
        return materialFamilyCostData;
    }

    function generateMaterialCostByMesStepData(materialFamilyCostData) {
        const materialCostByMesStepData = [];

        const materialFamilyToProcessArea = {
            'Substrates/Wafers': ['FEOL-Wafer Preparation', 'Dicing'],
            'Photomasks': ['FEOL-Photolithography', 'BEOL-Litho-Etch'],
            'Gases & Wet Chemicals': ['FEOL-Oxidation', 'FEOL-Etching', 'Post-Etch Wet Clean', 'Package Plasma Cleaning'],
            'Photoresists & Solvents': ['FEOL-Photolithography', 'Photoresist Ashing/Stripping'],
            'Dielectrics & Barriers': ['FEOL-Oxidation', 'BEOL-Dielectric Deposition', 'Adhesion/Barrier Layer Deposition (Ta/TaN)'],
            'Metals & Conductors': ['BEOL-DEP', 'Wire Bonding'],
            'Dopants': ['FEOL-Doping'],
            'CMP': ['FEOL-CMP', 'BEOL-CMP'],
            'Packaging Materials': ['Die Attach', 'Escapsulation'],
            'Support/Ancillaries': ['Wafer-Test', 'Final Test', 'Probe Card Setup & Verification'],
        };
        
        materialFamilyCostData.forEach(materialData => {
            const processAreas = materialFamilyToProcessArea[materialData.materialFamily] || [];
            const relevantSteps = processAreas.flatMap(area => COST_STRUCTURE[area] ? Object.keys(COST_STRUCTURE[area].steps) : []);
            
            if (relevantSteps.length === 0) return;

            // Distribute the costs across the relevant steps, adding some noise
            let stepCosts = relevantSteps.map(step => ({ step, weight: Math.random() }));
            const totalWeight = stepCosts.reduce((sum, s) => sum + s.weight, 0);

            stepCosts.forEach(stepCost => {
                const proportion = stepCost.weight / totalWeight;
                materialCostByMesStepData.push({
                    date: materialData.date,
                    product: materialData.product,
                    fab: materialData.fab,
                    technology: materialData.technology,
                    materialFamily: materialData.materialFamily,
                    mesStep: stepCost.step,
                    plannedCost: materialData.plannedCost * proportion,
                    actualCost: materialData.actualCost * proportion,
                });
            });
        });

        return materialCostByMesStepData;
    }

    document.addEventListener('DOMContentLoaded', () => {
        initializeDataSource();
    });
})();