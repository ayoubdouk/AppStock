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

// Elements
const addChequeForm = document.getElementById("add-cheque-form");
const cancelButton = document.getElementById("cancel-button");
const datePicker = document.getElementById("date-cheque");

// Set default date to today's date
function setDefaultDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // Format to YYYY-MM-DD
    datePicker.value = formattedDate; // Set the date picker value
}

// Authentication check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html"; // Redirect to login page if not logged in
    } else {
        setDefaultDate(); // Set the default date on page load
    }
});

// Add cheque
addChequeForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent form submission

    const numeroCheque = document.getElementById("numero-cheque").value;
    const tireurTitulaire = document.getElementById("tireur-titulaire").value;
    const montantCheque = parseFloat(document.getElementById("montant-cheque").value);
    const dateCheque = new Date(document.getElementById("date-cheque").value);
    const typeCheque = document.getElementById("type-cheque").value;

    if (!typeCheque) {
        alert("Veuillez sélectionner un type de chèque !");
        return;
    }

    // Show confirmation dialog
    const isConfirmed = confirm(`Confirmez-vous l'ajout de ce chèque ? 
    \nNuméro: ${numeroCheque} 
    \nMontant: ${montantCheque} DH 
    \nTireur/Titulaire: ${tireurTitulaire} 
    \nType: ${typeCheque === "chequesEmis" ? "Chèque Émis" : "Chèque Remis"}
    \nDate: ${dateCheque.toLocaleDateString("fr-FR")}`);
    
    if (!isConfirmed) {
        return; // Exit if the user cancels
    }

    try {
        const userId = auth.currentUser.uid;
        const chequesRef = collection(db, `users/${userId}/${typeCheque}`);
        await addDoc(chequesRef, {
            numeroCheque,
            tireurCheque: tireurTitulaire,
            montantCheque,
            dateCheque,
            paye: false, // Default to unpaid
            timestamp: serverTimestamp(), // Add timestamp for ordering
        });

        alert("Chèque ajouté avec succès !");
        addChequeForm.reset(); // Reset the form
        setDefaultDate(); // Reset the date picker to today
    } catch (error) {
        console.error("Erreur lors de l'ajout du chèque :", error.message);
        alert("Une erreur s'est produite lors de l'ajout.");
    }
});

// Cancel button
cancelButton.addEventListener("click", () => {
    if (confirm("Êtes-vous sûr de vouloir annuler ? Toutes les modifications seront perdues.")) {
        window.location.href = "gestion-cheque.html"; // Redirect to cheque management page
    }
});