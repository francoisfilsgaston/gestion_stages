// ======================================================
// CONFIGURATION
// ======================================================

const API_URL = "http://localhost:8001/api";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");


// ======================================================
// VERIFICATION AUTHENTIFICATION
// ======================================================

if (!token || !user || user.role !== "admin") {
    window.location.href = "../index.html";
}


// ======================================================
// ELEMENTS DOM
// ======================================================

const tableBody = document.getElementById("encadreursTableBody");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");

const totalEncadreurs = document.getElementById("totalEncadreurs");

const formModal = document.getElementById("formModal");
const deleteModal = document.getElementById("deleteModal");

const openAddModal = document.getElementById("openAddModal");
const closeFormModal = document.getElementById("closeFormModal");
const cancelForm = document.getElementById("cancelForm");

const encadreurForm = document.getElementById("encadreurForm");

const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");

const encadreurId = document.getElementById("encadreurId");

const nomInput = document.getElementById("nom");
const prenomInput = document.getElementById("prenom");
const telephoneInput = document.getElementById("telephone");
const emailInput = document.getElementById("email");
const fonctionInput = document.getElementById("fonction");

const saveBtn = document.getElementById("saveBtn");

const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

const logoutBtn = document.getElementById("logoutBtn");

const adminEmail = document.getElementById("adminEmail");

const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");
const closeToast = document.getElementById("closeToast");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");


// ======================================================
// VARIABLES
// ======================================================

let encadreurs = [];

let encadreurToDelete = null;

let toastTimeout;


// ======================================================
// AFFICHAGE ADMIN
// ======================================================

if (user && user.email) {
    adminEmail.textContent = user.email;
}


// ======================================================
// CHARGER LES ENCADREURS
// ======================================================

