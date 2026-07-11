const ENDPOINTS = {
  login: "/api/auth/login",
  register: "/api/auth/register"
};

let mode = "login";
const cities = {};

function showMsg(text, type) {
  const msg = document.getElementById("msg");
  msg.textContent = text;
  msg.className = "msg";
  if (type) {
    msg.className = "msg " + type;
  }
}

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

function openModal(startMode) {
  setMode(startMode);
  document.getElementById("overlay").className = "overlay open";
}

function closeModal() {
  document.getElementById("overlay").className = "overlay";
}

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

function submitForm(e) {
  e.preventDefault();
  showMsg("", "");

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const payload = {
    username: username,
    password: password
  };

  if (mode === "register") {
    payload.firstName = document.getElementById("firstName").value;
    payload.lastName = document.getElementById("lastName").value;
    payload.email = document.getElementById("email").value;
    payload.country = document.getElementById("country").value;
    payload.city = document.getElementById("city").value;
    payload.address = document.getElementById("address").value;

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
    body: JSON.stringify(payload)
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
        showMsg(text, "error");
        return;
      }
      if (mode === "register") {
        showMsg("Το αίτημά σας υποβλήθηκε. Ο διαχειριστής θα το εξετάσει και θα αναθέσει ρόλο.", "info");
      } else {
        showMsg("Συνδεθήκατε!", "ok");
      }
    })
    .catch(function () {
      showMsg("Σφάλμα δικτύου.", "error");
    });
}
