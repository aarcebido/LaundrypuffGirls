const STORAGE = {
  users: 'laundrypuff_users',
  currentUser: 'laundrypuff_current_user',
  customers: email => `laundrypuff_customers_${email}`,
  machines: email => `laundrypuff_machines_${email}`
};

const SERVICE_PRICES = {
  'Giant - Wash': 60,
  'Giant - Dry': 70,
  'Giant - Fold': 40,
  'Giant - Basic Package': 180,
  'Giant - Premium Package': 200,
  'Titan - Wash': 100,
  'Titan - Dry': 100,
  'Titan - Fold': 50,
  'Titan - Basic Package': 300,
  'Titan - Premium Package': 350
};

const DETERGENT_PRICES = {
  'Ariel Twin Pack': 20,
  'Breeze Twin Pack': 20,
  'Surf': 15,
  'Champion Detergent': 15
};

const FABCON_PRICES = {
  'Downy': 15,
  'Champion Fabcon': 15,
  'Del': 10,
  'Calla': 10,
  'Surf Fabcon': 10
};

const DEFAULT_MACHINES = [
  { id: 'm1', name: 'Giant Machine 1', model: 'Giant Washer', capacity: '4-7kg', type: 'Giant', status: 'Available' },
  { id: 'm2', name: 'Titan Machine 1', model: 'Titan Washer', capacity: '6-12kg', type: 'Titan', status: 'Available' }
];

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE.users) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(STORAGE.users, JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE.currentUser) || 'null');
}

function requireUser() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function getCustomers() {
  const user = getCurrentUser();
  if (!user) return [];
  return JSON.parse(localStorage.getItem(STORAGE.customers(user.email)) || '[]');
}

function saveCustomers(customers) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem(STORAGE.customers(user.email), JSON.stringify(customers));
}

function getMachines() {
  const user = getCurrentUser();
  if (!user) return [];
  const saved = localStorage.getItem(STORAGE.machines(user.email));
  if (!saved) {
    localStorage.setItem(STORAGE.machines(user.email), JSON.stringify(DEFAULT_MACHINES));
    return [...DEFAULT_MACHINES];
  }
  return JSON.parse(saved);
}

function saveMachines(machines) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem(STORAGE.machines(user.email), JSON.stringify(machines));
}

function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('63')) digits = digits.slice(2);
  digits = digits.replace(/^0+/, '').slice(0, 10);
  return digits ? '+63' + digits : '';
}

function showMessage(id, text, type = 'error') {
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = text;
  box.className = `message ${type} show`;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearMessage(id) {
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = '';
  box.className = 'message';
}

function formatPeso(amount) {
  return `₱${Number(amount || 0).toFixed(2)}`;
}

function getMachineTypeByKg(kg) {
  const weight = Number(kg);
  if (weight >= 6 && weight <= 12) return 'Titan';
  if (weight >= 4 && weight < 6) return 'Giant';
  return '';
}

function updateKgNote(inputId, noteId, serviceId) {
  const kgInput = document.getElementById(inputId);
  const note = document.getElementById(noteId);
  const serviceSelect = document.getElementById(serviceId);
  if (!kgInput || !note) return;

  const kg = Number(kgInput.value);
  if (!kg) {
    note.textContent = '';
    return;
  }

  if (kg >= 6 && kg <= 12) {
    note.textContent = 'Machine size: TITAN (6-12kg)';
    alignServiceToType(serviceSelect, 'Titan');
  } else if (kg >= 4 && kg < 6) {
    note.textContent = 'Machine size: GIANT (4-7kg)';
    alignServiceToType(serviceSelect, 'Giant');
  } else if (kg > 0 && kg < 4) {
    note.textContent = 'Below Giant minimum. Minimum is 4kg.';
  } else if (kg > 12) {
    note.textContent = 'Above Titan maximum. Maximum is 12kg.';
  }
}

function alignServiceToType(select, type) {
  if (!select || !type) return;
  const current = select.value;
  if (!current) return;
  const serviceName = current.includes(' - ') ? current.split(' - ')[1] : current;
  const targetValue = `${type} - ${serviceName}`;
  const optionExists = [...select.options].some(option => option.value === targetValue);
  if (optionExists) select.value = targetValue;
}

function calculatePayment(service, detergent, detergentQty, fabcon, fabconQty) {
  const base = SERVICE_PRICES[service] || 0;
  const detergentCost = (DETERGENT_PRICES[detergent] || 0) * Number(detergentQty || 0);
  const fabconCost = (FABCON_PRICES[fabcon] || 0) * Number(fabconQty || 0);
  return base + detergentCost + fabconCost;
}

function isCompletedRecord(customer) {
  return customer.paymentStatus === 'Paid' && customer.orderStatus === 'Completed';
}

function logout() {
  localStorage.removeItem(STORAGE.currentUser);
  window.location.href = 'index.html';
}

function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    clearMessage('loginMessage');

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const users = getUsers();
    const user = users.find(item => item.email === email && item.password === password);

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      showMessage('loginMessage', 'Email must be a valid Gmail address (@gmail.com).');
      return;
    }

    if (!user) {
      showMessage('loginMessage', 'Invalid email or password. Please sign up first.');
      return;
    }

    localStorage.setItem(STORAGE.currentUser, JSON.stringify(user));
    getMachines();
    window.location.href = 'homepage.html';
  });
}

