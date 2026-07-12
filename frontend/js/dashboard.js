// dashboard.html logic: tickets list + detail view + creation + agent management.
// Regular users see only their own tickets (open + past). Agents (admin/technician)
// see all tickets and get a management panel (status / assignment / resolution / comments).

// Ensure the visitor is authenticated; store the user object.
const user = requireAuth();
// Tickets with these statuses are shown under "open" for regular users.
const OPEN_STATUSES = ["open", "in_progress"];
// Closed tickets are shown under "past" (history).
const PAST_STATUSES = ["closed"];
// Local cache of tickets by id for quick lookups when opening the detail modal.
let ticketsById = {};

// On page load: build the nav and fetch tickets (and, for users, the category list).
if (user) {
  mountNav(user);
  if (!isAgent()) {
    loadCategories();
  }
  loadTickets();
}

// Display a message as a modal popup only (type: "", "error", "ok", "info").
function setMsg(text, type) {
  if (text) {
    notify(text, type);
  }
}

// Is the current user an agent (admin or technician)?
function isAgent() {
  return user.role === "admin" || user.role === "technician";
}

// Human-readable label for a ticket status.
function statusLabel(status) {
  if (status === "in_progress") {
    return "in progress";
  }
  return status || "";
}

// Build the "Άνοιγμα" action cell for a table row.
function openCell(id) {
  return (
    '<td class="actions">' +
    '<button class="btn btn-outline" onclick="openTicket(' + id + ')">Άνοιγμα</button>' +
    "</td>"
  );
}

// Load tickets from the API and render them (all vs. own).
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
      setMsg("Αδυναμία φόρτωσης tickets.", "error");
    });
}

// Render the open/in_progress and closed ticket tables for agents.
// Tickets are ranked by ascending id within each table.
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

// Build table rows for the agent view (includes creator and assignee columns).
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
      "<td>" + escapeHtml(t.created_by) + "</td>" +
      "<td>" + escapeHtml(t.assigned_to) + "</td>" +
      "<td>" + escapeHtml(t.created_at) + "</td>" +
      openCell(t.id) +
      "</tr>";
  }
  return html;
}

// Render the open + past ticket tables for regular users.
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

// Build table rows for the user view (fewer columns).
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

// Populate the read-only "top box" of the detail modal (info list, description,
// and the read-only resolution shown to non-agents) from a ticket object.
function renderTicketInfo(t) {
  document.getElementById("detailId").textContent = t.id;
  document.getElementById("detailStatus").textContent = statusLabel(t.status);
  document.getElementById("detailCategory").textContent = t.category || "";
  document.getElementById("detailPriority").textContent = t.priority || "";
  document.getElementById("detailCreator").textContent = t.created_by || "";
  document.getElementById("detailAssignee").textContent = t.assigned_to || "";
  document.getElementById("detailCreated").textContent = t.created_at || "";
  document.getElementById("detailDesc").textContent = t.description || "";
  document.getElementById("detailResolution").textContent = t.resolution || "";
}

// Open the detail modal for a ticket and populate it.
function openTicket(id) {
  const t = ticketsById[id];
  if (!t) {
    return;
  }
  renderTicketInfo(t);

  const att = document.getElementById("detailAttachments");
  const files = t.attachments || [];
  if (!files.length) {
    att.innerHTML = "<p>Δεν υπάρχουν συνημμένα.</p>";
  } else {
    let html = "";
    for (let i = 0; i < files.length; i++) {
      // Pass the numeric ticket id + attachment index rather than the file
      // path, so the URL is never interpolated into an inline onclick handler.
      html +=
        '<button class="btn btn-outline" onclick="viewAttachment(' +
        t.id + ", " + i + ')">Προβολή</button> ';
    }
    att.innerHTML = html;
  }

  const agent = isAgent();
  const resolution = t.resolution || "";
  document.getElementById("agentPanel").style.display = agent ? "" : "none";
  document.getElementById("resolutionReadonly").style.display = agent ? "none" : resolution ? "" : "none";
  document.getElementById("commentBox").style.display = agent ? "" : "none";
  document.getElementById("detailResolution").textContent = resolution;

  if (agent) {
    document.getElementById("detailStatusInput").value = t.status || "open";
    document.getElementById("detailResolutionInput").value = resolution;
    if (user.role === "admin" || user.role === "technician") {
      document.getElementById("assignField").style.display = "";
      loadTechnicians(t.assigned_to);
    } else {
      document.getElementById("assignField").style.display = "none";
    }
  }

  loadComments(id);
  openModalById("detailOverlay");
}

// Populate the "assign to technician" dropdown with all technicians.
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

