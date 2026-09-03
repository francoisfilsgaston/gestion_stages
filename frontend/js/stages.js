"use strict";

/* =========================================================
   CONFIGURATION
========================================================= */

const API_STAGES = "http://localhost:8001/api";

/*
 * L'application 2 possède une API intermédiaire.
 * La clé secrète reste côté PHP.
 */
const API_INTEGRATION = `${API_STAGES}/integration`;

const token = localStorage.getItem("token");

let currentUser = null;

try {
    currentUser = JSON.parse(
        localStorage.getItem("user") || "null"
    );
} catch (error) {
    currentUser = null;
}


/* =========================================================
   AUTHENTIFICATION
========================================================= */

if (
    !token ||
    !currentUser ||
    currentUser.role !== "admin"
) {
    window.location.href = "../index.html";
}


/* =========================================================
   VARIABLES
========================================================= */

let stages = [];
let etudiants = [];
let entreprises = [];
let encadreurs = [];

let stageToDelete = null;


/* =========================================================
   ELEMENTS HTML
========================================================= */

const stagesTableBody =
    document.getElementById("stagesTableBody");

const searchInput =
    document.getElementById("searchInput");

const stageCount =
    document.getElementById("stageCount");

const totalStages =
    document.getElementById("totalStages");

const stagesEnCours =
    document.getElementById("stagesEnCours");

const stagesTermines =
    document.getElementById("stagesTermines");

const stagesSuspendus =
    document.getElementById("stagesSuspendus");

const stageModal =
    document.getElementById("stageModal");

const deleteModal =
    document.getElementById("deleteModal");

const stageForm =
    document.getElementById("stageForm");

const stageId =
    document.getElementById("stageId");

const stageResourceSearch =
    document.getElementById("stageResourceSearch");

const etudiantId =
    document.getElementById("etudiantId");

const entrepriseId =
    document.getElementById("entrepriseId");

const encadreurId =
    document.getElementById("encadreurId");

const sujet =
    document.getElementById("sujet");

const dateDebut =
    document.getElementById("dateDebut");

const dateFin =
    document.getElementById("dateFin");

const statut =
    document.getElementById("statut");

const modalTitle =
    document.getElementById("modalTitle");

const submitBtn =
    document.getElementById("submitBtn");

const formError =
    document.getElementById("formError");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");

const adminEmail =
    document.getElementById("adminEmail");


/* =========================================================
   AFFICHER ADMIN
========================================================= */

if (currentUser && currentUser.email) {
    adminEmail.textContent = currentUser.email;
}


/* =========================================================
   HEADERS AUTH
========================================================= */

function getHeaders(json = false) {

    const headers = {
        "Authorization": `Bearer ${token}`
    };

    if (json) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}


/* =========================================================
   REQUETE API
========================================================= */

async function apiFetch(url, options = {}) {

    const response = await fetch(url, {
        ...options,
        headers: {
            ...getHeaders(
                options.body !== undefined
            ),
            ...(options.headers || {})
        }
    });

    let data;

    try {
        data = await response.json();
    } catch (error) {

        throw new Error(
            `Réponse invalide du serveur (${response.status})`
        );
    }

    if (!response.ok || data.success === false) {

        throw new Error(
            data.message ||
            `Erreur HTTP ${response.status}`
        );
    }

    return data;
}


/* =========================================================
   CHARGER LES ETUDIANTS
========================================================= */

async function chargerEtudiants() {

    try {

        etudiantId.innerHTML = `
            <option value="">
                Chargement des étudiants...
            </option>
        `;

        /*
         * IMPORTANT :
         * On appelle l'API d'intégration de l'APPLICATION 2.
         *
         * La clé secrète n'est donc PAS dans JavaScript.
         */

        const data = await apiFetch(
            `${API_INTEGRATION}/etudiants.php`
        );

        etudiants = Array.isArray(data.data)
            ? data.data
            : [];

        remplirSelectEtudiants();

    } catch (error) {

        console.error(
            "❌ Erreur étudiants :",
            error
        );

        etudiantId.innerHTML = `
            <option value="">
                Impossible de charger les étudiants
            </option>
        `;

        throw error;
    }
}


