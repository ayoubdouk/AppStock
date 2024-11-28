import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const datePicker = document.getElementById("date-picker");
const salesList = document.getElementById("sales-list");
const dayTab = document.getElementById("day-tab");
const weekTab = document.getElementById("week-tab");
const monthTab = document.getElementById("month-tab");
const yearTab = document.getElementById("year-tab");

// Total Elements
const totalItems = document.getElementById("total-items");
const totalSelling = document.getElementById("total-selling");
const totalProfit = document.getElementById("total-profit");

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        // Load today's sales by default
        const today = new Date();
        const startDate = new Date(today.setHours(0, 0, 0, 0));
        const endDate = new Date(today.setHours(23, 59, 59, 999));
        loadSales(startDate, endDate);
        setActiveTab(dayTab); // Set "Par Jour" as active
    }
});

// Load sales for a specific date range
async function loadSales(startDate, endDate) {
    clearSalesTable(); // Clear the table before adding new data

    let totalSales = 0;
    let totalSellingPrice = 0;
    let totalProfits = 0;

    try {
        const user = auth.currentUser;
        if (!user) {
            return;
        }

        const userId = user.uid;
        const productsRef = collection(db, `users/${userId}/products`);
        const q = query(
            productsRef,
            where("timestamp", ">=", startDate),
            where("timestamp", "<", endDate),
            orderBy("timestamp", "desc")
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            salesList.innerHTML = "<tr><td colspan='7'>Pas de ventes pour cette période</td></tr>";
        } else {
            snapshot.forEach((doc) => {
                const data = doc.data();
                const profit = calculateProfit(data);

                totalSales += 1;
                totalSellingPrice += parseFloat(data.sellingPrice);
                totalProfits += profit;

                addSaleToTable(doc.id, data, profit);
            });
        }

        // Update totals
        totalItems.textContent = `Total des ventes: ${totalSales}`;
        totalSelling.textContent = `Total Prix de Vente: ${totalSellingPrice.toFixed(2)} DH`;
        totalProfit.textContent = `Total Profit: ${totalProfits.toFixed(2)} DH`;
    } catch (error) {
        console.error("Erreur lors du chargement des ventes :", error.message);
    }
}

// Clear sales table
function clearSalesTable() {
    salesList.innerHTML = "";
}

// Add a sale to the table
function addSaleToTable(saleId, sale, profit) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${sale.productName}</td>
        <td>${sale.purchasePrice} DH</td>
        <td>${sale.sellingPrice} DH</td>
        <td>${profit.toFixed(2)} DH</td>
        <td>${new Date(sale.timestamp.seconds * 1000).toLocaleDateString()}</td>
        <td>${sale.clientName || "N/A"}</td>
        <td>
            <button class="edit-button" data-id="${saleId}">Modifier</button>
            <button class="delete-button" data-id="${saleId}">Supprimer</button>
        </td>
    `;
    salesList.appendChild(row);

    // Add event listener for Edit button
    const editButton = row.querySelector(".edit-button");
    editButton.addEventListener("click", () => {
        editSale(saleId, sale);
    });

    // Add event listener for Delete button
    const deleteButton = row.querySelector(".delete-button");
    deleteButton.addEventListener("click", () => {
        deleteSale(saleId);
    });
}

// Calculate profit
function calculateProfit(sale) {
    const purchasePrice = parseFloat(sale.purchasePrice) || 0;
    const sellingPrice = parseFloat(sale.sellingPrice) || 0;
    return sellingPrice - purchasePrice;
}

// Edit a sale
async function editSale(saleId, sale) {
    const productName = prompt("Modifier le nom du produit:", sale.productName);
    const purchasePrice = prompt("Modifier le prix d'achat:", sale.purchasePrice);
    const sellingPrice = prompt("Modifier le prix de vente:", sale.sellingPrice);
    const clientName = prompt("Modifier le nom du client:", sale.clientName || "N/A");

    if (productName && purchasePrice && sellingPrice) {
        const user = auth.currentUser;
        if (!user) {
            alert("Utilisateur non authentifié !");
            return;
        }

        const userId = user.uid;
        const saleRef = doc(db, `users/${userId}/products`, saleId);

        try {
            await updateDoc(saleRef, {
                productName,
                purchasePrice,
                sellingPrice,
                clientName,
            });
            alert("Vente modifiée avec succès!");
            loadSalesForCurrentTab(); // Refresh the current tab
        } catch (error) {
            console.error("Erreur lors de la modification de la vente :", error.message);
            alert("Erreur : " + error.message);
        }
    }
}

// Delete a sale
async function deleteSale(saleId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette vente?")) {
        const user = auth.currentUser;
        if (!user) {
            alert("Utilisateur non authentifié !");
            return;
        }

        const userId = user.uid;
        const saleRef = doc(db, `users/${userId}/products`, saleId);

        try {
            await deleteDoc(saleRef);
            alert("Vente supprimée avec succès!");
            loadSalesForCurrentTab(); // Update the list dynamically
        } catch (error) {
            console.error("Erreur lors de la suppression de la vente :", error.message);
            alert("Erreur : " + error.message);
        }
    }
}

// Load sales based on the currently selected tab
function loadSalesForCurrentTab() {
    const selectedTab = document.querySelector(".tab-button.active");
    if (selectedTab) {
        selectedTab.click();
    } else {
        console.error("Aucun onglet actif trouvé !");
    }
}

// Set active tab
function setActiveTab(activeTab) {
    const allTabs = [dayTab, weekTab, monthTab, yearTab];
    allTabs.forEach((tab) => tab.classList.remove("active"));
    activeTab.classList.add("active");
}

// Event listeners for tabs
dayTab.addEventListener("click", () => {
    const selectedDate = new Date(datePicker.value);
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    loadSales(startDate, endDate);
    setActiveTab(dayTab);
});

weekTab.addEventListener("click", () => {
    const selectedDate = new Date(datePicker.value);
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);

    const dayOfWeek = startDate.getDay();
    const diffToStart = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const diffToEnd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

    startDate.setDate(startDate.getDate() - diffToStart);
    endDate.setDate(endDate.getDate() + diffToEnd);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    loadSales(startDate, endDate);
    setActiveTab(weekTab);
});

monthTab.addEventListener("click", () => {
    const selectedDate = new Date(datePicker.value);
    const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    loadSales(startDate, endDate);
    setActiveTab(monthTab);
});

yearTab.addEventListener("click", () => {
    const selectedDate = new Date(datePicker.value);
    const startDate = new Date(selectedDate.getFullYear(), 0, 1);
    const endDate = new Date(selectedDate.getFullYear(), 11, 31);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    loadSales(startDate, endDate);
    setActiveTab(yearTab);
});

// توجيه المستخدم إلى صفحة sales-entry.html عند النقر على الزر "Ajouter une Vente"
document.getElementById("add-sale-button").addEventListener("click", () => {
    window.location.href = "sales-entry.html"; // الانتقال إلى صفحة إدخال المبيعات
});

// Initialize date picker
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    datePicker.value = today.toISOString().slice(0, 10); // Set default to today's date
});