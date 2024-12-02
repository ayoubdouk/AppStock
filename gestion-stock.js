import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    deleteDoc,
    updateDoc,
    doc,
    getDoc, // Ensure this is imported for fetching individual documents
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
const stockList = document.getElementById("stock-list");
const totalItems = document.getElementById("total-items");
const totalCapital = document.getElementById("total-capital");
const searchBar = document.getElementById("search-bar");
const chequeList = document.getElementById("stock-list"); // Assuming stock-list is the table body
const tabs = {
    all: document.getElementById("all-products-tab"),
    sold: document.getElementById("sold-products-tab"),
    unsold: document.getElementById("unsold-products-tab"),
};

// Helper function to set the active tab and highlight it
function setActiveTab(activeTab) {
    Object.values(tabs).forEach((tab) => tab.classList.remove("active")); // Remove active class from all tabs
    activeTab.classList.add("active"); // Add active class to the clicked tab
}

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        // Display all products by default
        setActiveTab(tabs.all);
        loadStock("all");
    }
});

// Load stock data
async function loadStock(type) {
    stockList.innerHTML = ""; // Clear the table
    totalItems.textContent = "Total des Produits: 0";
    totalCapital.textContent = "Capital Total: 0 DH";

    try {
        const userId = auth.currentUser.uid;
        const stockRef = collection(db, `users/${userId}/stock`);
        let q;

        // Query based on type
        if (type === "all") {
            q = query(stockRef, orderBy("dateAchat", "desc")); // Order by date
        } else {
            const sold = type === "sold";
            q = query(stockRef, where("vendu", "==", sold), orderBy("dateAchat", "desc"));
        }

        const snapshot = await getDocs(q);

        let itemCount = 0;
        let capital = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            addStockToTable(doc.id, data);

            itemCount++;
            if (!data.vendu) {
                capital += parseFloat(data.prixDachat) || 0;
            }
        });

        // Update totals
        totalItems.textContent = `Total des Produits: ${itemCount}`;
        if (type === "unsold") {
            totalCapital.textContent = `Capital Total: ${capital.toFixed(2)} DH`;
        }
    } catch (error) {
        console.error("Erreur lors du chargement du stock :", error.message);

        if (error.message.includes("requires an index")) {
            alert("الاستعلام يحتاج إلى فهرس. الرجاء إنشاء الفهرس من لوحة Firebase.");
        }
    }
}

// Add stock data to the table
function addStockToTable(stockId, stock) {
    const row = document.createElement("tr");

    let formattedDate = "N/A";
    if (stock.dateAchat && stock.dateAchat.seconds) {
        const date = new Date(stock.dateAchat.seconds * 1000);
        formattedDate = date.toLocaleDateString("fr-FR");
    }

    row.innerHTML = `
        <td>${stock.nomProduit}</td>
        <td>${stock.imei}</td>
        <td>${stock.configuration}</td>
        <td>${stock.prixDachat} DH</td>
        <td>${formattedDate}</td>
        <td>${stock.nomVendeur}</td>
        <td>${stock.cinVendeur}</td>
        <td>${stock.numeroTelephoneVendeur}</td>
        <td>${stock.vendu ? "Vendu" : "Non Vendu"}</td>
        <td>
            <button class="edit-button" data-id="${stockId}">Modifier</button>
            <button class="delete-button" data-id="${stockId}">Supprimer</button>
            <button class="status-button" data-id="${stockId}" data-status="${stock.vendu}">
                ${stock.vendu ? "Marquer Non Vendu" : "Marquer Vendu"}
            </button>
        </td>
    `;
    stockList.appendChild(row);

    const editButton = row.querySelector(".edit-button");
    const deleteButton = row.querySelector(".delete-button");
    const statusButton = row.querySelector(".status-button");

    editButton.addEventListener("click", () => editStock(stockId));
    deleteButton.addEventListener("click", () => deleteStock(stockId));
    statusButton.addEventListener("click", () =>
        toggleStockStatus(stockId, statusButton.dataset.status === "true")
    );
}

