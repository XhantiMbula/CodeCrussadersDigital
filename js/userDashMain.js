import { db, ref, onValue, set, push, storage, getDownloadURL, auth } from './index.js';

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
const userNameElement = document.getElementById('userName');
const userInfo = document.getElementById('userInfo');
const notificationButton = document.getElementById('notificationButton');
const notificationsPanel = document.getElementById('notificationsPanel');
const notificationsList = document.querySelector('.notifications-list');
const notificationBadge = document.querySelector('.notification-badge');
const requestNewResourceBtn = document.getElementById('requestNewResourceBtn');
const requestModal = document.getElementById('requestModal');
const requestForm = document.getElementById('requestForm');
const cancelRequestBtn = document.getElementById('cancelRequest');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileRole = document.getElementById('profileRole');
const profileJoined = document.getElementById('profileJoined');
const profileLastLogin = document.getElementById('profileLastLogin');
let notifications = [];

// Create resource card HTML
function createResourceCard(resource, isRequest = false) {
  const statusClass = (resource.status || 'available').toLowerCase();
  let actions = '';
  if (!isRequest && statusClass === 'available') {
    actions = `
      <button class="action-button request" title="Request">
        <h1 class="request-title">Request</h1>
      </button>
    `;
  } else if (isRequest) {
    if (statusClass === 'pending' || statusClass === 'rejected') {
      actions = `
        <button class="action-button cancel" title="Cancel Request">
        <h1 class="request-title">Cancel Request</h1>
        </button>

        <h2> Requested By ${userNameElement}</h2>
      `;
    } else if (statusClass === 'approved') {
      actions = `

      <a href="../assets (2)/documents/Xhanti_Mbula_CV.pdf" class="action-button download" target="_blank"
      > Download Resource </a>
        <h2> Requested By ${userNameElement}</h2>
     
      `;
    }

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
        <span class="status-badge ${statusClass}">${isRequest ? resource.status : 'available'}</span>
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

// Fetch user data once
async function fetchUserDataOnce(userId) {
  return new Promise((resolve) => {
    const userRef = ref(db, `users/${userId}`);
    onValue(userRef, (snapshot) => {
      resolve(snapshot.val() || {});
    }, { onlyOnce: true });
  });
}

// Render resources or requests
function renderResources(searchTerm = '') {
  const activeTab = document.querySelector('.tab-button.active').dataset.tab;
  const searchLower = searchTerm.toLowerCase();
  const user = auth.currentUser;

  if (!user) {
    resourceGrid.innerHTML = '<div class="no-resources"><p>Please log in to view resources.</p></div>';
    return;
  }

  if (activeTab === 'resources') {
    fetchData('resources', (resources) => {
      let displayResources = resources.filter(resource =>
        resource.status === 'available' &&
        (resource.title.toLowerCase().includes(searchLower) ||
         resource.description.toLowerCase().includes(searchLower))
      );
      resourceGrid.innerHTML = displayResources.length
        ? displayResources.map(resource => createResourceCard(resource)).join('')
        : `<div class="no-resources"><p>${searchTerm ? 'No resources found.' : 'No resources available.'}</p></div>`;
    });
  } else if (activeTab === 'requests') {
    fetchData('requests', (requests) => {
      let displayRequests = requests.filter(request =>
        request.studentId === user.uid &&
        (request.title.toLowerCase().includes(searchLower) ||
         request.description.toLowerCase().includes(searchLower))
      );
      resourceGrid.innerHTML = displayRequests.length
        ? displayRequests.map(request => createResourceCard(request, true)).join('')
        : `<div class="no-resources"><p>${searchTerm ? 'No requests found.' : 'You have no requests.'}</p></div>`;
    });
  }
}

// Send notification to admin (for existing resource requests)
async function sendNotificationToAdmin(user, resourceTitle) {
  const notificationsRef = ref(db, 'adminNotifications');
  const newNotificationRef = push(notificationsRef);
  const displayName = user.displayName || user.email.split('@')[0];
  const notificationData = {
    title: 'New Resource Request',
    message: `${displayName} has requested "${resourceTitle}"`,
    timestamp: new Date().toISOString(),
    read: false
  };
  try {
    await set(newNotificationRef, notificationData);
    console.log('Notification sent:', notificationData);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Send custom resource request to admin
async function sendCustomResourceRequest(user, requestData) {
  const customRequestsRef = ref(db, 'customRequests');
  const newRequestRef = push(customRequestsRef);
  const requestPayload = {
    studentId: user.uid,
    studentName: user.displayName || user.email.split('@')[0],
    resourceName: requestData.resourceName,
    resourceType: requestData.resourceType,
    description: requestData.description || 'No description provided',
    status: 'pending',
    requestedAt: new Date().toISOString()
  };
  try {
    await set(newRequestRef, requestPayload);
    const notificationsRef = ref(db, 'adminNotifications');
    const newNotificationRef = push(notificationsRef);
    const notificationData = {
      title: 'Custom Resource Request',
      message: `${requestPayload.studentName} has requested "${requestPayload.resourceName}" (${requestPayload.resourceType})`,
      timestamp: new Date().toISOString(),
      read: false,
      customRequestId: newRequestRef.key
    };
    await set(newNotificationRef, notificationData);
    console.log('Custom request and notification sent:', requestPayload, notificationData);
    alert(`Request for "${requestPayload.resourceName}" sent successfully!`);
  } catch (error) {
    console.error('Error sending custom request:', error);
    alert('Failed to send request: ' + error.message);
  }
}

// Add notification to student
async function addStudentNotification(userId, title, message) {
  const notificationsRef = ref(db, `studentNotifications/${userId}`);
  const newNotificationRef = push(notificationsRef);
  const notificationData = {
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false
  };
  try {
    await set(newNotificationRef, notificationData);
    console.log('Student notification added:', notificationData);
  } catch (error) {
    console.error('Error adding student notification:', error);
  }
}

// Update notification badge
function updateNotificationBadge() {
  const unreadCount = notifications.filter(n => !n.read).length;
  notificationBadge.textContent = unreadCount;
  notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
}

// Render notifications
function renderNotifications() {
  notificationsList.innerHTML = notifications.length
    ? notifications.map(notification => `
        <div class="notification-item" data-id="${notification.id}">
          <div class="notification-header" style="display: flex; justify-content: space-between;">
            <span class="notification-title">${notification.title}</span>
            <span class="notification-time">${formatTime(notification.time)}</span>
          </div>
          <p class="notification-message">${notification.message}</p>
        </div>
      `).join('')
    : '<div class="no-notifications">No notifications</div>';
}

// Format time for notifications and profile dates
function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Listen for student notifications from Firebase
function listenForNotifications(userId) {
  const notificationsRef = ref(db, `studentNotifications/${userId}`);
  onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      notifications = Object.keys(data).map(key => ({
        id: key,
        title: data[key].title,
        message: data[key].message,
        time: new Date(data[key].timestamp),
        read: data[key].read || false
      })).sort((a, b) => b.time - a.time);
      updateNotificationBadge();
      renderNotifications();
    } else {
      notifications = [];
      updateNotificationBadge();
      renderNotifications();
    }
  });
}

// Show profile modal with user details
async function showProfileModal(user) {
  const userData = await fetchUserDataOnce(user.uid);
  const displayName = user.displayName || user.email.split('@')[0] || 'User';
  const joinDate = user.metadata.creationTime || 'Unknown';
  const lastLogin = user.metadata.lastSignInTime || 'Unknown';

  profileName.textContent = displayName;
  profileEmail.textContent = user.email || 'N/A';
  profileRole.textContent = userData.role || 'Student';
  profileJoined.textContent = formatDate(joinDate);
  profileLastLogin.textContent = formatTime(new Date(lastLogin));
  // Use a default avatar or user's photoURL if available
  profileAvatar.src = user.photoURL || '../assets (2)/images (1)/profilePic.png' + displayName.charAt(0).toUpperCase();

  profileModal.classList.add('active');
}

// Initialize the dashboard
function initDashboard(user) {
  const displayName = user.displayName || user.email.split('@')[0] || 'User';
  userNameElement.textContent = `Hello, ${displayName.toLocaleUpperCase()}`;

  renderResources();
  listenForNotifications(user.uid);

  searchInput.addEventListener('input', (e) => renderResources(e.target.value));

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      searchInput.value = '';
      renderResources();
    });
  });

  notificationButton.addEventListener('click', () => {
    notificationsPanel.style.display = notificationsPanel.style.display === 'none' ? 'block' : 'none';
    if (notificationsPanel.style.display === 'block') {
      notifications.forEach(n => n.read = true);
      updateNotificationBadge();
      renderNotifications();
    }
  });

  document.querySelector('.clear-all-button').addEventListener('click', () => {
    notifications = [];
    updateNotificationBadge();
    renderNotifications();
    set(ref(db, `studentNotifications/${user.uid}`), null);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#notificationsPanel') && !e.target.closest('#notificationButton') &&
        !e.target.closest('#profileModal') && !e.target.closest('#userInfo')) {
      notificationsPanel.style.display = 'none';
      profileModal.classList.remove('active');
    }
  });

  // New resource request modal logic
  requestNewResourceBtn.addEventListener('click', () => {
    requestModal.classList.add('active');
  });

  document.querySelector('.close-button').addEventListener('click', () => {
    requestModal.classList.remove('active');
    requestForm.reset();
  });

  cancelRequestBtn.addEventListener('click', () => {
    requestModal.classList.remove('active');
    requestForm.reset();
  });

  requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(requestForm);
    const requestData = {
      resourceName: formData.get('resourceName'),
      resourceType: formData.get('resourceType'),
      description: formData.get('resourceDescription')
    };
    await sendCustomResourceRequest(user, requestData);
    requestModal.classList.remove('active');
    requestForm.reset();
  });

  // Profile modal logic
  userInfo.addEventListener('click', () => {
    showProfileModal(user);
  });

  closeProfileModal.addEventListener('click', () => {
    profileModal.classList.remove('active');
  });

  closeProfileBtn.addEventListener('click', () => {
    profileModal.classList.remove('active');
  });

  resourceGrid.addEventListener('click', async (e) => {
    e.stopPropagation();
    const card = e.target.closest('.resource-card');
    if (!card) return;
    const resourceId = card.dataset.id;

    if (e.target.closest('.action-button.request')) {
      fetchData('resources', async (resources) => {
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) return;
        const requestData = {
          resourceId: resourceId,
          studentId: user.uid,
          title: resource.title,
          type: resource.type,
          description: resource.description,
          status: 'pending',
          requestedAt: new Date().toISOString()
        };
        try {
          const requestsRef = ref(db, 'requests');
          const newRequestRef = push(requestsRef);
          await set(newRequestRef, requestData);
          await sendNotificationToAdmin(user, resource.title);
          alert(`Request for "${resource.title}" submitted successfully!`);
          renderResources();
        } catch (error) {
          console.error('Error submitting request:', error);
          alert('Failed to submit request: ' + error.message);
        }
      });
    } else if (e.target.closest('.action-button.cancel')) {
      try {
        const requestRef = ref(db, `requests/${resourceId}`);
        const snapshot = await new Promise(resolve => onValue(requestRef, resolve, { onlyOnce: true }));
        const request = snapshot.val();
        if (!request || request.studentId !== user.uid || request.status !== 'pending') {
          alert('Cannot cancel this request.');
          return;
        }
        await set(requestRef, null);
        alert(`Request for "${request.title}" canceled successfully!`);
        renderResources();
      } catch (error) {
        console.error('Error canceling request:', error);
        alert('Failed to cancel request: ' + error.message);
      }
    }
  });
}

// Initialize when DOM is loaded and auth state is confirmed
document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      initDashboard(user);
    } else {
      userNameElement.textContent = 'Not Logged In';
      resourceGrid.innerHTML = '<div class="no-resources"><p>Please log in to view resources.</p></div>';
    }
  });
});