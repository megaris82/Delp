const user = requireAuth(["admin"]);

if (user) {
  mountNav(user);
  loadCategories();
}

function setMsg(text, type) {
  const msg = document.getElementById("msg");
  msg.textContent = text;
  msg.className = type ? "msg " + type : "msg";
}

function loadCategories() {
  api("/api/categories")
    .then(function (res) {
      const rows = document.getElementById("categoryRows");
      const categories = res.data.categories || [];
      if (!categories.length) {
        rows.innerHTML = '<tr><td colspan="4">Δεν υπάρχουν κατηγορίες.</td></tr>';
        return;
      }
      let html = "";
      for (let i = 0; i < categories.length; i++) {
        const c = categories[i];
        html +=
          "<tr>" +
          "<td>" + c.id + "</td>" +
          "<td>" + escapeHtml(c.name) + "</td>" +
          "<td>" + escapeHtml(c.priority) + "</td>" +
          '<td class="actions">' +
          '<button class="btn btn-outline" onclick="editCategory(' +
          c.id + ",'" + escapeHtml(c.name).replace(/'/g, "&#39;") + "','" + c.priority +
          "')\">Επεξεργασία</button> " +
          '<button class="btn btn-danger" onclick="deleteCategory(' + c.id + ')">Διαγραφή</button>' +
          "</td>" +
          "</tr>";
      }
      rows.innerHTML = html;
    })
    .catch(function () {
      setMsg("Αδυναμία φόρτωσης κατηγοριών.", "error");
    });
}

function openCategoryModal() {
  document.getElementById("categoryModalTitle").textContent = "Νέα Κατηγορία";
  document.getElementById("categoryId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("priority").value = "medium";
  document.getElementById("name").focus();
}

function editCategory(id, name, priority) {
  document.getElementById("editCategoryId").value = id;
  document.getElementById("editName").value = name;
  document.getElementById("editPriority").value = priority;
  openModalById("categoryEditOverlay");
}

function saveCategoryEdit(e) {
  e.preventDefault();
  const id = document.getElementById("editCategoryId").value;
  const payload = {
    name: document.getElementById("editName").value,
    priority: document.getElementById("editPriority").value,
  };

  api("/api/categories/" + id, { method: "PUT", body: payload })
    .then(function (res) {
      if (res.status !== 200) {
        setMsg(errorText(res.data), "error");
        return;
      }
      closeModalById("categoryEditOverlay");
      setMsg("Αποθηκεύτηκε.", "ok");
      loadCategories();
    })
    .catch(function () {
      setMsg("Σφάλμα δικτύου.", "error");
    });
}

function saveCategory(e) {
  e.preventDefault();
  const id = document.getElementById("categoryId").value;
  const payload = {
    name: document.getElementById("name").value,
    priority: document.getElementById("priority").value,
  };
  const path = id ? "/api/categories/" + id : "/api/categories";
  const method = id ? "PUT" : "POST";

  api(path, { method: method, body: payload })
    .then(function (res) {
      if (res.status !== 200 && res.status !== 201) {
        setMsg(errorText(res.data), "error");
        return;
      }
      setMsg("Αποθηκεύτηκε.", "ok");
      openCategoryModal();
      loadCategories();
    })
    .catch(function () {
      setMsg("Σφάλμα δικτύου.", "error");
    });
}

function deleteCategory(id) {
  confirmDialog("Διαγραφή κατηγορίας;", function () {
    api("/api/categories/" + id, { method: "DELETE" })
      .then(function (res) {
        if (res.status !== 200) {
          setMsg(errorText(res.data), "error");
          return;
        }
        loadCategories();
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
