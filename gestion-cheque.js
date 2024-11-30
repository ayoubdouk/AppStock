import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs
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
const chequeList = document.getElementById("cheque-list");
const datePicker = document.getElementById("date-picker");
const toggleButton = document.getElementById("toggle-button");
const emisButton = document.getElementById("emis-button");
const remisButton = document.getElementById("remis-button");
const searchBar = document.getElementById("search-bar");
const totalsContainer = document.getElementById("totals-container");

let currentCollection = null; // Default collection is null (no selection yet)
let showAllCheques = true; // Toggle state

// عند تسجيل الدخول
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        setDefaultDate(); // تعيين تاريخ اليوم في datePicker
        chequeList.innerHTML = "<tr><td colspan='5'>اختر نوع الشيك لعرض القائمة.</td></tr>";
        updateTotals(0, 0); // Reset totals on initial load
    }
});

// تعيين تاريخ اليوم في date picker عند تحميل الصفحة
function setDefaultDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    datePicker.value = formattedDate;
}

// تحديث الإحصائيات في نهاية الصفحة
function updateTotals(totalCheques, totalUnpaidAmount) {
    totalsContainer.innerHTML = `
        <p>Le nombre des chèques non payé : ${totalCheques}</p>
        <p>Le montant total non payé : ${totalUnpaidAmount.toFixed(2)} DH</p>
    `;
}

// تحميل جميع الشيكات
async function loadAllCheques() {
    if (!currentCollection) {
        chequeList.innerHTML = "<tr><td colspan='5'>يرجى اختيار الشيكات الصادرة أو المستلمة أولاً.</td></tr>";
        updateTotals(0, 0);
        return;
    }

    chequeList.innerHTML = ""; // تفريغ القائمة
    let totalCheques = 0; // إجمالي عدد الشيكات
    let totalUnpaidAmount = 0; // إجمالي المبلغ غير المدفوع

    try {
        const userId = auth.currentUser.uid;
        const chequesRef = collection(db, `users/${userId}/${currentCollection}`);
        const snapshot = await getDocs(chequesRef);

        if (snapshot.empty) {
            chequeList.innerHTML = "<tr><td colspan='5'>لا توجد شيكات.</td></tr>";
            updateTotals(0, 0);
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            addChequeToTable(data);

            if (!data.paye) {
                totalCheques++;
                totalUnpaidAmount += parseFloat(data.montantCheque) || 0;
            }
        });

        updateTotals(totalCheques, totalUnpaidAmount);
    } catch (error) {
        console.error("خطأ أثناء تحميل الشيكات:", error.message);
    }
}

// تحميل الشيكات حسب التاريخ المحدد
async function loadChequesByDate() {
    if (!currentCollection) {
        chequeList.innerHTML = "<tr><td colspan='5'>يرجى اختيار الشيكات الصادرة أو المستلمة أولاً.</td></tr>";
        updateTotals(0, 0);
        return;
    }

    chequeList.innerHTML = ""; // تفريغ القائمة
    let totalCheques = 0; // إجمالي عدد الشيكات
    let totalUnpaidAmount = 0; // إجمالي المبلغ غير المدفوع

    const selectedDate = new Date(datePicker.value);
    selectedDate.setHours(0, 0, 0, 0); // بداية اليوم
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1); // نهاية اليوم

    try {
        const userId = auth.currentUser.uid;
        const chequesRef = collection(db, `users/${userId}/${currentCollection}`);
        const q = query(
            chequesRef,
            where("dateCheque", ">=", selectedDate),
            where("dateCheque", "<", nextDate)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            chequeList.innerHTML = "<tr><td colspan='5'>لا توجد شيكات لهذا التاريخ.</td></tr>";
            updateTotals(0, 0);
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            addChequeToTable(data);

            if (!data.paye) {
                totalCheques++;
                totalUnpaidAmount += parseFloat(data.montantCheque) || 0;
            }
        });

        updateTotals(totalCheques, totalUnpaidAmount);
    } catch (error) {
        console.error("خطأ أثناء تحميل الشيكات حسب التاريخ:", error.message);
    }
}

// إضافة شيك إلى الجدول
function addChequeToTable(cheque) {
    const row = document.createElement("tr");

    let formattedDate = "N/A";
    if (cheque.dateCheque && cheque.dateCheque.seconds) {
        const date = new Date(cheque.dateCheque.seconds * 1000);
        formattedDate = date.toLocaleDateString("fr-FR");
    }

    row.innerHTML = `
        <td>${cheque.numeroCheque || "N/A"}</td>
        <td>${cheque.tireurCheque || cheque.titulaireCheque || "N/A"}</td>
        <td>${cheque.montantCheque || 0} DH</td>
        <td>${formattedDate}</td>
        <td>${cheque.paye ? "Payé" : "Non payé"}</td>
    `;
    chequeList.appendChild(row);
}

// تبديل بين عرض الشيكات الكاملة أو حسب التاريخ
toggleButton.addEventListener("click", () => {
    if (showAllCheques) {
        toggleButton.textContent = "Afficher tous les chèques"; // تغيير النص
        loadChequesByDate();
    } else {
        toggleButton.textContent = "Afficher par date";
        loadAllCheques();
    }
    showAllCheques = !showAllCheques; // تبديل الحالة
});

// عند النقر على زر الشيكات الصادرة
emisButton.addEventListener("click", () => {
    currentCollection = "chequesEmis";
    emisButton.classList.add("active"); // إضافة مؤشر على الزر
    remisButton.classList.remove("active"); // إزالة المؤشر من الزر الآخر
    loadAllCheques();
});

// عند النقر على زر الشيكات المستلمة
remisButton.addEventListener("click", () => {
    currentCollection = "chequesRemis";
    remisButton.classList.add("active"); // إضافة مؤشر على الزر
    emisButton.classList.remove("active"); // إزالة المؤشر من الزر الآخر
    loadAllCheques();
});

// البحث في القائمة
searchBar.addEventListener("input", () => {
    const searchTerm = searchBar.value.toLowerCase();
    const rows = chequeList.querySelectorAll("tr");

    rows.forEach((row) => {
        const rowText = row.textContent.toLowerCase();
        row.style.display = rowText.includes(searchTerm) ? "" : "none";
    });
});