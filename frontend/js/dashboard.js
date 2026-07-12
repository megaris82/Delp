const user = requireAuth();

if (user) {
  mountNav(user);
  loadTickets();
}

function loadTickets() {
  api("/api/tickets")
    .then(function (res) {
      const rows = document.getElementById("ticketRows");
      const tickets = res.data.tickets || [];
      if (!tickets.length) {
        rows.innerHTML = '<tr><td colspan="8">Δεν υπάρχουν tickets.</td></tr>';
        return;
      }
      let html = "";
      for (let i = 0; i < tickets.length; i++) {
        const t = tickets[i];
        html +=
          "<tr>" +
          "<td>" + t.id + "</td>" +
          "<td>" + escapeHtml(t.status) + "</td>" +
          "<td>" + escapeHtml(t.category) + "</td>" +
          "<td>" + escapeHtml(t.priority) + "</td>" +
          "<td>" + escapeHtml(t.description) + "</td>" +
          "<td>" + escapeHtml(t.created_by) + "</td>" +
          "<td>" + escapeHtml(t.assigned_to) + "</td>" +
          "<td>" + escapeHtml(t.created_at) + "</td>" +
          "</tr>";
      }
      rows.innerHTML = html;
    })
    .catch(function () {
      document.getElementById("msg").textContent = "Αδυναμία φόρτωσης tickets.";
      document.getElementById("msg").className = "msg error";
    });
}
