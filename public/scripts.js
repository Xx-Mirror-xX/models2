document.addEventListener('DOMContentLoaded', function() {

    const signUpButton = document.getElementById('SignUpButton');
    const signInButton = document.getElementById('SignInButton');
    const signInForm = document.getElementById('SignIn');
    const signUpForm = document.getElementById('SignUp');

    if (signUpButton && signInButton) {
        signUpButton.addEventListener('click', function(e) {
            e.preventDefault();
            signInForm.style.display = "none";
            signUpForm.style.display = "block";
        });

        signInButton.addEventListener('click', function(e) {
            e.preventDefault();
            signUpForm.style.display = "none";
            signInForm.style.display = "block";
        });
    }


    const contactForm = document.getElementById('contactFormData');
    const showContactBtn = document.getElementById('showContactForm');
    const contactFormContainer = document.getElementById('contactForm');

    if (showContactBtn && contactFormContainer) {
        showContactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            contactFormContainer.style.display = 
                contactFormContainer.style.display === 'none' ? 'block' : 'none';

            const paymentForm = document.getElementById('paymentForm');
            if (paymentForm) paymentForm.style.display = 'none';
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            

            const requiredFields = ['firstName', 'lastName', 'email', 'message'];
            let isValid = true;
            
            requiredFields.forEach(field => {
                const input = this.elements[field];
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderBottom = '2px solid red';
                } else {
                    input.style.borderBottom = '';
                }
            });
            
            if (!isValid) {
                alert('Por favor complete todos los campos requeridos');
                return;
            }

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({
                        firstName: this.firstName.value.trim(),
                        lastName: this.lastName.value.trim(),
                        email: this.email.value.trim(),
                        message: this.message.value.trim()
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message || 'Mensaje enviado con éxito');
                    this.reset();
                    if (contactFormContainer) {
                        contactFormContainer.style.display = 'none';
                    }
                } else {
                    alert(result.error || 'Error al enviar el mensaje');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión con el servidor');
            }
        });
    }

    const paymentForm = document.getElementById('paymentFormData');
    const showPaymentBtn = document.getElementById('showPaymentForm');
    const paymentFormContainer = document.getElementById('paymentForm');

    if (showPaymentBtn && paymentFormContainer) {
        showPaymentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            paymentFormContainer.style.display = 
                paymentFormContainer.style.display === 'none' ? 'block' : 'none';

            if (contactFormContainer) contactFormContainer.style.display = 'none';
        });
    }

    if (paymentForm) {
        paymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            

            const requiredFields = ['email', 'cardName', 'cardNumber', 
                                  'expiryMonth', 'expiryYear', 'cvv', 
                                  'amount', 'currency'];
            let isValid = true;
            
            requiredFields.forEach(field => {
                const input = this.elements[field];
                if (!input.value.trim()) {
                    isValid = false;
                    if (input.style) input.style.borderBottom = '2px solid red';
                } else {
                    if (input.style) input.style.borderBottom = '';
                }
            });
            
            if (!isValid) {
                alert('Por favor complete todos los campos requeridos');
                return;
            }

            try {
                const response = await fetch('/api/payment', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({
                        email: this.email.value.trim(),
                        cardName: this.cardName.value.trim(),
                        cardNumber: this.cardNumber.value.trim(),
                        expiryMonth: this.expiryMonth.value,
                        expiryYear: this.expiryYear.value,
                        cvv: this.cvv.value.trim(),
                        amount: this.amount.value.trim(),
                        currency: this.currency.value
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message || 'Pago procesado con éxito');
                    this.reset();
                    if (paymentFormContainer) {
                        paymentFormContainer.style.display = 'none';
                    }

                } else {
                    alert(result.error || 'Error al procesar el pago');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión con el servidor');
            }
        });
    }
});
const loginForm = document.getElementById('SignIn')?.querySelector('form');

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = this.email.value;
        const password = this.password.value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (response.ok) {

                window.location.href = result.redirect || '/admin/contacts.html';
            } else {
                alert(result.error || 'Error en el login');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión con el servidor');
        }
    });
}