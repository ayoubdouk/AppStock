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

async function loadCredits(collectionName) {
    try {
        const userId = auth.currentUser.uid;
        const creditsRef = collection(db, `users/${userId}/${collectionName}`);
        const snapshot = await getDocs(query(creditsRef, orderBy("date", "desc")));

        const credits = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            credits.push({
                id: doc.id,
                name: data.name || "Nom non disponible", // تعديل: استخدام الحقل الصحيح
                description: data.description || "-",
                amount: data.amount !== undefined ? data.amount : "-", // تعديل: استخدام الحقل الصحيح
                date: data.date?.toDate ? data.date.toDate() : "Date non valide", // معالجة التاريخ
            });
        });

        renderCredits(credits); // عرض البيانات في الجدول
    } catch (error) {
        console.error("Error loading credits:", error.message);
        alert(`Erreur: ${error.message}`);
    }
}

function renderCredits(credits) {
    creditList.innerHTML = ""; // تفريغ الجدول

    if (credits.length === 0) {
        creditList.innerHTML = "<tr><td colspan='5'>Aucun crédit trouvé.</td></tr>";
        return;
    }

    credits.forEach((credit) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${credit.name}</td> <!-- تعديل: استخدام الحقل الصحيح -->
            <td>${credit.description}</td>
            <td>${credit.amount !== "Montant non disponible" ? `${credit.amount} DH` : credit.amount}</td>
            <td>${credit.date instanceof Date ? credit.date.toLocaleDateString() : credit.date}</td>
            <td>
                <button class="modify-button" data-id="${credit.id}">Modifier</button>
                <button class="delete-button" data-id="${credit.id}">Supprimer</button>
            </td>
        `;
        creditList.appendChild(row);
    });

    attachActionListeners(); // إرفاق الأحداث بالأزرار
}

// Attach event listeners for modify and delete buttons
function attachActionListeners() {
    document.querySelectorAll(".modify-button").forEach((button) => {
        button.addEventListener("click", () => modifyCredit(button.dataset.id));
    });

    document.querySelectorAll(".delete-button").forEach((button) => {
        button.addEventListener("click", () => deleteCredit(button.dataset.id));
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

// Switch collection type
creditAObtenirButton.addEventListener("click", () => {
    currentType = "creditAObtenir";
    updateButtonStates();
    loadCredits(currentType);
});

creditARembourserButton.addEventListener("click", () => {
    currentType = "creditARembourser";
    updateButtonStates();
    loadCredits(currentType);
});

// Update active button states
function updateButtonStates() {
    creditAObtenirButton.classList.toggle("active", currentType === "creditAObtenir");
    creditARembourserButton.classList.toggle("active", currentType === "creditARembourser");
}