async function chargerEncadreurs() {

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="loading-row">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Chargement des encadreurs...
            </td>
        </tr>
    `;

    emptyState.classList.remove("show");

    try {

        const response = await fetch(
            `${API_URL}/encadreurs/liste.php`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message || "Impossible de charger les encadreurs."
            );
        }

        encadreurs = Array.isArray(data.data)
            ? data.data
            : [];

        afficherEncadreurs(encadreurs);

    } catch (error) {

        console.error("❌ Erreur encadreurs :", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-row">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

        totalEncadreurs.textContent = "0";
    }
}


// ======================================================
// AFFICHER ENCADREURS
// ======================================================

function afficherEncadreurs(liste) {

    totalEncadreurs.textContent = liste.length;

    if (liste.length === 0) {

        tableBody.innerHTML = "";

        emptyState.classList.add("show");

        return;
    }

    emptyState.classList.remove("show");

    tableBody.innerHTML = liste.map(encadreur => {

        const nom = encadreur.nom || "";
        const prenom = encadreur.prenom || "";

        const initiales = obtenirInitiales(
            prenom,
            nom
        );

        const telephone = encadreur.telephone || "";
        const email = encadreur.email || "";

        const fonction = encadreur.fonction || "Non définie";

        const dateCreation = formatDate(
            encadreur.date_creation
        );

        return `
            <tr>

                <!-- ENCADREUR -->
                <td>

                    <div class="person-cell">

                        <div class="person-avatar">
                            ${escapeHTML(initiales)}
                        </div>

                        <div class="person-info">

                            <span class="person-name">
                                ${escapeHTML(prenom)} ${escapeHTML(nom)}
                            </span>

                            <span class="person-id">
                                ID #${escapeHTML(String(encadreur.id))}
                            </span>

                        </div>

                    </div>

                </td>


                <!-- CONTACT -->
                <td>

                    <div class="contact-cell">

                        ${telephone
                ? `
                                    <span class="contact-item">
                                        <i class="fa-solid fa-phone"></i>
                                        ${escapeHTML(telephone)}
                                    </span>
                                `
                : ""
            }

                        ${email
                ? `
                                    <span class="contact-item">
                                        <i class="fa-solid fa-envelope"></i>
                                        ${escapeHTML(email)}
                                    </span>
                                `
                : ""
            }

                        ${!telephone && !email
                ? `
                                    <span class="contact-item">
                                        <i class="fa-solid fa-minus"></i>
                                        Aucun contact
                                    </span>
                                `
                : ""
            }

                    </div>

                </td>


                <!-- FONCTION -->
                <td>

                    <span class="function-badge">
                        ${escapeHTML(fonction)}
                    </span>

                </td>


                <!-- DATE -->
                <td>

                    <span class="date-cell">
                        ${escapeHTML(dateCreation)}
                    </span>

                </td>


                <!-- ACTIONS -->
                <td>

                    <div class="actions">

                        <button
                            class="action-btn edit-btn"
                            title="Modifier"
                            onclick="ouvrirModification(${Number(encadreur.id)})">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="action-btn delete-btn"
                            title="Supprimer"
                            onclick="ouvrirSuppression(${Number(encadreur.id)})">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            </tr>
        `;

    }).join("");
}


// ======================================================
// RECHERCHE
// ======================================================

searchInput.addEventListener("input", function () {

    const recherche = this.value
        .toLowerCase()
        .trim();

    if (!recherche) {

        afficherEncadreurs(encadreurs);

        return;
    }

    const resultat = encadreurs.filter(encadreur => {

        const texte = [

            encadreur.nom,
            encadreur.prenom,
            encadreur.telephone,
            encadreur.email,
            encadreur.fonction

        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return texte.includes(recherche);
    });

    afficherEncadreurs(resultat);
});


// ======================================================
// OUVRIR MODAL AJOUT
// ======================================================

openAddModal.addEventListener("click", function () {

    ouvrirModalAjout();

});


function ouvrirModalAjout() {

    encadreurForm.reset();

    encadreurId.value = "";

    modalTitle.textContent = "Ajouter un encadreur";

    modalSubtitle.textContent =
        "Ajoutez un nouvel encadreur.";

    saveBtn.innerHTML = `
        <i class="fa-solid fa-floppy-disk"></i>
        Enregistrer
    `;

    formModal.classList.add("show");

    setTimeout(() => {
        nomInput.focus();
    }, 100);
}


// ======================================================
// OUVRIR MODAL MODIFICATION
// ======================================================

function ouvrirModification(id) {

    const encadreur = encadreurs.find(
        item => Number(item.id) === Number(id)
    );

    if (!encadreur) {

        afficherToast(
            "Erreur",
            "Encadreur introuvable.",
            "error"
        );

        return;
    }

    encadreurId.value = encadreur.id;

    nomInput.value = encadreur.nom || "";
    prenomInput.value = encadreur.prenom || "";
    telephoneInput.value = encadreur.telephone || "";
    emailInput.value = encadreur.email || "";
    fonctionInput.value = encadreur.fonction || "";

    modalTitle.textContent = "Modifier l'encadreur";

    modalSubtitle.textContent =
        "Modifiez les informations de l'encadreur.";

    saveBtn.innerHTML = `
        <i class="fa-solid fa-pen"></i>
        Modifier
    `;

    formModal.classList.add("show");

    setTimeout(() => {
        nomInput.focus();
    }, 100);
}


// ======================================================
// FERMER MODAL FORMULAIRE
// ======================================================

function fermerFormModal() {

    formModal.classList.remove("show");

    encadreurForm.reset();

    encadreurId.value = "";
}

closeFormModal.addEventListener(
    "click",
    fermerFormModal
);

cancelForm.addEventListener(
    "click",
    fermerFormModal
);


// ======================================================
// CLIQUER EN DEHORS DU MODAL
// ======================================================

formModal.addEventListener("click", function (event) {

    if (event.target === formModal) {
        fermerFormModal();
    }

});

deleteModal.addEventListener("click", function (event) {

    if (event.target === deleteModal) {
        fermerSuppression();
    }

});


// ======================================================
// AJOUT / MODIFICATION
// ======================================================

encadreurForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const id = encadreurId.value;

        const donnees = {

            nom: nomInput.value.trim(),

            prenom: prenomInput.value.trim(),

            telephone: telephoneInput.value.trim(),

            email: emailInput.value.trim(),

            fonction: fonctionInput.value.trim()

        };


        // VALIDATION

        if (!donnees.nom || !donnees.prenom) {

            afficherToast(
                "Attention",
                "Le nom et le prénom sont obligatoires.",
                "error"
            );

            return;
        }


        // EMAIL

        if (donnees.email) {

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(donnees.email)) {

                afficherToast(
                    "Attention",
                    "L'adresse email n'est pas valide.",
                    "error"
                );

                return;
            }
        }


        // ETAT BOUTON

        const texteOriginal = saveBtn.innerHTML;

        saveBtn.disabled = true;

        saveBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Enregistrement...
        `;


        try {

            let url;
            let method;

            if (id) {

                url =
                    `${API_URL}/encadreurs/modifier.php?id=${encodeURIComponent(id)}`;

                method = "PUT";

            } else {

                url =
                    `${API_URL}/encadreurs/ajouter.php`;

                method = "POST";
            }


            const response = await fetch(
                url,
                {
                    method: method,

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify(donnees)
                }
            );


            const data = await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Une erreur est survenue."
                );
            }


            fermerFormModal();

            await chargerEncadreurs();


            afficherToast(
                "Succès",
                id
                    ? "Encadreur modifié avec succès."
                    : "Encadreur ajouté avec succès.",
                "success"
            );


        } catch (error) {

            console.error(
                "❌ Erreur sauvegarde :",
                error
            );

            afficherToast(
                "Erreur",
                error.message,
                "error"
            );

        } finally {

            saveBtn.disabled = false;

            saveBtn.innerHTML =
                texteOriginal;
        }

    }
);


