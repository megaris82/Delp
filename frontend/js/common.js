function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    return null;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

function requireAuth(allowedRoles) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = "../index.html";
    return null;
  }
  if (allowedRoles && allowedRoles.indexOf(user.role) === -1) {
    window.location.href = "dashboard.html";
    return null;
  }
  return user;
}

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
    '<div class="nav-brand"><div class="name">Delp</div></div>' +
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

function mountNav(user) {
  const holder = document.getElementById("nav");
  if (holder) {
    holder.innerHTML = renderNav(user);
  }
}

function openModalById(id) {
  document.getElementById(id).className = "overlay open";
}

function closeModalById(id) {
  document.getElementById(id).className = "overlay";
}

function api(path, options) {
  options = options || {};
  const headers = options.headers || {};
  headers["Authorization"] = "Bearer " + getToken();
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(path, {
    method: options.method || "GET",
    headers: headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
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

function confirmDialog(message, onConfirm) {
  let overlay = document.getElementById("confirmOverlay");
  if (!overlay) {
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
  const okBtn = document.getElementById("confirmOk");
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.addEventListener("click", function () {
    closeConfirm();
    onConfirm();
  });
  overlay.className = "overlay open";
}

function closeConfirm() {
  const overlay = document.getElementById("confirmOverlay");
  if (overlay) {
    overlay.className = "overlay";
  }
}
