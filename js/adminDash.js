import { db, ref, onValue, set, push, storage, storageRef, uploadBytes, getDownloadURL } from './index.js';

// Icons for different resource types
const icons = {
  pdf: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
  training: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  course: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>'
};

// Get DOM elements
const searchInput = document.getElementById('searchInput');
const resourceGrid = document.getElementById('resourceGrid');
const tabButtons = document.querySelectorAll('.tab-button');
const addResourceBtn = document.getElementById('addResourceBtn');
const resourceModal = document.getElementById('resourceModal');
const resourceForm = document.getElementById('resourceForm');
const notificationButton = document.getElementById('notificationButton');
const notificationsPanel = document.getElementById('notificationsPanel');
const notificationsList = document.querySelector('.notifications-list');
const notificationBadge = document.querySelector('.notification-badge');
const totalRequestsEl = document.getElementById('totalRequests');
const pendingRequestsEl = document.getElementById('pendingRequests');
const approvedRequestsEl = document.getElementById('approvedRequests');
const rejectedRequestsEl = document.getElementById('rejectedRequests');
const barChartCanvas = document.getElementById('barChart');
const pieChartCanvas = document.getElementById('pieChart');
let barChart, pieChart;

let notifications = [];
let isEditing = false;
let editingResourceId = null;