// Edit stock
async function editStock(stockId) {
    try {
        const userId = auth.currentUser.uid;
        const stockRef = doc(db, `users/${userId}/stock`, stockId);

        // Fetch existing data
        const stockSnapshot = await getDoc(stockRef);
        if (!stockSnapshot.exists()) {
            alert("Produit introuvable!");
            return;
        }

        const stockData = stockSnapshot.data();

        // Prompt the user to update each field
        const newNomProduit = prompt("Modifier le nom du produit:", stockData.nomProduit);
        const newImei = prompt("Modifier l'IMEI:", stockData.imei);
        const newConfiguration = prompt("Modifier la configuration:", stockData.configuration);
        const newPrixDachat = prompt("Modifier le prix d'achat:", stockData.prixDachat);
        const newNomVendeur = prompt("Modifier le nom du vendeur:", stockData.nomVendeur);
        const newCinVendeur = prompt("Modifier la CIN du vendeur:", stockData.cinVendeur);
        const newNumeroTelephoneVendeur = prompt(
            "Modifier le numéro de téléphone du vendeur:",
            stockData.numeroTelephoneVendeur
        );

        // Check if at least one field is updated
        if (
            !newNomProduit &&
            !newImei &&
            !newConfiguration &&
            !newPrixDachat &&
            !newNomVendeur &&
            !newCinVendeur &&
            !newNumeroTelephoneVendeur
        ) {
            alert("Aucune modification n'a été effectuée!");
            return;
        }

        // Update Firestore
        await updateDoc(stockRef, {
            nomProduit: newNomProduit || stockData.nomProduit,
            imei: newImei || stockData.imei,
            configuration: newConfiguration || stockData.configuration,
            prixDachat: newPrixDachat || stockData.prixDachat,
            nomVendeur: newNomVendeur || stockData.nomVendeur,
            cinVendeur: newCinVendeur || stockData.cinVendeur,
            numeroTelephoneVendeur: newNumeroTelephoneVendeur || stockData.numeroTelephoneVendeur,
        });

        alert("Produit modifié avec succès!");
        loadStock("all"); // Reload the table
    } catch (error) {
        console.error("Erreur lors de la modification :", error.message);
    }
}

// Other functions for delete and status change remain unchanged...

// حذف منتج
async function deleteStock(stockId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit?")) {
        try {
            const userId = auth.currentUser.uid;
            const stockRef = doc(db, `users/${userId}/stock`, stockId);
            await deleteDoc(stockRef);
            alert("Produit supprimé avec succès!");
            loadStock("all");
        } catch (error) {
            console.error("Erreur lors de la suppression :", error.message);
        }
    }
}

// تغيير الحالة (Vendu/Non Vendu)
async function toggleStockStatus(stockId, currentStatus) {
    try {
        const userId = auth.currentUser.uid;
        const stockRef = doc(db, `users/${userId}/stock`, stockId);
        await updateDoc(stockRef, { vendu: !currentStatus });
        alert(`Statut changé avec succès إلى ${!currentStatus ? "Vendu" : "Non Vendu"}!`);
        loadStock("all");
    } catch (error) {
        console.error("Erreur lors du changement de statut :", error.message);
    }
}

// إضافة مستمعين للنقر على التبويبات
tabs.all.addEventListener("click", () => {
    setActiveTab(tabs.all);
    loadStock("all");
});
tabs.sold.addEventListener("click", () => {
    setActiveTab(tabs.sold);
    loadStock("sold");
});
tabs.unsold.addEventListener("click", () => {
    setActiveTab(tabs.unsold);
    loadStock("unsold");
});

// Add event listener to search bar
searchBar.addEventListener("input", () => {
    const searchTerm = searchBar.value.toLowerCase().replace(/\s+/g, ""); // Remove spaces from input
    const rows = chequeList.querySelectorAll("tr");

    rows.forEach((row) => {
        const rowText = row.textContent.toLowerCase().replace(/\s+/g, ""); // Remove spaces from row text
        row.style.display = rowText.includes(searchTerm) ? "" : "none";
    });
});

// الانتقال إلى صفحة "stock-entry"
document.getElementById("add-stock-button").addEventListener("click", () => {
    window.location.href = "stock-entry.html";
});