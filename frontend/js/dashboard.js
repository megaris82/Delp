// Logic for dashboard.html: the tickets list, the detail view, the new-ticket
// form, and the agent management panel (status/assignment/resolution/comments).

// Redirect to login if not authenticated; grab the user object.
const user = requireAuth();
// Tickets in these statuses count as "open" for regular users.
const OPEN_STATUSES = ["open", "in_progress"];
const PAST_STATUSES = ["closed"];
// Tickets cached by id, so opening the detail modal can read from memory.
let ticketsById = {};
// Object URL for the attachment currently being previewed. Revoked when a
// new one is opened, otherwise the browser keeps the blob alive.
let attachmentObjUrl = null;

if (user) {
  mountNav(user);
  // Regular users need the category list for the new-ticket form; agents don't.
  if (!isAgent()) {
    loadCategories();
  }
  loadTickets();
}

// Is the current user an agent (admin or technician)?
function isAgent() {
  return user.role === "admin" || user.role === "technician";
}

// Turn a status into the text shown in the UI. Only in_progress needs changing.
function statusLabel(status) {
  if (status === "in_progress") {
    return "in progress";
  }
  return status || "";
}

// Build the "Άνοιγμα" button cell for a table row.
function openCell(id) {
  return (
    '<td class="actions">' +
    '<button class="btn btn-outline" onclick="openTicket(' + id + ')">Άνοιγμα</button>' +
    "</td>"
  );
}

// Load tickets from the API and render them (all for agents, own for users).
function loadTickets() {
  api("/api/tickets")
    .then(function (res) {
      const tickets = res.data.tickets || [];
      ticketsById = {};
      for (let i = 0; i < tickets.length; i++) {
        ticketsById[tickets[i].id] = tickets[i];
      }
      if (isAgent()) {
        renderAll(tickets);
      } else {
        renderUser(tickets);
      }
    })
    .catch(function () {
      notify("Αδυναμία φόρτωσης tickets.", "error");
    });
}

// Render the agent view: two tables, one for open/in_progress and one for closed.
// Within each table rows are sorted by id ascending.
function renderAll(tickets) {
  document.getElementById("allSection").style.display = "";
  document.getElementById("userSection").style.display = "none";
  document.getElementById("pageTitle").textContent = "Όλα τα Tickets";

  const sorted = tickets.slice().sort(function (a, b) {
    return a.id - b.id;
  });

  const open = [];
  const closed = [];
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    if (PAST_STATUSES.indexOf(t.status) !== -1) {
      closed.push(t);
    } else {
      open.push(t);
    }
  }

  const openRows = document.getElementById("openAgentRows");
  if (!open.length) {
    openRows.innerHTML = '<tr><td colspan="8">Δεν υπάρχουν ανοιχτά αιτήματα.</td></tr>';
  } else {
    openRows.innerHTML = buildAgentRows(open);
  }

  const closedRows = document.getElementById("closedAgentRows");
  if (!closed.length) {
    closedRows.innerHTML = '<tr><td colspan="8">Δεν υπάρχουν κλειστά αιτήματα.</td></tr>';
  } else {
    closedRows.innerHTML = buildAgentRows(closed);
  }
}

// Build the rows for the agent tables (includes creator and assignee columns).
function buildAgentRows(tickets) {
  let html = "";
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    html +=
      "<tr>" +
      "<td>" + t.id + "</td>" +
      "<td>" + escapeHtml(statusLabel(t.status)) + "</td>" +
      "<td>" + escapeHtml(t.category) + "</td>" +
      "<td>" + escapeHtml(t.priority) + "</td>" +
      "<td>" + escapeHtml(t.created_by_name) + "</td>" +
      "<td>" + escapeHtml(t.assigned_to_name) + "</td>" +
      "<td>" + escapeHtml(t.created_at) + "</td>" +
      openCell(t.id) +
      "</tr>";
  }
  return html;
}

// Render the user view: open tickets on top, past (closed) tickets below.
function renderUser(tickets) {
  document.getElementById("allSection").style.display = "none";
  document.getElementById("userSection").style.display = "";
  document.getElementById("pageTitle").textContent = "Τα Tickets μου";

  const open = [];
  const past = [];
  for (let i = 0; i < tickets.length; i++) {
    if (OPEN_STATUSES.indexOf(tickets[i].status) !== -1) {
      open.push(tickets[i]);
    } else {
      past.push(tickets[i]);
    }
  }

  const openRows = document.getElementById("openRows");
  if (!open.length) {
    openRows.innerHTML = '<tr><td colspan="6">Δεν υπάρχουν ανοιχτά αιτήματα.</td></tr>';
  } else {
    openRows.innerHTML = buildRows(open);
  }

  const pastRows = document.getElementById("pastRows");
  if (!past.length) {
    pastRows.innerHTML = '<tr><td colspan="6">Δεν υπάρχουν προηγούμενα αιτήματα.</td></tr>';
  } else {
    pastRows.innerHTML = buildRows(past);
  }
}