// ======================================================
// OUVRIR SUPPRESSION
// ======================================================

function ouvrirSuppression(id) {

    const encadreur = encadreurs.find(
        item => Number(item.id) === Number(id)
    );

    if (!encadreur) {

        afficherToast(
            "Erreur",
            "Encadreur introuvable.",
            "error"
        );

        return;
    }

    encadreurToDelete = id;

    deleteModal.classList.add("show");
}


// ======================================================
// FERMER SUPPRESSION
// ======================================================

function fermerSuppression() {

    deleteModal.classList.remove("show");

    encadreurToDelete = null;
}

cancelDelete.addEventListener(
    "click",
    fermerSuppression
);


// ======================================================
// CONFIRMER SUPPRESSION
// ======================================================

confirmDelete.addEventListener(
    "click",
    async function () {

        if (!encadreurToDelete) {
            return;
        }

        const id = encadreurToDelete;

        confirmDelete.disabled = true;

        confirmDelete.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Suppression...
        `;


        try {

            const response = await fetch(
                `${API_URL}/encadreurs/supprimer.php?id=${encodeURIComponent(id)}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"
                    }
                }
            );


            const data = await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Impossible de supprimer l'encadreur."
                );
            }


            fermerSuppression();

            await chargerEncadreurs();


            afficherToast(
                "Succès",
                "Encadreur supprimé avec succès.",
                "success"
            );


        } catch (error) {

            console.error(
                "❌ Erreur suppression :",
                error
            );

            afficherToast(
                "Erreur",
                error.message,
                "error"
            );

        } finally {

            confirmDelete.disabled = false;

            confirmDelete.innerHTML = `
                <i class="fa-solid fa-trash"></i>
                Supprimer
            `;
        }

    }
);


// ======================================================
// ACTUALISER
// ======================================================

refreshBtn.addEventListener(
    "click",
    async function () {

        const icon =
            refreshBtn.querySelector("i");

        icon.classList.add("fa-spin");

        await chargerEncadreurs();

        icon.classList.remove("fa-spin");

    }
);


// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener(
    "click",
    function () {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href =
            "../index.html";
    }
);


// ======================================================
// TOAST
// ======================================================

function afficherToast(
    title,
    message,
    type = "success"
) {

    toastTitle.textContent = title;

    toastMessage.textContent = message;


    const icon =
        toast.querySelector(".toast-icon i");


    if (type === "error") {

        icon.className =
            "fa-solid fa-triangle-exclamation";

        toast.querySelector(".toast-icon").style.background =
            "#fef2f2";

        toast.querySelector(".toast-icon").style.color =
            "#dc2626";

    } else {

        icon.className =
            "fa-solid fa-check";

        toast.querySelector(".toast-icon").style.background =
            "#dcfce7";

        toast.querySelector(".toast-icon").style.color =
            "#16a34a";
    }


    toast.classList.add("show");


    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {

        toast.classList.remove("show");

    }, 4000);
}


closeToast.addEventListener(
    "click",
    () => toast.classList.remove("show")
);


// ======================================================
// MENU MOBILE
// ======================================================

menuBtn.addEventListener(
    "click",
    function () {

        sidebar.classList.toggle("open");

        sidebarOverlay.classList.toggle("show");
    }
);


sidebarOverlay.addEventListener(
    "click",
    function () {

        sidebar.classList.remove("open");

        sidebarOverlay.classList.remove("show");
    }
);


// ======================================================
// FERMER AVEC ESC
// ======================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            fermerFormModal();

            fermerSuppression();

            sidebar.classList.remove("open");

            sidebarOverlay.classList.remove("show");
        }
    }
);


// ======================================================
// UTILITAIRES
// ======================================================

function obtenirInitiales(prenom, nom) {

    const p =
        (prenom || "").trim().charAt(0);

    const n =
        (nom || "").trim().charAt(0);

    return (p + n).toUpperCase() || "?";
}


function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }

    const date =
        new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================================
// CHARGEMENT INITIAL
// ======================================================

chargerEncadreurs();