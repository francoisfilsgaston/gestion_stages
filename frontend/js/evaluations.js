/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL = "http://localhost:8001/api";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");


/* =========================================================
   PROTECTION ADMIN
========================================================= */

if (!token || !user || user.role !== "admin") {
    window.location.href = "../index.html";
}


/* =========================================================
   ELEMENTS
========================================================= */

const tableBody = document.getElementById("evaluationsTableBody");
const evaluationCount = document.getElementById("evaluationCount");
const searchInput = document.getElementById("searchInput");

const evaluationModal = document.getElementById("evaluationModal");
const deleteModal = document.getElementById("deleteModal");

const evaluationForm = document.getElementById("evaluationForm");

const evaluationId = document.getElementById("evaluationId");
const evaluationSearch = document.getElementById("evaluationSearch");
const etudiantId = document.getElementById("etudiantId");
const stageId = document.getElementById("stageId");
const note = document.getElementById("note");
const appreciation = document.getElementById("appreciation");

const modalTitle = document.getElementById("modalTitle");
const submitBtn = document.getElementById("submitBtn");

const formError = document.getElementById("formError");

const adminEmail = document.getElementById("adminEmail");

const notification = document.getElementById("notification");
const notificationIcon = document.getElementById("notificationIcon");
const notificationMessage = document.getElementById("notificationMessage");


/* =========================================================
   VARIABLES
========================================================= */

let evaluations = [];
let stages = [];
let etudiants = [];
let evaluationToDelete = null;


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    if (user && user.email) {
        adminEmail.textContent = user.email;
    }

    await chargerEtudiants();
    await chargerStages();
    await chargerEvaluations();

});


/* =========================================================
   HEADERS
========================================================= */

function getHeaders() {

    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

}


/* =========================================================
   CHARGER LES STAGES
========================================================= */

async function chargerStages() {

    try {

        const response = await fetch(
            `${API_URL}/stages/liste.php`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message || "Impossible de charger les stages"
            );

        }

        stages = result.data || [];

        remplirSelectStages();

    } catch (error) {

        console.error("❌ Erreur stages :", error);

        showNotification(
            error.message || "Erreur lors du chargement des stages",
            "error"
        );

    }

}


/* =========================================================
   REMPLIR SELECT STAGES
========================================================= */

function remplirSelectStages(selectedId = null) {

    stageId.innerHTML = `
        <option value="">Sélectionner un stage</option>
    `;

    stages.forEach(stage => {

        const option = document.createElement("option");

        option.value = stage.id;

        const etudiant = nomEtudiant(stage.etudiant_id) ||
            `Étudiant #${stage.etudiant_id}`;

        const entreprise = stage.entreprise_nom
            ? stage.entreprise_nom
            : "Entreprise inconnue";

        option.textContent =
            `${etudiant} — ${entreprise} — ${stage.sujet}`;

        if (
            selectedId !== null &&
            Number(selectedId) === Number(stage.id)
        ) {
            option.selected = true;
        }

        stageId.appendChild(option);

    });

}


/* =========================================================
   CHARGER LES EVALUATIONS
========================================================= */

async function chargerEvaluations() {

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Chargement des évaluations...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(
            `${API_URL}/evaluations/liste.php`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message || "Impossible de charger les évaluations"
            );

        }

        evaluations = result.data || [];

        afficherEvaluations(evaluations);

    } catch (error) {

        console.error("❌ Erreur évaluations :", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <strong>Erreur</strong>
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

        showNotification(
            error.message || "Erreur lors du chargement",
            "error"
        );

    }

}


/* =========================================================
   AFFICHER EVALUATIONS
========================================================= */

