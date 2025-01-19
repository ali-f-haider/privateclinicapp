// IndexedDB setup
const dbName = 'patientDB';
const dbVersion = 1;
let db;

const openDatabase = () => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains('patients')) {
            db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        loadPatients();
    };

    request.onerror = (event) => {
        showMessage('Error opening database.', true);
    };
};

// Function to show toast message
const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toastContainer');
    
    // Create a new toast element
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.innerText = message;

    // Append toast to the container
    toastContainer.appendChild(toast);

    // Remove the toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

// Add patient to IndexedDB
const addPatient = () => {
    const name = document.getElementById('patientName').value;
    const age = document.getElementById('patientAge').value;
    const disease = document.getElementById('patientDisease').value;

    if (!name || !age || !disease) {
        showToast('Please fill out all fields.', 'error');
        return;
    }

    const newPatient = { name, age: parseInt(age), disease };

    const transaction = db.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    store.add(newPatient);

    transaction.onsuccess = () => {
        showToast('Patient added successfully!');
        loadPatients();
    };

    transaction.onerror = () => {
        showToast('Error adding patient.', 'error');
    };
};

// Delete patient
const deletePatient = (id) => {
    const transaction = db.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    const request = store.delete(id);

    request.onsuccess = () => {
        showToast('Patient deleted successfully!');
        loadPatients();
    };

    request.onerror = () => {
        showToast('Patient not found.', 'error');
    };
};

// Export data as JSON
const exportData = () => {
    const transaction = db.transaction(['patients'], 'readonly');
    const store = transaction.objectStore('patients');
    const request = store.getAll();

    request.onsuccess = () => {
        const data = request.result;
        if (data.length === 0) {
            showToast('No data to export.', 'error');
            return;
        }
        const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'patients_data.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported successfully!');
    };

    request.onerror = () => {
        showToast('Error exporting data.', 'error');
    };
};

// Import data from JSON file
const importData = (event) => {
    const file = event.target.files[0];

    if (!file) {
        showToast('No file selected.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) {
                showToast('Invalid data format. Expected an array of patients.', 'error');
                return;
            }

            const transaction = db.transaction(['patients'], 'readwrite');
            const store = transaction.objectStore('patients');

            data.forEach(patient => {
                store.add(patient);
            });

            transaction.onsuccess = () => {
                showToast('Data imported successfully!');
                loadPatients();
            };

            transaction.onerror = () => {
                showToast('Error importing data.', 'error');
            };
        } catch (error) {
            showToast('Error reading file or invalid JSON format.', 'error');
        }
    };

    reader.readAsText(file);
};

// Initialize the database
openDatabase();
