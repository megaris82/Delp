// users.html logic: admin user management (list, edit, delete) and registration approval.
// Also loads the country/city dropdowns (from the external API) for the edit form.

// Ensure only admins can access this page.
const user = requireAuth(["admin"]);
// Cache of users by id (for the edit dialog).
let usersById = {};
// Cache of country -> [cities] for the edit form.
const cities = {};
// Whether the country list has finished loading.
let countriesLoaded = false;
// Pending country/city selection to apply once countries are loaded.
const pendingSelection = {};

// On load: build nav, load users and countries.
if (user) {
  mountNav(user);
  loadUsers();
  loadCountries();
}

// Reload the user table when the role/status filters change.
document.getElementById("filterRole").addEventListener("change", loadUsers);
document.getElementById("filterStatus").addEventListener("change", loadUsers);

// Fetch countries from the external API and fill the country <select>.
function loadCountries() {
  const country = document.getElementById("country");
  if (country.options.length > 1) {
    return;
  }
  fetch("https://countriesnow.space/api/v0.1/countries")
    .then(function (res) {
      return res.json();
    })
    .then(function (json) {
      const data = json.data;
      for (let i = 0; i < data.length; i++) {
        const c = data[i];
        const opt = document.createElement("option");
        opt.value = c.country;
        opt.text = c.country;
        country.appendChild(opt);
        cities[c.country] = c.cities || [];
      }
      countriesLoaded = true;
      if (pendingSelection.country) {
        country.value = pendingSelection.country;
        onCountryChange();
        if (pendingSelection.city) {
          document.getElementById("city").value = pendingSelection.city;
        }
      }
    })
    .catch(function () {
      notify("Αδυναμία φόρτωσης χωρών.", "error");
    });
}

// Refill the city <select> when the country changes.
function onCountryChange() {
  const country = document.getElementById("country");
  const city = document.getElementById("city");
  const list = cities[country.value] || [];
  city.innerHTML = "";
  const first = document.createElement("option");
  first.value = "";
  first.text = "Επιλέξτε πόλη…";
  city.appendChild(first);
  for (let i = 0; i < list.length; i++) {
    const opt = document.createElement("option");
    opt.value = list[i];
    opt.text = list[i];
    city.appendChild(opt);
  }
  city.disabled = list.length === 0;
}

// Load users from the API, applying the role/status filters, and render the table.
function loadUsers() {
  const role = document.getElementById("filterRole").value;
  const status = document.getElementById("filterStatus").value;
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (status) params.set("register_status", status);
  const qs = params.toString();
  api("/api/users" + (qs ? "?" + qs : ""))
    .then(function (res) {
      const rows = document.getElementById("userRows");
      const users = res.data.users || [];
      usersById = {};
      if (!users.length) {
        rows.innerHTML = '<tr><td colspan="7">Δεν υπάρχουν χρήστες.</td></tr>';
        return;
      }
      let html = "";
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        usersById[u.id] = u;
        const fullName = escapeHtml((u.firstName || "") + " " + (u.lastName || ""));
        html +=
          "<tr>" +
          "<td>" + u.id + "</td>" +
          "<td>" + escapeHtml(u.username) + "</td>" +
          "<td>" + fullName + "</td>" +
          "<td>" + escapeHtml(u.email) + "</td>" +
          "<td>" + escapeHtml(u.role) + "</td>" +
          "<td>" + escapeHtml(u.register_status) + "</td>" +
          '<td class="actions">' +
          '<button class="btn btn-outline" onclick="editUser(' + u.id + ')">Επεξεργασία</button> ' +
          '<button class="btn btn-danger" onclick="deleteUser(' + u.id + ')">Διαγραφή</button>' +
          "</td>" +
          "</tr>";
      }
      rows.innerHTML = html;
    })
    .catch(function () {
      notify("Αδυναμία φόρτωσης χρηστών.", "error");
    });
}

// Open the edit dialog for a user, pre-filling their data (and country/city).
function editUser(id) {
  const u = usersById[id];
  if (!u) {
    return;
  }
  document.getElementById("userId").value = u.id;
  document.getElementById("userLabel").value = u.username;
  document.getElementById("firstName").value = u.firstName || "";
  document.getElementById("lastName").value = u.lastName || "";
  document.getElementById("email").value = u.email || "";
  document.getElementById("address").value = u.address || "";
  if (!countriesLoaded) {
    // Remember the selection and apply it once the country list is ready.
    pendingSelection.country = u.country || "";
    pendingSelection.city = u.city || "";
  } else {
    document.getElementById("country").value = u.country || "";
    onCountryChange();
    document.getElementById("city").value = u.city || "";
  }
  document.getElementById("role").value = u.role;
  document.getElementById("status").value = u.register_status;
  openModalById("userOverlay");
}

// Save edits (including role and registration status = approval/rejection).
function saveUser(e) {
  e.preventDefault();
  const id = document.getElementById("userId").value;
  const payload = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    country: document.getElementById("country").value,
    city: document.getElementById("city").value,
    address: document.getElementById("address").value,
    role: document.getElementById("role").value,
    register_status: document.getElementById("status").value,
  };
  api("/api/users/" + id, { method: "PUT", body: payload })
    .then(function (res) {
      if (res.status !== 200) {
        notify(errorText(res.data), "error");
        return;
      }
      closeModalById("userOverlay");
      notify("Αποθηκεύτηκε.", "ok");
      loadUsers();
    })
    .catch(function () {
      notify("Σφάλμα δικτύου.", "error");
    });
}

// Delete a user (with confirmation).
function deleteUser(id) {
  confirmDialog("Διαγραφή χρήστη;", function () {
    api("/api/users/" + id, { method: "DELETE" })
      .then(function (res) {
        if (res.status !== 200) {
          notify(errorText(res.data), "error");
          return;
        }
        loadUsers();
      })
      .catch(function () {
        notify("Σφάλμα δικτύου.", "error");
      });
  });
}
