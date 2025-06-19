// This script will manage the global filters for the dashboard.

document.addEventListener('enhancedDataReady', () => {
    console.log("Global Filters script initializing...");

    const { configData } = window.appData;
    const globalFilterContainer = document.getElementById('global-filter-container');
    const aggregationSelect = document.getElementById('aggregation-select');
    if (!globalFilterContainer || !aggregationSelect) return;

    // --- GLOBAL STATE ---
    window.globalFilters = {
        selectedFabs: [],
        selectedTechnologies: [],
        selectedProducts: [],
        aggregationLevel: 'Month', // Default aggregation level
        isInitialized: false
    };

    let fabFilter, techFilter, productFilter;

    // --- FILTER CREATION & MANAGEMENT ---
    function createMultiSelect(title, getOptions, onChange) {
        const controlContainer = document.createElement('div');
        controlContainer.className = 'filter-control';

        const label = document.createElement('label');
        label.className = 'filter-label';
        label.textContent = `${title}:`;
        
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'multi-select-dropdown';

        const button = document.createElement('button');
        const panel = document.createElement('div');
        panel.className = 'dropdown-panel';
        
        let checkboxes = [];
        let options = [];

        function updateButtonText(selectedItems) {
            if (selectedItems.length === options.length && options.length > 0) {
                button.textContent = `All ${title}`;
            } else if (selectedItems.length === 0) {
                button.textContent = `None`;
            } else {
                button.textContent = `${selectedItems.length} of ${options.length} selected`;
            }
        }

        function rebuildOptions() {
            options = getOptions();
            panel.innerHTML = ''; // Clear existing
            checkboxes = [];

            const panelHeader = document.createElement('div');
            panelHeader.className = 'dropdown-panel-header';
            const selectAll = document.createElement('a');
            selectAll.href = '#';
            selectAll.textContent = 'Select All';
            const selectNone = document.createElement('a');
            selectNone.href = '#';
            selectNone.textContent = 'Select None';

            selectAll.onclick = (e) => { e.preventDefault(); checkboxes.forEach(cb => cb.checked = true); handleSelectionChange(); };
            selectNone.onclick = (e) => { e.preventDefault(); checkboxes.forEach(cb => cb.checked = false); handleSelectionChange(); };

            panelHeader.appendChild(selectAll);
            panelHeader.appendChild(selectNone);
            panel.appendChild(panelHeader);

            options.forEach(option => {
                const optionLabel = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = option;
                checkbox.checked = true; // Default to all selected
                checkbox.addEventListener('change', handleSelectionChange);
                checkboxes.push(checkbox);
                optionLabel.appendChild(checkbox);
                optionLabel.appendChild(document.createTextNode(` ${option}`));
                panel.appendChild(optionLabel);
            });
            handleSelectionChange(); // Trigger initial state
        }
        
        function handleSelectionChange() {
            const selected = checkboxes.filter(cb => cb.checked).map(cb => cb.value);
            updateButtonText(selected);
            onChange(selected);
        }
        
        dropdownContainer.appendChild(button);
        dropdownContainer.appendChild(panel);
        controlContainer.appendChild(label);
        controlContainer.appendChild(dropdownContainer);

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-panel').forEach(p => {
                if (p !== panel) p.classList.remove('show');
            });
            panel.classList.toggle('show');
        });

        // rebuildOptions(); // Initial build is now triggered by the caller.

        return { element: controlContainer, rebuild: rebuildOptions };
    }
    
    // --- EVENT LISTENERS & DISPATCHERS ---
    aggregationSelect.addEventListener('change', (e) => {
        window.globalFilters.aggregationLevel = e.target.value;
        updateTimeRangeDisplay();
        dispatchFilterChange();
    });

    function updateTimeRangeDisplay() {
        const timeRangeElement = document.getElementById('time-range-display');
        if (timeRangeElement && window.dateUtils && window.dateUtils.formatTimeRangeDisplay) {
            try {
                const aggregationLevel = window.globalFilters.aggregationLevel;
                const displayText = window.dateUtils.formatTimeRangeDisplay(aggregationLevel);
                timeRangeElement.textContent = displayText;
                console.log(`Time range updated: ${aggregationLevel} -> ${displayText}`);
            } catch (error) {
                console.error('Error updating time range display:', error);
                timeRangeElement.textContent = `Current ${window.globalFilters.aggregationLevel}`;
            }
        } else {
            console.log('Time range display not ready:', {
                element: !!timeRangeElement,
                dateUtils: !!window.dateUtils,
                formatFunction: !!(window.dateUtils && window.dateUtils.formatTimeRangeDisplay)
            });
        }
    }

    function dispatchFilterChange() {
        console.log('Global filters changed:', window.globalFilters);
        document.dispatchEvent(new CustomEvent('globalFiltersChanged', { detail: window.globalFilters }));
    }

    function dispatchFiltersReady() {
        console.log('Global filters are ready.');
        document.dispatchEvent(new CustomEvent('globalFiltersReady', { detail: window.globalFilters }));
    }

    // --- FILTER DEPENDENCY LOGIC ---
    // This is now simplified as the filters are independent.
    function updateAllFilters() {
        fabFilter.rebuild();
        techFilter.rebuild();
        productFilter.rebuild();
    }

    // --- INITIALIZATION ---
    function initializeFilters() {
        if (window.globalFilters.isInitialized) return;
        
        // --- Fab Filter ---
        fabFilter = createMultiSelect('Fab', 
            () => configData.fabs, 
            (selected) => {
                window.globalFilters.selectedFabs = selected;
                dispatchFilterChange(); 
            }
        );

        // --- Technology Filter ---
        techFilter = createMultiSelect('Technology', 
            () => configData.technologies, 
            (selected) => {
                window.globalFilters.selectedTechnologies = selected;
                dispatchFilterChange();
            }
        );
        
        // --- Product Filter ---
        productFilter = createMultiSelect('Product',
            () => configData.products,
            (selected) => {
                window.globalFilters.selectedProducts = selected;
                
                // Set initialized flag only after the last filter is processed
                if (!window.globalFilters.isInitialized) {
                    window.globalFilters.isInitialized = true;
                    dispatchFiltersReady();
                }

                dispatchFilterChange(); 
            }
        );

        globalFilterContainer.appendChild(fabFilter.element);
        globalFilterContainer.appendChild(techFilter.element);
        globalFilterContainer.appendChild(productFilter.element);
        
        // Set initial state from the dropdown
        window.globalFilters.aggregationLevel = aggregationSelect.value;
        
        // Update time range display with initial value
        updateTimeRangeDisplay();
        
        // IMPORTANT: Manually trigger the first `rebuild` for all filters.
        // The `onChange` within the rebuild will set the initial state.
        fabFilter.rebuild();
        techFilter.rebuild();
        productFilter.rebuild();
    }

    initializeFilters();
    
    // Also update time range display after a short delay to ensure everything is loaded
    setTimeout(() => {
        updateTimeRangeDisplay();
    }, 100);
});

