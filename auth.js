// Import the Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCpioRg0cXjDFRjxK51Asyq8mEeCxx2088",
    authDomain: "appstock-b663d.firebaseapp.com",
    projectId: "appstock-b663d",
    storageBucket: "appstock-b663d.appspot.com",
    messagingSenderId: "953054905514",
    appId: "1:953054905514:web:1546782e3b183db77ffcd3",
    measurementId: "G-ZWJJJZR0CJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle login form submission
// Handle login form submission
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault(); // منع إعادة تحميل الصفحة

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        // محاولة تسجيل الدخول
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // التحقق إذا كان البريد الإلكتروني غير مفعل
        if (!user.emailVerified) {
            alert("Votre email n'est pas encore vérifié. Veuillez vérifier votre boîte mail.");
            return; // إيقاف العملية هنا
        }

        // إذا كانت بيانات تسجيل الدخول صحيحة وكان البريد مفعل، الانتقال إلى صفحة الترحيب
        window.location.href = "welcome.html";
    } catch (error) {
        // عرض رسالة خطأ بناءً على نوع الخطأ
        if (error.code === "auth/wrong-password") {
            alert("Mot de passe incorrect. Veuillez réessayer !");
        } else if (error.code === "auth/user-not-found") {
            alert("Utilisateur introuvable. Vérifiez votre email ou créez un compte !");
        } else {
            alert(`Une erreur est survenue : ${error.message}`);
        }
    }
});

// Handle "forgot password" click
document.getElementById("forgot-password-link").addEventListener("click", async (e) => {
    e.preventDefault(); // منع الانتقال إلى رابط آخر

    const email = document.getElementById("email").value;

    // تحقق إذا كان الحقل فارغًا
    if (!email) {
        alert("Veuillez remplir le champ email pour réinitialiser le mot de passe.");
        return;
    }

    try {
        // إرسال رابط إعادة تعيين كلمة المرور
        await sendPasswordResetEmail(auth, email);
        alert(`Un email de réinitialisation a été envoyé à ${email}.`);
    } catch (error) {
        console.error("Erreur lors de la réinitialisation du mot de passe :", error);
        alert("Une erreur s'est produite lors de la réinitialisation. Vérifiez votre email.");
    }
});