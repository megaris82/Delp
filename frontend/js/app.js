// index.html logic: login / registration modal, and country/city dropdowns
// populated from the external CountriesNow REST API.

// Endpoint paths for the two auth actions.
const ENDPOINTS = {
  login: "/api/auth/login",
  register: "/api/auth/register",
};

// Current modal mode: "login" or "register".
let mode = "login";
// Cache of country -> [cities] so we don't re-fetch cities on every country change.
const cities = {};

// Show a message as a modal popup only (type: "", "error", "info", "ok").
function showMsg(text, type) {
  if (text) {
    notify(text, type);
  }
}

// Switch between login and register mode and update the UI accordingly.
function setMode(next) {
  mode = next;
  const isLogin = next === "login";
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const form = document.getElementById("authForm");
  const title = document.getElementById("modalTitle");
  const submitBtn = document.getElementById("submitBtn");

  if (isLogin) {
    tabLogin.className = "tab active";
    tabRegister.className = "tab";
    form.className = "";
  } else {
    tabLogin.className = "tab";
    tabRegister.className = "tab active";
    form.className = "register";
  }

  if (isLogin) {
    title.textContent = "Σύνδεση";
    submitBtn.textContent = "Σύνδεση";
  } else {
    title.textContent = "Εγγραφή";
    submitBtn.textContent = "Εγγραφή";
  }

  showMsg("", "");

  if (!isLogin) {
    loadCountries();
  }
}

// Open the modal in the given starting mode.
function openModal(startMode) {
  setMode(startMode);
  document.getElementById("overlay").className = "overlay open";
}

// Close the modal.
function closeModal() {
  document.getElementById("overlay").className = "overlay";
}

// Fetch the list of countries from the external API and fill the country <select>.
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
    })
    .catch(function () {
      showMsg("Αδυναμία φόρτωσης χωρών.", "error");
    });
}

// When the country changes, refill the city <select> from the cached list.
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

// Submit the login or registration form.
function submitForm(e) {
  e.preventDefault();
  showMsg("", "");

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const payload = {
    username: username,
    password: password,
  };

  if (mode === "register") {
    payload.firstName = document.getElementById("firstName").value;
    payload.lastName = document.getElementById("lastName").value;
    payload.email = document.getElementById("email").value;
    payload.country = document.getElementById("country").value;
    payload.city = document.getElementById("city").value;
    payload.address = document.getElementById("address").value;

    // Client-side password strength check (mirrors the backend minimum length).
    if (payload.password.length < 6) {
      showMsg("Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.", "error");
      return;
    }

    const confirmPass = document.getElementById("confirm").value;
    if (payload.password !== confirmPass) {
      showMsg("Τα password δεν ταιριάζουν.", "error");
      return;
    }
  }

  let status = 0;
  fetch(ENDPOINTS[mode], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(function (res) {
      status = res.status;
      return res.json().catch(function () {
        return {};
      });
    })
    .then(function (data) {
      if (status !== 200 && status !== 201) {
        let text;
        if (Array.isArray(data.details) && data.details.length) {
          text = data.details.join(" • ");
        } else {
          text = data.message || data.error || "Κάτι πήγε στραβά.";
        }
        // A denied/pending registration is shown only as a modal popup,
        // not as inline text at the bottom of the form.
        if (status === 403 && data.error && data.error.indexOf("Registration ") === 0) {
          if (data.error === "Registration denied") {
            text = "Η εγγραφή σας απορρίφθηκε.";
          } else if (data.error === "Registration pending") {
            text = "Η εγγραφή σας βρίσκεται σε αναμονή έγκρισης από τον διαχειριστή.";
          }
          notify(text, "error");
          return;
        }
        showMsg(text, "error");
        return;
      }
      if (mode === "register") {
        notify("Το αίτημά σας υποβλήθηκε. Ο διαχειριστής θα το εξετάσει και θα αναθέσει ρόλο.", "info");
        setTimeout(closeModal, 5000);
      } else {
        // On successful login, store the token + user and go to the dashboard.
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        showMsg("Συνδεθήκατε!", "ok");
        window.location.href = "html/dashboard.html";
      }
    })
    .catch(function () {
      showMsg("Σφάλμα δικτύου.", "error");
    });
}
