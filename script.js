const form = document.getElementById("employeeForm");
const employeeIdInput = document.getElementById("employeeId");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const tableBody = document.querySelector("#employeeTable tbody");
const formMessage = document.getElementById("formMessage");

const docFields = [
  { key: "doc10", label: "10th", typeId: "doc10Type", fileId: "doc10File" },
  { key: "doc12", label: "12th", typeId: "doc12Type", fileId: "doc12File" },
  { key: "degree", label: "Degree", typeId: "degreeType", fileId: "degreeFile" },
  { key: "offer", label: "Offer Letter", typeId: "offerType", fileId: "offerFile" },
  { key: "joining", label: "Joining Letter", typeId: "joiningType", fileId: "joiningFile" },
];

const allowedExtensions = ["jpg", "jpeg", "pdf", "docx"];
let employees = [];

function normalizeType(value) {
  if (value === "jpg" || value === "jpeg") {
    return "jpg";
  }
  return value;
}

function getFileExtension(fileName) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function validateAndCollectDocuments() {
  const documents = {};

  for (const doc of docFields) {
    const typeSelect = document.getElementById(doc.typeId);
    const fileInput = document.getElementById(doc.fileId);
    const selectedType = normalizeType(typeSelect.value.trim().toLowerCase());
    const selectedFile = fileInput.files[0];

    if (!selectedType) {
      throw new Error(`Please select ${doc.label} document format.`);
    }

    if (!selectedFile) {
      throw new Error(`Please upload ${doc.label} document.`);
    }

    const fileExt = normalizeType(getFileExtension(selectedFile.name));

    if (!allowedExtensions.includes(fileExt)) {
      throw new Error(`${doc.label} supports only JPG, PDF, or DOCX.`);
    }

    if (fileExt !== selectedType) {
      throw new Error(`${doc.label} format dropdown and file extension must match.`);
    }

    documents[doc.key] = {
      fileName: selectedFile.name,
      format: selectedType,
    };
  }

  return documents;
}

function renderEmployees() {
  tableBody.innerHTML = "";

  employees.forEach((employee, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${employee.firstName}</td>
      <td>${employee.lastName}</td>
      <td>${employee.email}</td>
      <td>${employee.phone}</td>
      <td>${employee.qualification}</td>
      <td>
        <ul class="doc-list">
          <li>10th: ${employee.documents.doc10.fileName}</li>
          <li>12th: ${employee.documents.doc12.fileName}</li>
          <li>Degree: ${employee.documents.degree.fileName}</li>
          <li>Offer: ${employee.documents.offer.fileName}</li>
          <li>Joining: ${employee.documents.joining.fileName}</li>
        </ul>
      </td>
      <td>
        <button type="button" class="action-btn" onclick="editEmployee(${index})">Edit</button>
        <button type="button" class="danger action-btn" onclick="removeEmployee(${index})">Remove</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

function resetFormState() {
  form.reset();
  employeeIdInput.value = "";
  submitBtn.textContent = "Add Employee";
  cancelBtn.style.display = "none";
  formMessage.textContent = "";

  docFields.forEach((doc) => {
    const fileInput = document.getElementById(doc.fileId);
    fileInput.required = true;
  });
}

function fillFormForEdit(employee) {
  document.getElementById("firstName").value = employee.firstName;
  document.getElementById("lastName").value = employee.lastName;
  document.getElementById("email").value = employee.email;
  document.getElementById("phone").value = employee.phone;
  document.getElementById("address").value = employee.address;
  document.getElementById("qualification").value = employee.qualification;

  docFields.forEach((doc) => {
    document.getElementById(doc.typeId).value = employee.documents[doc.key].format;

    // File inputs cannot be prefilled by browser security rules.
    const fileInput = document.getElementById(doc.fileId);
    fileInput.required = false;
  });

  formMessage.textContent = "Editing employee: upload new files only if you want to replace existing ones.";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const employeeIndex = employeeIdInput.value;

  const baseData = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim(),
    qualification: document.getElementById("qualification").value.trim(),
  };

  try {
    if (employeeIndex === "") {
      const documents = validateAndCollectDocuments();
      employees.push({ ...baseData, documents });
    } else {
      const existingEmployee = employees[Number(employeeIndex)];
      const updatedDocuments = { ...existingEmployee.documents };

      for (const doc of docFields) {
        const typeSelect = document.getElementById(doc.typeId);
        const fileInput = document.getElementById(doc.fileId);
        const selectedType = normalizeType(typeSelect.value.trim().toLowerCase());
        const selectedFile = fileInput.files[0];

        if (!selectedType) {
          throw new Error(`Please select ${doc.label} document format.`);
        }

        if (selectedFile) {
          const fileExt = normalizeType(getFileExtension(selectedFile.name));
          if (!allowedExtensions.includes(fileExt)) {
            throw new Error(`${doc.label} supports only JPG, PDF, or DOCX.`);
          }
          if (fileExt !== selectedType) {
            throw new Error(`${doc.label} format dropdown and file extension must match.`);
          }

          updatedDocuments[doc.key] = {
            fileName: selectedFile.name,
            format: selectedType,
          };
        } else {
          updatedDocuments[doc.key] = {
            ...updatedDocuments[doc.key],
            format: selectedType,
          };
        }
      }

      employees[Number(employeeIndex)] = { ...baseData, documents: updatedDocuments };
    }

    renderEmployees();
    resetFormState();
  } catch (error) {
    formMessage.textContent = error.message;
  }
});

cancelBtn.addEventListener("click", () => {
  resetFormState();
});

window.editEmployee = function editEmployee(index) {
  employeeIdInput.value = String(index);
  submitBtn.textContent = "Update Employee";
  cancelBtn.style.display = "inline-block";

  fillFormForEdit(employees[index]);
};

window.removeEmployee = function removeEmployee(index) {
  employees.splice(index, 1);
  renderEmployees();
  resetFormState();
};
