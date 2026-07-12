const user = requireAuth(["admin"]);
let usersById = {};
const cities = {};
let countriesLoaded = false;
const pendingSelection = {};

if (user) {
  mountNav(user);
  loadUsers();
  loadCountries();
}

document.getElementById("filterRole").addEventListener("change", loadUsers);
document.getElementById("filterStatus").addEventListener("change", loadUsers);

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
      setMsg("Αδυναμία φόρτωσης χωρών.", "error");
    });
}

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

function setMsg(text, type) {
  const msg = document.getElementById("msg");
  msg.textContent = text;
  msg.className = type ? "msg " + type : "msg";
}

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
      setMsg("Αδυναμία φόρτωσης χρηστών.", "error");
    });
}

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
        setMsg(errorText(res.data), "error");
        return;
      }
      closeModalById("userOverlay");
      setMsg("Αποθηκεύτηκε.", "ok");
      loadUsers();
    })
    .catch(function () {
      setMsg("Σφάλμα δικτύου.", "error");
    });
}

function deleteUser(id) {
  confirmDialog("Διαγραφή χρήστη;", function () {
    api("/api/users/" + id, { method: "DELETE" })
      .then(function (res) {
        if (res.status !== 200) {
          setMsg(errorText(res.data), "error");
          return;
        }
        loadUsers();
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
