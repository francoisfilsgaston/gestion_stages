// ========================================
// CONFIGURATION
// ========================================

const API_URL = "http://localhost:8001/api";


// ========================================
// AUTHENTIFICATION
// ========================================

const token = localStorage.getItem("token");

let user = null;

try {

    user = JSON.parse(
        localStorage.getItem("user")
    );

} catch (error) {

    user = null;
}


// Vérifier la connexion

if (!token || !user || user.role !== "admin") {

    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("user");

    window.location.href = "../index.html";
}


// ========================================
// ÉLÉMENTS DOM
// ========================================

const tableBody =
    document.getElementById("entreprisesTableBody");

const loading =
    document.getElementById("loading");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const entrepriseCount =
    document.getElementById("entrepriseCount");

const message =
    document.getElementById("message");

const modalOverlay =
    document.getElementById("modalOverlay");

const deleteOverlay =
    document.getElementById("deleteOverlay");

const entrepriseForm =
    document.getElementById("entrepriseForm");

const modalTitle =
    document.getElementById("modalTitle");

const modalSubtitle =
    document.getElementById("modalSubtitle");

const modalIcon =
    document.getElementById("modalIcon");

const addButton =
    document.getElementById("addButton");

const closeModalButton =
    document.getElementById("closeModalButton");

const cancelButton =
    document.getElementById("cancelButton");

const refreshButton =
    document.getElementById("refreshButton");

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.getElementById("sidebar");

const logoutButton =
    document.getElementById("logoutButton");

const adminEmail =
    document.getElementById("adminEmail");


// ========================================
// VARIABLES
// ========================================

let entreprises = [];

let entrepriseEnModification = null;

let entrepriseASupprimer = null;


// ========================================
// AFFICHER EMAIL
// ========================================

if (adminEmail && user) {

    adminEmail.textContent =
        user.email || "Administrateur";
}


// ========================================
// MESSAGE
// ========================================

function afficherMessage(
    texte,
    type
) {

    message.textContent = texte;

    message.className =
        `message show ${type}`;

    setTimeout(() => {

        message.className = "message";

    }, 4000);
}


// ========================================
// FORMAT DATE
// ========================================

