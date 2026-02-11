const form = document.getElementById("employeeForm");
const employeeIdInput = document.getElementById("employeeId");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const tableBody = document.querySelector("#employeeTable tbody");
const formMessage = document.getElementById("formMessage");

const apiBaseUrl = "/api/employees";

const docFields = [
  { label: "10th", typeId: "doc10Type", fileId: "doc10File", apiField: "tenth", dbField: "tenth" },
  { label: "12th", typeId: "doc12Type", fileId: "doc12File", apiField: "twelfth", dbField: "twelfth" },
  { label: "Degree", typeId: "degreeType", fileId: "degreeFile", apiField: "degree", dbField: "degree" },
  { label: "Offer Letter", typeId: "offerType", fileId: "offerFile", apiField: "offerletter", dbField: "offerletter" },
  { label: "Joining Letter", typeId: "joiningType", fileId: "joiningFile", apiField: "joiningletter", dbField: "joiningletter" },
];

const allowedExtensions = ["jpg", "jpeg", "pdf", "docx"];

function normalizeType(value) {
  if (value === "jpg" || value === "jpeg") return "jpg";
  return value;
}

function getFileExtension(fileName) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function getBaseUrl() {
  return window.location.origin;
}

function fileNameFromPath(pathValue) {
  if (!pathValue) return "Not uploaded";
  const parts = pathValue.split(/[\\/]/);
  return parts[parts.length - 1];
}

function documentLink(pathValue) {
  if (!pathValue) return "Not uploaded";
  const href = `${getBaseUrl()}/${pathValue.replace(/^\/+/, "")}`;
  const text = fileNameFromPath(pathValue);
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
}

function validateDocSelection(typeSelect, fileInput, label, requireFile) {
  const selectedType = normalizeType(typeSelect.value.trim().toLowerCase());
  const selectedFile = fileInput.files[0];

  if (!selectedType) {
    throw new Error(`Please select ${label} document format.`);
  }

  if (requireFile && !selectedFile) {
    throw new Error(`Please upload ${label} document.`);
  }

  if (selectedFile) {
    const fileExt = normalizeType(getFileExtension(selectedFile.name));

    if (!allowedExtensions.includes(fileExt)) {
      throw new Error(`${label} supports only JPG, PDF, or DOCX.`);
    }

    if (fileExt !== selectedType) {
      throw new Error(`${label} format dropdown and file extension must match.`);
    }
  }
}

async function fetchEmployees() {
  const response = await fetch(apiBaseUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch employees.");
  }
  return response.json();
}

function renderEmployees(employees) {
  tableBody.innerHTML = "";

  employees.forEach((employee) => {
    const row = document.createElement("tr");
    const nameParts = (employee.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    row.innerHTML = `
      <td>${firstName}</td>
      <td>${lastName}</td>
      <td>${employee.email || ""}</td>
      <td>${employee.phone || ""}</td>
      <td>${employee.qualification || ""}</td>
      <td>
        <ul class="doc-list">
          <li>10th: ${documentLink(employee.documents?.tenth)}</li>
          <li>12th: ${documentLink(employee.documents?.twelfth)}</li>
          <li>Degree: ${documentLink(employee.documents?.degree)}</li>
          <li>Offer: ${documentLink(employee.documents?.offerletter)}</li>
          <li>Joining: ${documentLink(employee.documents?.joiningletter)}</li>
        </ul>
      </td>
      <td>
        <button type="button" class="action-btn" data-action="edit" data-id="${employee._id}">Edit</button>
        <button type="button" class="danger action-btn" data-action="delete" data-id="${employee._id}">Remove</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

async function loadEmployees() {
  try {
    const employees = await fetchEmployees();
    renderEmployees(employees);
  } catch (error) {
    formMessage.textContent = error.message;
  }
}

function resetFormState() {
  form.reset();
  employeeIdInput.value = "";
  submitBtn.textContent = "Add Employee";
  cancelBtn.style.display = "none";
  formMessage.textContent = "";

  for (const doc of docFields) {
    document.getElementById(doc.fileId).required = true;
  }
}

async function populateFormForEdit(employeeId) {
  const response = await fetch(`${apiBaseUrl}/${employeeId}`);
  if (!response.ok) {
    throw new Error("Failed to load employee for edit.");
  }

  const employee = await response.json();
  const nameParts = (employee.name || "").trim().split(/\s+/);

  document.getElementById("firstName").value = nameParts[0] || "";
  document.getElementById("lastName").value = nameParts.slice(1).join(" ");
  document.getElementById("email").value = employee.email || "";
  document.getElementById("phone").value = employee.phone || "";
  document.getElementById("address").value = employee.address || "";
  document.getElementById("qualification").value = employee.qualification || "";

  for (const doc of docFields) {
    const pathValue = employee.documents?.[doc.dbField] || "";
    const ext = normalizeType(getFileExtension(pathValue));
    document.getElementById(doc.typeId).value = ext && ["jpg", "pdf", "docx"].includes(ext) ? ext : "";
    document.getElementById(doc.fileId).required = false;
  }

  employeeIdInput.value = employee._id;
  submitBtn.textContent = "Update Employee";
  cancelBtn.style.display = "inline-block";
  formMessage.textContent = "Editing employee: upload new files only to replace existing documents.";
}

function buildEmployeeFormData(isEdit) {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const qualification = document.getElementById("qualification").value.trim();

  const formData = new FormData();
  formData.append("name", `${firstName} ${lastName}`.trim());
  formData.append("email", email);
  formData.append("phone", phone);
  formData.append("address", address);
  formData.append("qualification", qualification);

  for (const doc of docFields) {
    const typeSelect = document.getElementById(doc.typeId);
    const fileInput = document.getElementById(doc.fileId);
    const isRequired = !isEdit;

    validateDocSelection(typeSelect, fileInput, doc.label, isRequired);

    const selectedFile = fileInput.files[0];
    if (selectedFile) {
      formData.append(doc.apiField, selectedFile);
    }
  }

  return formData;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const employeeId = employeeIdInput.value;
  const isEdit = employeeId !== "";

  try {
    const formData = buildEmployeeFormData(isEdit);
    const endpoint = isEdit ? `${apiBaseUrl}/${employeeId}` : apiBaseUrl;
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(endpoint, { method, body: formData });

    if (!response.ok) {
      let errorMessage = "Failed to save employee.";
      try {
        const result = await response.json();
        errorMessage = result.message || result.error || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();

    resetFormState();
    await loadEmployees();
  } catch (error) {
    formMessage.textContent = error.message;
  }
});

cancelBtn.addEventListener("click", () => {
  resetFormState();
});

tableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const employeeId = button.dataset.id;

  try {
    if (action === "edit") {
      await populateFormForEdit(employeeId);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm("Are you sure you want to remove this employee?");
      if (!confirmed) return;

      const response = await fetch(`${apiBaseUrl}/${employeeId}`, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Failed to delete employee.");
      }

      if (employeeIdInput.value === employeeId) {
        resetFormState();
      }

      await loadEmployees();
    }
  } catch (error) {
    formMessage.textContent = error.message;
  }
});

loadEmployees();