// Save status / resolution / assignment changes made by an agent.
function saveTicketChanges() {
  const id = document.getElementById("detailId").textContent;
  const payload = {
    status: document.getElementById("detailStatusInput").value,
    resolution: document.getElementById("detailResolutionInput").value,
  };
  if (user.role === "admin" || user.role === "technician") {
    const assignVal = document.getElementById("detailAssigneeInput").value;
    payload.assigned_to = assignVal === "" ? null : Number(assignVal);
  }
  api("/api/tickets/" + id, { method: "PATCH", body: payload })
    .then(function (res) {
      if (res.status !== 200) {
        setMsg(errorText(res.data), "error");
        return;
      }
      ticketsById[id] = res.data.ticket;
      renderTicketInfo(ticketsById[id]);
      const resolution = ticketsById[id].resolution || "";
      document.getElementById("resolutionReadonly").style.display =
        isAgent() ? "none" : resolution ? "" : "none";
      setMsg("Οι αλλαγές αποθηκεύτηκαν.", "ok");
      loadTickets();
    })
    .catch(function () {
      setMsg("Σφάλμα δικτύου κατά την αποθήκευση.", "error");
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
        setMsg(errorText(res.data), "error");
        return;
      }
      input.value = "";
      loadComments(id);
    })
    .catch(function () {
      setMsg("Σφάλμα δικτύου κατά την προσθήκη σχολίου.", "error");
    });
}

// Load the category list into the "new ticket" form's <select>.
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
      setMsg("Αδυναμία φόρτωσης κατηγοριών.", "error");
    });
}

// Open the "new ticket" creation modal (resetting the form first).
function openCreateModal() {
  document.getElementById("createForm").reset();
  openModalById("createOverlay");
}

// Submit a new ticket (with optional file attachment) via multipart/form-data.
function submitCreate(e) {
  e.preventDefault();
  const form = document.getElementById("createForm");
  const formData = new FormData(form);

  if (!formData.get("category_id")) {
    setMsg("Επιλέξτε κατηγορία.", "error");
    return;
  }
  if (!formData.get("description").trim()) {
    setMsg("Η περιγραφή είναι υποχρεωτική.", "error");
    return;
  }

  // Client-side guard mirroring the backend 5 MB multer limit.
  const fileInput = form.querySelector("#attachment");
  if (fileInput && fileInput.files && fileInput.files[0]) {
    if (fileInput.files[0].size > 5 * 1024 * 1024) {
      setMsg("Το αρχείο υπερβαίνει το μέγιστο μέγεθος (5MB).", "error");
      return;
    }
  }

  api("/api/tickets", { method: "POST", body: formData })
    .then(function (res) {
      if (res.status !== 201) {
        setMsg(errorText(res.data), "error");
        return;
      }
      closeModalById("createOverlay");
      setMsg("Το αίτημα υποβλήθηκε.", "ok");
      loadTickets();
    })
    .catch(function () {
      setMsg("Σφάλμα δικτύου κατά την υποβολή.", "error");
    });
}

// Open the attachment viewer modal for the attachment at the given index of the
// cached ticket. The file is fetched through the authenticated /api/uploads
// endpoint (which also enforces ownership) and shown via a blob URL.
function viewAttachment(id, index) {
  const t = ticketsById[id];
  if (!t || !t.attachments || !t.attachments[index]) {
    setMsg("Το συνημμένο δεν βρέθηκε.", "error");
    return;
  }
  const filename = t.attachments[index].split("/").pop();
  const token = localStorage.getItem("token");
  fetch("/api/uploads/" + encodeURIComponent(filename), {
    headers: { Authorization: "Bearer " + token },
  })
    .then(function (res) {
      if (!res.ok) {
        setMsg("Σφάλμα φόρτωσης συνημμένου.", "error");
        return null;
      }
      return res.blob();
    })
    .then(function (blob) {
      if (!blob) {
        return;
      }
      const objUrl = URL.createObjectURL(blob);
      const img = document.getElementById("attachmentImg");
      // Revoke the previous object URL once the new image has loaded.
      img.onload = function () {
        URL.revokeObjectURL(objUrl);
      };
      img.src = objUrl;
      const link = document.getElementById("attachmentDownload");
      link.href = objUrl;
      link.download = filename;
      openModalById("attachmentOverlay");
    })
    .catch(function () {
      setMsg("Σφάλμα δικτύου.", "error");
    });
}

// Extract a human-readable error message from an API response.
function errorText(data) {
  if (data && Array.isArray(data.details) && data.details.length) {
    return data.details.join(" • ");
  }
  return (data && (data.error || data.message)) || "Κάτι πήγε στραβά.";
}