function formaterDate(dateString) {

    if (!dateString) {
        return "—";
    }

    const date = new Date(
        dateString.replace(" ", "T")
    );

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


// ========================================
// REQUÊTE API
// ========================================

async function requeteAPI(
    endpoint,
    options = {}
) {

    const response = await fetch(
        `${API_URL}/${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                "Authorization":
                    `Bearer ${token}`,

                ...(options.headers || {})
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


    let result;

    try {

        result = await response.json();

    } catch (error) {

        throw new Error(
            "Réponse invalide du serveur."
        );
    }


    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(
            result.message ||
            "Une erreur est survenue."
        );
    }


    return result;
}


// ========================================
// CHARGER ENTREPRISES
// ========================================

async function chargerEntreprises() {

    loading.style.display = "flex";

    emptyState.style.display = "none";

    tableBody.innerHTML = "";

    try {

        const result =
            await requeteAPI(
                "entreprises/liste.php"
            );


        if (!result) {
            return;
        }


        entreprises =
            Array.isArray(result.data)
                ? result.data
                : [];


        afficherEntreprises(
            entreprises
        );


    } catch (error) {

        console.error(
            "Erreur entreprises :",
            error
        );

        afficherMessage(
            error.message ||
            "Impossible de charger les entreprises.",
            "error"
        );

        entreprises = [];

        afficherEntreprises([]);

    } finally {

        loading.style.display = "none";
    }
}


// ========================================
// AFFICHER ENTREPRISES
// ========================================

function afficherEntreprises(
    liste
) {

    tableBody.innerHTML = "";

    entrepriseCount.textContent =
        liste.length;


    if (liste.length === 0) {

        emptyState.style.display = "flex";

        return;
    }


    emptyState.style.display = "none";


    liste.forEach(
        entreprise => {

            const row =
                document.createElement("tr");


            const nom =
                entreprise.nom || "Sans nom";

            const adresse =
                entreprise.adresse || "";

            const telephone =
                entreprise.telephone || "";

            const email =
                entreprise.email || "";

            const secteur =
                entreprise.secteur || "Non renseigné";

            const dateCreation =
                entreprise.date_creation;


            row.innerHTML = `

                <td>

                    <div class="company-cell">

                        <div class="company-icon">

                            <i class="fa-solid fa-building"></i>

                        </div>

                        <div>

                            <div class="company-name">
                                ${echapperHTML(nom)}
                            </div>

                        </div>

                    </div>

                </td>


                <td>

                    <div class="contact-cell">

                        ${telephone
                    ? `
                                <span class="contact-item">

                                    <i class="fa-solid fa-phone"></i>

                                    ${echapperHTML(telephone)}

                                </span>
                            `
                    : ""
                }


                        ${email
                    ? `
                                <span class="contact-item">

                                    <i class="fa-solid fa-envelope"></i>

                                    ${echapperHTML(email)}

                                </span>
                            `
                    : ""
                }


                        ${adresse
                    ? `
                                <span class="contact-item">

                                    <i class="fa-solid fa-location-dot"></i>

                                    ${echapperHTML(adresse)}

                                </span>
                            `
                    : ""
                }

                    </div>

                </td>


                <td>

                    <span class="sector-badge">

                        ${echapperHTML(secteur)}

                    </span>

                </td>


                <td class="date-cell">

                    ${formaterDate(dateCreation)}

                </td>


                <td>

                    <div class="actions">

                        <button
                            type="button"
                            class="action-button edit-button"
                            title="Modifier"
                            data-action="edit"
                            data-id="${entreprise.id}"
                        >

                            <i class="fa-solid fa-pen"></i>

                        </button>


                        <button
                            type="button"
                            class="action-button delete-button-small"
                            title="Supprimer"
                            data-action="delete"
                            data-id="${entreprise.id}"
                        >

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            `;


            tableBody.appendChild(row);
        }
    );
}


// ========================================
// ÉCHAPPER HTML
// ========================================

function echapperHTML(
    valeur
) {

    const div =
        document.createElement("div");

    div.textContent =
        valeur ?? "";

    return div.innerHTML;
}


// ========================================
// RECHERCHE
// ========================================

searchInput.addEventListener(
    "input",
    () => {

        const recherche =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!recherche) {

            afficherEntreprises(
                entreprises
            );

            return;
        }


        const resultats =
            entreprises.filter(
                entreprise => {

                    return (

                        String(
                            entreprise.nom || ""
                        )
                            .toLowerCase()
                            .includes(recherche)

                        ||

                        String(
                            entreprise.adresse || ""
                        )
                            .toLowerCase()
                            .includes(recherche)

                        ||

                        String(
                            entreprise.telephone || ""
                        )
                            .toLowerCase()
                            .includes(recherche)

                        ||

                        String(
                            entreprise.email || ""
                        )
                            .toLowerCase()
                            .includes(recherche)

                        ||

                        String(
                            entreprise.secteur || ""
                        )
                            .toLowerCase()
                            .includes(recherche)

                    );
                }
            );


        afficherEntreprises(
            resultats
        );
    }
);


// ========================================
// OUVRIR MODAL AJOUT
// ========================================

function ouvrirModalAjout() {

    entrepriseEnModification = null;

    entrepriseForm.reset();


    modalTitle.textContent =
        "Nouvelle entreprise";

    modalSubtitle.textContent =
        "Ajouter une entreprise partenaire";

    modalIcon.className =
        "fa-solid fa-building";


    modalOverlay.classList.add(
        "show"
    );


    document
        .getElementById("nom")
        .focus();
}


// ========================================
// OUVRIR MODAL MODIFICATION
// ========================================

function ouvrirModalModification(
    id
) {

    const entreprise =
        entreprises.find(
            item =>
                Number(item.id) === Number(id)
        );


    if (!entreprise) {

        afficherMessage(
            "Entreprise introuvable.",
            "error"
        );

        return;
    }


    entrepriseEnModification =
        entreprise;


    document.getElementById("nom").value =
        entreprise.nom || "";

    document.getElementById("adresse").value =
        entreprise.adresse || "";

    document.getElementById("telephone").value =
        entreprise.telephone || "";

    document.getElementById("email").value =
        entreprise.email || "";

    document.getElementById("secteur").value =
        entreprise.secteur || "";


    modalTitle.textContent =
        "Modifier l'entreprise";

    modalSubtitle.textContent =
        "Mettre à jour les informations";

    modalIcon.className =
        "fa-solid fa-pen";


    modalOverlay.classList.add(
        "show"
    );
}


// ========================================
// FERMER MODAL
// ========================================

function fermerModal() {

    modalOverlay.classList.remove(
        "show"
    );

    entrepriseEnModification =
        null;

    entrepriseForm.reset();
}


// ========================================
// AJOUT / MODIFICATION
// ========================================

entrepriseForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const nom =
            document.getElementById("nom")
                .value
                .trim();

        const adresse =
            document.getElementById("adresse")
                .value
                .trim();

        const telephone =
            document.getElementById("telephone")
                .value
                .trim();

        const email =
            document.getElementById("email")
                .value
                .trim();

        const secteur =
            document.getElementById("secteur")
                .value
                .trim();


        if (!nom) {

            afficherMessage(
                "Le nom de l'entreprise est obligatoire.",
                "error"
            );

            return;
        }


        const data = {

            nom: nom,

            adresse: adresse,

            telephone: telephone,

            email: email,

            secteur: secteur

        };


        const modification =
            entrepriseEnModification !== null;


        const saveButton =
            document.getElementById(
                "saveButton"
            );

        const saveButtonText =
            document.getElementById(
                "saveButtonText"
            );

        const saveLoader =
            document.getElementById(
                "saveLoader"
            );


        saveButton.disabled = true;

        saveButtonText.style.display =
            "none";

        saveLoader.style.display =
            "block";


        try {

            let endpoint;


            if (modification) {

                endpoint =
                    `entreprises/modifier.php?id=${entrepriseEnModification.id}`;

            } else {

                endpoint =
                    "entreprises/ajouter.php";

            }


            const result =
                await requeteAPI(
                    endpoint,
                    {
                        method:
                            modification
                                ? "PUT"
                                : "POST",

                        body:
                            JSON.stringify(data)
                    }
                );


            if (!result) {
                return;
            }


            fermerModal();


            afficherMessage(
                result.message ||
                (
                    modification
                        ? "Entreprise modifiée avec succès."
                        : "Entreprise ajoutée avec succès."
                ),
                "success"
            );


            await chargerEntreprises();


        } catch (error) {

            console.error(
                "Erreur sauvegarde :",
                error
            );

            afficherMessage(
                error.message ||
                "Impossible d'enregistrer l'entreprise.",
                "error"
            );

        } finally {

            saveButton.disabled = false;

            saveButtonText.style.display =
                "inline-flex";

            saveLoader.style.display =
                "none";
        }

    }
);


// ========================================
// OUVRIR MODAL SUPPRESSION
// ========================================

function ouvrirSuppression(
    id
) {

    const entreprise =
        entreprises.find(
            item =>
                Number(item.id) === Number(id)
        );


    if (!entreprise) {
        return;
    }


    entrepriseASupprimer =
        entreprise;


    document.getElementById(
        "deleteEntrepriseName"
    ).textContent =
        entreprise.nom;


    deleteOverlay.classList.add(
        "show"
    );
}


// ========================================
// FERMER SUPPRESSION
// ========================================

function fermerSuppression() {

    deleteOverlay.classList.remove(
        "show"
    );

    entrepriseASupprimer = null;
}


// ========================================
// CONFIRMER SUPPRESSION
// ========================================

document
    .getElementById("confirmDeleteButton")
    .addEventListener(
        "click",
        async () => {

            if (!entrepriseASupprimer) {
                return;
            }


            const id =
                entrepriseASupprimer.id;


            const button =
                document.getElementById(
                    "confirmDeleteButton"
                );


            button.disabled = true;


            try {

                const result =
                    await requeteAPI(
                        `entreprises/supprimer.php?id=${id}`,
                        {
                            method: "DELETE"
                        }
                    );


                if (!result) {
                    return;
                }


                fermerSuppression();


                afficherMessage(
                    result.message ||
                    "Entreprise supprimée avec succès.",
                    "success"
                );


                await chargerEntreprises();


            } catch (error) {

                console.error(
                    "Erreur suppression :",
                    error
                );

                afficherMessage(
                    error.message ||
                    "Impossible de supprimer l'entreprise.",
                    "error"
                );

            } finally {

                button.disabled = false;
            }

        }
    );


// ========================================
// ACTIONS DU TABLEAU
// ========================================

tableBody.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "button[data-action]"
            );


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;

        const action =
            button.dataset.action;


        if (action === "edit") {

            ouvrirModalModification(
                id
            );

        }


        if (action === "delete") {

            ouvrirSuppression(
                id
            );

        }

    }
);


// ========================================
// BOUTONS MODAL
// ========================================

addButton.addEventListener(
    "click",
    ouvrirModalAjout
);


closeModalButton.addEventListener(
    "click",
    fermerModal
);


cancelButton.addEventListener(
    "click",
    fermerModal
);


document
    .getElementById("cancelDeleteButton")
    .addEventListener(
        "click",
        fermerSuppression
    );


// Fermer en cliquant à l'extérieur

modalOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            modalOverlay
        ) {

            fermerModal();

        }

    }
);


deleteOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            deleteOverlay
        ) {

            fermerSuppression();

        }

    }
);


// ========================================
// ACTUALISER
// ========================================

refreshButton.addEventListener(
    "click",
    async () => {

        const icon =
            refreshButton.querySelector(
                "i"
            );


        icon.classList.add(
            "fa-spin"
        );

        refreshButton.disabled =
            true;


        await chargerEntreprises();


        icon.classList.remove(
            "fa-spin"
        );

        refreshButton.disabled =
            false;
    }
);


// ========================================
// MENU MOBILE
// ========================================

menuButton.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle(
            "open"
        );

    }
);


// ========================================
// DÉCONNEXION
// ========================================

logoutButton.addEventListener(
    "click",
    () => {

        if (
            !confirm(
                "Voulez-vous vraiment vous déconnecter ?"
            )
        ) {

            return;
        }


        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "expiration"
        );

        localStorage.removeItem(
            "user"
        );


        window.location.href =
            "../index.html";
    }
);


// ========================================
// CHARGEMENT INITIAL
// ========================================

chargerEntreprises();