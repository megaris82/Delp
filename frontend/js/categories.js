// categories.html logic: admin category management (list, create, edit, delete)
// with an associated priority level.

// Ensure only admins can access this page.
const user = requireAuth(["admin"]);

if (user) {
  mountNav(user);
  loadCategories();
}

// Display a message as a modal popup only.
function setMsg(text, type) {
  if (text) {
    notify(text, type);
  }
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

// Reset the side-panel form for creating a new category.
function openCategoryModal() {
  document.getElementById("categoryModalTitle").textContent = "Νέα Κατηγορία";
  document.getElementById("categoryId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("priority").value = "medium";
  document.getElementById("name").focus();
}

// Open the edit dialog for a category (values passed from the table row).
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

// Create a new category (the side-panel form submits here).
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

// Delete a category (with confirmation).
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

// Extract a human-readable error message from an API response.
function errorText(data) {
  if (data && Array.isArray(data.details) && data.details.length) {
    return data.details.join(" • ");
  }
  return (data && (data.error || data.message)) || "Κάτι πήγε στραβά.";
}