function initSignupPage() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    clearMessage('signupMessage');

    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const users = getUsers();

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      showMessage('signupMessage', 'Email must be a valid Gmail address (@gmail.com).');
      return;
    }

    if (password.length < 7 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      showMessage('signupMessage', 'Password must be at least 7 characters with letters, numbers, and special characters.');
      return;
    }

    if (password !== confirmPassword) {
      showMessage('signupMessage', 'Passwords do not match.');
      return;
    }

    if (users.some(user => user.email === email)) {
      showMessage('signupMessage', 'Email already registered. Please log in.');
      return;
    }

    const newUser = { email, password };
    users.push(newUser);
    saveUsers(users);
    localStorage.setItem(STORAGE.customers(email), JSON.stringify([]));
    localStorage.setItem(STORAGE.machines(email), JSON.stringify(DEFAULT_MACHINES));

    showMessage('signupMessage', 'Account created successfully. Redirecting to login...', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
  });
}

function initHomepage() {
  if (!document.getElementById('customersTableBody')) return;
  requireUser();
  renderCustomers();

  const search = document.getElementById('searchCustomers');
  if (search) search.addEventListener('input', renderCustomers);
}

function renderCustomers() {
  const tbody = document.getElementById('customersTableBody');
  const search = (document.getElementById('searchCustomers')?.value || '').toLowerCase();
  if (!tbody) return;

  const activeCustomers = getCustomers()
    .filter(customer => !isCompletedRecord(customer))
    .filter(customer => JSON.stringify(customer).toLowerCase().includes(search));

  if (activeCustomers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13" class="empty-state">No active customers yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = activeCustomers.map(customer => `
    <tr>
      <td>${customer.name}</td>
      <td>${customer.address}</td>
      <td>${customer.service}</td>
      <td>${customer.contactNo}</td>
      <td>${customer.kg}kg</td>
      <td>${customer.dateIn}</td>
      <td>${customer.dateOut || 'N/A'}</td>
      <td>${formatPeso(customer.payment)}</td>
      <td>${customer.detergent || 'None'} ${customer.detergentQty ? `(${customer.detergentQty})` : ''}</td>
      <td>${customer.fabcon || 'None'} ${customer.fabconQty ? `(${customer.fabconQty})` : ''}</td>
      <td><span class="badge ${customer.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}" onclick="openPaymentModal('${customer.id}', '${customer.paymentStatus}')" style="cursor: pointer;">${customer.paymentStatus}</span></td>
      <td><span class="badge ${customer.orderStatus === 'Completed' ? 'done' : customer.orderStatus === 'In Progress' ? 'progress' : 'pending'}">${customer.orderStatus}</span></td>
      <td>
        <a class="btn btn-light" href="addcustomer.html?id=${customer.id}">Edit</a>
      </td>
    </tr>
  `).join('');
}

let currentPaymentCustomerId = null;

function openPaymentModal(id, status) {
  const modal = document.getElementById('paymentModal');
  const select = document.getElementById('quickPaymentStatus');
  if (!modal || !select) return;

  currentPaymentCustomerId = id;
  select.value = status;
  modal.classList.add('show');
}

function initPaymentModal() {
  const modal = document.getElementById('paymentModal');
  const closeBtn = document.getElementById('closePaymentModal');
  const saveBtn = document.getElementById('savePaymentBtn');
  const select = document.getElementById('quickPaymentStatus');

  if (!modal || !closeBtn || !saveBtn) return;

  closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  
  modal.addEventListener('click', event => {
    if (event.target === modal) modal.classList.remove('show');
  });

  saveBtn.addEventListener('click', () => {
    if (!currentPaymentCustomerId) return;

    const customers = getCustomers();
    const index = customers.findIndex(c => c.id === currentPaymentCustomerId);
    
    if (index >= 0) {
      customers[index].paymentStatus = select.value;
      saveCustomers(customers);
      modal.classList.remove('show');
      renderCustomers();
    }
  });
}

function initCustomerForm() {
  const form = document.getElementById('customerForm');
  if (!form) return;
  requireUser();

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');
  const customers = getCustomers();
  const editingCustomer = customers.find(customer => customer.id === editId);

  if (editingCustomer) {
    document.getElementById('formTitle').textContent = 'Edit Customer';
    document.getElementById('saveCustomerBtn').textContent = 'Save Changes';
    fillCustomerForm(editingCustomer);
  }

  ['customerKg', 'customerService', 'detergent', 'detergentQty', 'fabcon', 'fabconQty'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('input', updatePaymentPreview);
    if (input) input.addEventListener('change', updatePaymentPreview);
  });

  const phoneInput = document.getElementById('contactNo');
  phoneInput.addEventListener('input', () => {
    phoneInput.value = normalizePhone(phoneInput.value);
  });

  const kgInput = document.getElementById('customerKg');
  kgInput.addEventListener('input', () => {
    kgInput.value = kgInput.value.replace(/\D/g, '');
    updateKgNote('customerKg', 'kgNote', 'customerService');
    updatePaymentPreview();
  });

  updatePaymentPreview();

  form.addEventListener('submit', event => {
    event.preventDefault();
    clearMessage('customerMessage');

    const customer = collectCustomerForm(editId || Date.now().toString());
    if (!validateCustomer(customer)) return;

    const allCustomers = getCustomers();
    const existingIndex = allCustomers.findIndex(item => item.id === customer.id);

    if (existingIndex >= 0) {
      allCustomers[existingIndex] = customer;
    } else {
      allCustomers.push(customer);
    }

    try {
      saveCustomers(allCustomers);
      showMessage('customerMessage', 'Customer saved successfully! Redirecting...', 'success');
      
      const saveBtn = document.getElementById('saveCustomerBtn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
      }

      setTimeout(() => {
        window.location.href = 'homepage.html';
      }, 1000);
    } catch (error) {
      console.error('Error saving customer:', error);
      showMessage('customerMessage', 'Failed to save customer. Please try again.');
    }
  });
}

function fillCustomerForm(customer) {
  document.getElementById('customerName').value = customer.name || '';
  document.getElementById('customerAddress').value = customer.address || '';
  document.getElementById('customerService').value = customer.service || '';
  document.getElementById('contactNo').value = customer.contactNo || '';
  document.getElementById('customerKg').value = customer.kg || '';
  document.getElementById('dateIn').value = customer.dateIn || '';
  document.getElementById('dateOut').value = customer.dateOut || '';
  document.getElementById('detergent').value = customer.detergent || '';
  document.getElementById('detergentQty').value = customer.detergentQty || 0;
  document.getElementById('fabcon').value = customer.fabcon || '';
  document.getElementById('fabconQty').value = customer.fabconQty || 0;
  document.getElementById('paymentStatus').value = customer.paymentStatus || 'Unpaid';
  document.getElementById('orderStatus').value = customer.orderStatus || 'Pending';
  updateKgNote('customerKg', 'kgNote', 'customerService');
  updatePaymentPreview();
}

function collectCustomerForm(id) {
  const service = document.getElementById('customerService').value;
  const detergent = document.getElementById('detergent').value;
  const detergentQty = Number(document.getElementById('detergentQty').value || 0);
  const fabcon = document.getElementById('fabcon').value;
  const fabconQty = Number(document.getElementById('fabconQty').value || 0);

  return {
    id,
    name: document.getElementById('customerName').value.trim(),
    address: document.getElementById('customerAddress').value.trim(),
    service,
    contactNo: normalizePhone(document.getElementById('contactNo').value),
    kg: Number(document.getElementById('customerKg').value),
    dateIn: document.getElementById('dateIn').value,
    dateOut: document.getElementById('dateOut').value,
    detergent,
    detergentQty,
    fabcon,
    fabconQty,
    payment: calculatePayment(service, detergent, detergentQty, fabcon, fabconQty),
    paymentStatus: document.getElementById('paymentStatus').value,
    orderStatus: document.getElementById('orderStatus').value
  };
}

function validateCustomer(customer) {
  if (!customer.name || !customer.address || !customer.service || !customer.dateIn) {
    showMessage('customerMessage', 'Please fill in all required fields.');
    return false;
  }

  if (!/^\+639\d{9}$/.test(customer.contactNo)) {
    showMessage('customerMessage', 'Contact number must start with +639 and have 13 characters.');
    return false;
  }

  if (!customer.kg || customer.kg < 1) {
    showMessage('customerMessage', 'Weight must be a positive number.');
    return false;
  }

  if (customer.kg < 4 || customer.kg > 12) {
    showMessage('customerMessage', 'Weight must be within Giant/Titan machine range: 4kg to 12kg.');
    return false;
  }

  if (customer.dateOut && new Date(customer.dateOut) < new Date(customer.dateIn)) {
    showMessage('customerMessage', 'Date Out cannot be earlier than Date In.');
    return false;
  }

  return true;
}

function updatePaymentPreview() {
  const preview = document.getElementById('paymentPreview');
  if (!preview) return;

  const service = document.getElementById('customerService').value;
  const detergent = document.getElementById('detergent').value;
  const detergentQty = Number(document.getElementById('detergentQty').value || 0);
  const fabcon = document.getElementById('fabcon').value;
  const fabconQty = Number(document.getElementById('fabconQty').value || 0);
  const total = calculatePayment(service, detergent, detergentQty, fabcon, fabconQty);

  preview.value = formatPeso(total);
}

function initHistoryPage() {
  if (!document.getElementById('historyTableBody')) return;
  requireUser();
  renderHistory();

  const search = document.getElementById('searchHistory');
  if (search) search.addEventListener('input', renderHistory);
}

function renderHistory() {
  const tbody = document.getElementById('historyTableBody');
  const search = (document.getElementById('searchHistory')?.value || '').toLowerCase();
  if (!tbody) return;

  const completedCustomers = getCustomers()
    .filter(isCompletedRecord)
    .filter(customer => JSON.stringify(customer).toLowerCase().includes(search));

  if (completedCustomers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty-state">No completed paid records yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = completedCustomers.map(customer => `
    <tr>
      <td>${customer.name}</td>
      <td>${customer.service}</td>
      <td>${customer.kg}kg</td>
      <td>${customer.dateIn}</td>
      <td>${customer.dateOut || 'N/A'}</td>
      <td>${formatPeso(customer.payment)}</td>
      <td>${customer.detergent || 'None'} ${customer.detergentQty ? `(${customer.detergentQty})` : ''}</td>
      <td>${customer.fabcon || 'None'} ${customer.fabconQty ? `(${customer.fabconQty})` : ''}</td>
      <td><span class="badge paid">${customer.paymentStatus}</span></td>
      <td><span class="badge done">${customer.orderStatus}</span></td>
    </tr>
  `).join('');
}

function initMachinePage() {
  if (!document.getElementById('machineGrid')) return;
  requireUser();
  renderMachines();

  const openBtn = document.getElementById('openMachineModal');
  const closeBtn = document.getElementById('closeMachineModal');
  const modal = document.getElementById('machineModal');
  const form = document.getElementById('machineForm');

  openBtn.addEventListener('click', () => modal.classList.add('show'));
  closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', event => {
    if (event.target === modal) modal.classList.remove('show');
  });

  form.addEventListener('submit', event => {
    event.preventDefault();

    const machine = {
      id: Date.now().toString(),
      name: document.getElementById('machineName').value.trim(),
      model: document.getElementById('machineModel').value.trim(),
      type: document.getElementById('machineType').value,
      capacity: document.getElementById('machineType').value === 'Titan' ? '6-12kg' : '4-7kg',
      status: document.getElementById('machineStatus').value
    };

    if (!machine.name || !machine.model) return;

    const machines = getMachines();
    machines.push(machine);
    saveMachines(machines);
    renderMachines();
    form.reset();
    modal.classList.remove('show');
  });
}

function renderMachines() {
  const grid = document.getElementById('machineGrid');
  if (!grid) return;

  const machines = getMachines();
  if (machines.length === 0) {
    grid.innerHTML = '<div class="empty-state">No machines added yet.</div>';
    return;
  }

  grid.innerHTML = machines.map((machine, index) => `
    <div class="machine-card">
      <button class="delete-machine" onclick="deleteMachine(${index})">✕</button>
      <div class="card-top">
         <div class="card-icon machine-icon">
          <span class="material-icons">local_laundry_service</span>
        </div>
        <div>
          <h3>${machine.name}</h3>
          <p>${machine.model}</p>
        </div>
      </div>
      <p><strong>Type:</strong> ${machine.type}</p>
      <p><strong>Capacity:</strong> ${machine.capacity}</p>
      <p><strong>Status:</strong> <span class="badge ${machine.status === 'Available' ? 'available' : machine.status === 'In Use' ? 'use' : 'maintenance'}">${machine.status}</span></p>
      <div class="machine-actions">
        <button class="${machine.status === 'Available' ? 'active' : ''}" onclick="updateMachineStatus(${index}, 'Available')">Available</button>
        <button class="${machine.status === 'In Use' ? 'active' : ''}" onclick="updateMachineStatus(${index}, 'In Use')">In Use</button>
        <button class="${machine.status === 'Maintenance' ? 'active' : ''}" onclick="updateMachineStatus(${index}, 'Maintenance')">Maintenance</button>
      </div>
    </div>
  `).join('');
}

function updateMachineStatus(index, status) {
  const machines = getMachines();
  machines[index].status = status;
  saveMachines(machines);
  renderMachines();
}

function deleteMachine(index) {
  const machines = getMachines();
  machines.splice(index, 1);
  saveMachines(machines);
  renderMachines();
}

function initServicesPage() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  requireUser();
  grid.innerHTML = Object.entries(SERVICE_PRICES).map(([name, price]) => {
  let icon = 'local_laundry_service';
  if (name.includes('Wash')) {
    icon = 'local_laundry_service';
  } 
  else if (name.includes('Dry')) {
    icon = 'air';
  } 
  else if (name.includes('Fold')) {
    icon = 'checkroom';
  } 
  else if (name.includes('Package')) {
    icon = 'inventory_2';
  }

  return `
    <div class="service-card">
      <div class="card-icon service-icon">
        <span class="material-icons">${icon}</span>
      </div>
      <h3>${name}</h3>
      <p class="price">${formatPeso(price)}</p>
    </div>
  `;
}).join('');
}

function showHelp() {
  alert(
    "Need help?\n\n" +
    "Contact us at:\n" +
    "Email: veniceangelgacusan1905@gmail.com\n" +
    "Phone: +63 998 823 0199"
  );
}

document.addEventListener('DOMContentLoaded', () => {
  initLoginPage();
  initSignupPage();
  initHomepage();
  initCustomerForm();
  initHistoryPage();
  initMachinePage();
  initServicesPage();
  initPaymentModal();
});