// Create resource card HTML
function createResourceCard(resource) {
  const statusClass = resource.status.toLowerCase();
  let actions = `
    <button class="action-button edit" title="Edit">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
    </button>
    <button class="action-button delete" title="Delete">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    </button>
  `;
  if (statusClass === 'pending') {
    actions += `
      <button class="action-button approve" title="Approve">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
      </button>
      <button class="action-button reject" title="Reject">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;
  }
  return `
    <div class="resource-card" data-id="${resource.id}">
      <div class="resource-actions">${actions}</div>
      <div class="resource-header">
        <div class="resource-icon">${icons[resource.type]}</div>
        <h3 class="resource-title">${resource.title}</h3>
      </div>
      <p class="resource-description">${resource.description}</p>
      <div class="resource-footer">
        <span class="resource-type">${resource.type}</span>
        <span class="status-badge ${statusClass}">${resource.status}</span>
      </div>
    </div>
  `;
}

// Fetch data from Firebase
function fetchData(path, callback) {
  const dataRef = ref(db, path);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    const dataArray = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    callback(dataArray);
  });
}

// Fetch data once (for synchronous operations)
async function fetchDataOnce(path) {
  return new Promise((resolve) => {
    const dataRef = ref(db, path);
    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      const dataArray = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      resolve(dataArray);
    }, { onlyOnce: true });
  });
}

// Render resources or requests
function renderResources(searchTerm = '') {
  const activeTab = document.querySelector('.tab-button.active').dataset.tab;
  const searchLower = searchTerm.toLowerCase();

  if (activeTab === 'all') {
    fetchData('resources', (resources) => {
      let displayResources = resources.filter(resource =>
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description.toLowerCase().includes(searchLower)
      );
      resourceGrid.innerHTML = displayResources.length
        ? displayResources.map(resource => createResourceCard(resource)).join('')
        : `<div class="no-resources"><p>No resources available.</p></div>`;
    });
  } else {
    fetchData('requests', (requests) => {
      let displayRequests = requests.filter(request =>
        request.status.toLowerCase() === activeTab &&
        (request.title.toLowerCase().includes(searchLower) ||
         request.description.toLowerCase().includes(searchLower))
      );
      resourceGrid.innerHTML = displayRequests.length
        ? displayRequests.map(request => createResourceCard(request)).join('')
        : `<div class="no-resources"><p>No ${activeTab} requests.</p></div>`;
    });
  }
}

// Update stats and charts
function updateStatsAndCharts() {
  fetchData('requests', (requests) => {
    fetchData('resources', (resources) => {
      const totalRequests = requests.length;
      const pendingRequests = requests.filter(r => r.status.toLowerCase() === 'pending').length;
      const approvedRequests = requests.filter(r => r.status.toLowerCase() === 'approved').length;
      const rejectedRequests = requests.filter(r => r.status.toLowerCase() === 'rejected').length;

      totalRequestsEl.textContent = totalRequests;
      pendingRequestsEl.textContent = pendingRequests;
      approvedRequestsEl.textContent = approvedRequests;
      rejectedRequestsEl.textContent = rejectedRequests;

      const requestCounts = {};
      requests.forEach(request => {
        const resourceId = request.resourceId;
        const resource = resources.find(r => r.id === resourceId);
        const title = resource ? resource.title : 'Unknown Resource';
        requestCounts[title] = (requestCounts[title] || 0) + 1;
      });

      const labels = Object.keys(requestCounts);
      const values = Object.values(requestCounts);

      if (barChart) barChart.destroy();
      if (pieChart) pieChart.destroy();

      barChart = new Chart(barChartCanvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Number of Requests',
            data: values,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Number of Requests' } },
            x: { title: { display: true, text: 'Resources' } }
          }
        }
      });

      pieChart = new Chart(pieChartCanvas, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Request Distribution' }
          }
        }
      });
    });
  });
}

// Add new notification (for local array and display)
function addNotification(title, message) {
  const notification = {
    id: Date.now(),
    title,
    message,
    time: new Date(),
    read: false
  };
  notifications.unshift(notification);
  updateNotificationBadge();
  renderNotifications();
  showToast(`${title}: ${message}`);
}

// Update notification badge
function updateNotificationBadge() {
  const unreadCount = notifications.filter(n => !n.read).length;
  notificationBadge.textContent = unreadCount;
  notificationBadge.style.display = unreadCount ? 'flex' : 'none';
  console.log('Notification badge updated:', unreadCount);
}

// Render notifications
function renderNotifications() {
  notificationsList.innerHTML = notifications.length
    ? notifications.map(notification => `
        <div class="notification-item" data-id="${notification.id}">
          <div class="notification-header">
            <span class="notification-title">${notification.title}</span>
            <span class="notification-time">${formatTime(notification.time)}</span>
          </div>
          <p class="notification-message">${notification.message}</p>
        </div>
      `).join('')
    : '<div class="no-notifications">No notifications</div>';
  console.log('Notifications rendered:', notifications);
}

// Format time for notifications
function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'notification';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Listen for admin notifications from Firebase
function listenForNotifications() {
  const notificationsRef = ref(db, 'adminNotifications');
  onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    console.log('Raw notification data from Firebase:', data);
    if (data) {
      notifications = Object.keys(data).map(key => ({
        id: key,
        title: data[key].title,
        message: data[key].message,
        time: new Date(data[key].timestamp),
        read: data[key].read || false,
        customRequestId: data[key].customRequestId // Include custom request ID if present
      })).sort((a, b) => b.time - a.time);
      console.log('Processed notifications:', notifications);
      updateNotificationBadge();
      renderNotifications();
    } else {
      console.log('No notifications found in Firebase');
      notifications = [];
      updateNotificationBadge();
      renderNotifications();
    }
  }, (error) => {
    console.error('Error listening for notifications:', error);
  });
}

// Send notification to student
async function sendNotificationToStudent(studentId, title, message) {
  const notificationsRef = ref(db, `studentNotifications/${studentId}`);
  const newNotificationRef = push(notificationsRef);
  const notificationData = {
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false
  };
  try {
    await set(newNotificationRef, notificationData);
    console.log('Student notification sent:', notificationData);
  } catch (error) {
    console.error('Error sending student notification:', error);
  }
}

// Handle form submission (add or edit)
async function handleResourceFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(resourceForm);
  const resourceData = {
    title: formData.get('title'),
    type: formData.get('type'),
    description: formData.get('description'),
    status: isEditing ? (await getResource(editingResourceId)).status : 'available',
    createdAt: isEditing ? (await getResource(editingResourceId)).createdAt : new Date().toISOString()
  };

  try {
    let resourceRef;
    if (isEditing) {
      resourceRef = ref(db, `resources/${editingResourceId}`);
    } else {
      resourceRef = push(ref(db, 'resources'));
    }

    if (resourceData.type === 'pdf') {
      const file = formData.get('fileUpload');
      if (file) {
        const fileRef = storageRef(storage, `resources/${resourceRef.key}.pdf`);
        await uploadBytes(fileRef, file);
        resourceData.fileUrl = await getDownloadURL(fileRef);
      } else if (isEditing) {
        resourceData.fileUrl = (await getResource(editingResourceId)).fileUrl;
      }
    }

    await set(resourceRef, resourceData);
    addNotification(isEditing ? 'Resource Updated' : 'New Resource Added',
      `"${resourceData.title}" has been ${isEditing ? 'updated' : 'added'}.`);

    // Notify all students when a new resource is added (not updated)
    if (!isEditing) {
      console.log('Adding new resource, notifying students...');
      const users = await fetchDataOnce('users');
      const studentIds = users.filter(u => u.role === 'student').map(u => u.id);
      for (const studentId of studentIds) {
        await sendNotificationToStudent(studentId, 'New Resource Available', `"${resourceData.title}" has been added by an admin.`);
      }

      // Check for matching custom requests and notify specific students
      const customRequests = await fetchDataOnce('customRequests');
      const matchingRequests = customRequests.filter(req => 
        req.resourceName.toLowerCase() === resourceData.title.toLowerCase() &&
        req.resourceType === resourceData.type &&
        req.status === 'pending'
      );
      for (const request of matchingRequests) {
        await sendNotificationToStudent(request.studentId, 'Request Fulfilled', 
          `Your request for "${request.resourceName}" has been added and is now available.`);
        await set(ref(db, `customRequests/${request.id}`), { ...request, status: 'fulfilled' });
      }
    }

    resourceModal.classList.remove('active');
    resetFormState();
    renderResources();
    updateStatsAndCharts();
  } catch (error) {
    console.error(`${isEditing ? 'Edit' : 'Add'} resource error:`, error);
    addNotification('Error', `Failed to ${isEditing ? 'update' : 'add'} resource: ${error.message}`);
  }
}

// Helper to fetch a single resource
async function getResource(resourceId) {
  return new Promise((resolve) => {
    const resourceRef = ref(db, `resources/${resourceId}`);
    onValue(resourceRef, (snapshot) => {
      resolve(snapshot.val() ? { id: resourceId, ...snapshot.val() } : null);
    }, { onlyOnce: true });
  });
}

// Reset form state
function resetFormState() {
  isEditing = false;
  editingResourceId = null;
  resourceForm.reset();
  document.getElementById('fileUploadGroup').style.display = 'none';
  resourceForm.removeEventListener('submit', handleResourceFormSubmit);
  resourceForm.addEventListener('submit', handleResourceFormSubmit);
}

// Initialize the dashboard
function initDashboard() {
  console.log('Initializing admin dashboard');
  renderResources();
  updateStatsAndCharts();
  listenForNotifications();
  updateNotificationBadge();

  searchInput.addEventListener('input', (e) => renderResources(e.target.value));

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      searchInput.value = '';
      renderResources();
    });
  });

  addResourceBtn.addEventListener('click', () => {
    resetFormState();
    document.getElementById('modalTitle').textContent = 'Add New Resource';
    resourceModal.classList.add('active');
  });

  document.querySelector('.close-button').addEventListener('click', () => {
    resourceModal.classList.remove('active');
    resetFormState();
  });

  document.querySelector('[data-action="cancel"]').addEventListener('click', () => {
    resourceModal.classList.remove('active');
    resetFormState();
  });

  document.getElementById('type').addEventListener('change', (e) => {
    document.getElementById('fileUploadGroup').style.display = e.target.value === 'pdf' ? 'block' : 'none';
  });

  resourceForm.addEventListener('submit', handleResourceFormSubmit);

  resourceGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.resource-card');
    if (!card) return;
    const resourceId = card.dataset.id;

    if (e.target.closest('.action-button.edit')) {
      const resource = await getResource(resourceId);
      if (!resource) return;
      isEditing = true;
      editingResourceId = resourceId;
      document.getElementById('modalTitle').textContent = 'Edit Resource';
      document.getElementById('title').value = resource.title;
      document.getElementById('type').value = resource.type;
      document.getElementById('description').value = resource.description;
      document.getElementById('fileUploadGroup').style.display = resource.type === 'pdf' ? 'block' : 'none';
      resourceModal.classList.add('active');
    } else if (e.target.closest('.action-button.delete')) {
      if (confirm('Are you sure you want to delete this resource?')) {
        try {
          const resourceRef = ref(db, `resources/${resourceId}`);
          await set(resourceRef, null);
          addNotification('Resource Deleted', `"${(await getResource(resourceId))?.title || 'Resource'}" has been removed.`);
          renderResources();
          updateStatsAndCharts();
        } catch (error) {
          console.error('Error deleting resource:', error);
          addNotification('Error', 'Failed to delete resource.');
        }
      }
    } else if (e.target.closest('.action-button.approve')) {
      fetchData('requests', async (requests) => {
        const request = requests.find(r => r.id === resourceId);
        if (!request) return;
        const requestRef = ref(db, `requests/${resourceId}`);
        const updatedRequest = { ...request, status: 'approved' };
        if (request.type === 'pdf') {
          const resource = await getResource(request.resourceId);
          updatedRequest.fileUrl = resource.fileUrl;
        }
        await set(requestRef, updatedRequest);
        addNotification('Request Approved', `"${request.title}" has been approved.`);
        await sendNotificationToStudent(request.studentId, 'Request Approved', `Your request for "${request.title}" has been approved.`);
        renderResources();
        updateStatsAndCharts();
      });
    } else if (e.target.closest('.action-button.reject')) {
      fetchData('requests', async (requests) => {
        const request = requests.find(r => r.id === resourceId);
        if (!request) return;
        const requestRef = ref(db, `requests/${resourceId}`);
        await set(requestRef, { ...request, status: 'rejected' });
        addNotification('Request Rejected', `"${request.title}" has been rejected.`);
        await sendNotificationToStudent(request.studentId, 'Request Rejected', `Your request for "${request.title}" has been rejected.`);
        renderResources();
        updateStatsAndCharts();
      });
    }
  });

  notificationButton.addEventListener('click', () => {
    notificationsPanel.classList.toggle('hidden');
    if (!notificationsPanel.classList.contains('hidden')) {
      notifications.forEach(n => n.read = true);
      updateNotificationBadge();
      renderNotifications();
    }
  });

  document.querySelector('.clear-all-button').addEventListener('click', () => {
    notifications = [];
    updateNotificationBadge();
    renderNotifications();
    set(ref(db, 'adminNotifications'), null);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#notificationsPanel') && !e.target.closest('#notificationButton')) {
      notificationsPanel.classList.add('hidden');
    }
  });

  addNotification('Welcome', 'Welcome to the admin dashboard!');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);