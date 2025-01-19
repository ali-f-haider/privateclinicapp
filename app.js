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

// Function to show message to the user
const showMessage = (message, type = 'success') => {
    const messageBox = document.getElementById('messageBox');
    messageBox.style.display = 'block';
    messageBox.innerText = message;

    // Apply different styles based on message type
    if (type === 'success') {
        messageBox.className = 'message success';
    } else {
        messageBox.className = 'message error';
    }

    // Hide the message box after a few seconds
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
};

// Add patient to IndexedDB
const addPatient = () => {
    const name = document.getElementById('patientName').value;
    const age = document.getElementById('patientAge').value;
    const disease = document.getElementById('patientDisease').value;

    if (!name || !age || !disease) {
        showMessage('Please fill out all fields.', 'error');
        return;
    }

    const newPatient = { name, age: parseInt(age), disease };

    const transaction = db.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    store.add(newPatient);

    transaction.onsuccess = () => {
        showMessage('Patient added successfully!');
        loadPatients();
    };

    transaction.onerror = () => {
        showMessage('Error adding patient.', 'error');
    };
};

// Load patients from IndexedDB
const loadPatients = () => {
    const transaction = db.transaction(['patients'], 'readonly');
    const store = transaction.objectStore('patients');
    const request = store.getAll();

    request.onsuccess = () => {
        const patientsList = document.getElementById('patientsList');
        patientsList.innerHTML = '';

        request.result.forEach(patient => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${patient.name} (Age: ${patient.age}) - ${patient.disease}</span>
                <button onclick="deletePatient(${patient.id})">Delete</button>
            `;
            patientsList.appendChild(li);
        });
    };

    request.onerror = () => {
        showMessage('Error loading patients.', 'error');
    };
};

// Delete patient
const deletePatient = (id) => {
    const transaction = db.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    const request = store.delete(id);

    request.onsuccess = () => {
        showMessage('Patient deleted successfully!');
        loadPatients();
    };

    request.onerror = () => {
        showMessage('Patient not found.', 'error');
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
            showMessage('No data to export.', 'error');
            return;
        }
        const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'patients_data.json';
        a.click();
        URL.revokeObjectURL(url);
        showMessage('Data exported successfully!');
    };

    request.onerror = () => {
        showMessage('Error exporting data.', 'error');
    };
};

// Import data from JSON file
const importData = (event) => {
    const file = event.target.files[0];

    if (!file) {
        showMessage('No file selected.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) {
                showMessage('Invalid data format. Expected an array of patients.', 'error');
                return;
            }

            const transaction = db.transaction(['patients'], 'readwrite');
            const store = transaction.objectStore('patients');

            data.forEach(patient => {
                store.add(patient);
            });

            transaction.onsuccess = () => {
                showMessage('Data imported successfully!');
                loadPatients();
            };

            transaction.onerror = () => {
                showMessage('Error importing data.', 'error');
            };
        } catch (error) {
            showMessage('Error reading file or invalid JSON format.', 'error');
        }
    };

    reader.readAsText(file);
};

// Initialize the database
openDatabase();
