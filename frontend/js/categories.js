// Logic for categories.html: admin category management (list, create, edit,
// delete) with a priority level.

// Only admins can open this page; requireAuth redirects everyone else away.
const user = requireAuth(["admin"]);

if (user) {
  mountNav(user);
  loadCategories();
}

// Load categories from the API and render the table.
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
        // The edit button passes the current name and priority straight into
        // the onclick. The name is escaped and its single quotes encoded so the
        // JS string literal doesn't break.
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
      notify("Αδυναμία φόρτωσης κατηγοριών.", "error");
    });
}

// Reset the side-panel form for creating a new category.
function openCategoryModal() {
  document.getElementById("categoryModalTitle").textContent = "Νέα Κατηγορία";
  document.getElementById("categoryId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("priority").value = "medium";
  document.getElementById("name").focus();
}

// Open the edit dialog for a category (values come from the table row).
function editCategory(id, name, priority) {
  document.getElementById("editCategoryId").value = id;
  document.getElementById("editName").value = name;
  document.getElementById("editPriority").value = priority;
  openModalById("categoryEditOverlay");
}

// Save an edited category via PUT.
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
        notify(errorText(res.data), "error");
        return;
      }
      closeModalById("categoryEditOverlay");
      notify("Αποθηκεύτηκε.", "ok");
      loadCategories();
    })
    .catch(function () {
      notify("Σφάλμα δικτύου.", "error");
    });
}

// Create a new category (the side-panel form submits here). If categoryId is
// set it does a PUT instead, so the same form can edit too.
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
        notify(errorText(res.data), "error");
        return;
      }
      notify("Αποθηκεύτηκε.", "ok");
      openCategoryModal();
      loadCategories();
    })
    .catch(function () {
      notify("Σφάλμα δικτύου.", "error");
    });
}

// Delete a category after confirmation.
function deleteCategory(id) {
  confirmDialog("Διαγραφή κατηγορίας;", function () {
    api("/api/categories/" + id, { method: "DELETE" })
      .then(function (res) {
        if (res.status !== 200) {
          notify(errorText(res.data), "error");
          return;
        }
        loadCategories();
      })
      .catch(function () {
        notify("Σφάλμα δικτύου.", "error");
      });
  });
}
