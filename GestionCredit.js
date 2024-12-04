import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    deleteDoc,
    addDoc,
    updateDoc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCpioRg0cXjDFRjxK51Asyq8mEeCxx2088",
    authDomain: "appstock-b663d.firebaseapp.com",
    projectId: "appstock-b663d",
    storageBucket: "appstock-b663d.appspot.com",
    messagingSenderId: "953054905514",
    appId: "1:953054905514:web:1546782e3b183db77ffcd3",
    measurementId: "G-ZWJJJZR0CJ",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Elements
const creditList = document.getElementById("credits-list");
const creditAObtenirButton = document.getElementById("credit-a-obtenir-button");
const creditARembourserButton = document.getElementById("credit-a-rembourser-button");
const addCreditButton = document.getElementById("add-credit-button");
const totalsContainer = document.getElementById("totals-container");
const searchBar = document.getElementById("search-bar");

// Default collection type
let currentType = "creditAObtenir";

// User authentication check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html"; // Redirect if not logged in
    } else {
        loadCredits(currentType); // Load credits after authentication
    }
});

// Function to load credits
async function loadCredits(collectionName, searchQuery = "") {
    try {
        const userId = auth.currentUser.uid;
        const creditsRef = collection(db, `users/${userId}/${collectionName}`);
        const snapshot = await getDocs(query(creditsRef, orderBy("date", "desc")));

        let credits = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            credits.push({
                id: doc.id,
                name: data.name || "Nom non disponible",
                description: data.description || "-",
                amount: data.amount !== undefined ? data.amount : 0,
                date: data.date?.toDate ? data.date.toDate() : "Date non valide",
            });
        });

        // Filter credits based on search query
        if (searchQuery) {
            const queryLower = searchQuery.toLowerCase();
            credits = credits.filter(
                (credit) =>
                    credit.name.toLowerCase().includes(queryLower) ||
                    credit.description.toLowerCase().includes(queryLower) ||
                    String(credit.amount).includes(queryLower) ||
                    (credit.date instanceof Date &&
                        credit.date.toLocaleDateString().includes(queryLower))
            );
        }

        renderCredits(credits); // Render credits in the table
    } catch (error) {
        console.error("Error loading credits:", error.message);
        alert(`Erreur: ${error.message}`);
    }
}

