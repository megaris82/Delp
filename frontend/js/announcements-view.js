// Logic for announcements-view.html: read-only announcement list for all users.

// Redirect to login if not authenticated; grab the user object.
const user = requireAuth();

if (user) {
  mountNav(user);
  loadAnnouncements();
}

// Load and render all announcements (no edit/delete actions on this page).
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
        html +=
          '<article class="card" id="announcement-' + a.id + '">' +
          "<h3>" + escapeHtml(a.title) + "</h3>" +
          "<p>" + escapeHtml(a.body) + "</p>" +
          "<small>" + escapeHtml(a.created_by) + " — " + escapeHtml(a.created_at) + "</small>" +
          "</article>";
      }
      list.innerHTML = html;
    })
    .catch(function () {
      notify("Αδυναμία φόρτωσης ανακοινώσεων.", "error");
    });
}
