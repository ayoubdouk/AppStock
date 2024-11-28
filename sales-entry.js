import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

// Form and button elements
const saleForm = document.getElementById("sale-form");
const cancelButton = document.getElementById("cancel-button");

// Redirect if not authenticated
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    }
});

// Save sale data to Firestore
saleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get user ID
    const user = auth.currentUser;
    if (!user) {
        alert("Utilisateur non authentifié.");
        return;
    }
    const userId = user.uid;

    // Get form values
    const productName = document.getElementById("product-name").value;
    const purchasePrice = document.getElementById("purchase-price").value;
    const sellingPrice = document.getElementById("selling-price").value;
    const clientName = document.getElementById("client-name").value || "Inconnu";
    const saleDate = document.getElementById("sale-date").value;

    // Validate input
    if (!productName || !purchasePrice || !sellingPrice || !saleDate) {
        alert("Veuillez remplir tous les champs obligatoires !");
        return;
    }

    // Prepare data
    const saleData = {
        productName,
        purchasePrice,
        sellingPrice,
        clientName,
        timestamp: new Date(saleDate),
    };

    // Save to Firestore
    try {
        const docRef = await addDoc(collection(db, `users/${userId}/products`), saleData);
        alert("Vente ajoutée avec succès !");
        window.location.href = "sales.html"; // Redirect to sales page
    } catch (error) {
        console.error("Erreur lors de l'ajout de la vente :", error.message);
        alert("Erreur : " + error.message);
    }
});

// Handle cancel button click
cancelButton.addEventListener("click", () => {
    window.location.href = "sales.html"; // Redirect to sales page
});
// إعداد التاريخ الحالي عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    const datePicker = document.getElementById("sale-date");
    const today = new Date(); // الحصول على التاريخ الحالي
    const formattedDate = today.toISOString().slice(0, 10); // تنسيق التاريخ إلى YYYY-MM-DD
    datePicker.value = formattedDate; // تعيين القيمة الافتراضية
});