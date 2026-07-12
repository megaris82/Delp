const user = requireAuth(["admin"]);
const isAdmin = user && user.role === "admin";

if (user) {
  mountNav(user);
  if (isAdmin) {
    document.getElementById("announcementPanel").style.display = "block";
  }
  loadAnnouncements();
}

function setMsg(text, type) {
  const msg = document.getElementById("msg");
  msg.textContent = text;
  msg.className = type ? "msg " + type : "msg";
}

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
        let actions = "";
        if (isAdmin) {
          actions =
            '<div class="actions">' +
            '<button class="btn btn-outline" onclick="editAnnouncement(' + a.id + ')">Επεξεργασία</button> ' +
            '<button class="btn btn-danger" onclick="deleteAnnouncement(' + a.id + ')">Διαγραφή</button>' +
            "</div>";
        }
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
      setMsg("Αδυναμία φόρτωσης ανακοινώσεων.", "error");
    });
}

function openAnnouncementModal() {
  document.getElementById("announcementModalTitle").textContent = "Νέα Ανακοίνωση";
  document.getElementById("announcementId").value = "";
  document.getElementById("title").value = "";
  document.getElementById("body").value = "";
  document.getElementById("title").focus();
}

function editAnnouncement(id) {
  const card = document.getElementById("announcement-" + id);
  document.getElementById("editAnnouncementId").value = id;
  document.getElementById("editTitle").value = card.querySelector("[data-title]").textContent;
  document.getElementById("editBody").value = card.querySelector("[data-body]").textContent;
  openModalById("announcementEditOverlay");
}

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
        setMsg(errorText(res.data), "error");
        return;
      }
      closeModalById("announcementEditOverlay");
      setMsg("Αποθηκεύτηκε.", "ok");
      loadAnnouncements();
    })
    .catch(function () {
      setMsg("Σφάλμα δικτύου.", "error");
    });
}

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
        setMsg(errorText(res.data), "error");
        return;
      }
      setMsg("Αποθηκεύτηκε.", "ok");
      openAnnouncementModal();
      loadAnnouncements();
    })
    .catch(function () {
      setMsg("Σφάλμα δικτύου.", "error");
    });
}

function deleteAnnouncement(id) {
  confirmDialog("Διαγραφή ανακοίνωσης;", function () {
    api("/api/announcements/" + id, { method: "DELETE" })
      .then(function (res) {
        if (res.status !== 200) {
          setMsg(errorText(res.data), "error");
          return;
        }
        loadAnnouncements();
      })
      .catch(function () {
        setMsg("Σφάλμα δικτύου.", "error");
      });
  });
}

function errorText(data) {
  if (data && Array.isArray(data.details) && data.details.length) {
    return data.details.join(" • ");
  }
  return (data && (data.error || data.message)) || "Κάτι πήγε στραβά.";
}
