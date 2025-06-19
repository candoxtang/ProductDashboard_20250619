document.addEventListener('dataReady', () => {
    const configTab = document.getElementById('configuration');
    if (!configTab) return;

    let draggedItem = null;
    let mappings = {}; // The global mapping object

    function initializeApp() {
        console.log("Config Screen: Data is ready, initializing.");
        
        const loadButton = document.getElementById('load-mapping');
        const saveButton = document.getElementById('save-mapping');

        if (!loadButton || !saveButton) {
            console.error("Config screen critical controls not found.");
            return;
        }

        loadButton.addEventListener('click', loadGlobalMapping);
        saveButton.addEventListener('click', saveGlobalMapping);

        // Initial load to populate the view
        loadGlobalMapping();
    }

    function loadGlobalMapping() {
        // For this example, we'll start with a default mapping.
        // In a real app, this might be fetched from a server.
        mappings = {
            "FEOL - Wafer Prep & Cleaning": [
                "Crystal Growth (Czochralski/Float-Zone)", 
                "Ingot Slicing and Shaping",
                "Wafer Lapping"
            ],
            "FEOL - Epitaxy & Thermal": [
                "Wafer Polishing & Edge Grinding",
                "Final Wafer Inspection & Packaging"
            ]
        }; 
        
        console.log(`Loading global mapping`);
        populateSapTargets();
        populateMesSteps();
    }

    function saveGlobalMapping() {
        const currentDomMappings = {};
        document.querySelectorAll('.sap-target-card').forEach(sapCard => {
            const sapName = sapCard.dataset.sapName;
            const mappedSteps = [];
            sapCard.querySelectorAll('.mapped-item').forEach(item => {
                mappedSteps.push(item.dataset.mesStep);
            });
            if (mappedSteps.length > 0) {
                currentDomMappings[sapName] = mappedSteps;
            }
        });

        mappings = currentDomMappings;
        // In a real app, you would save `mappings` to a central state management or backend
        console.log(`Saved global mapping:`, mappings);
        alert(`Global mapping saved successfully!`);
    }

    function populateMesSteps() {
        const mesContainer = document.getElementById('mes-steps');
        if (!mesContainer) return;
        mesContainer.innerHTML = '';

        const allMappedSteps = Object.values(mappings).flat();
        const allMesSteps = window.appData.configData.mes_steps;

        allMesSteps.forEach(stepName => {
            if (!allMappedSteps.includes(stepName)) {
                const stepEl = createMesStepElement(stepName);
                mesContainer.appendChild(stepEl);
            }
        });
    }

    function populateSapTargets() {
        const sapContainer = document.getElementById('sap-steps');
        if (!sapContainer) return;
        sapContainer.innerHTML = '';

        const costStructure = window.appData.configData.costStructure;
        if (!costStructure) {
            console.error("New cost structure not found in appData!");
            return;
        }

        // The "SAP Targets" are now the Process Areas from our new structure
        for (const [processAreaName, processAreaDetails] of Object.entries(costStructure)) {
            const mappedMesSteps = mappings[processAreaName] || [];
            
            const sapCard = document.createElement('div');
            sapCard.className = 'sap-target-card';
            sapCard.dataset.sapName = processAreaName;

            // --- Header ---
            const header = document.createElement('div');
            header.className = 'sap-target-header';
            
            const title = document.createElement('span');
            title.textContent = processAreaName;
            
            // The cost is now a relative weight
            const costSpan = document.createElement('span');
            costSpan.className = 'planned-cost';
            costSpan.textContent = `Cost Weight: ${(processAreaDetails.costWeight * 100).toFixed(1)}%`;
            
            header.appendChild(title);
            header.appendChild(costSpan);
            sapCard.appendChild(header);

            // --- Cost Breakdown (now shows MES step weights) ---
            const breakdown = document.createElement('ul');
            breakdown.className = 'cost-breakdown';
            if (processAreaDetails.steps && Object.keys(processAreaDetails.steps).length > 0) {
                for (const [stepName, stepDetails] of Object.entries(processAreaDetails.steps)) {
                    const li = document.createElement('li');
                    li.innerHTML = `${stepName} <span class="item-cost">${(stepDetails.costWeight * 100).toFixed(1)}%</span>`;
                    breakdown.appendChild(li);
                }
            } else {
                const li = document.createElement('li');
                li.textContent = 'No MES steps defined.';
                breakdown.appendChild(li);
            }
            sapCard.appendChild(breakdown);

            // --- Dropzone ---
            const dropzone = document.createElement('div');
            dropzone.className = 'dropzone';
            
            if (mappedMesSteps.length === 0) {
                dropzone.innerHTML = '<span>Drop MES Steps Here</span>';
            } else {
                mappedMesSteps.forEach(mesStep => {
                    const mappedItem = createMappedItemElement(mesStep);
                    dropzone.appendChild(mappedItem);
                });
            }

            sapCard.appendChild(dropzone);
            sapContainer.appendChild(sapCard);
        }

        addDragDropListeners();
    }
    
    function createMesStepElement(stepName) {
        const stepEl = document.createElement('div');
        stepEl.className = 'mes-step-item';
        stepEl.textContent = stepName;
        stepEl.dataset.mesStep = stepName;
        stepEl.draggable = true;
        stepEl.addEventListener('dragstart', handleDragStart);
        stepEl.addEventListener('dragend', handleDragEnd);
        return stepEl;
    }

    function createMappedItemElement(mesStep) {
        const mappedItem = document.createElement('div');
        mappedItem.className = 'mapped-item';
        mappedItem.textContent = mesStep;
        mappedItem.dataset.mesStep = mesStep;
        mappedItem.draggable = true;

        const unmapButton = document.createElement('button');
        unmapButton.className = 'unmap-btn';
        unmapButton.textContent = '×';
        unmapButton.addEventListener('click', handleUnmapClick);

        mappedItem.appendChild(unmapButton);
        mappedItem.addEventListener('dragstart', handleDragStart);
        mappedItem.addEventListener('dragend', handleDragEnd);
        return mappedItem;
    }

    function addDragDropListeners() {
        const dropzones = document.querySelectorAll('.sap-target-card');
        dropzones.forEach(zone => {
            zone.addEventListener('dragover', handleDragOver);
            zone.addEventListener('dragleave', handleDragLeave);
            zone.addEventListener('drop', handleDrop);
        });
        
        // Add global dragend listener to clean up any stuck drag states
        document.addEventListener('dragend', handleDragEnd);
    }

    function handleDragStart(e) {
        draggedItem = e.target;
        e.dataTransfer.setData('text/plain', draggedItem.dataset.mesStep);
        setTimeout(() => {
            if (draggedItem) {
                draggedItem.style.opacity = '0.5';
                draggedItem.classList.add('dragging');
            }
        }, 0);
    }

    function handleDragEnd(e) {
        // Clean up drag state regardless of whether drop was successful
        if (draggedItem) {
            draggedItem.style.opacity = '1';
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
        
        // Remove any lingering drag-over states
        document.querySelectorAll('.drag-over').forEach(element => {
            element.classList.remove('drag-over');
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
        const dropzoneCard = e.target.closest('.sap-target-card');
        if (dropzoneCard) {
            dropzoneCard.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        const dropzoneCard = e.target.closest('.sap-target-card');
        if (dropzoneCard) {
            dropzoneCard.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        const dropzoneCard = e.target.closest('.sap-target-card');
        if (dropzoneCard && draggedItem) {
            dropzoneCard.classList.remove('drag-over');
            const dropzone = dropzoneCard.querySelector('.dropzone');
            
            // If the item came from another dropzone, remove it from there
            if (draggedItem.parentElement.classList.contains('dropzone')) {
                 draggedItem.parentElement.removeChild(draggedItem);
            } else { // It came from the MES list
                 draggedItem.parentElement.removeChild(draggedItem);
            }

            const newMappedItem = createMappedItemElement(draggedItem.dataset.mesStep);
            dropzone.appendChild(newMappedItem);
            
            // Clean up drag state
            draggedItem.style.opacity = '1';
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        } else {
            // Drop failed - clean up anyway
            handleDragEnd(e);
        }
    }

    function handleUnmapClick(e) {
        const mappedItem = e.target.closest('.mapped-item');
        if (!mappedItem) return;

        const mesStepName = mappedItem.dataset.mesStep;

        // Add it back to the MES list
        const mesContainer = document.getElementById('mes-steps');
        if (mesContainer) {
            const stepEl = createMesStepElement(mesStepName);
            mesContainer.appendChild(stepEl);
        }

        // Remove it from the SAP card
        mappedItem.remove();
    }
    
    // --- INITIALIZATION ---
    initializeApp();
});