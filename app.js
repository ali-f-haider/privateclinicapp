document.addEventListener('DOMContentLoaded', () => {

    // Function to show notification
    const showNotification = message => {
        const notification = document.createElement("div");
        notification.className = "notification";
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    };

    // Function to show error notification
    const showErrorNotification = message => {
        const notification = document.createElement("div");
        notification.className = "notification error";
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 5000);
    };

    // IndexedDB setup
    let db;
    const request = indexedDB.open('patientDB', 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        const objectStore = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('name', 'name', { unique: false });
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        displayPatients();
    };

    request.onerror = function(event) {
        showErrorNotification("Database error: " + event.target.errorCode);
    };

    // Add patient function
    const addPatient = event => {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const age = parseInt(document.getElementById('age').value);
        const disease = document.getElementById('disease').value;

        const transaction = db.transaction(['patients'], 'readwrite');
        const objectStore = transaction.objectStore('patients');
        const request = objectStore.add({ name, age, disease });

        request.onsuccess = () => {
            showNotification(`Patient ${name} added successfully.`);
            displayPatients();
        };

        request.onerror = event => {
            showErrorNotification("Add patient error: " + event.target.errorCode);
        };

        event.target.reset();
    };

    // Display patients function
    const displayPatients = () => {
        const patientList = document.getElementById('patientList');
        if (patientList) {
            patientList.innerHTML = '';

            const transaction = db.transaction('patients', 'readonly');
            const objectStore = transaction.objectStore('patients');
            const request = objectStore.openCursor();

            request.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) {
                    const listItem = document.createElement('li');
                    listItem.textContent = `Name: ${cursor.value.name}, Age: ${cursor.value.age}, Disease: ${cursor.value.disease}`;
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = "Delete";
                    deleteButton.className = "button";
                    deleteButton.onclick = () => deletePatient(cursor.value.id);
                    listItem.appendChild(deleteButton);
                    patientList.appendChild(listItem);
                    cursor.continue();
                }
            };

            request.onerror = event => {
                showErrorNotification("Display patients error: " + event.target.errorCode);
            };
        } else {
            showErrorNotification("Element 'patientList' not found.");
        }
    };

    // Delete patient function
    const deletePatient = id => {
        const transaction = db.transaction(['patients'], 'readwrite');
        const objectStore = transaction.objectStore('patients');
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            showNotification("Patient deleted successfully.");
            displayPatients();
        };

        request.onerror = event => {
            showErrorNotification("Delete patient error: " + event.target.errorCode);
        };
    };

    // Export patient data
    const exportData = () => {
        const transaction = db.transaction('patients', 'readonly');
        const objectStore = transaction.objectStore('patients');
        const request = objectStore.getAll();

        request.onsuccess = event => {
            const data = event.target.result;
            const dataStr = JSON.stringify(data);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "patients_backup.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        request.onerror = event => {
            showErrorNotification("Export data error: " + event.target.errorCode);
        };
    };

    // Import patient data
    const importData = event => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = event => {
            const data = JSON.parse(event.target.result);
            const transaction = db.transaction('patients', 'readwrite');
            const objectStore = transaction.objectStore('patients');
            
            data.forEach(patient => {
                objectStore.put(patient);
            });
            displayPatients();
        };

        reader.onerror = event => {
            showErrorNotification("File read error: " + event.target.errorCode);
        };

        reader.readAsText(file);
    };

    // Search patient by name function
    const searchPatient = () => {
        const name = document.getElementById('searchName').value.toLowerCase();
        const patientList = document.getElementById('patientList');
        if (patientList) {
            patientList.innerHTML = '';

            const transaction = db.transaction('patients', 'readonly');
            const objectStore = transaction.objectStore('patients');
            const index = objectStore.index('name');
            const request = index.openCursor();

            request.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.name.toLowerCase().includes(name)) {
                        const listItem = document.createElement('li');
                        listItem.textContent = `Name: ${cursor.value.name}, Age: ${cursor.value.age}, Disease: ${cursor.value.disease}`;
                        patientList.appendChild(listItem);
                    }
                    cursor.continue();
                } else {
                    if (patientList.innerHTML === '') {
                        showNotification("No patients found with that name.");
                    }
                }
            };

            request.onerror = event => {
                showErrorNotification("Search patient error: " + event.target.errorCode);
            };
        } else {
            showErrorNotification("Element 'patientList' not found.");
        }
    };

    // Delete all patients function
    const deleteAllPatients = () => {
        const transaction = db.transaction(['patients'], 'readwrite');
        const objectStore = transaction.objectStore('patients');
        const request = objectStore.clear();

        request.onsuccess = () => {
            showNotification("All patients deleted successfully.");
            const patientList = document.getElementById('patientList');
            if (patientList) {
                patientList.innerHTML = '';
            }
        };

        request.onerror = event => {
            showErrorNotification("Delete patients error: " + event.target.errorCode);
        };
    };

    // Ensure elements are found before binding events
    const bindElement = (id, event, callback) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, callback);
        } else {
            console.error(`Element '${id}' not found.`);
            showErrorNotification(`Element '${id}' not found.`);
        }
        return element;
    };

    // Bind buttons to functions
    bindElement('exportButton', 'click', exportData);
    bindElement('importButton', 'click', () => document.getElementById('importInput').click());
    bindElement('importInput', 'change', importData);
    bindElement('deleteAllButton', 'click', deleteAllPatients);
    bindElement('searchButton', 'click', searchPatient);

    // Handle form submission
    bindElement('patientForm', 'submit', addPatient);
});
