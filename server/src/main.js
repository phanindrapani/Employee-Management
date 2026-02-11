document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = '/api/employees';
    const employeeForm = document.getElementById('employee-form');
    const employeeTableBody = document.querySelector('#employee-table tbody');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const employeeIdField = document.getElementById('employee-id');

    // Fetch and display employees
    const getEmployees = async () => {
        try {
            const response = await fetch(apiBaseUrl);
            const employees = await response.json();

            employeeTableBody.innerHTML = ''; // Clear existing rows
            employees.forEach(employee => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${employee.name}</td>
                    <td>${employee.email}</td>
                    <td>${employee.phone}</td>
                    <td class="actions">
                        <button class="edit-btn" data-id="${employee._id}">Edit</button>
                        <button class="delete-btn" data-id="${employee._id}">Delete</button>
                    </td>
                `;
                employeeTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    // Reset form to "Add" mode
    const resetForm = () => {
        employeeForm.reset();
        employeeIdField.value = '';
        formTitle.textContent = 'Add New Employee';
        submitBtn.textContent = 'Add Employee';
        cancelBtn.classList.add('hidden');
    };

    // Handle form submission (Add/Update)
    employeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(employeeForm);
        const id = employeeIdField.value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${apiBaseUrl}/${id}` : apiBaseUrl;

        try {
            const response = await fetch(url, {
                method: method,
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Something went wrong');
            }

            await response.json();
            resetForm();
            await getEmployees(); // Refresh the table
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'adding'} employee:`, error);
            alert(`Error: ${error.message}`);
        }
    });

    // Handle table actions (Edit/Delete)
    employeeTableBody.addEventListener('click', async (e) => {
        const target = e.target;
        const id = target.dataset.id;

        // Delete action
        if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this employee?')) {
                try {
                    await fetch(`${apiBaseUrl}/${id}`, { method: 'DELETE' });
                    await getEmployees(); // Refresh table
                } catch (error) {
                    console.error('Error deleting employee:', error);
                }
            }
        }

        // Edit action
        if (target.classList.contains('edit-btn')) {
            try {
                const response = await fetch(`${apiBaseUrl}/${id}`);
                const employee = await response.json();

                // Populate form with employee data
                employeeIdField.value = employee._id;
                document.getElementById('name').value = employee.name;
                document.getElementById('email').value = employee.email;
                document.getElementById('phone').value = employee.phone;
                document.getElementById('address').value = employee.address;
                document.getElementById('qualification').value = employee.qualification;

                formTitle.textContent = 'Edit Employee';
                submitBtn.textContent = 'Update Employee';
                cancelBtn.classList.remove('hidden');
                window.scrollTo(0, 0); // Scroll to top to see the form
            } catch (error) {
                console.error('Error fetching employee for edit:', error);
            }
        }
    });

    // Cancel edit
    cancelBtn.addEventListener('click', resetForm);

    // Initial load
    getEmployees();
});