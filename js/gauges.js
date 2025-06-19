(function() {
    "use strict";

    let varianceGauge, cycleTimeGauge;
    const varianceGaugeText = document.getElementById('variance-gauge-text');
    const cycleTimeGaugeText = document.getElementById('cycle-time-gauge-text');

    const baseOptions = {
        angle: -0.2,
        lineWidth: 0.2,
        radiusScale: 0.9,
        pointer: {
            length: 0.5,
            strokeWidth: 0.035,
            color: '#000000'
        },
        limitMax: false,
        limitMin: false,
        strokeColor: '#E0E0E0',
        generateGradient: true,
        highDpiSupport: true,
    };

    /**
     * Main initialization function, called by main.js
     */
    window.initializeGauges = function() {
        // --- Variance Gauge ---
        const varianceOptions = { ...baseOptions, staticLabels: { font: "10px sans-serif", labels: [-50, 0, 50], fractionDigits: 0 }, staticZones: [ {strokeStyle: "#30B32D", min: -50, max: -15}, {strokeStyle: "#FFDD00", min: -15, max: 15}, {strokeStyle: "#F03E3E", min: 15, max: 50} ]};
        const varianceTarget = document.getElementById('variance-gauge');
        varianceGauge = new Gauge(varianceTarget).setOptions(varianceOptions);
        varianceGauge.maxValue = 50;
        varianceGauge.setMinValue(-50);
        
        // --- Cycle Time Gauge ---
        const cycleTimeOptions = { ...baseOptions };
        const cycleTimeTarget = document.getElementById('cycle-time-gauge');
        cycleTimeGauge = new Gauge(cycleTimeTarget).setOptions(cycleTimeOptions);
        cycleTimeGauge.maxValue = 120; // Assuming a max cycle time for visual scale
        cycleTimeGauge.setMinValue(50);  // Assuming a min cycle time
        
        updateGauges(); // Perform the first update

        // Add listener for subsequent filter changes
        document.addEventListener('globalFiltersChanged', updateGauges);
        console.log("Gauges initialized and listeners attached.");
    }

    function updateGauges() {
        const data = dateUtils.getAggregatedData(window.getGlobalFilters(), 'none');
        
        // Update Variance Gauge
        let variancePercent = 0;
        if (data.grandTotalPlanned > 0) {
            variancePercent = ((data.grandTotalActual - data.grandTotalPlanned) / data.grandTotalPlanned) * 100;
        }
        varianceGauge.set(variancePercent);
        varianceGaugeText.textContent = `${variancePercent.toFixed(1)}%`;

        // Update Cycle Time Gauge
        const cycleTime = data.averageCycleTime;
        cycleTimeGauge.set(cycleTime);
        cycleTimeGaugeText.textContent = `${cycleTime.toFixed(1)}`;
    }
})(); 