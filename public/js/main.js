// Urban Issue Reporter - Main JS

document.addEventListener('DOMContentLoaded', () => {

  // ---- Sidebar Toggle (Mobile) ----
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ---- Socket.io Live Updates ----
  if (typeof io !== 'undefined') {
    const socket = io();

    socket.on('dashboard-update', (data) => {
      showToast(data.message || 'Issue updated', 'info');
      // Optionally refresh stats
    });

    // Notification bell count
    updateNotifCount();
    setInterval(updateNotifCount, 30000);
  }

  // ---- Auto-dismiss alerts ----
  setTimeout(() => {
    document.querySelectorAll('.alert').forEach(a => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(a);
      bsAlert.close();
    });
  }, 5000);

  // ---- Form validation feedback ----
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function() {
      const btn = this.querySelector('[type=submit]');
      if (btn) {
        btn.disabled = true;
        const original = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = original;
        }, 10000);
      }
    });
  });
});

// ---- Notification count ----
async function updateNotifCount() {
  try {
    const res = await fetch('/api/notifications/unread-count');
    const data = await res.json();
    const badge = document.getElementById('notifCount');
    if (badge) {
      if (data.count > 0) {
        badge.textContent = data.count > 9 ? '9+' : data.count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (e) {}
}

// ---- Toast notification ----
function showToast(message, type = 'info') {
  const toastEl = document.getElementById('liveToast');
  const msgEl = document.getElementById('toastMsg');
  if (toastEl && msgEl) {
    msgEl.textContent = message;
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
    toast.show();
  } else {
    // Create a toast dynamically if not in template
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;min-width:300px;';
    div.innerHTML = `
      <div class="toast show align-items-center text-bg-primary border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }
}

// ---- Password strength indicator ----
const pwField = document.querySelector('[name=password]');
if (pwField && pwField.closest('#registerForm, [action*=register]')) {
  pwField.addEventListener('input', function() {
    const strength = getPasswordStrength(this.value);
    // Could show indicator here
  });
}

function getPasswordStrength(pass) {
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return score;
}