function afficherEvaluations(data) {

    evaluationCount.textContent =
        `${data.length} évaluation${data.length > 1 ? "s" : ""}`;

    if (data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fa-solid fa-star"></i>
                    <strong>Aucune évaluation</strong>
                    Aucune évaluation n'a encore été enregistrée.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML = data.map(evaluation => {

        const stage = trouverStage(evaluation.stage_id);

        const etudiantNom =
            evaluation.etudiant_nom ||
            nomEtudiant(evaluation.etudiant_id || stage?.etudiant_id) ||
            `Étudiant #${evaluation.etudiant_id || stage?.etudiant_id || "inconnu"}`;

        const entrepriseNom =
            evaluation.entreprise_nom ||
            stage?.entreprise_nom ||
            "—";

        const sujet =
            evaluation.sujet ||
            stage?.sujet ||
            "Stage";

        const noteValue = Number(evaluation.note);

        const noteClass = getNoteClass(noteValue);

        const appreciationText =
            evaluation.appreciation ||
            "Aucune appréciation";

        const date =
            formatDate(evaluation.date_evaluation);


        return `
            <tr>

                <td>

                    <div class="stage-info">

                        <span class="stage-title">
                            ${escapeHTML(sujet)}
                        </span>

                        <span class="stage-id">
                            Stage #${escapeHTML(
            String(evaluation.stage_id ?? "")
        )}
                        </span>

                    </div>

                </td>


                <td>

                    <div class="student-info">

                        <div class="student-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>

                        <div class="student-details">

                            <span class="student-name">
                                ${escapeHTML(etudiantNom)}
                            </span>

                            ${evaluation.etudiant_email
                ? `
                                    <span class="student-email">
                                        ${escapeHTML(
                    evaluation.etudiant_email
                )}
                                    </span>
                                    `
                : ""
            }

                        </div>

                    </div>

                </td>


                <td>
                    ${escapeHTML(entrepriseNom)}
                </td>


                <td>

                    <span class="note ${noteClass}">
                        <i class="fa-solid fa-star"></i>
                        ${isNaN(noteValue)
                ? "—"
                : noteValue.toFixed(2)
            } / 20
                    </span>

                </td>


                <td>

                    <div class="appreciation"
                         title="${escapeHTML(appreciationText)}">

                        ${escapeHTML(appreciationText)}

                    </div>

                </td>


                <td>

                    <span class="date-evaluation">
                        ${escapeHTML(date)}
                    </span>

                </td>


                <td>

                    <div class="actions">

                        <button
                            class="action-btn edit-btn"
                            title="Modifier"
                            onclick="ouvrirModification(${evaluation.id})"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            class="action-btn delete-btn"
                            title="Supprimer"
                            onclick="ouvrirSuppression(${evaluation.id})"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                </td>

            </tr>
        `;

    }).join("");

}


/* =========================================================
   TROUVER UN STAGE
========================================================= */

function trouverStage(id) {

    return stages.find(
        stage => Number(stage.id) === Number(id)
    );

}


/* =========================================================
   CLASS NOTE
========================================================= */

function getNoteClass(noteValue) {

    if (isNaN(noteValue)) {
        return "";
    }

    if (noteValue >= 16) {
        return "note-excellent";
    }

    if (noteValue >= 12) {
        return "note-good";
    }

    if (noteValue >= 10) {
        return "note-average";
    }

    return "note-low";

}


/* =========================================================
   OUVRIR AJOUT
========================================================= */

document
    .getElementById("btnAddEvaluation")
    .addEventListener("click", () => {

        evaluationForm.reset();

        evaluationId.value = "";

        modalTitle.textContent = "Nouvelle évaluation";

        submitBtn.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Enregistrer
        `;

        formError.classList.remove("show");
        formError.textContent = "";

        evaluationSearch.value = "";
        remplirSelectEtudiants();
        remplirSelectStages();

        ouvrirModal(evaluationModal);

    });


/* =========================================================
   OUVRIR MODIFICATION
========================================================= */

function ouvrirModification(id) {

    const evaluation = evaluations.find(
        item => Number(item.id) === Number(id)
    );

    if (!evaluation) {

        showNotification(
            "Évaluation introuvable",
            "error"
        );

        return;
    }


    evaluationId.value = evaluation.id;

    const stage = trouverStage(evaluation.stage_id);
    const studentId = evaluation.etudiant_id || stage?.etudiant_id;

    evaluationSearch.value = stage
        ? `${nomEtudiant(studentId)} — ${stage.sujet || "Stage"}`
        : "";

    remplirSelectEtudiants(studentId);

    remplirSelectStages(evaluation.stage_id);

    note.value = evaluation.note ?? "";

    appreciation.value =
        evaluation.appreciation ?? "";


    modalTitle.textContent =
        "Modifier l'évaluation";

    submitBtn.innerHTML = `
        <i class="fa-solid fa-pen"></i>
        Modifier
    `;

    formError.classList.remove("show");

    ouvrirModal(evaluationModal);

}


/* =========================================================
   FORMULAIRE
========================================================= */

evaluationForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    formError.classList.remove("show");
    formError.textContent = "";


    const stageValue = stageId.value;
    const studentValue = etudiantId.value;
    const noteValue = note.value;
    const appreciationValue = appreciation.value.trim();

    if (!stageValue) {

        afficherErreurFormulaire(
            "Veuillez sélectionner un stage."
        );

        return;
    }

    if (!studentValue) {

        afficherErreurFormulaire(
            "Veuillez sélectionner un étudiant."
        );

        return;
    }

    const selectedStage = trouverStage(stageValue);

    if (selectedStage && Number(selectedStage.etudiant_id) !== Number(studentValue)) {
        afficherErreurFormulaire("L'étudiant sélectionné ne correspond pas au stage.");
        return;
    }


    if (
        noteValue === "" ||
        Number(noteValue) < 0 ||
        Number(noteValue) > 20
    ) {

        afficherErreurFormulaire(
            "La note doit être comprise entre 0 et 20."
        );

        return;
    }


    const data = {

        stage_id: Number(stageValue),

        note: Number(noteValue),

        appreciation:
            appreciationValue || null

    };


    const id = evaluationId.value;

    const isModification = Boolean(id);

    const url = isModification
        ? `${API_URL}/evaluations/modifier.php?id=${encodeURIComponent(id)}`
        : `${API_URL}/evaluations/ajouter.php`;


    try {

        submitBtn.disabled = true;

        submitBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            ${isModification
                ? "Modification..."
                : "Enregistrement..."
            }
        `;


        const response = await fetch(url, {

            method: isModification
                ? "PUT"
                : "POST",

            headers: getHeaders(),

            body: JSON.stringify(data)

        });


        const result = await response.json();


        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Une erreur est survenue"
            );

        }


        fermerModal(evaluationModal);

        showNotification(
            isModification
                ? "Évaluation modifiée avec succès"
                : "Évaluation ajoutée avec succès",
            "success"
        );


        await chargerEvaluations();


    } catch (error) {

        console.error(
            "❌ Erreur enregistrement :",
            error
        );

        afficherErreurFormulaire(
            error.message ||
            "Erreur lors de l'enregistrement"
        );

    } finally {

        submitBtn.disabled = false;

        submitBtn.innerHTML = isModification
            ? `
                <i class="fa-solid fa-pen"></i>
                Modifier
              `
            : `
                <i class="fa-solid fa-floppy-disk"></i>
                Enregistrer
              `;

    }

});


