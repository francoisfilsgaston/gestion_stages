// ========================================
// CONFIGURATION
// ========================================

const API_URL = "http://localhost:8000/api";


// ========================================
// RÉCUPÉRER LE TOKEN
// ========================================

const token = localStorage.getItem("token");


// ========================================
// PROTECTION DU DASHBOARD
// ========================================

if (!token) {

    window.location.href = "../index.html";

}


// ========================================
// RÉCUPÉRER L'UTILISATEUR
// ========================================

let user = null;

try {

    user = JSON.parse(
        localStorage.getItem("user")
    );

} catch (error) {

    user = null;

}


// Vérifier le rôle

if (
    !user ||
    user.role !== "admin"
) {

    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("user");

    window.location.href = "../index.html";

}


// ========================================
// AFFICHER EMAIL ADMIN
// ========================================

const adminEmail =
    document.getElementById("adminEmail");

if (adminEmail && user) {

    adminEmail.textContent =
        user.email || "Administrateur";

}


// ========================================
// ÉLÉMENTS STATISTIQUES
// ========================================

const totalEntreprises =
    document.getElementById("totalEntreprises");

const totalEncadreurs =
    document.getElementById("totalEncadreurs");

const totalStages =
    document.getElementById("totalStages");

const totalEvaluations =
    document.getElementById("totalEvaluations");


// ========================================
// REQUÊTE API
// ========================================

async function chargerDonnees(
    endpoint
) {

    const response = await fetch(
        `${API_URL}/${endpoint}`,
        {
            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );


    // Token invalide/expiré

    if (response.status === 401) {

        localStorage.removeItem("token");
        localStorage.removeItem("expiration");
        localStorage.removeItem("user");

        window.location.href =
            "../index.html";

        return null;
    }


    const result =
        await response.json();


    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(
            result.message ||
            "Erreur lors du chargement"
        );

    }


    return result.data || [];

}


// ========================================
// CHARGER LES STATISTIQUES
// ========================================

async function chargerStatistiques() {

    try {

        // Afficher un état de chargement

        totalEntreprises.textContent = "…";
        totalEncadreurs.textContent = "…";
        totalStages.textContent = "…";
        totalEvaluations.textContent = "…";


        // ==================================
        // ENTREPRISES
        // ==================================

        const entreprises =
            await chargerDonnees(
                "entreprises/liste.php"
            );


        // ==================================
        // ENCADREURS
        // ==================================

        const encadreurs =
            await chargerDonnees(
                "encadreurs/liste.php"
            );


        // ==================================
        // STAGES
        // ==================================

        const stages =
            await chargerDonnees(
                "stages/liste.php"
            );


        // ==================================
        // ÉVALUATIONS
        // ==================================

        const evaluations =
            await chargerDonnees(
                "evaluations/liste.php"
            );


        // ==================================
        // AFFICHER
        // ==================================

        totalEntreprises.textContent =
            entreprises.length;

        totalEncadreurs.textContent =
            encadreurs.length;

        totalStages.textContent =
            stages.length;

        totalEvaluations.textContent =
            evaluations.length;


    } catch (error) {

        console.error(
            "Erreur statistiques :",
            error
        );


        totalEntreprises.textContent = "—";
        totalEncadreurs.textContent = "—";
        totalStages.textContent = "—";
        totalEvaluations.textContent = "—";
    }

}


// ========================================
// ACTUALISER
// ========================================

const refreshButton =
    document.getElementById(
        "refreshButton"
    );


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            const icon =
                refreshButton.querySelector("i");

            icon.classList.add(
                "fa-spin"
            );

            refreshButton.disabled = true;


            await chargerStatistiques();


            icon.classList.remove(
                "fa-spin"
            );

            refreshButton.disabled = false;

        }
    );

}


// ========================================
// MENU MOBILE
// ========================================

const menuButton =
    document.getElementById(
        "menuButton"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );


if (
    menuButton &&
    sidebar
) {

    menuButton.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


// ========================================
// DÉCONNEXION
// ========================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            const confirmation =
                confirm(
                    "Voulez-vous vraiment vous déconnecter ?"
                );


            if (!confirmation) {
                return;
            }


            // Supprimer les données

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "expiration"
            );

            localStorage.removeItem(
                "user"
            );


            // Retour connexion

            window.location.href =
                "../index.html";

        }
    );

}


// ========================================
// CHARGEMENT INITIAL
// ========================================

chargerStatistiques();