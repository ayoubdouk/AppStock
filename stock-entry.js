import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

// Set the date picker to today's date
document.addEventListener("DOMContentLoaded", () => {
    const purchaseDateInput = document.getElementById("purchase-date");
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    purchaseDateInput.value = formattedDate;
});



// Elements
const productForm = document.getElementById("product-form");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");

// Check authentication
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    }
});

// Save product
saveButton.addEventListener("click", async () => {
    if (!confirm("Êtes-vous sûr de vouloir enregistrer ce produit?")) {
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("Utilisateur non authentifié !");
        return;
    }

    try {
        const productData = {
            nomProduit: document.getElementById("product-name").value,
            imei: document.getElementById("imei").value,
            configuration: document.getElementById("configuration").value,
            prixDachat: parseFloat(document.getElementById("purchase-price").value) || 0,
            dateAchat: new Date(document.getElementById("purchase-date").value),
            nomVendeur: document.getElementById("seller-name").value,
            cinVendeur: document.getElementById("seller-cin").value,
            numeroTelephoneVendeur: document.getElementById("seller-phone").value,
            vendu: false, // Default value for new product
            timestamp: serverTimestamp(), // Auto-generated timestamp
        };

        // Save to Firestore
        const userId = user.uid;
        const stockRef = collection(db, `users/${userId}/stock`);
        await addDoc(stockRef, productData);

        alert("Produit ajouté avec succès !");
        window.location.href = "gestion-stock.html"; // Redirect to stock management page
    } catch (error) {
        console.error("Erreur lors de l'enregistrement :", error.message);
        alert("Erreur : " + error.message);
    }
});

// Cancel button
cancelButton.addEventListener("click", () => {
    if (confirm("Êtes-vous sûr de vouloir annuler? Toutes les modifications seront perdues.")) {
        window.location.href = "gestion-stock.html"; // Redirect to stock management page
    }
});