/* =========================================================
   SUPPRESSION
========================================================= */

function ouvrirSuppression(id) {

    const evaluation = evaluations.find(
        item => Number(item.id) === Number(id)
    );

    if (!evaluation) {

        showNotification(
            "Évaluation introuvable",
            "error"
        );

        return;
    }

    evaluationToDelete = id;

    ouvrirModal(deleteModal);

}


/* =========================================================
   CONFIRMER SUPPRESSION
========================================================= */

document
    .getElementById("confirmDelete")
    .addEventListener("click", async () => {

        if (!evaluationToDelete) {
            return;
        }


        const id = evaluationToDelete;

        const button =
            document.getElementById("confirmDelete");


        try {

            button.disabled = true;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Suppression...
            `;


            const response = await fetch(
                `${API_URL}/evaluations/supprimer.php?id=${encodeURIComponent(id)}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );


            const result = await response.json();


            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Impossible de supprimer l'évaluation"
                );

            }


            fermerModal(deleteModal);

            evaluationToDelete = null;


            showNotification(
                "Évaluation supprimée avec succès",
                "success"
            );


            await chargerEvaluations();


        } catch (error) {

            console.error(
                "❌ Erreur suppression :",
                error
            );

            showNotification(
                error.message ||
                "Erreur lors de la suppression",
                "error"
            );

        } finally {

            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-trash"></i>
                Supprimer
            `;

        }

    });


/* =========================================================
   FERMETURE MODALS
========================================================= */

document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        () => fermerModal(evaluationModal)
    );


document
    .getElementById("cancelModal")
    .addEventListener(
        "click",
        () => fermerModal(evaluationModal)
    );


document
    .getElementById("cancelDelete")
    .addEventListener(
        "click",
        () => {

            evaluationToDelete = null;

            fermerModal(deleteModal);

        }
    );


/* =========================================================
   CLIQUE EN DEHORS DU MODAL
========================================================= */

evaluationModal.addEventListener("click", event => {

    if (event.target === evaluationModal) {
        fermerModal(evaluationModal);
    }

});


deleteModal.addEventListener("click", event => {

    if (event.target === deleteModal) {

        evaluationToDelete = null;

        fermerModal(deleteModal);

    }

});


/* =========================================================
   FONCTIONS MODAL
========================================================= */

function ouvrirModal(modal) {

    modal.classList.add("show");

    document.body.style.overflow = "hidden";

}


function fermerModal(modal) {

    modal.classList.remove("show");

    if (
        !evaluationModal.classList.contains("show") &&
        !deleteModal.classList.contains("show")
    ) {
        document.body.style.overflow = "";
    }

}


/* =========================================================
   RECHERCHE
========================================================= */

searchInput.addEventListener("input", () => {

    const search = searchInput.value
        .toLowerCase()
        .trim();


    if (!search) {

        afficherEvaluations(evaluations);

        return;
    }


    const resultats = evaluations.filter(evaluation => {

        const stage = trouverStage(
            evaluation.stage_id
        );


        const texte = [

            evaluation.etudiant_nom,
            nomEtudiant(evaluation.etudiant_id || stage?.etudiant_id),

            evaluation.etudiant_email,

            evaluation.entreprise_nom,

            evaluation.sujet,

            evaluation.appreciation,

            evaluation.note,

            stage?.etudiant_nom,

            stage?.entreprise_nom,

            stage?.sujet

        ]
            .filter(value => value !== undefined && value !== null)
            .join(" ")
            .toLowerCase();


        return texte.includes(search);

    });


    afficherEvaluations(resultats);

});


/* =========================================================
   ACTUALISER
========================================================= */

document
    .getElementById("btnRefresh")
    .addEventListener("click", async () => {

        const button =
            document.getElementById("btnRefresh");

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
        `;

        await chargerEtudiants();
        await chargerStages();
        await chargerEvaluations();

        button.innerHTML = `
            <i class="fa-solid fa-rotate"></i>
        `;

    });


