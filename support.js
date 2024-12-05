

// Handle form submission
document.getElementById('contactForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Gather form data
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // Send email using EmailJS
    emailjs.send('service_0zuq60m', 'template_iwr0qmb', {
        email: email,
        message: message
    }).then(function (response) {
        alert('تم إرسال الرسالة بنجاح!');
    }, function (error) {
        alert('حدث خطأ أثناء الإرسال: ' + error.text);
    });
});