/* =========================================================
   REMPLIR SELECT ETUDIANTS
========================================================= */

function remplirSelectEtudiants(selectedId = null) {

    etudiantId.innerHTML = `
        <option value="">
            Sélectionner un étudiant
        </option>
    `;

    etudiants.forEach(etudiant => {

        const option =
            document.createElement("option");

        option.value = etudiant.id;

        const nom =
            `${etudiant.nom || ""} ${etudiant.prenom || ""}`
                .trim();

        option.textContent =
            `${nom || "Étudiant"} — ${etudiant.email || ""}`;

        if (
            selectedId !== null &&
            String(etudiant.id) === String(selectedId)
        ) {
            option.selected = true;
        }

        etudiantId.appendChild(option);
    });

    if (etudiants.length === 0) {

        etudiantId.innerHTML = `
            <option value="">
                Aucun étudiant disponible
            </option>
        `;
    }
}


/* =========================================================
   CHARGER ENTREPRISES
========================================================= */

async function chargerEntreprises() {

    const data = await apiFetch(
        `${API_STAGES}/entreprises/liste.php`
    );

    entreprises = Array.isArray(data.data)
        ? data.data
        : [];

    remplirSelectEntreprises();
}


/* =========================================================
   REMPLIR SELECT ENTREPRISES
========================================================= */

function remplirSelectEntreprises(selectedId = null) {

    entrepriseId.innerHTML = `
        <option value="">
            Sélectionner une entreprise
        </option>
    `;

    entreprises.forEach(entreprise => {

        const option =
            document.createElement("option");

        option.value = entreprise.id;

        option.textContent =
            entreprise.nom;

        if (
            selectedId !== null &&
            String(entreprise.id) === String(selectedId)
        ) {
            option.selected = true;
        }

        entrepriseId.appendChild(option);
    });
}


/* =========================================================
   CHARGER ENCADREURS
========================================================= */

async function chargerEncadreurs() {

    const data = await apiFetch(
        `${API_STAGES}/encadreurs/liste.php`
    );

    encadreurs = Array.isArray(data.data)
        ? data.data
        : [];

    remplirSelectEncadreurs();
}


/* =========================================================
   REMPLIR SELECT ENCADREURS
========================================================= */

function remplirSelectEncadreurs(selectedId = null) {

    encadreurId.innerHTML = `
        <option value="">
            Sélectionner un encadreur
        </option>
    `;

    encadreurs.forEach(encadreur => {

        const option =
            document.createElement("option");

        option.value = encadreur.id;

        option.textContent =
            `${encadreur.nom} ${encadreur.prenom}`;

        if (
            selectedId !== null &&
            String(encadreur.id) === String(selectedId)
        ) {
            option.selected = true;
        }

        encadreurId.appendChild(option);
    });
}


/* =========================================================
   RECHERCHE DES RESSOURCES DE LA MODALE
========================================================= */

function normaliserRecherche(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}


function rechercherRessourceStage() {

    const recherche = normaliserRecherche(
        stageResourceSearch.value
    );

    if (!recherche) {
        return;
    }

    const etudiant = etudiants.find(item => {

        const nom = normaliserRecherche(
            `${item.nom || ""} ${item.prenom || ""}`
        );

        return nom.includes(recherche) ||
            normaliserRecherche(item.email).includes(recherche);
    });

    if (etudiant) {
        remplirSelectEtudiants(etudiant.id);
        return;
    }

    const entreprise = entreprises.find(item =>
        normaliserRecherche(item.nom).includes(recherche)
    );

    if (entreprise) {
        remplirSelectEntreprises(entreprise.id);
        return;
    }

    const encadreur = encadreurs.find(item => {

        const nom = normaliserRecherche(
            `${item.nom || ""} ${item.prenom || ""}`
        );

        return nom.includes(recherche) ||
            normaliserRecherche(item.email).includes(recherche);
    });

    if (encadreur) {
        remplirSelectEncadreurs(encadreur.id);
    }
}


