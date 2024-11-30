// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

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

// Ensure the page is loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
    // Check if the user is authenticated
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Redirect to login page if not authenticated
            window.location.href = "index.html";
        }
    });

    const menuButton = document.getElementById("menu-button");
const slideMenu = document.getElementById("slide-menu");

// Toggle sliding menu
menuButton.addEventListener("click", () => {
    slideMenu.classList.toggle("active");
});

// Close menu when clicking outside (optional)
document.addEventListener("click", (event) => {
    if (!slideMenu.contains(event.target) && !menuButton.contains(event.target)) {
        slideMenu.classList.remove("active");
    }
});

    // Logout button logic
    const logoutButton = document.getElementById("logout-button");

    logoutButton.addEventListener("click", () => {
        signOut(auth)
            .then(() => {
                alert("Déconnecté avec succès!");
                window.location.href = "index.html"; // Redirect to login page
            })
            .catch((error) => {
                console.error("Erreur lors de la déconnexion :", error.message);
                alert("Erreur : " + error.message);
            });
    });
});


document.getElementById("sales-button").addEventListener("click", () => {
    window.location.href = "sales.html"; // Replace with your desired page URL
});

document.getElementById("stock-button").addEventListener("click", () => {
    window.location.href = "gestion-stock.html"; // Replace with your desired page URL
});

document.getElementById("cheque-button").addEventListener("click", () => {
    window.location.href = "gestion-cheque.html"; // Replace with your desired page URL
});

document.getElementById("yourButtonId").addEventListener("click", () => {
    window.location.href = "your-target-page.html"; // Replace with your desired page URL
});

document.getElementById("yourButtonId").addEventListener("click", () => {
    window.location.href = "your-target-page.html"; // Replace with your desired page URL
});


