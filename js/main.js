/**
 * @file main.js
 * @description Core application logic for initialization and navigation.
 */
(function() {
    'use strict';

    console.log("Main application script loaded. Initializing navigation.");

    let activeTabId = null;
    const initializedTabs = new Map();
    let loadingComplete = false;

    // Loading management
    function hideLoadingOverlay() {
        if (loadingComplete) return;
        
        const loadingOverlay = document.getElementById('loading-overlay');
        const body = document.body;
        
        if (loadingOverlay && body) {
            loadingComplete = true;
            body.classList.remove('loading');
            body.classList.add('loaded');
            
            // Fade out loading overlay
            setTimeout(() => {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 300);
            }, 100);
            
            console.log("Loading overlay hidden - application ready");
        }
    }

    // Check if all critical resources are loaded
    function checkLoadingComplete() {
        // Update progress tracking
        if (window.loadingSteps) {
            if (typeof Chart !== 'undefined' && !window.loadingSteps.chartsReady) {
                window.loadingSteps.chartsReady = true;
                window.updateLoadingProgress && window.updateLoadingProgress();
            }
            
            if ((typeof window.costingData !== 'undefined' || typeof window.semiconductorStepsData !== 'undefined') && !window.loadingSteps.dataReady) {
                window.loadingSteps.dataReady = true;
                window.updateLoadingProgress && window.updateLoadingProgress();
            }
        }
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            setTimeout(checkLoadingComplete, 100);
            return;
        }
        
        // Check if critical data is available
        if (typeof window.costingData === 'undefined' && typeof window.semiconductorStepsData === 'undefined') {
            setTimeout(checkLoadingComplete, 100);
            return;
        }
        
        hideLoadingOverlay();
    }

    // Start checking for loading completion
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkLoadingComplete, 500); // Give a small delay for scripts to load
    });

    function destroyAllCharts() {
        console.log("Destroying all chart instances...");
        if (window.dashboardCharts && typeof window.dashboardCharts.destroyAll === 'function') {
            window.dashboardCharts.destroyAll();
        }
        if (window.orgCosting && typeof window.orgCosting.destroyCharts === 'function') {
            window.orgCosting.destroyCharts();
        }
        if (window.manufacturingDashboard && typeof window.manufacturingDashboard.destroyCharts === 'function') {
            window.manufacturingDashboard.destroyCharts();
        }
        if (window.materialAnalysis && typeof window.materialAnalysis.destroyCharts === 'function') {
            window.materialAnalysis.destroyCharts();
        }
        if (window.costCategoryAnalysis && typeof window.costCategoryAnalysis.destroyCharts === 'function') {
            window.costCategoryAnalysis.destroyCharts();
        }
    }

    function initializeChartsForTab(tabId) {
        if (initializedTabs.has(tabId)) {
            console.log(`Tab ${tabId} already initialized.`);
            return;
        }
        initializedTabs.set(tabId, true);

        console.log(`Initializing charts for tab: ${tabId}`);
        try {
            switch (tabId) {
                case 'quality':
                    console.log(`MAIN: Calling initializeQualityCharts() for ${tabId}`);
                    if (window.dashboardCharts) window.dashboardCharts.initializeQualityCharts();
                    console.log(`MAIN: Completed initializeQualityCharts() for ${tabId}`);
                    break;
                case 'org-costing-overview':
                    console.log(`MAIN: Calling setupDashboard() for ${tabId}`);
                    if (window.orgCosting) window.orgCosting.setupDashboard();
                    console.log(`MAIN: Completed setupDashboard() for ${tabId}`);
                    break;
                case 'manufacturing':
                    console.log(`MAIN: Calling initialize() for ${tabId}`);
                    if (window.manufacturingDashboard) window.manufacturingDashboard.initialize();
                    console.log(`MAIN: Completed initialize() for ${tabId}`);
                    break;
                case 'material-analysis':
                    console.log("MAIN: Checking for materialAnalysis.initialize:", typeof window.materialAnalysis?.initialize);
                    if (window.materialAnalysis) {
                        window.materialAnalysis.initialize();
                    }
                    break;
                case 'cost-category-analysis':
                    console.log(`MAIN: Calling initialize() for ${tabId}`);
                    if (window.costCategoryAnalysis) window.costCategoryAnalysis.initialize();
                    console.log(`MAIN: Completed initialize() for ${tabId}`);
                    break;
            }
        } catch (error) {
            console.error(`Error initializing charts for tab ${tabId}:`, error);
        }
    }

    function handleTabClick(event) {
        event.preventDefault();
        const clickedTab = event.currentTarget;
        const targetTabId = clickedTab.getAttribute('data-tab');

        if (targetTabId === activeTabId) {
            return; 
        }

        document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(pane => pane.classList.remove('active'));

        clickedTab.classList.add('active');
        document.getElementById(targetTabId).classList.add('active');
        
        // Show/hide the analyze by dropdown based on the active tab
        const analyzeByGroup = document.getElementById('analyze-by-group');
        if (analyzeByGroup) {
            analyzeByGroup.style.display = targetTabId === 'cost-category-analysis' ? 'flex' : 'none';
        }
        
        activeTabId = targetTabId;
        
        console.log(`Tab changed to: ${targetTabId}. Initializing charts if needed.`);
        initializeChartsForTab(targetTabId);

        // Dispatch a custom event to notify other components of the tab change
        document.dispatchEvent(new CustomEvent('tabChanged', { detail: { activeTab: targetTabId } }));
    }

    // This listener sets up the page once all data is generated and ready.
    document.addEventListener('enhancedDataReady', () => {
        console.log("Main.js: enhancedDataReady received. Setting up tabs.");
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.addEventListener('click', handleTabClick);
        });

        // Set the initial active tab and initialize its charts
        const initialActiveTab = document.querySelector('.tab-button.active') || document.querySelector('.tab-button');
        if (initialActiveTab) {
            initialActiveTab.click();
        }
        
        // Ensure loading overlay is hidden after setup
        setTimeout(hideLoadingOverlay, 1000);
    });

})(); 