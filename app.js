document.addEventListener('DOMContentLoaded', () => {

if (!firebase.apps.length) { firebase.initializeApp({apiKey: "AIzaSyA4AwdgDl98iFD4_PA9v1lnAaN3ElEUwQ0",
  authDomain: "privateclinicapp.firebaseapp.com",
  projectId: "privateclinicapp",
  storageBucket: "privateclinicapp.firebasestorage.app",
  messagingSenderId: "968128571839",
  appId: "1:968128571839:web:9b2be35bcd414fdf6bd90a",
  measurementId: "G-J037W4SZHZ"}); } 
else { firebase.app(); } 
  const db = firebase.firestore();


    
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

    // Firebase configuration and initialization
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // Add patient function
    const addPatient = event => {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const age = parseInt(document.getElementById('age').value);
        const disease = document.getElementById('disease').value;

        db.collection("patients").add({
            name: name,
            age: age,
            disease: disease
        }).then(() => {
            showNotification(`Patient ${name} added successfully.`);
            displayPatients();
        }).catch(error => {
            showErrorNotification("Add patient error: " + error.message);
        });

        event.target.reset();
    };

    // Display patients function
    const displayPatients = () => {
        const patientList = document.getElementById('patientList');
        if (patientList) {
            patientList.innerHTML = '';
            db.collection("patients").get().then(querySnapshot => {
                querySnapshot.forEach(doc => {
                    const patient = doc.data();
                    const listItem = document.createElement('li');
                    listItem.textContent = `Name: ${patient.name}, Age: ${patient.age}, Disease: ${patient.disease}`;
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = "Delete";
                    deleteButton.className = "button";
                    deleteButton.onclick = () => deletePatient(doc.id);
                    listItem.appendChild(deleteButton);
                    patientList.appendChild(listItem);
                });
            }).catch(error => {
                showErrorNotification("Display patients error: " + error.message);
            });
        } else {
            showErrorNotification("Element 'patientList' not found.");
        }
    };

    // Delete patient function
    const deletePatient = id => {
        db.collection("patients").doc(id).delete().then(() => {
            showNotification("Patient deleted successfully.");
            displayPatients();
        }).catch(error => {
            showErrorNotification("Delete patient error: " + error.message);
        });
    };

    // Export patient data
    const exportData = () => {
        db.collection("patients").get().then(querySnapshot => {
            const data = querySnapshot.docs.map(doc => doc.data());
            const dataStr = JSON.stringify(data);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "patients_backup.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }).catch(error => {
            showErrorNotification("Export data error: " + error.message);
        });
    };

    // Import patient data
    const importData = event => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = event => {
            const data = JSON.parse(event.target.result);
            db.collection("patients").get().then(querySnapshot => {
                const batch = db.batch();
                querySnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                data.forEach(patient => {
                    batch.set(db.collection("patients").doc(), patient);
                });
                return batch.commit();
            }).then(() => {
                showNotification("Patient data imported successfully.");
                displayPatients();
            }).catch(error => {
                showErrorNotification("Import data error: " + error.message);
            });
        };

        reader.onerror = error => {
            showErrorNotification("File read error: " + error.message);
        };

        reader.readAsText(file);
    };

    // Search patient by name function
    const searchPatient = () => {
        const name = document.getElementById('searchName').value.toLowerCase();
        const patientList = document.getElementById('patientList');
        if (patientList) {
            patientList.innerHTML = '';

            db.collection("patients").orderBy("name").startAt(name).endAt(name + "\uf8ff").get().then(querySnapshot => {
                querySnapshot.forEach(doc => {
                    const patient = doc.data();
                    const listItem = document.createElement('li');
                    listItem.textContent = `Name: ${patient.name}, Age: ${patient.age}, Disease: ${patient.disease}`;
                    patientList.appendChild(listItem);
                });
                if (patientList.innerHTML === '') {
                    showNotification("No patients found with that name.");
                }
            }).catch(error => {
                showErrorNotification("Search patient error: " + error.message);
            });
        } else {
            showErrorNotification("Element 'patientList' not found.");
        }
    };

    // Delete all patients function
    const deleteAllPatients = () => {
        db.collection("patients").get().then(querySnapshot => {
            const batch = db.batch();
            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            return batch.commit();
        }).then(() => {
            showNotification("All patients deleted successfully.");
            const patientList = document.getElementById('patientList');
            if (patientList) {
                patientList.innerHTML = '';
            }
        }).catch(error => {
            showErrorNotification("Delete patients error: " + error.message);
        });
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

    // Load initial patient data from server
    displayPatients();
});
