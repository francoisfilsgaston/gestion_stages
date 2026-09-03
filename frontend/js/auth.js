// ========================================
// CONFIGURATION API
// ========================================

const API_URL = "http://localhost:8001/api";


// ========================================
// RÉCUPÉRATION DES ÉLÉMENTS
// ========================================

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

const togglePassword = document.getElementById("togglePassword");


// ========================================
// AFFICHER / MASQUER LE MOT DE PASSE
// ========================================

togglePassword.addEventListener("click", () => {

    const icon = togglePassword.querySelector("i");

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");

    } else {

        passwordInput.type = "password";

        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
});


// ========================================
// AFFICHER UN MESSAGE
// ========================================

function afficherMessage(texte, type) {

    message.textContent = texte;

    message.className = "message show " + type;
}


// ========================================
// MASQUER LE MESSAGE
// ========================================

function masquerMessage() {

    message.textContent = "";

    message.className = "message";
}


// ========================================
// ÉTAT CHARGEMENT DU BOUTON
// ========================================

function activerChargement() {

    loginButton.disabled = true;

    loginButton.classList.add("loading");
}


function desactiverChargement() {

    loginButton.disabled = false;

    loginButton.classList.remove("loading");
}


// ========================================
// CONNEXION
// ========================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    masquerMessage();

    const email = emailInput.value.trim();
    const password = passwordInput.value;


    // ====================================
    // VALIDATION
    // ====================================

    if (!email || !password) {

        afficherMessage(
            "Veuillez remplir tous les champs.",
            "error"
        );

        return;
    }


    // ====================================
    // CHARGEMENT
    // ====================================

    activerChargement();


    try {

        // ==================================
        // ENVOYER LA REQUÊTE
        // ==================================

        const response = await fetch(
            `${API_URL}/auth/login.php`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        // ==================================
        // RÉCUPÉRER LA RÉPONSE
        // ==================================

        const result = await response.json();


        console.log("Réponse serveur :", result);


        // ==================================
        // VÉRIFIER LA RÉPONSE
        // ==================================

        if (!response.ok || !result.success) {

            afficherMessage(
                result.message ||
                "Email ou mot de passe incorrect.",
                "error"
            );

            desactiverChargement();

            return;
        }


        // ==================================
        // VÉRIFIER LE TOKEN
        // ==================================

        if (!result.token) {

            afficherMessage(
                "Le serveur n'a pas retourné de token.",
                "error"
            );

            desactiverChargement();

            return;
        }


        // ==================================
        // ENREGISTRER LE TOKEN
        // ==================================

        localStorage.setItem(
            "token",
            result.token
        );


        // ==================================
        // ENREGISTRER L'EXPIRATION
        // ==================================

        if (result.expiration) {

            localStorage.setItem(
                "expiration",
                result.expiration
            );
        }


        // ==================================
        // ENREGISTRER L'UTILISATEUR
        // ==================================

        if (result.user) {

            localStorage.setItem(
                "user",
                JSON.stringify(result.user)
            );
        }


        // ==================================
        // MESSAGE DE SUCCÈS
        // ==================================

        afficherMessage(
            "Connexion réussie. Redirection...",
            "success"
        );


        // ==================================
        // REDIRECTION
        // ==================================

        setTimeout(() => {

            window.location.href = "pages/dashboard.html";

        }, 700);


    } catch (error) {

        console.error(
            "Erreur de connexion :",
            error
        );

        afficherMessage(
            "Impossible de contacter le serveur.",
            "error"
        );

        desactiverChargement();
    }

});