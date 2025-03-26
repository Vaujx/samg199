/**
 * JSONBin.io API Wrapper
 * This file handles all interactions with the JSONBin.io API
 */

// Define CONFIG and default data
const CONFIG = {
    JSONBIN_URL: 'https://api.jsonbin.io/v3/b', // Replace with your actual URL
    MASTER_KEY: '$2b$10$YOUR_MASTER_KEY', // Replace with your actual master key
    BINS: {}
};

const DEFAULT_PRODUCTS = [];
const DEFAULT_ORDERS = [];
const DEFAULT_SYSTEM_STATUS = {};
const DEFAULT_SYSTEM_LOG = [];


// Initialize the JSONBin.io bins
async function initializeJSONBins() {
    try {
        // Check if we have bin IDs in localStorage
        const storedBins = localStorage.getItem('seoul_grill_bins');
        if (storedBins) {
            CONFIG.BINS = JSON.parse(storedBins);
            console.log('Loaded bin IDs from localStorage:', CONFIG.BINS);
            return true;
        }

        // Create bins for each data type if they don't exist
        await createBinIfNotExists('PRODUCTS', DEFAULT_PRODUCTS);
        await createBinIfNotExists('ORDERS', DEFAULT_ORDERS);
        await createBinIfNotExists('SYSTEM_STATUS', DEFAULT_SYSTEM_STATUS);
        await createBinIfNotExists('SYSTEM_LOG', DEFAULT_SYSTEM_LOG);

        // Save bin IDs to localStorage
        localStorage.setItem('seoul_grill_bins', JSON.stringify(CONFIG.BINS));
        console.log('Created and saved bin IDs:', CONFIG.BINS);
        return true;
    } catch (error) {
        console.error('Error initializing JSONBins:', error);
        return false;
    }
}

// Create a bin if it doesn't exist
async function createBinIfNotExists(binType, defaultData) {
    if (CONFIG.BINS[binType]) {
        return CONFIG.BINS[binType];
    }

    try {
        const response = await fetch(CONFIG.JSONBIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.MASTER_KEY,
                'X-Bin-Private': 'false'
            },
            body: JSON.stringify(defaultData)
        });

        if (!response.ok) {
            throw new Error(`Failed to create ${binType} bin: ${response.status}`);
        }

        const data = await response.json();
        CONFIG.BINS[binType] = data.metadata.id;
        return data.metadata.id;
    } catch (error) {
        console.error(`Error creating ${binType} bin:`, error);
        throw error;
    }
}

// Get data from a bin
async function getBinData(binType) {
    try {
        if (!CONFIG.BINS[binType]) {
            throw new Error(`Bin ID for ${binType} not found`);
        }

        const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS[binType]}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': CONFIG.MASTER_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get ${binType} data: ${response.status}`);
        }

        const data = await response.json();
        return data.record;
    } catch (error) {
        console.error(`Error getting ${binType} data:`, error);
        throw error;
    }
}

// Update data in a bin
async function updateBinData(binType, data) {
    try {
        if (!CONFIG.BINS[binType]) {
            throw new Error(`Bin ID for ${binType} not found`);
        }

        const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS[binType]}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.MASTER_KEY
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Failed to update ${binType} data: ${response.status}`);
        }

        const responseData = await response.json();
        return responseData.record;
    } catch (error) {
        console.error(`Error updating ${binType} data:`, error);
        throw error;
    }
}