/* =========================================================
   MENU MOBILE
========================================================= */

const sidebar =
    document.getElementById("sidebar");

const menuToggle =
    document.getElementById("mobileMenuBtn");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");


menuToggle.addEventListener("click", () => {

    sidebar.classList.toggle("open");
    sidebarOverlay.classList.toggle("show");

});


sidebarOverlay.addEventListener("click", () => {

    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");

});


/* =========================================================
   LOGOUT
========================================================= */

document
    .getElementById("logoutBtn")
    .addEventListener("click", () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "../index.html";

    });


/* =========================================================
   NOTIFICATION
========================================================= */

let notificationTimer;


function showNotification(message, type = "success") {

    clearTimeout(notificationTimer);


    notification.className =
        `notification ${type} show`;


    notificationIcon.className =
        type === "success"
            ? "fa-solid fa-circle-check"
            : "fa-solid fa-circle-exclamation";


    notificationMessage.textContent = message;


    notificationTimer = setTimeout(() => {

        notification.classList.remove("show");

    }, 3500);

}


/* =========================================================
   ERREUR FORMULAIRE
========================================================= */

function afficherErreurFormulaire(message) {

    formError.textContent = message;

    formError.classList.add("show");

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }


    const date = new Date(dateString);


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


/* =========================================================
   SECURITE HTML
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   CHARGER LES ETUDIANTS
========================================================= */

async function chargerEtudiants() {

    try {

        const response = await fetch(
            `${API_URL}/integration/etudiants.php`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Impossible de charger les étudiants");
        }

        etudiants = Array.isArray(result.data) ? result.data : [];
        remplirSelectEtudiants();

    } catch (error) {

        console.error("❌ Erreur étudiants :", error);
        etudiantId.innerHTML = `<option value="">Impossible de charger les étudiants</option>`;
        showNotification(error.message || "Erreur lors du chargement des étudiants", "error");

    }

}


function nomEtudiant(id) {

    const etudiant = etudiants.find(
        item => Number(item.id) === Number(id)
    );

    return etudiant
        ? `${etudiant.nom || ""} ${etudiant.prenom || ""}`.trim()
        : "";

}


function remplirSelectEtudiants(selectedId = null) {

    etudiantId.innerHTML = `<option value="">Sélectionner un étudiant</option>`;

    etudiants.forEach(etudiant => {

        const option = document.createElement("option");
        const nom = `${etudiant.nom || ""} ${etudiant.prenom || ""}`.trim();

        option.value = etudiant.id;
        option.textContent = nom || `Étudiant #${etudiant.id}`;
        option.selected = selectedId !== null && Number(selectedId) === Number(etudiant.id);
        etudiantId.appendChild(option);

    });

}


etudiantId.addEventListener("change", () => {
    remplirSelectStages();
});


function normaliserRecherche(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


evaluationSearch.addEventListener("input", () => {

    const recherche = normaliserRecherche(evaluationSearch.value);

    if (!recherche) {
        return;
    }

    const stageCorrespondant = stages.find(stage => {

        const texteEtudiant = normaliserRecherche(
            nomEtudiant(stage.etudiant_id)
        );

        const texteStage = normaliserRecherche(stage.sujet);
        const texteEntreprise = normaliserRecherche(stage.entreprise_nom);

        return texteEtudiant.includes(recherche) ||
            texteStage.includes(recherche) ||
            texteEntreprise.includes(recherche);

    });

    if (!stageCorrespondant) {
        return;
    }

    remplirSelectEtudiants(stageCorrespondant.etudiant_id);
    remplirSelectStages(stageCorrespondant.id);

});