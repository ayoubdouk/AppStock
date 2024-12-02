import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCpioRg0cXjDFRjxK51Asyq8mEeCxx2088",
    authDomain: "appstock-b663d.firebaseapp.com",
    projectId: "appstock-b663d",
    storageBucket: "appstock-b663d.appspot.com",
    messagingSenderId: "953054905514",
    appId: "1:953054905514:web:1546782e3b183db77ffcd3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const expenseList = document.getElementById("expense-list");
const datePicker = document.getElementById("date-picker");
const filterPeriod = document.getElementById("filter-period");
const totalsContainer = document.getElementById("totals-container");

// Authentication check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        setDefaultDate();
        loadExpenses();
    }
});

// Set default date picker to today
function setDefaultDate() {
    const today = new Date();
    datePicker.value = today.toISOString().split("T")[0];
}

// Load expenses based on filter
async function loadExpenses() {
    const userId = auth.currentUser.uid;
    const expensesRef = collection(db, `users/${userId}/depenses`);
    let filteredExpenses = [];

    const filterValue = filterPeriod.value; // e.g., "day", "week", "month", "year"
    const selectedDate = new Date(datePicker.value);
    selectedDate.setHours(0, 0, 0, 0); // Set time to start of the day

    try {
        const snapshot = await getDocs(expensesRef);

        snapshot.forEach((doc) => {
            const data = doc.data();

            // Convert Firestore Timestamp to JavaScript Date
            const expenseDate = data.dateDepense.toDate ? data.dateDepense.toDate() : new Date(data.dateDepense);

            // Filter based on the selected period
            if (
                (filterValue === "day" && isSameDay(expenseDate, selectedDate)) ||
                (filterValue === "week" && isSameWeek(expenseDate, selectedDate)) ||
                (filterValue === "month" && isSameMonth(expenseDate, selectedDate)) ||
                (filterValue === "year" && isSameYear(expenseDate, selectedDate))
            ) {
                filteredExpenses.push({ id: doc.id, ...data });
            }
        });

        renderExpenses(filteredExpenses); // Render filtered data
    } catch (error) {
        console.error("Error loading expenses:", error);
        alert("Une erreur s'est produite lors du chargement des dépenses.");
    }
}

// Helper functions for date filtering
function isSameDay(d1, d2) {
    return d1.toDateString() === d2.toDateString();
}

function isSameWeek(d1, d2) {
    const startOfWeek = new Date(d2);
    startOfWeek.setDate(d2.getDate() - d2.getDay()); // Start of the week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    return d1 >= startOfWeek && d1 <= endOfWeek;
}

function isSameMonth(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

function isSameYear(d1, d2) {
    return d1.getFullYear() === d2.getFullYear();
}

// Render expenses in the table
function renderExpenses(expenses) {
    expenseList.innerHTML = "";
    let totalAmount = 0;

    expenses.forEach((expense) => {
        totalAmount += parseFloat(expense.montant) || 0;
        addExpenseToTable(expense.id, expense);
    });

    updateTotals(totalAmount);
}

function addExpenseToTable(id, data) {
    const expenseDate = data.dateDepense.toDate ? data.dateDepense.toDate() : new Date(data.dateDepense);

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${expenseDate.toLocaleDateString()}</td>
        <td>${data.description || "-"}</td>
        <td>${data.montant || "0"} DH</td>
        <td>${data.modePaiement || "-"}</td>
        <td>
            <button class="modify-button" data-id="${id}">Modifier</button>
            <button class="delete-button" data-id="${id}">Supprimer</button>
        </td>
    `;

    expenseList.appendChild(row);

    // Attach modify and delete events
    row.querySelector(".modify-button").addEventListener("click", () => modifyExpense(id, data));
    row.querySelector(".delete-button").addEventListener("click", () => deleteExpense(id));
}

// Update totals
function updateTotals(totalAmount) {
    totalsContainer.textContent = `Montant Total: ${totalAmount.toFixed(2)} DH`;
}

// Delete an expense
async function deleteExpense(id) {
    const userId = auth.currentUser.uid;
    const expenseRef = doc(db, `users/${userId}/depenses`, id);

    if (confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) {
        await deleteDoc(expenseRef);
        alert("Dépense supprimée avec succès !");
        loadExpenses();
    }
}

// Modify an expense
async function modifyExpense(id, data) {
    const userId = auth.currentUser.uid;
    const expenseRef = doc(db, `users/${userId}/depenses`, id);

    const newDescription = prompt("Modifier la description :", data.description);
    const newModePaiement = prompt("Modifier le mode de paiement :", data.modePaiement);
    const newMontant = parseFloat(prompt("Modifier le montant :", data.montant));

    if (!newDescription || !newModePaiement || isNaN(newMontant)) {
        alert("Veuillez remplir tous les champs correctement.");
        return;
    }

    await updateDoc(expenseRef, {
        description: newDescription,
        modePaiement: newModePaiement,
        montant: newMontant
    });

    alert("Dépense modifiée avec succès !");
    loadExpenses();
}

// Add event listeners for filter and date picker changes
filterPeriod.addEventListener("change", loadExpenses);
datePicker.addEventListener("change", loadExpenses);


// Add event listener for the add expense button
document.getElementById("add-expense-button").addEventListener("click", async () => {
    // Create a modal with a form for adding expenses
    const modal = document.createElement("div");

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h2>Ajouter une Dépense</h2>
                <form id="add-expense-form">
                    <label for="expense-date">Date:</label>
                    <input type="date" id="expense-date" value="${formattedDate}" required>
                    <label for="expense-description">Description:</label>
                    <input type="text" id="expense-description" placeholder="Description de la dépense" required>
                    <label for="expense-montant">Montant:</label>
                    <input type="number" id="expense-montant" placeholder="Montant" required>
                    <label for="expense-mode">Mode de Paiement:</label>
                    <input type="text" id="expense-mode" placeholder="Mode de paiement (Cash, Carte, etc.)" required>
                    <div class="modal-buttons">
                        <button type="button" id="cancel-button">Annuler</button>
                        <button type="submit">Ajouter</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Add the modal to the document body
    document.body.appendChild(modal);

    // Add event listener for the cancel button
    document.getElementById("cancel-button").addEventListener("click", () => {
        document.body.removeChild(modal); // Remove modal on cancel
    });

    // Add event listener for the form submission
    document.getElementById("add-expense-form").addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Get values from the form
        const dateDepenseValue = document.getElementById("expense-date").value;
        const description = document.getElementById("expense-description").value;
        const modePaiement = document.getElementById("expense-mode").value;
        const montant = parseFloat(document.getElementById("expense-montant").value);

        // Validate inputs
        if (!dateDepenseValue || !description || !modePaiement || isNaN(montant)) {
            alert("Veuillez remplir tous les champs correctement.");
            return;
        }

        try {
            const userId = auth.currentUser.uid;
            const expensesRef = collection(db, `users/${userId}/depenses`);

            await addDoc(expensesRef, {
                dateDepense: new Date(dateDepenseValue),
                description,
                modePaiement,
                montant,
            });

            alert("Dépense ajoutée avec succès !");
            document.body.removeChild(modal); // Remove modal after success
            loadExpenses(); // Reload the list to reflect the new expense
        } catch (error) {
            console.error("Erreur lors de l'ajout de la dépense:", error.message);
            alert("Une erreur s'est produite lors de l'ajout de la dépense.");
        }
    });
});