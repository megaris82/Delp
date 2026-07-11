const $ = (id) => document.getElementById(id);

const overlay = $("overlay");
const tabLogin = $("tabLogin");
const tabRegister = $("tabRegister");
const title = $("modalTitle");
const form = $("authForm");
const submitBtn = $("submitBtn");
const msg = $("msg");
const country = $("country");
const city = $("city");

const ENDPOINTS = { login: "/api/auth/login", register: "/api/auth/register" };
const cities = {};
let mode = "login";

function showMsg(text, type) {
  msg.textContent = text;
  msg.className = "msg" + (type ? " " + type : "");
}

function setMode(next) {
  mode = next;
  const isLogin = next === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  form.classList.toggle("register", !isLogin);
  title.textContent = submitBtn.textContent = isLogin ? "Σύνδεση" : "Εγγραφή";
  showMsg("");
  if (!isLogin) loadCountries();
}

function openModal(startMode) {
  setMode(startMode);
  overlay.classList.add("open");
}
function closeModal() {
  overlay.classList.remove("open");
}

$("openLogin").addEventListener("click", () => openModal("login"));
$("openRegister").addEventListener("click", () => openModal("register"));
tabLogin.addEventListener("click", () => setMode("login"));
tabRegister.addEventListener("click", () => setMode("register"));
$("closeModal").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

async function loadCountries() {
  if (country.options.length > 1) return;
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const { data } = await res.json();
    data.forEach((c) => {
      country.add(new Option(c.country, c.country));
      cities[c.country] = c.cities || [];
    });
  } catch {
    showMsg("Αδυναμία φόρτωσης χωρών.", "error");
  }
}

country.addEventListener("change", () => {
  const list = cities[country.value] || [];
  city.innerHTML = '<option value="">Επιλέξτε πόλη…</option>';
  list.forEach((c) => city.add(new Option(c, c)));
  city.disabled = list.length === 0;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMsg("");

  const payload = {
    username: $("username").value,
    password: $("password").value,
  };

  if (mode === "register") {
    Object.assign(payload, {
      firstName: $("firstName").value,
      lastName: $("lastName").value,
      email: $("email").value,
      country: country.value,
      city: city.value,
      address: $("address").value,
    });
    if (payload.password !== $("confirm").value) {
      return showMsg("Τα password δεν ταιριάζουν.", "error");
    }
  }

  try {
    const res = await fetch(ENDPOINTS[mode], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showMsg(data.message || "Κάτι πήγε στραβά.", "error");
    if (mode === "register") {
      showMsg("Το αίτημά σας υποβλήθηκε. Ο διαχειριστής θα το εξετάσει και θα αναθέσει ρόλο.", "info");
    } else {
      showMsg("Συνδεθήκατε!", "ok");
    }
  } catch {
    showMsg("Σφάλμα δικτύου.", "error");
  }
});