// Render credits in the table
function renderCredits(credits) {
    creditList.innerHTML = ""; // Clear the table

    if (credits.length === 0) {
        creditList.innerHTML = "<tr><td colspan='6'>Aucun crédit trouvé.</td></tr>";
        totalsContainer.textContent = "Montant Total: 0 DH";
        return;
    }

    let totalAmount = 0;

    credits.forEach((credit) => {
        totalAmount += credit.amount;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${credit.name}</td>
            <td>${credit.description}</td>
            <td>${credit.amount !== 0 ? `${credit.amount} DH` : credit.amount}</td>
            <td>${credit.date instanceof Date ? credit.date.toLocaleDateString() : credit.date}</td>
            <td>
                <button class="modify-button" data-id="${credit.id}">Modifier</button>
                <button class="delete-button" data-id="${credit.id}">Supprimer</button>
                <button class="view-operations-button" data-id="${credit.id}">Détails</button>
            </td>
        `;
        creditList.appendChild(row);
    });

    totalsContainer.textContent = `Montant Total: ${totalAmount.toFixed(2)} DH`;
    attachActionListeners(); // Attach actions to buttons
}

// Attach button event listeners
function attachActionListeners() {
    document.querySelectorAll(".modify-button").forEach((button) => {
        button.addEventListener("click", () => modifyCredit(button.dataset.id));
    });

    document.querySelectorAll(".delete-button").forEach((button) => {
        button.addEventListener("click", () => deleteCredit(button.dataset.id));
    });

    document.querySelectorAll(".view-operations-button").forEach((button) => {
        button.addEventListener("click", () => viewOperations(button.dataset.id));
    });
}

// Delete credit
async function deleteCredit(id) {
    const userId = auth.currentUser.uid;

    try {
        const creditRef = doc(db, `users/${userId}/${currentType}`, id);
        if (confirm("Êtes-vous sûr de vouloir supprimer ce crédit ?")) {
            await deleteDoc(creditRef);
            alert("Crédit supprimé avec succès !");
            loadCredits(currentType); // Reload the credits
        }
    } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Une erreur s'est produite lors de la suppression.");
    }
}

// Add credit
addCreditButton.addEventListener("click", () => {
    const modal = document.createElement("div");
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h2>Ajouter un Crédit</h2>
                <form id="add-credit-form">
                    <label for="credit-name">Nom:</label>
                    <input type="text" id="credit-name" placeholder="Nom" required>
                    <label for="credit-description">Description:</label>
                    <input type="text" id="credit-description" placeholder="Description" required>
                    <label for="credit-amount">Montant:</label>
                    <input type="number" id="credit-amount" placeholder="Montant" required>
                    <label for="credit-date">Date:</label>
                    <input type="date" id="credit-date" required>
                    <label for="credit-type">Type:</label>
                    <select id="credit-type">
                        <option value="creditAObtenir">Crédit à Obtenir</option>
                        <option value="creditARembourser">Crédit à Rembourser</option>
                    </select>
                    <div class="modal-buttons">
                        <button type="button" id="cancel-button">Annuler</button>
                        <button type="submit">Ajouter</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Cancel button
    document.getElementById("cancel-button").addEventListener("click", () => {
        document.body.removeChild(modal);
    });

    // Submit form
    document.getElementById("add-credit-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("credit-name").value;
        const description = document.getElementById("credit-description").value;
        const amount = parseFloat(document.getElementById("credit-amount").value);
        const date = document.getElementById("credit-date").value;
        const type = document.getElementById("credit-type").value;

        if (confirm("Voulez-vous ajouter ce crédit ?")) {
            const userId = auth.currentUser.uid;

            try {
                const creditRef = collection(db, `users/${userId}/${type}`);
                await addDoc(creditRef, {
                    name,
                    description,
                    amount,
                    date: new Date(date),
                });
                alert("Crédit ajouté avec succès !");
                document.body.removeChild(modal);
                loadCredits(currentType); // Reload credits
            } catch (error) {
                console.error("Erreur lors de l'ajout du crédit:", error.message);
                alert("Une erreur s'est produite lors de l'ajout du crédit.");
            }
        }
    });
});
// Add event listeners to switch between "Crédit à Obtenir" and "Crédit à Rembourser"
creditAObtenirButton.addEventListener("click", () => {
    currentType = "creditAObtenir";
    updateButtonStates();
    loadCredits(currentType); // Load credits for "Crédit à Obtenir"
});

creditARembourserButton.addEventListener("click", () => {
    currentType = "creditARembourser";
    updateButtonStates();
    loadCredits(currentType); // Load credits for "Crédit à Rembourser"
});

// Update button states visually
function updateButtonStates() {
    creditAObtenirButton.classList.toggle("active", currentType === "creditAObtenir");
    creditARembourserButton.classList.toggle("active", currentType === "creditARembourser");
}



async function viewOperations(creditId) {
    const modal = document.createElement("div");
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h2>Opérations pour le Crédit</h2>
                <ul id="operations-list"></ul>
                <form id="add-operation-form">
                    <label for="operation-type">Type:</label>
                    <select id="operation-type">
                        <option value="+">Ajouter au crédit</option>
                        <option value="-">Réduire le Crédit</option>
                    </select>
                    <label for="operation-amount">Montant:</label>
                    <input type="number" id="operation-amount" placeholder="Montant" required>
                    <label for="operation-date">Date:</label>
                    <input type="date" id="operation-date" required>
                    <label for="operation-description">Description (Optionnel):</label>
                    <input type="text" id="operation-description" placeholder="Description">
                    <button type="submit">Ajouter Opération</button>
                    <button type="button" id="close-operations-modal">Fermer</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Set current date for the date picker
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("operation-date").value = today;

    const userId = auth.currentUser.uid;
    const operationsList = document.getElementById("operations-list");
    const operationsRef = collection(db, `users/${userId}/${currentType}/${creditId}/operations`);
    const creditRef = doc(db, `users/${userId}/${currentType}`, creditId);

    let creditDoc = await getDoc(creditRef);
    let currentBalance = creditDoc.data().amount;

    // Display initial "Reste à payer"
    operationsList.innerHTML = `<p><strong>Reste à payer:</strong> ${currentBalance.toFixed(2)} DH</p>`;

    // Fetch and display operations
    const snapshot = await getDocs(query(operationsRef, orderBy("date", "desc")));
    snapshot.forEach((doc) => {
        const operation = doc.data();

        const operationItem = document.createElement("li");
        const operationSign = operation.type === "+" ? "+" : "-";
        const operationClass = operation.type === "+" ? "operation-positive" : "operation-negative";
        operationItem.className = operationClass;
        operationItem.innerHTML = `
            ${operation.date.toDate().toLocaleDateString()} - ${operationSign}${operation.amount} DH (${operation.description || "Pas de description"})
            <button class="delete-operation-button" data-id="${doc.id}" title="Supprimer cette opération">X</button>
        `;
        operationsList.appendChild(operationItem);
    });

    // Delete operation logic
    document.querySelectorAll(".delete-operation-button").forEach((button) => {
        button.addEventListener("click", async (e) => {
            const operationId = button.dataset.id;

            if (confirm("Êtes-vous sûr de vouloir supprimer cette opération ?")) {
                try {
                    const operationDoc = await getDoc(doc(operationsRef, operationId));
                    const { type, amount } = operationDoc.data();

                    const adjustedAmount = type === "+"
                        ? currentBalance - amount
                        : currentBalance + amount;

                    await updateDoc(creditRef, {
                        amount: adjustedAmount,
                    });

                    await deleteDoc(doc(operationsRef, operationId));
                    alert("Opération supprimée avec succès !");
                    document.body.removeChild(modal);
                    viewOperations(creditId);
                } catch (error) {
                    console.error("Erreur lors de la suppression:", error.message);
                    alert("Une erreur s'est produite.");
                }
            }
        });
    });

    // Add operation logic
    document.getElementById("add-operation-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const type = document.getElementById("operation-type").value;
        const amount = parseFloat(document.getElementById("operation-amount").value);
        const description = document.getElementById("operation-description").value || ""; // Default to empty string if not provided
        const date = new Date(document.getElementById("operation-date").value);

        const signedAmount = type === "-" ? -Math.abs(amount) : Math.abs(amount);

        if (confirm("Voulez-vous ajouter cette opération ?")) {
            try {
                await addDoc(operationsRef, {
                    type,
                    amount: signedAmount,
                    description,
                    date,
                });

                const updatedAmount = currentBalance + signedAmount;
                await updateDoc(creditRef, { amount: updatedAmount });

                alert("Opération ajoutée avec succès !");
                document.body.removeChild(modal);
                loadCredits(currentType); // Refresh the credit list
            } catch (error) {
                console.error("Erreur lors de l'ajout:", error.message);
                alert("Une erreur s'est produite.");
            }
        }
    });

    // Close modal
    document.getElementById("close-operations-modal").addEventListener("click", () => {
        document.body.removeChild(modal);
    });
}
