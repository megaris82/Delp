// Shared helpers used by every authenticated page: token/user storage, route
// guards, the top nav, a fetch wrapper, HTML escaping, and the pop-up dialogs.

// Read the JWT from localStorage.
function getToken() {
  return localStorage.getItem("token");
}

// Read the current user object from localStorage (parsed JSON).
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    return null;
  }
}

// Clear the session and go back to the landing page.
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

// Route guard. If there's no token, send to login. If the user's role isn't in
// allowedRoles, send to the dashboard. Returns the user object or null.
function requireAuth(allowedRoles) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = "../index.html";
    return null;
  }
  if (allowedRoles && allowedRoles.indexOf(user.role) === -1) {
    window.location.href = "../dashboard.html";
    return null;
  }
  return user;
}

// Build the top navigation HTML based on the user's role.
// Everyone sees "Tickets" and "Ανακοινώσεις"; admins also see "Χρήστες" and
// "Κατηγορίες". Admins manage announcements, everyone else only views them.
function renderNav(user) {
  const links = [{ label: "Tickets", href: "dashboard.html" }];

  if (user.role === "admin") {
    links.push({ label: "Χρήστες", href: "users.html" });
    links.push({ label: "Κατηγορίες", href: "categories.html" });
  }
  const announcementHref =
    user.role === "admin" ? "announcements.html" : "announcements-view.html";
  links.push({ label: "Ανακοινώσεις", href: announcementHref });

  const page = window.location.pathname.split("/").pop();

  let linksHtml = "";
  for (let i = 0; i < links.length; i++) {
    const active = links[i].href === page ? " active" : "";
    linksHtml +=
      '<a class="nav-link' + active + '" href="' + links[i].href + '">' + links[i].label + "</a>";
  }

  return (
    '<nav class="nav">' +
    '<div class="nav-brand"><div class="name">Delp - The Help Desk WebApp</div></div>' +
    '<div class="nav-links">' +
    linksHtml +
    "</div>" +
    '<div class="nav-actions">' +
    '<span class="nav-user">' +
    user.username +
    " (" +
    user.role +
    ")</span>" +
    '<button class="btn btn-solid" onclick="logout()">Αποσύνδεση</button>' +
    "</div>" +
    "</nav>"
  );
}

// Inject the nav into the #nav placeholder on the current page.
function mountNav(user) {
  const holder = document.getElementById("nav");
  if (holder) {
    holder.innerHTML = renderNav(user);
  }
}

// Show / hide a modal overlay by id.
function openModalById(id) {
  document.getElementById(id).className = "overlay open";
}

function closeModalById(id) {
  document.getElementById(id).className = "overlay";
}

// fetch wrapper: adds the Bearer token, serializes JSON bodies, and logs the
// user out on a 401. Returns { status, data }.
function api(path, options) {
  options = options || {};
  const headers = options.headers || {};
  headers["Authorization"] = "Bearer " + getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(path, {
    method: options.method || "GET",
    headers: headers,
    body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined,
  }).then(function (res) {
    if (res.status === 401) {
      logout();
      return Promise.reject(new Error("Unauthorized"));
    }
    return res.json().then(function (data) {
      return { status: res.status, data: data };
    });
  });
}

// Escape a string before putting it into innerHTML, so user input can't inject
// HTML/script tags.
function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Show a confirm dialog. Calls onConfirm() if the user clicks "Διαγραφή".
function confirmDialog(message, onConfirm) {
  let overlay = document.getElementById("confirmOverlay");
  if (!overlay) {
    // Build the dialog once, then reuse it.
    overlay = document.createElement("div");
    overlay.id = "confirmOverlay";
    overlay.className = "overlay";
    overlay.innerHTML =
      '<div class="modal modal-sm">' +
      '<p id="confirmMessage" class="confirm-message"></p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-outline" onclick="closeConfirm()">Ακύρωση</button>' +
      '<button class="btn btn-danger" id="confirmOk">Διαγραφή</button>' +
      "</div>" +
      "</div>";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        closeConfirm();
      }
    });
  }
  document.getElementById("confirmMessage").textContent = message;
  // Replace the OK button so the previous click handler doesn't fire again.
  const okBtn = document.getElementById("confirmOk");
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.addEventListener("click", function () {
    closeConfirm();
    onConfirm();
  });
  overlay.className = "overlay open";
}

// Hide the confirm dialog.
function closeConfirm() {
  const overlay = document.getElementById("confirmOverlay");
  if (overlay) {
    overlay.className = "overlay";
  }
}

// Show a notification popup. type can be "", "error", "ok", or "info".
function notify(message, type) {
  let overlay = document.getElementById("notifyOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "notifyOverlay";
    overlay.className = "overlay";
    overlay.innerHTML =
      '<div class="modal modal-sm">' +
      '<p id="notifyMessage" class="confirm-message"></p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-solid" onclick="closeNotify()">OK</button>' +
      "</div>" +
      "</div>";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        closeNotify();
      }
    });
  }
  const msg = document.getElementById("notifyMessage");
  msg.textContent = message;
  msg.className = type ? "confirm-message " + type : "confirm-message";
  overlay.className = "overlay open";
}

// Hide the notification popup.
function closeNotify() {
  const overlay = document.getElementById("notifyOverlay");
  if (overlay) {
    overlay.className = "overlay";
  }
}

// Pull a readable error message out of an API response, preferring the
// per-field details list when present.
function errorText(data) {
  if (data && Array.isArray(data.details) && data.details.length) {
    return data.details.join(" • ");
  }
  return (data && (data.error || data.message)) || "Κάτι πήγε στραβά.";
}