window.getGlobalFilters = function() {
    return window.globalFilters || {
        selectedFabs: [],
        selectedTechnologies: [],
        selectedProducts: [],
        aggregationLevel: 'Month',
        isInitialized: false
    };
};

function createFilterControl(label, dropdown) {
    const container = document.createElement('div');
    container.className = 'filter-control';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    
    container.appendChild(labelEl);
    container.appendChild(dropdown);
    return container;
}

function createMultiSelectDropdown(title, options, selectedState) {
    const container = document.createElement('div');
    container.className = 'multi-select-dropdown';

    const button = document.createElement('button');
    button.className = 'multi-select-button';

    const panel = document.createElement('div');
    panel.className = 'multi-select-panel';

    const panelContent = document.createElement('div');
    panelContent.className = 'panel-content';

    const actions = document.createElement('div');
    actions.className = 'filter-actions';
    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = 'Select All';
    const unselectAllBtn = document.createElement('button');
    unselectAllBtn.textContent = 'Unselect All';
    actions.appendChild(selectAllBtn);
    actions.appendChild(unselectAllBtn);
    
    panel.appendChild(actions);
    panel.appendChild(panelContent);

    const checkboxes = [];

    options.forEach(option => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = option;
        checkbox.checked = selectedState.includes(option);
        checkboxes.push(checkbox);

        checkbox.addEventListener('change', () => {
            updateSelection();
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${option}`));
        panelContent.appendChild(label);
    });

    function updateSelection() {
        selectedState.length = 0;
        checkboxes.forEach(cb => {
            if (cb.checked) {
                selectedState.push(cb.value);
            }
        });
        updateButtonText();
        document.dispatchEvent(new CustomEvent('globalFiltersChanged'));
    }

    function updateButtonText() {
        if (selectedState.length === options.length) {
            button.textContent = `All ${title}`;
        } else if (selectedState.length === 0) {
            button.textContent = `None`;
        } else if (selectedState.length === 1) {
            button.textContent = selectedState[0];
        } else {
            button.textContent = `${selectedState.length} ${title} selected`;
        }
    }

    selectAllBtn.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = true);
        updateSelection();
    });

    unselectAllBtn.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = false);
        updateSelection();
    });

    container.appendChild(button);
    container.appendChild(panel);

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other open panels before opening a new one
        document.querySelectorAll('.multi-select-panel').forEach(p => {
            if (p !== panel) {
                p.classList.remove('show');
            }
        });
        panel.classList.toggle('show');
    });

    // Initial button text
    updateButtonText();

    return container;
}

function createViewByDropdown() {
    const select = document.createElement('select');
    select.id = 'view-by-select';
    select.className = 'filter-select'; // For styling

    const options = ['Day', 'Week', 'Month', 'Quarter', 'Year'];
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === window.globalFilterState.viewBy) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
        window.globalFilterState.viewBy = e.target.value;
        document.dispatchEvent(new CustomEvent('globalFiltersChanged'));
    });

    return select;
}

// Close dropdowns if clicking outside
window.addEventListener('click', () => {
    document.querySelectorAll('.multi-select-panel').forEach(panel => {
        panel.classList.remove('show');
    });
}); 