stageResourceSearch.addEventListener(
    "input",
    rechercherRessourceStage
);


/* =========================================================
   CHARGER LES STAGES
========================================================= */

async function chargerStages() {

    try {

        afficherChargement();

        const data = await apiFetch(
            `${API_STAGES}/stages/liste.php`
        );

        stages = Array.isArray(data.data)
            ? data.data
            : [];

        mettreAJourStatistiques();

        afficherStages();

    } catch (error) {

        console.error(
            "❌ Erreur stages :",
            error
        );

        stagesTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>${escapeHtml(error.message)}</span>
                    </div>
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   CHARGEMENT TABLE
========================================================= */

function afficherChargement() {

    stagesTableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="7">

                <div class="loading">

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Chargement des stages...

                </div>

            </td>
        </tr>
    `;
}


/* =========================================================
   AFFICHER STAGES
========================================================= */

function afficherStages() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const filtered =
        stages.filter(stage => {

            const etudiant =
                getEtudiantById(stage.etudiant_id);

            const nomEtudiant =
                etudiant
                    ? `${etudiant.nom || ""} ${etudiant.prenom || ""}`
                    : `Étudiant ${stage.etudiant_id}`;

            const texte = [
                nomEtudiant,
                etudiant?.email || "",
                stage.entreprise_nom || "",
                stage.encadreur_nom || "",
                stage.sujet || "",
                stage.statut || ""
            ]
                .join(" ")
                .toLowerCase();

            return texte.includes(search);
        });

    stageCount.textContent =
        `${filtered.length} stage${filtered.length !== 1 ? "s" : ""}`;

    if (filtered.length === 0) {

        stagesTableBody.innerHTML = `
            <tr class="empty-row">

                <td colspan="7">

                    <div class="empty-state">

                        <i class="fa-solid fa-briefcase"></i>

                        <span>
                            Aucun stage trouvé.
                        </span>

                    </div>

                </td>

            </tr>
        `;

        return;
    }


    stagesTableBody.innerHTML =
        filtered.map(stage => {

            const etudiant =
                getEtudiantById(stage.etudiant_id);

            const nomEtudiant =
                etudiant
                    ? `${etudiant.nom || ""} ${etudiant.prenom || ""}`.trim()
                    : `Étudiant #${stage.etudiant_id}`;

            const email =
                etudiant?.email || "";

            const statutClasse =
                getStatutClasse(stage.statut);

            const statutIcon =
                getStatutIcon(stage.statut);

            return `
                <tr>

                    <td>

                        <div class="student-cell">

                            <div class="student-avatar">
                                <i class="fa-solid fa-user"></i>
                            </div>

                            <div>

                                <div class="student-name">
                                    ${escapeHtml(nomEtudiant)}
                                </div>

                                <div class="student-id">
                                    ID #${escapeHtml(String(stage.etudiant_id))}
                                    ${email ? ` • ${escapeHtml(email)}` : ""}
                                </div>

                            </div>

                        </div>

                    </td>


                    <td>

                        <div class="company-name">
                            ${escapeHtml(stage.entreprise_nom || "—")}
                        </div>

                    </td>


                    <td>

                        <div class="supervisor-name">
                            ${escapeHtml(stage.encadreur_nom || "—")}
                        </div>

                    </td>


                    <td>

                        <div
                            class="subject-cell"
                            title="${escapeHtml(stage.sujet || "")}"
                        >
                            ${escapeHtml(stage.sujet || "—")}
                        </div>

                    </td>


                    <td>

                        <div class="date-cell">

                            ${formatDate(stage.date_debut)}
                            <br>
                            <span style="color:#9ca3af;">
                                au
                            </span>
                            <br>
                            ${formatDate(stage.date_fin)}

                        </div>

                    </td>


                    <td>

                        <span class="status ${statutClasse}">

                            <i class="fa-solid ${statutIcon}"></i>

                            ${escapeHtml(stage.statut || "—")}

                        </span>

                    </td>


                    <td>

                        <div class="actions">

                            <button
                                class="action-btn edit-btn"
                                title="Modifier"
                                onclick="ouvrirModification(${stage.id})"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                class="action-btn delete-btn"
                                title="Supprimer"
                                onclick="ouvrirSuppression(${stage.id})"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        })
            .join("");
}


/* =========================================================
   RECHERCHER ETUDIANT
========================================================= */

function getEtudiantById(id) {

    return etudiants.find(
        etudiant =>
            String(etudiant.id) === String(id)
    );
}


/* =========================================================
   STATISTIQUES
========================================================= */

function mettreAJourStatistiques() {

    totalStages.textContent =
        stages.length;

    stagesEnCours.textContent =
        stages.filter(
            stage =>
                normaliserStatut(stage.statut) === "en cours"
        ).length;

    stagesTermines.textContent =
        stages.filter(
            stage =>
                normaliserStatut(stage.statut) === "terminé"
        ).length;

    stagesSuspendus.textContent =
        stages.filter(
            stage =>
                normaliserStatut(stage.statut) === "suspendu"
        ).length;
}


/* =========================================================
   STATUT
========================================================= */

function normaliserStatut(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
}


function getStatutClasse(value) {

    const status =
        normaliserStatut(value);

    if (status === "en cours") {
        return "en-cours";
    }

    if (status === "terminé") {
        return "termine";
    }

    if (status === "suspendu") {
        return "suspendu";
    }

    return "autre";
}


function getStatutIcon(value) {

    const status =
        normaliserStatut(value);

    if (status === "en cours") {
        return "fa-spinner";
    }

    if (status === "terminé") {
        return "fa-circle-check";
    }

    if (status === "suspendu") {
        return "fa-pause";
    }

    return "fa-circle";
}


/* =========================================================
   OUVRIR MODALE AJOUT
========================================================= */

function ouvrirAjout() {

    stageForm.reset();

    stageResourceSearch.value = "";

    stageId.value = "";

    modalTitle.textContent =
        "Nouveau stage";

    submitBtn.innerHTML = `
        <i class="fa-solid fa-floppy-disk"></i>
        Enregistrer
    `;

    masquerErreur();

    remplirSelectEtudiants();

    remplirSelectEntreprises();

    remplirSelectEncadreurs();

    statut.value = "en cours";

    stageModal.classList.add("show");
}


/* =========================================================
   OUVRIR MODALE MODIFICATION
========================================================= */

function ouvrirModification(id) {

    const stage =
        stages.find(
            item =>
                String(item.id) === String(id)
        );

    if (!stage) {
        afficherToast(
            "Stage introuvable.",
            true
        );
        return;
    }

    stageId.value =
        stage.id;

    modalTitle.textContent =
        "Modifier le stage";

    submitBtn.innerHTML = `
        <i class="fa-solid fa-pen"></i>
        Modifier
    `;

    sujet.value =
        stage.sujet || "";

    dateDebut.value =
        stage.date_debut || "";

    dateFin.value =
        stage.date_fin || "";

    statut.value =
        stage.statut || "en cours";

    masquerErreur();

    remplirSelectEtudiants(
        stage.etudiant_id
    );

    remplirSelectEntreprises(
        stage.entreprise_id
    );

    remplirSelectEncadreurs(
        stage.encadreur_id
    );

    stageModal.classList.add("show");
}


/* =========================================================
   FERMER MODALE
========================================================= */

function fermerModal() {

    stageModal.classList.remove("show");

    masquerErreur();
}


/* =========================================================
   SOUMISSION FORMULAIRE
========================================================= */

stageForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        masquerErreur();


        const id =
            stageId.value.trim();

        const selectedStudent =
            etudiantId.value;

        const selectedCompany =
            entrepriseId.value;

        const selectedSupervisor =
            encadreurId.value;


        if (!selectedStudent) {

            afficherErreur(
                "Veuillez sélectionner un étudiant."
            );

            return;
        }

        if (!selectedCompany) {

            afficherErreur(
                "Veuillez sélectionner une entreprise."
            );

            return;
        }

        if (!selectedSupervisor) {

            afficherErreur(
                "Veuillez sélectionner un encadreur."
            );

            return;
        }


        if (!sujet.value.trim()) {

            afficherErreur(
                "Le sujet du stage est obligatoire."
            );

            return;
        }


        if (!dateDebut.value || !dateFin.value) {

            afficherErreur(
                "Les dates de début et de fin sont obligatoires."
            );

            return;
        }


        if (dateFin.value < dateDebut.value) {

            afficherErreur(
                "La date de fin doit être supérieure ou égale à la date de début."
            );

            return;
        }


        const payload = {

            /*
             * C'est ici que l'ID réel de l'étudiant
             * provenant de l'application 1 est envoyé.
             */

            etudiant_id:
                Number(selectedStudent),

            entreprise_id:
                Number(selectedCompany),

            encadreur_id:
                Number(selectedSupervisor),

            sujet:
                sujet.value.trim(),

            date_debut:
                dateDebut.value,

            date_fin:
                dateFin.value,

            statut:
                statut.value

        };


        try {

            submitBtn.disabled = true;

            submitBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Enregistrement...
            `;


            let data;


            if (id) {

                data = await apiFetch(
                    `${API_STAGES}/stages/modifier.php?id=${encodeURIComponent(id)}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(payload)
                    }
                );

                afficherToast(
                    "Stage modifié avec succès."
                );

            } else {

                data = await apiFetch(
                    `${API_STAGES}/stages/ajouter.php`,
                    {
                        method: "POST",
                        body: JSON.stringify(payload)
                    }
                );

                afficherToast(
                    "Stage ajouté avec succès."
                );
            }


            fermerModal();

            await chargerStages();

        } catch (error) {

            console.error(
                "❌ Erreur enregistrement :",
                error
            );

            afficherErreur(
                error.message
            );

        } finally {

            submitBtn.disabled = false;

            submitBtn.innerHTML = id
                ? `
                    <i class="fa-solid fa-pen"></i>
                    Modifier
                  `
                : `
                    <i class="fa-solid fa-floppy-disk"></i>
                    Enregistrer
                  `;
        }

    }
);


/* =========================================================
   SUPPRESSION
========================================================= */

function ouvrirSuppression(id) {

    stageToDelete = id;

    deleteModal.classList.add("show");
}


function fermerSuppression() {

    deleteModal.classList.remove("show");

    stageToDelete = null;
}


async function supprimerStage() {

    if (!stageToDelete) {
        return;
    }


    const id =
        stageToDelete;


    try {

        const confirmBtn =
            document.getElementById(
                "confirmDeleteBtn"
            );

        confirmBtn.disabled = true;

        confirmBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Suppression...
        `;


        await apiFetch(
            `${API_STAGES}/stages/supprimer.php?id=${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );


        fermerSuppression();

        afficherToast(
            "Stage supprimé avec succès."
        );


        await chargerStages();

    } catch (error) {

        console.error(
            "❌ Erreur suppression :",
            error
        );

        fermerSuppression();

        afficherToast(
            error.message,
            true
        );

    } finally {

        const confirmBtn =
            document.getElementById(
                "confirmDeleteBtn"
            );

        confirmBtn.disabled = false;

        confirmBtn.innerHTML = `
            <i class="fa-solid fa-trash"></i>
            Supprimer
        `;
    }
}


/* =========================================================
   UTILITAIRES
========================================================= */

function formatDate(date) {

    if (!date) {
        return "—";
    }

    const parts =
        String(date).split("-");

    if (parts.length !== 3) {
        return escapeHtml(String(date));
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function afficherErreur(message) {

    formError.textContent =
        message;

    formError.classList.add("show");
}


function masquerErreur() {

    formError.textContent = "";

    formError.classList.remove("show");
}


function afficherToast(
    message,
    error = false
) {

    toastMessage.textContent =
        message;

    const icon =
        toast.querySelector("i");

    if (error) {

        icon.className =
            "fa-solid fa-circle-exclamation";

        icon.style.color =
            "#f87171";

    } else {

        icon.className =
            "fa-solid fa-circle-check";

        icon.style.color =
            "#4ade80";
    }


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);
}


/* =========================================================
   RECHERCHE
========================================================= */

searchInput.addEventListener(
    "input",
    afficherStages
);


/* =========================================================
   ACTUALISER
========================================================= */

document
    .getElementById("refreshBtn")
    .addEventListener(
        "click",
        async function () {

            try {

                this.disabled = true;

                await Promise.all([
                    chargerEtudiants(),
                    chargerEntreprises(),
                    chargerEncadreurs(),
                    chargerStages()
                ]);

                afficherToast(
                    "Données actualisées."
                );

            } catch (error) {

                afficherToast(
                    error.message,
                    true
                );

            } finally {

                this.disabled = false;
            }

        }
    );


/* =========================================================
   MODALE AJOUT
========================================================= */

document
    .getElementById("openAddModalBtn")
    .addEventListener(
        "click",
        ouvrirAjout
    );


document
    .getElementById("closeModalBtn")
    .addEventListener(
        "click",
        fermerModal
    );


document
    .getElementById("cancelModalBtn")
    .addEventListener(
        "click",
        fermerModal
    );


/* =========================================================
   MODALE SUPPRESSION
========================================================= */

document
    .getElementById("cancelDeleteBtn")
    .addEventListener(
        "click",
        fermerSuppression
    );


document
    .getElementById("confirmDeleteBtn")
    .addEventListener(
        "click",
        supprimerStage
    );


/* =========================================================
   FERMER EN CLIQUANT À L'EXTÉRIEUR
========================================================= */

stageModal.addEventListener(
    "click",
    function (event) {

        if (event.target === stageModal) {
            fermerModal();
        }

    }
);


deleteModal.addEventListener(
    "click",
    function (event) {

        if (event.target === deleteModal) {
            fermerSuppression();
        }

    }
);


/* =========================================================
   MENU MOBILE
========================================================= */

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");


function ouvrirSidebar() {

    sidebar.classList.add("open");

    sidebarOverlay.classList.add("show");
}


function fermerSidebar() {

    sidebar.classList.remove("open");

    sidebarOverlay.classList.remove("show");
}


mobileMenuBtn.addEventListener(
    "click",
    ouvrirSidebar
);


sidebarOverlay.addEventListener(
    "click",
    fermerSidebar
);


/* =========================================================
   LOGOUT
========================================================= */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        function () {

            localStorage.removeItem("token");

            localStorage.removeItem("user");

            window.location.href =
                "../index.html";

        }
    );


/* =========================================================
   INITIALISATION
========================================================= */

async function initialiserPage() {

    try {

        /*
         * Les trois listes sont chargées en parallèle.
         */

        await Promise.all([

            chargerEtudiants(),

            chargerEntreprises(),

            chargerEncadreurs()

        ]);


        /*
         * Puis les stages.
         */

        await chargerStages();


    } catch (error) {

        console.error(
            "❌ Erreur initialisation :",
            error
        );

    }

}


/* =========================================================
   LANCER
========================================================= */

initialiserPage();