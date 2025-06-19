(function() {
    'use strict';

    function enhanceData() {
        console.log("data.js: Enhancing application data with MES details...");
        if (!window.appData) {
            console.error("appData not initialized by data-source.js. Aborting enhancement.");
            return;
        }

        try {
            const { products, fabs, technologies, processAreas, costStructure } = window.appData.configData;
            
            const operations = {};
            for (const area of processAreas) {
                if (costStructure[area] && costStructure[area].steps) {
                    operations[area] = Object.keys(costStructure[area].steps);
                } else {
                    operations[area] = [];
                }
            }

            const mesData = generateMesData({
                lots: 100,
                products,
                fabs,
                technologies,
                processAreas,
                operations
            });

            // Get the full product objects from the data source
            const fullProducts = window.appData.configData.fullProducts || [];
            
            const lotData = generateLotData({
                products: fullProducts,
                fabs,
                technologies
            });

            console.log(`Generated ${lotData.length} lot records from ${fullProducts.length} product configurations.`);

            window.appData.mesData = mesData;
            window.appData.lotData = lotData;
            console.log(`Generated ${mesData.length} detailed MES data records.`);
            console.log(`Generated ${lotData.length} lot records for grid view.`);
            
            console.log("Enhanced data is ready. Dispatching enhancedDataReady event.");
            document.dispatchEvent(new CustomEvent('enhancedDataReady', { detail: { appData: window.appData } }));

        } catch (error) {
            console.error("Error during data enhancement in data.js:", error);
        }
    }

    document.addEventListener('dataReady', function handleOriginalDataReady() {
        enhanceData();
    }, { once: true });

})(); 