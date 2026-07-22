// Logic for announcements.html: admin announcement management (list, create,
// edit, delete).

// Only admins can open this page; requireAuth redirects everyone else away.
const user = requireAuth(["admin"]);

if (user) {
  mountNav(user);
  // Show the create form in the side panel.
  document.getElementById("announcementPanel").style.display = "block";
  loadAnnouncements();
}

// Load announcements and render them with edit/delete buttons.
function loadAnnouncements() {
  api("/api/announcements")
    .then(function (res) {
      const list = document.getElementById("announcementList");
      const announcements = res.data.announcements || [];
      if (!announcements.length) {
        list.innerHTML = "<p>Δεν υπάρχουν ανακοινώσεις.</p>";
        return;
      }
      let html = "";
      for (let i = 0; i < announcements.length; i++) {
        const a = announcements[i];
        const actions =
          '<div class="actions">' +
          '<button class="btn btn-outline" onclick="editAnnouncement(' + a.id + ')">Επεξεργασία</button> ' +
          '<button class="btn btn-danger" onclick="deleteAnnouncement(' + a.id + ')">Διαγραφή</button>' +
          "</div>";
        html +=
          '<article class="card" id="announcement-' + a.id + '">' +
          '<h3 data-title>' + escapeHtml(a.title) + "</h3>" +
          '<p data-body>' + escapeHtml(a.body) + "</p>" +
          '<small>' + escapeHtml(a.created_by) + " — " + escapeHtml(a.created_at) + "</small>" +
          actions +
          "</article>";
      }
      list.innerHTML = html;
    })
    .catch(function () {
      notify("Αδυναμία φόρτωσης ανακοινώσεων.", "error");
    });
}

// Open the edit dialog, copying the announcement's current values into the form.
// Reads them back out of the rendered card via the data-title/data-body hooks.
function editAnnouncement(id) {
  const card = document.getElementById("announcement-" + id);
  document.getElementById("editAnnouncementId").value = id;
  document.getElementById("editTitle").value = card.querySelector("[data-title]").textContent;
  document.getElementById("editBody").value = card.querySelector("[data-body]").textContent;
  openModalById("announcementEditOverlay");
}

// Save an edited announcement via PUT.
function saveAnnouncementEdit(e) {
  e.preventDefault();
  const id = document.getElementById("editAnnouncementId").value;
  const payload = {
    title: document.getElementById("editTitle").value,
    body: document.getElementById("editBody").value,
  };

  api("/api/announcements/" + id, { method: "PUT", body: payload })
    .then(function (res) {
      if (res.status !== 200) {
        notify(errorText(res.data), "error");
        return;
      }
      closeModalById("announcementEditOverlay");
      notify("Αποθηκεύτηκε.", "ok");
      loadAnnouncements();
    })
    .catch(function () {
      notify("Σφάλμα δικτύου.", "error");
    });
}

// Create a new announcement (the side-panel form submits here). If
// announcementId is set it does a PUT instead, so the same form can edit too.
function saveAnnouncement(e) {
  e.preventDefault();
  const id = document.getElementById("announcementId").value;
  const payload = {
    title: document.getElementById("title").value,
    body: document.getElementById("body").value,
  };
  const path = id ? "/api/announcements/" + id : "/api/announcements";
  const method = id ? "PUT" : "POST";

  api(path, { method: method, body: payload })
    .then(function (res) {
      if (res.status !== 200 && res.status !== 201) {
        notify(errorText(res.data), "error");
        return;
      }
      notify("Αποθηκεύτηκε.", "ok");
      // Reset the side-panel form for the next entry.
      document.getElementById("announcementModalTitle").textContent = "Νέα Ανακοίνωση";
      document.getElementById("announcementId").value = "";
      document.getElementById("title").value = "";
      document.getElementById("body").value = "";
      document.getElementById("title").focus();
      loadAnnouncements();
    })
    .catch(function () {
      notify("Σφάλμα δικτύου.", "error");
    });
}

// Delete an announcement after confirmation.
function deleteAnnouncement(id) {
  confirmDialog("Διαγραφή ανακοίνωσης;", function () {
    api("/api/announcements/" + id, { method: "DELETE" })
      .then(function (res) {
        if (res.status !== 200) {
          notify(errorText(res.data), "error");
          return;
        }
        loadAnnouncements();
      })
      .catch(function () {
        notify("Σφάλμα δικτύου.", "error");
      });
  });
}
