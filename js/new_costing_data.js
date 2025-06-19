const semiconductorStepsData = {
    "mes_steps": [
        // Silicon Crystal & Wafer Production (External) - Steps 1-5
        "Crystal Growth (Czochralski/Float-Zone)", "Ingot Slicing and Shaping", "Wafer Lapping", "Wafer Polishing & Edge Grinding", "Final Wafer Inspection & Packaging",
        // Wafer Preparation (Incoming) - Steps 6-10
        "Incoming Wafer Inspection & Unpack", "Wafer Laser Scribing", "Initial Wafer Cleaning", "Wafer Surface Defect Scan", "Wafer Registration & Cassette Loading",
        // Front-End-Of-Line (FEOL) - Steps 11-70
        "Epitaxial Growth (Epi)", "Thermal Oxidation - Starting Layer", "Well Formation - Ion Implantation (P-well/N-well)", "Well Formation - Annealing", "Shallow Trench Isolation (STI) - Hardmask Deposition", // 15
        "STI - Photolithography", "STI - Trench Etch", "STI - Dielectric Fill (CVD)", "STI - Chemical Mechanical Planarization (CMP)", "Gate Dielectric Formation (High-K Deposition)", // 20
        "Gate Electrode Deposition (Polysilicon or Metal)", "Gate - Photolithography", "Gate - Etch", "Lightly Doped Drain (LDD) - Ion Implantation", "LDD - Annealing", // 25
        "Sidewall Spacer Formation (Dielectric Deposition)", "Sidewall Spacer - Anisotropic Etch", "Source/Drain - Ion Implantation (High Dose)", "Source/Drain - Millisecond Annealing", "Contact Area Silicide (Salicide) Formation - Metal Deposition", // 30
        "Salicide Formation - Annealing", "Salicide Formation - Unreacted Metal Strip", "Contact Stop Layer Deposition (Pre-Metal Dielectric)", "PMD - CMP", "Contact - Photolithography", // 35
        "Contact - Etch", "Contact - Tungsten Plug Deposition (CVD)", "Contact - Tungsten CMP", "Transistor Stress Engineering - Deposition", "Transistor Stress Engineering - Etch", // 40
        // (Repeating some core processes for complexity)
        "FEOL Clean 1", "FEOL Photolithography 2", "FEOL Etch 2", "FEOL Deposition 2", "FEOL Implant 2", // 45
        "FEOL Anneal 2", "FEOL CMP 2", "FEOL Metrology - Critical Dimension (CD-SEM) 1", "FEOL Metrology - Overlay 1", "FEOL Defect Inspection 1", // 50
        "FEOL Clean 3", "FEOL Photolithography 3", "FEOL Etch 3", "FEOL Deposition 3", "FEOL Implant 3", // 55
        "FEOL Anneal 3", "FEOL CMP 3", "FEOL Metrology - CD-SEM 2", "FEOL Metrology - Overlay 2", "FEOL Defect Inspection 2", // 60
        "FEOL Clean 4", "FEOL Photolithography 4", "FEOL Etch 4", "FEOL Deposition 4", "FEOL Implant 4", // 65
        "FEOL Anneal 4", "FEOL CMP 4", "FEOL Metrology - CD-SEM 3", "FEOL Metrology - Overlay 3", "FEOL Final Electrical Test Probe", // 70
        // Back-End-Of-Line (BEOL) - Steps 71-130
        "Inter-Layer Dielectric (ILD) Deposition 1", "Metal 1 - Copper Seed Layer Deposition (PVD)", "Metal 1 - Photolithography (Damascene)", "Metal 1 - Trench Etch", "Metal 1 - Copper Electroplating", // 75
        "Metal 1 - Copper CMP", "Metal 1 - Dielectric Capping Layer Deposition", "Via 1 - ILD Deposition", "Via 1 - Photolithography", "Via 1 - Etch", // 80
        "Via 1 - Tungsten Fill", "Via 1 - CMP", "Metal 2 - Copper Seed Layer Deposition", "Metal 2 - Photolithography", "Metal 2 - Trench Etch", // 85
        "Metal 2 - Copper Electroplating", "Metal 2 - CMP", "Metal 2 - Dielectric Capping Layer Deposition", "Via 2 - ILD Deposition", "Via 2 - Photolithography", // 90
        "Via 2 - Etch", "Via 2 - Tungsten Fill", "Via 2 - CMP", "Metal 3 - Photolithography", "Metal 3 - Copper Electroplating", // 95
        "Metal 3 - CMP", "Metal 4 - Photolithography", "Metal 4 - Copper Electroplating", "Metal 4 - CMP", "Metal 5 - Photolithography", // 100
        "Metal 5 - Copper Electroplating", "Metal 5 - CMP", "Metal 6 - Photolithography", "Metal 6 - Copper Electroplating", "Metal 6 - CMP", // 105
        "BEOL Metrology - CD-SEM 1", "BEOL Metrology - Overlay 1", "BEOL Defect Inspection 1", "BEOL Clean 1", "Final Metal Layer (M-last) - Aluminum Deposition", // 110
        "M-last - Photolithography", "M-last - Etch", "Passivation Layer 1 (Oxide) Deposition", "Passivation Layer 2 (Nitride) Deposition", "Passivation - Photolithography (Pad Openings)", // 115
        "Passivation - Etch", "BEOL Metrology - CD-SEM 2", "BEOL Metrology - Overlay 2", "BEOL Defect Inspection 2", "BEOL Clean 2", // 120
        "BEOL Metrology - Film Thickness 1", "BEOL Metrology - Film Thickness 2", "BEOL Metrology - Sheet Resistance 1", "BEOL Metrology - Sheet Resistance 2", "BEOL Metrology - Via Resistance 1", // 125
        "BEOL Metrology - Via Resistance 2", "Wafer Level Reliability Test 1", "Wafer Level Reliability Test 2", "Final BEOL Clean", "Final BEOL Inspection", // 130
        // Wafer Test / Electrical Die Sort (E-Sort) - Steps 131-150
        "Pre-Bake/Dehydration", "Wafer Mounting for Probing", "Probe Card Alignment & Setup", "Automated Test Program Load", "Wafer ID & Map Correlation", // 135
        "Parametric Test - V-I Curves", "Parametric Test - Capacitance", "Functional Test - Logic Scan", "Functional Test - Memory (BIST)", "Speed Grade (At-Speed) Test", // 140
        "Leakage Current (IDDQ) Test", "Hot/Cold Wafer Probing", "Inkless Die Binning (Wafer Map Update)", "Offline Test Data Review", "Hold Lot Disposition - Test Engineering", // 145
        "Wafer Unload from Prober", "Probe Card Maintenance", "Wafer Level Burn-in", "Post Burn-in Wafer Test", "Wafer Shipment to Assembly Prep", // 150
        // Assembly / Packaging - Steps 151-185
        "Wafer Backgrinding", "Wafer Mounting on Tape Frame", "Wafer Dicing (Singulation)", "Die Pick and Place (from frame to substrate)", "Die Attach (Epoxy Dispense & Cure)", // 155
        "Plasma Cleaning Post-Die Attach", "Wire Bonding (Ball & Wedge)", "Wire Bond Pull/Shear Test (Offline)", "Encapsulation - Mold Compound Dispense", "Encapsulation - Cure", // 160
        "Laser Marking", "Plating (Leadframe)", "Deflash (Chemical or Mechanical)", "Lead Trim and Form", "Solder Ball Attach (BGA)", // 165
        "Solder Ball Reflow", "Automated Optical Inspection (AOI) - Post-Assembly", "Acoustic Microscopy (C-SAM) for voids", "X-Ray Inspection for wire sweep", "Substrate Singulation (for panel-level package)", // 170
        "Flip-Chip - Underfill Dispensing", "Flip-Chip - Cure", "Heat Spreader Attach", "Lid Seal", "System-in-Package (SiP) Stacking", // 175
        "Package-on-Package (PoP) Assembly", "Assembly Final Visual Inspection", "Assembly Lot Creation", "Assembly Lot Traveler Update", "Assembly WIP Management", // 180
        "Tool Calibration - Dicing Saw", "Tool Calibration - Wire Bonder", "Tool Calibration - Mold Press", "Assembly Consumables Management", "Assembly Scrap Processing", // 185
        // Final Test - Steps 186-200
        "Packaged Part Dehydration Bake", "Test Handler Setup & Kit Change", "Final Test Program Load", "Device Temperature Forcing (Tri-Temp)", "Final Electrical Test (Binning)", // 190
        "ESD Testing", "Quality Assurance Buy-off", "Tape and Reel", "Final Packaging & Labeling", "Dry Pack & Bag Seal", // 195
        "Certificate of Conformance Generation", "Finished Goods Inventory Entry", "Customer Order Fulfillment", "Logistics - Carrier Pickup Scheduling", "Final Shipment & Documentation Archiving" // 200
    ],
    "sap_steps": [
        // FEOL Group
        "FEOL - Wafer Prep & Cleaning", "FEOL - Epitaxy & Thermal", "FEOL - Well Formation", "FEOL - Isolation (STI)", "FEOL - Gate Stack",
        "FEOL - Spacers & Implantation", "FEOL - Silicide & Stress", "FEOL - Pre-Metal Dielectric (PMD)", "FEOL - Contact Formation", "FEOL - Metrology & Inspection",
        // BEOL Group
        "BEOL - Inter-Layer Dielectric (ILD)", "BEOL - Metal Layer 1-2", "BEOL - Via Layer 1-2", "BEOL - Metal Layer 3-4", "BEOL - Via Layer 3-4",
        "BEOL - Metal Layer 5-6", "BEOL - Top Metal & Passivation", "BEOL - Metrology & Inspection", "BEOL - Reliability Testing",
        // Test Group
        "TEST - Probe Card & Setup", "TEST - Parametric", "TEST - Functional & Speed", "TEST - Burn-in & Stress", "TEST - Data Analysis & Disposition",
        // Assembly Group
        "ASSY - Wafer Prep & Dicing", "ASSY - Die Attach", "ASSY - Wirebond / Flip-Chip", "ASSY - Encapsulation & Mold", "ASSY - Marking & Finishing",
        "ASSY - Ball Grid Array (BGA)", "ASSY - Inspection (AOI/AXI/Acoustic)", "ASSY - Advanced Packaging (SiP/PoP)", "ASSY - Lot & WIP Management",
        // Final Test & Logistics Group
        "FNLTEST - Handler & Setup", "FNLTEST - Electrical & Binning", "FNLTEST - Quality Assurance", "LOGISTICS - Tape & Reel", "LOGISTICS - Packaging & Labeling",
        "LOGISTICS - Finished Goods & Shipping",
        // Shared Services / Overheads
        "SHARED - Process Engineering", "SHARED - Equipment Engineering", "SHARED - Materials Management", "SHARED - Production Control", "SHARED - Yield Management",
        "SHARED - Facilities & EHS", "SHARED - IT & Automation", "SHARED - Scrap & Rework", "SHARED - NPI"
    ]
};

