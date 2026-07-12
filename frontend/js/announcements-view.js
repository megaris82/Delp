const user = requireAuth();

if (user) {
  mountNav(user);
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
      setMsg("Αδυναμία φόρτωσης ανακοινώσεων.", "error");
    });
}