// Build the rows for the user tables (no creator/assignee columns).
function buildRows(tickets) {
  let html = "";
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    html +=
      "<tr>" +
      "<td>" + t.id + "</td>" +
      "<td>" + escapeHtml(statusLabel(t.status)) + "</td>" +
      "<td>" + escapeHtml(t.category) + "</td>" +
      "<td>" + escapeHtml(t.priority) + "</td>" +
      "<td>" + escapeHtml(t.created_at) + "</td>" +
      openCell(t.id) +
      "</tr>";
  }
  return html;
}

// Fill the read-only info box at the top of the detail modal.
function renderTicketInfo(t) {
  document.getElementById("detailId").textContent = t.id;
  document.getElementById("detailStatus").textContent = statusLabel(t.status);
  document.getElementById("detailCategory").textContent = t.category || "";
  document.getElementById("detailPriority").textContent = t.priority || "";
  document.getElementById("detailCreator").textContent = t.created_by_name || "";
  document.getElementById("detailAssignee").textContent = t.assigned_to_name || "";
  document.getElementById("detailCreated").textContent = t.created_at || "";
  document.getElementById("detailDesc").textContent = t.description || "";
  document.getElementById("detailResolution").textContent = t.resolution || "";
}

// Open the detail modal for a ticket and fill it in.
function openTicket(id) {
  const t = ticketsById[id];
  if (!t) {
    return;
  }
  renderTicketInfo(t);

  // Attachment buttons. We pass the ticket id + index (not the file path) into
  // the onclick, so the path isn't sitting in an inline HTML attribute.
  const att = document.getElementById("detailAttachments");
  const files = t.attachments || [];
  if (!files.length) {
    att.innerHTML = "<p>Δεν υπάρχουν συνημμένα.</p>";
  } else {
    let html = "";
    for (let i = 0; i < files.length; i++) {
      html +=
        '<button class="btn btn-outline" onclick="viewAttachment(' +
        t.id + ", " + i + ')">Προβολή</button> ';
    }
    att.innerHTML = html;
  }

  const agent = isAgent();
  const resolution = t.resolution || "";
  document.getElementById("agentPanel").style.display = agent ? "" : "none";
  // Non-agents only see the resolution box if there is one.
  document.getElementById("resolutionReadonly").style.display = agent ? "none" : resolution ? "" : "none";
  document.getElementById("commentBox").style.display = agent ? "" : "none";
  document.getElementById("detailResolution").textContent = resolution;

  if (agent) {
    document.getElementById("detailStatusInput").value = t.status || "open";
    document.getElementById("detailResolutionInput").value = resolution;
    document.getElementById("assignField").style.display = "";
    loadTechnicians(t.assigned_to_id);
  }

  loadComments(id);
  openModalById("detailOverlay");
}

// Fill the "assign to technician" dropdown with all technicians.
function loadTechnicians(selectedId) {
  const select = document.getElementById("detailAssigneeInput");
  api("/api/users?role=technician")
    .then(function (res) {
      const technicians = res.data.users || [];
      let html = '<option value="">Χωρίς ανάθεση</option>';
      for (let i = 0; i < technicians.length; i++) {
        const tech = technicians[i];
        const sel = tech.id === Number(selectedId) ? " selected" : "";
        html +=
          '<option value="' + tech.id + '"' + sel + ">" +
          escapeHtml(tech.username) +
          "</option>";
      }
      select.innerHTML = html;
    })
    .catch(function () {
      select.innerHTML = '<option value="">Σφάλμα φόρτωσης</option>';
    });
}

// Save an agent's status/resolution/assignment changes for a ticket.
function saveTicketChanges() {
  const id = document.getElementById("detailId").textContent;
  const payload = {
    status: document.getElementById("detailStatusInput").value,
    resolution: document.getElementById("detailResolutionInput").value,
  };
  if (isAgent()) {
    const assignVal = document.getElementById("detailAssigneeInput").value;
    payload.assigned_to = assignVal === "" ? null : Number(assignVal);
  }
  api("/api/tickets/" + id, { method: "PATCH", body: payload })
    .then(function (res) {
      if (res.status !== 200) {
        notify(errorText(res.data), "error");
        return;
      }
      ticketsById[id] = res.data.ticket;
      renderTicketInfo(ticketsById[id]);
      const resolution = ticketsById[id].resolution || "";
      document.getElementById("resolutionReadonly").style.display =
        isAgent() ? "none" : resolution ? "" : "none";
      notify("Οι αλλαγές αποθηκεύτηκαν.", "ok");
      loadTickets();
    })
    .catch(function () {
      notify("Σφάλμα δικτύου κατά την αποθήκευση.", "error");
    });
}