const sapComplexCosts = {
    // FEOL Group
    "FEOL - Wafer Prep & Cleaning": {
        "Raw Silicon Wafers": 90000,
        "SC-1 Cleaning Solution": 15000,
        "SC-2 Cleaning Solution": 12000,
        "Deionized Water": 8000,
        "Hydrofluoric Acid (HF)": 5000,
        "Nitrogen (for drying)": 3000,
        "Direct Labour": 40000,
        "Utilities (Power/Water)": 30000
    },
    "FEOL - Epitaxy & Thermal": {
        "Process Gases (Silane, Dichlorosilane)": 75000,
        "High Purity Oxygen": 20000,
        "High Purity Nitrogen": 10000,
        "Furnace Consumables (Quartzware)": 25000,
        "Chemicals for Pre-cleaning": 5000,
        "Direct Labour": 60000,
        "Utilities (High Temp Furnaces)": 110000
    },
    "FEOL - Well Formation": {
        "Photoresist (I-line/DUV)": 45000,
        "Developer (TMAH)": 15000,
        "Ion Source Gas (Arsine, Phosphine)": 80000,
        "Resist Strip Chemicals": 10000,
        "Reticle Usage": 20000,
        "Direct Labour (Implant & Photo)": 70000,
        "Utilities (Implanter Power, HVAC)": 50000
    },
    "FEOL - Isolation (STI)": {
        "Photoresist (DUV)": 60000,
        "Hardmask Deposition Precursors": 40000,
        "Etchant Gases (Fluorocarbons)": 70000,
        "CVD Dielectric Gases (TEOS)": 50000,
        "CMP Slurry (Silica-based)": 35000,
        "CMP Pads": 15000,
        "Direct Labour": 90000,
        "Utilities": 60000
    },
    "FEOL - Gate Stack": {
        "High-K Dielectric Precursor (HfO2)": 90000,
        "Metal Gate Deposition Target (TiN, TaN)": 70000,
        "Polysilicon Deposition Gas (Silane)": 30000,
        "Gate Etch Gases (Cl2, HBr)": 65000,
        "Photoresist (ArF)": 80000,
        "Anti-Reflective Coating (ARC)": 25000,
        "Reticle Usage (Critical Layer)": 50000,
        "Direct Labour": 100000,
        "Utilities": 70000
    },
    "FEOL - Spacers & Implantation": {
        "Spacer Deposition Precursor (SiN)": 50000,
        "Anisotropic Etch Gases": 45000,
        "Source/Drain Implant Species (Boron, Arsenic)": 120000,
        "Implanter Source Filaments": 15000,
        "Annealing Power (Laser/Flash)": 80000,
        "Direct Labour": 70000,
        "Utilities": 60000
    },
    "FEOL - Silicide & Stress": {
        "Sputtering Target (Cobalt, Nickel, Titanium)": 80000,
        "Selective Etch Chemicals": 15000,
        "Stress Film Deposition Gases (SiN)": 60000,
        "Rapid Thermal Processing (RTP) Power": 40000,
        "Direct Labour": 60000,
        "Utilities": 40000
    },
    "FEOL - Pre-Metal Dielectric (PMD)": {
        "ILD Deposition Precursors (TEOS)": 90000,
        "CMP Slurry (Oxide)": 40000,
        "CMP Pads": 20000,
        "Post-CMP Cleaning Chemicals": 10000,
        "Direct Labour": 50000,
        "Utilities": 30000
    },
    "FEOL - Contact Formation": {
        "Photoresist (ArF)": 90000,
        "Contact Etch Gases (Fluorocarbons)": 75000,
        "Tungsten Deposition Precursor (WF6)": 110000,
        "Titanium/Titanium Nitride Liner Target": 40000,
        "Tungsten CMP Slurry": 50000,
        "CMP Pads": 20000,
        "Reticle Usage": 30000,
        "Direct Labour": 90000,
        "Utilities": 70000
    },
    "FEOL - Metrology & Inspection": {
        "CD-SEM Consumables": 10000,
        "Overlay Target Wafers": 5000,
        "Defect Inspection System Maintenance": 30000,
        "Test Wafers": 25000,
        "Engineering Labour": 150000,
        "Utilities (Power for tools)": 20000
    },

    // BEOL Group
    "BEOL - Inter-Layer Dielectric (ILD)": {
        "Low-K Dielectric Precursor": 80000,
        "Porous Sealing Material": 20000,
        "Deposition Chamber Cleaning Gases": 15000,
        "Direct Labour": 60000,
        "Utilities": 40000
    },
    "BEOL - Metal Layer 1-2": {
        "Copper Sputtering Target (Seed Layer)": 45000,
        "Copper Electroplating Chemicals": 90000,
        "Photoresist (ArF/EUV)": 120000,
        "Damascene Etch Gases": 60000,
        "Copper CMP Slurry": 55000,
        "CMP Pads": 25000,
        "Reticle Usage": 40000,
        "Direct Labour": 100000,
        "Utilities": 80000
    },
    "BEOL - Via Layer 1-2": {
        "Photoresist (ArF/EUV)": 110000,
        "Via Etch Gases": 70000,
        "Tungsten Plugfill (WF6)": 90000,
        "Barrier Layer Sputtering Target (TiN)": 35000,
        "Via CMP Slurry & Pads": 60000,
        "Reticle Usage": 35000,
        "Direct Labour": 90000,
        "Utilities": 70000
    },
     "BEOL - Metal Layer 3-4": {
        "Copper Sputtering Target (Seed Layer)": 45000,
        "Copper Electroplating Chemicals": 90000,
        "Photoresist (ArF)": 110000,
        "Damascene Etch Gases": 60000,
        "Copper CMP Slurry": 55000,
        "CMP Pads": 25000,
        "Reticle Usage": 40000,
        "Direct Labour": 100000,
        "Utilities": 80000
    },
    "BEOL - Via Layer 3-4": {
        "Photoresist (ArF)": 100000,
        "Via Etch Gases": 70000,
        "Tungsten Plugfill (WF6)": 90000,
        "Barrier Layer Sputtering Target (TiN)": 35000,
        "Via CMP Slurry & Pads": 60000,
        "Reticle Usage": 35000,
        "Direct Labour": 90000,
        "Utilities": 70000
    },
    "BEOL - Metal Layer 5-6": {
        "Copper Sputtering Target (Seed Layer)": 45000,
        "Copper Electroplating Chemicals": 90000,
        "Photoresist (ArF)": 100000,
        "Damascene Etch Gases": 60000,
        "Copper CMP Slurry": 55000,
        "CMP Pads": 25000,
        "Reticle Usage": 40000,
        "Direct Labour": 100000,
        "Utilities": 80000
    },
    "BEOL - Top Metal & Passivation": {
        "Aluminum Sputtering Target (Top Metal)": 50000,
        "Top Metal Etch Gases": 30000,
        "Passivation Layer Precursors (SiN, SiO2)": 70000,
        "Polyimide for Stress Buffer": 25000,
        "Photoresist (I-Line for pads)": 30000,
        "Reticle Usage": 15000,
        "Direct Labour": 80000,
        "Utilities": 60000
    },
    "BEOL - Metrology & Inspection": {
        "E-beam Inspection Time/Cost": 40000,
        "Film Thickness Metrology Consumables": 10000,
        "Resistance Probe Tips": 5000,
        "Test Wafers": 20000,
        "Engineering Labour": 160000,
        "Utilities": 20000
    },
    "BEOL - Reliability Testing": {
        "Wafer Level Reliability System Power": 50000,
        "Specialized Probes": 15000,
        "Test Structure Wafers": 30000,
        "Engineering Labour (Data Analysis)": 120000,
        "Utilities": 50000
    },

    // Test Group
    "TEST - Probe Card & Setup": {
        "Probe Card Maintenance & Repair": 50000,
        "Probe Tips/Needles": 20000,
        "Test Setup Technician Labour": 60000,
        "Calibration Wafers": 10000,
        "Utilities": 10000
    },
    "TEST - Parametric": {
        "Tester Time (Amortized)": 80000,
        "Test Program Development (Amortized)": 20000,
        "Technician Labour": 100000,
        "Utilities (Tester Power & Cooling)": 40000
    },
    "TEST - Functional & Speed": {
        "ATE Time (High Speed Tester)": 120000,
        "Test Program Maintenance": 30000,
        "Technician/Operator Labour": 150000,
        "Utilities (ATE Power & Cooling)": 60000
    },
    "TEST - Burn-in & Stress": {
        "Burn-in Boards (BIBs)": 40000,
        "Burn-in Oven Operation (Power, N2)": 90000,
        "Operator Labour (Loading/Unloading)": 90000,
        "Utilities (Oven Power)": 120000
    },
    "TEST - Data Analysis & Disposition": {
        "Yield Analysis Software License": 40000,
        "Product Engineering Labour": 110000,
        "Data Storage & Archiving": 5000,
        "Utilities (Servers, Workstations)": 10000
    },

    // Assembly Group
    "ASSY - Wafer Prep & Dicing": {
        "Backgrinding Tape": 10000,
        "Dicing Blades": 25000,
        "Wafer Mounting Film (dicing tape)": 15000,
        "Deionized Water for Dicing Saw": 5000,
        "Operator Labour": 60000,
        "Utilities": 30000
    },
    "ASSY - Die Attach": {
        "Die Attach Epoxy or Solder Paste": 40000,
        "Substrates or Leadframes": 90000,
        "Dispensing Needles": 5000,
        "Curing Oven Operation": 15000,
        "Operator Labour": 70000,
        "Utilities": 20000
    },
    "ASSY - Wirebond / Flip-Chip": {
        "Bonding Wire (Gold, Copper)": 120000,
        "Bonding Capillary/Tool": 15000,
        "Process Gases (Forming Gas)": 10000,
        "For Flip-Chip: Underfill Epoxy": 60000,
        "For Flip-Chip: Solder Bumps": 80000,
        "Operator Labour": 120000,
        "Utilities": 40000
    },
    "ASSY - Encapsulation & Mold": {
        "Mold Compound": 100000,
        "Mold Release Agents": 5000,
        "Mold Chase Cleaning": 10000,
        "Curing Ovens": 20000,
        "Operator Labour": 80000,
        "Utilities": 50000
    },
    "ASSY - Marking & Finishing": {
        "Laser Marking Consumables": 5000,
        "Chemicals for De-flashing": 10000,
        "Solder Plating Chemicals": 30000,
        "Lead Trim & Form Tooling Wear": 20000,
        "Operator Labour": 50000,
        "Utilities": 15000
    },
    "ASSY - Ball Grid Array (BGA)": {
        "Solder Balls": 90000,
        "Solder Flux": 20000,
        "Solder Paste for Screening": 15000,
        "Reflow Oven Operation (N2, Power)": 35000,
        "Operator Labour": 90000,
        "Utilities": 30000
    },
    "ASSY - Inspection (AOI/AXI/Acoustic)": {
        "AOI/AXI System Maintenance": 30000,
        "Acoustic Microscopy Transducer": 10000,
        "Inspection Technician Labour": 140000,
        "Utilities": 20000
    },
    "ASSY - Advanced Packaging (SiP/PoP)": {
        "Interposers (Silicon or Organic)": 80000,
        "Stacking Adhesives": 30000,
        "Through-Silicon Via (TSV) Wafers (if applicable)": 150000,
        "Specialized Operator Labour": 110000,
        "Utilities": 40000
    },
    "ASSY - Lot & WIP Management": {
        "MES & Tracking Software License": 20000,
        "Lot Travelers & Labels": 2000,
        "Production Control Labour": 60000,
        "Utilities": 5000
    },

    // Final Test & Logistics Group
    "FNLTEST - Handler & Setup": {
        "Test Handler Change Kits": 30000,
        "Test Sockets/Contactors": 40000,
        "Handler Maintenance": 15000,
        "Technician Labour": 70000,
        "Utilities": 10000
    },
    "FNLTEST - Electrical & Binning": {
        "Final Test ATE Time": 110000,
        "Temperature Forcing System Power": 30000,
        "Operator Labour": 130000,
        "Utilities (Tester & Temp forcing)": 50000
    },
    "FNLTEST - Quality Assurance": {
        "QA Sampling & Testing": 25000,
        "Documentation & Reporting": 10000,
        "Quality Engineer Labour": 90000,
        "Utilities": 10000
    },
    "LOGISTICS - Tape & Reel": {
        "Carrier Tape": 20000,
        "Cover Tape": 10000,
        "Reels": 5000,
        "Taping Machine Operation": 8000,
        "Operator Labour": 60000,
        "Utilities": 5000
    },
    "LOGISTICS - Packaging & Labeling": {
        "Moisture Barrier Bags (MBB)": 12000,
        "Desiccant Packs": 3000,
        "Cardboard Boxes & Packing Material": 5000,
        "Labels & Barcodes": 2000,
        "Operator Labour": 80000,
        "Utilities": 10000
    },
    "LOGISTICS - Finished Goods & Shipping": {
        "Warehouse Space (Amortized)": 20000,
        "Shipping & Freight Costs": 50000,
        "Logistics Coordinator Labour": 100000,
        "Utilities": 5000
    },

    // Shared Services / Overheads
    "SHARED - Process Engineering": { "Salaries & Benefits": 350000, "Software Licenses": 25000, "Training & Development": 15000, "Lab Supplies": 10000 },
    "SHARED - Equipment Engineering": { "Salaries & Benefits": 450000, "Spare Parts Inventory": 150000, "External Service Contracts": 80000, "Tools & Calibration": 20000 },
    "SHARED - Materials Management": { "Salaries & Benefits": 250000, "ERP Software License": 50000, "Inventory Carrying Costs": 30000 },
    "SHARED - Production Control": { "Salaries & Benefits": 280000, "Scheduling Software": 40000, "Consumables (Printers, Paper)": 5000 },
    "SHARED - Yield Management": { "Salaries & Benefits": 320000, "Statistical Analysis Software": 60000, "Reporting Tools": 20000 },
    "SHARED - Facilities & EHS": { "Cleanroom Power & HVAC": 500000, "Bulk Gases (N2, CDA)": 150000, "Waste Treatment & Disposal": 80000, "Safety Equipment & Training": 40000, "Maintenance Salaries": 200000 },
    "SHARED - IT & Automation": { "Salaries & Benefits": 300000, "Server Hosting & Maintenance": 100000, "Network Infrastructure": 50000, "Software Licenses (General)": 80000 },
    "SHARED - Scrap & Rework": { "Scrapped Materials Cost": 150000, "Rework Labour": 80000, "Analysis of Scrapped Product": 50000 },
    "SHARED - NPI": { "R&D Salaries": 400000, "Mask Set Costs": 500000, "Pilot Run Wafers": 200000, "External R&D Contracts": 100000, "Specialized Lab Equipment": 150000 }
};

// Expose data to the global scope
window.semiconductorStepsData = semiconductorStepsData;
window.sapComplexCosts = sapComplexCosts; 