// Load and render the comments for a ticket.
function loadComments(id) {
  const box = document.getElementById("detailComments");
  api("/api/tickets/" + id + "/comments")
    .then(function (res) {
      const comments = res.data.comments || [];
      if (!comments.length) {
        box.innerHTML = "<p>Δεν υπάρχουν σχόλια.</p>";
        return;
      }
      let html = "";
      for (let i = 0; i < comments.length; i++) {
        const c = comments[i];
        html +=
          '<div class="comment">' +
          "<div>" + escapeHtml(c.body) + "</div>" +
          '<div class="comment-meta">' + escapeHtml(c.author) + " (" + escapeHtml(c.author_role) + ") — " + escapeHtml(c.created_at) + "</div>" +
          "</div>";
      }
      box.innerHTML = html;
    })
    .catch(function () {
      box.innerHTML = "<p>Αδυναμία φόρτωσης σχολίων.</p>";
    });
}

// Post a new comment as the current agent.
function addComment() {
  const id = document.getElementById("detailId").textContent;
  const input = document.getElementById("commentInput");
  const body = input.value.trim();
  if (!body) {
    return;
  }
  api("/api/tickets/" + id + "/comments", { method: "POST", body: { body: body } })
    .then(function (res) {
      if (res.status !== 201) {
        notify(errorText(res.data), "error");
        return;
      }
      input.value = "";
      loadComments(id);
    })
    .catch(function () {
      notify("Σφάλμα δικτύου κατά την προσθήκη σχολίου.", "error");
    });
}

// Fill the category <select> in the new-ticket form.
function loadCategories() {
  api("/api/categories")
    .then(function (res) {
      const select = document.getElementById("category");
      const categories = res.data.categories || [];
      let html = '<option value="" disabled selected>Επιλέξτε…</option>';
      for (let i = 0; i < categories.length; i++) {
        const c = categories[i];
        html += '<option value="' + c.id + '">' + escapeHtml(c.name) + "</option>";
      }
      select.innerHTML = html;
    })
    .catch(function () {
      notify("Αδυναμία φόρτωσης κατηγοριών.", "error");
    });
}

// Open the "new ticket" modal, resetting the form first.
function openCreateModal() {
  document.getElementById("createForm").reset();
  openModalById("createOverlay");
}

// Submit a new ticket (with an optional image) as multipart/form-data.
function submitCreate(e) {
  e.preventDefault();
  const form = document.getElementById("createForm");
  const formData = new FormData(form);

  if (!formData.get("category_id")) {
    notify("Επιλέξτε κατηγορία.", "error");
    return;
  }
  if (!formData.get("description").trim()) {
    notify("Η περιγραφή είναι υποχρεωτική.", "error");
    return;
  }

  // Match the backend 5 MB limit so we fail early instead of after uploading.
  const fileInput = form.querySelector("#attachment");
  if (fileInput && fileInput.files && fileInput.files[0]) {
    if (fileInput.files[0].size > 5 * 1024 * 1024) {
      notify("Το αρχείο υπερβαίνει το μέγιστο μέγεθος (5MB).", "error");
      return;
    }
  }

  api("/api/tickets", { method: "POST", body: formData })
    .then(function (res) {
      if (res.status !== 201) {
        notify(errorText(res.data), "error");
        return;
      }
      closeModalById("createOverlay");
      notify("Το αίτημα υποβλήθηκε.", "ok");
      loadTickets();
    })
    .catch(function () {
      notify("Σφάλμα δικτύου κατά την υποβολή.", "error");
    });
}

// Open the attachment viewer for the attachment at `index` of ticket `id`.
// The file is fetched through /api/uploads (which checks ownership) and shown
// via a blob URL so the token-protected response can be displayed in an <img>.
function viewAttachment(id, index) {
  const t = ticketsById[id];
  if (!t || !t.attachments || !t.attachments[index]) {
    notify("Το συνημμένο δεν βρέθηκε.", "error");
    return;
  }
  const filename = t.attachments[index].split("/").pop();
  const token = localStorage.getItem("token");
  fetch("/api/uploads/" + encodeURIComponent(filename), {
    headers: { Authorization: "Bearer " + token },
  })
    .then(function (res) {
      if (!res.ok) {
        notify("Σφάλμα φόρτωσης συνημμένου.", "error");
        return null;
      }
      return res.blob();
    })
    .then(function (blob) {
      if (!blob) {
        return;
      }
      // Revoke the previous object URL so we don't leak blob memory. We do it
      // before creating the new one (not on img load) because the same URL is
      // used by both the <img> and the download <a> below.
      if (attachmentObjUrl) {
        URL.revokeObjectURL(attachmentObjUrl);
      }
      attachmentObjUrl = URL.createObjectURL(blob);
      const img = document.getElementById("attachmentImg");
      img.src = attachmentObjUrl;
      const link = document.getElementById("attachmentDownload");
      link.href = attachmentObjUrl;
      link.download = filename;
      openModalById("attachmentOverlay");
    })
    .catch(function () {
      notify("Σφάλμα δικτύου.", "error");
    });
}
