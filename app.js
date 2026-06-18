/* ==========================================================================
   VERTEX SEARCH GROUP SPA APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initThemeAndDirection();
  initAccordions();
  initMobileMenu();
  initCounterAnimations();
  initResumePreviewSync();
});

/* ==========================================
   1. NAVIGATION & SPA ROUTING STATE
   ========================================== */
function navigateTo(viewId, event) {
  if (event) event.preventDefault();

  // Close dashboard sidebar if open
  closeDashboardSidebar();

  // 1. Hide all views, remove active classes
  const views = document.querySelectorAll('.app-view');
  views.forEach(view => view.classList.remove('active-view'));

  // 2. Show requested view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active-view');
  }

  // 3. Manage Header/Footer Visibility on Dashboards
  const isDashboard = viewId.includes('dashboard') || viewId === 'login' || viewId === 'register';
  if (isDashboard) {
    document.body.classList.add('dashboard-active');
    // Default dashboard sub-tabs reset
    if (viewId === 'user-dashboard') {
      switchDashboardTab('user-overview');
    } else if (viewId === 'admin-dashboard') {
      switchDashboardTab('admin-overview');
    }
  } else {
    document.body.classList.remove('dashboard-active');
  }

  // 4. Update Header Nav Active state
  updateHeaderActiveLink(viewId);

  // 5. Close Mobile Menu if open
  closeMobileMenu();

  // 6. Trigger counter animations if entering Home 1
  if (viewId === 'home-1') {
    resetAndRunCounters();
  }

  // 6b. Initialize Leaflet Map if entering Home 2
  if (viewId === 'home-2') {
    initLeafletMap();
  }

  // 7. Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateHeaderActiveLink(viewId) {
  const navLinks = document.querySelectorAll('.nav-link, .dropdown-link, .mobile-nav-link, .mobile-dropdown-link');
  navLinks.forEach(link => link.classList.remove('active-link'));

  // Highlight matches
  navLinks.forEach(link => {
    const clickAttr = link.getAttribute('onclick');
    if (clickAttr && clickAttr.includes(`'${viewId}'`)) {
      link.classList.add('active-link');
      
      // Also highlight parent if it is a dropdown
      const dropdownParent = link.closest('.has-dropdown, .mobile-dropdown');
      if (dropdownParent) {
        const toggle = dropdownParent.querySelector('.dropdown-toggle, .mobile-dropdown-toggle');
        if (toggle) toggle.classList.add('active-link');
      }
    }
  });
}

/* Dashboard Tab Switches */
function switchDashboardTab(tabId, event) {
  if (event) event.preventDefault();

  // Close dashboard sidebar if open
  closeDashboardSidebar();

  // Find dashboard container (user or admin)
  const isUserTab = tabId.startsWith('user');
  const dashboardClass = isUserTab ? '#view-user-dashboard' : '#view-admin-dashboard';
  const dashboard = document.querySelector(dashboardClass);

  if (!dashboard) return;

  // Toggle active tab link
  const tabLinks = dashboard.querySelectorAll('.sidebar-nav-link');
  tabLinks.forEach(link => link.classList.remove('active-nav'));

  const activeLink = Array.from(tabLinks).find(link => {
    const clickAttr = link.getAttribute('onclick');
    return clickAttr && clickAttr.includes(`'${tabId}'`);
  });
  if (activeLink) activeLink.classList.add('active-nav');

  // Toggle tab contents
  const contents = dashboard.querySelectorAll('.dashboard-tab-content');
  contents.forEach(content => content.classList.remove('active-tab-content'));

  const targetContent = document.getElementById(`tab-${tabId}`);
  if (targetContent) {
    targetContent.classList.add('active-tab-content');
  }
}

/* ==========================================
   2. THEME (DARK/LIGHT) & DIRECTION (LTR/RTL)
   ========================================== */
function initThemeAndDirection() {
  const htmlElement = document.documentElement;

  // Select all theme toggle buttons (header & dashboards)
  const themeToggles = document.querySelectorAll('#theme-toggle-btn, #mobile-theme-toggle, .dash-theme-toggle');
  themeToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      let isLight = false;
      if (htmlElement.classList.contains('dark-theme')) {
        htmlElement.classList.replace('dark-theme', 'light-theme');
        isLight = true;
      } else {
        htmlElement.classList.replace('light-theme', 'dark-theme');
      }
      updateMapTheme(isLight);
    });
  });

  // Select all direction toggles
  const dirToggles = document.querySelectorAll('#direction-toggle-btn, #mobile-direction-toggle, .dash-direction-toggle');
  dirToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const currentDir = htmlElement.getAttribute('dir') || 'ltr';
      const newDir = currentDir === 'rtl' ? 'ltr' : 'rtl';
      updateDirectionUI(newDir);
    });
  });

  // Set initial text direction label on load
  const initialDir = htmlElement.getAttribute('dir') || 'ltr';
  updateDirectionUI(initialDir);
}

function updateDirectionUI(dir) {
  const htmlElement = document.documentElement;
  
  // Set dir and lang attribute on html
  htmlElement.setAttribute('dir', dir);
  if (dir === 'rtl') {
    htmlElement.setAttribute('lang', 'ar');
  } else {
    htmlElement.setAttribute('lang', 'en');
  }

  // Update text of main header LTR/RTL button
  const mainToggle = document.getElementById('direction-toggle-btn');
  if (mainToggle) {
    mainToggle.innerText = dir.toUpperCase();
  }

  // Update text of mobile nav LTR/RTL button
  const mobileToggleBadge = document.querySelector('.mobile-dir-badge');
  if (mobileToggleBadge) {
    mobileToggleBadge.innerText = dir.toUpperCase();
  }

  // Update text of dashboard LTR/RTL button
  const dashToggles = document.querySelectorAll('.dash-direction-toggle');
  dashToggles.forEach(toggle => {
    const span = toggle.querySelector('span');
    if (span) {
      span.innerText = dir.toUpperCase();
    } else {
      toggle.innerText = dir.toUpperCase();
    }
  });
}

/* ==========================================
   3. MOBILE NAVIGATION DRAWER
   ========================================== */
function initMobileMenu() {
  const trigger = document.getElementById('mobile-menu-trigger');
  const nav = document.getElementById('mobile-nav');

  if (trigger && nav) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      trigger.classList.toggle('active');
      nav.classList.toggle('open');
      document.body.classList.toggle('menu-open');
    });
  }

  // Mobile navigation dropdown triggers
  const mobileDropdowns = document.querySelectorAll('.mobile-dropdown-toggle');
  mobileDropdowns.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const parent = toggle.closest('.mobile-dropdown');
      if (parent) {
        // Toggle open state on the clicked dropdown
        parent.classList.toggle('open-dropdown');
      }
    });
  });
}

function closeMobileMenu() {
  const trigger = document.getElementById('mobile-menu-trigger');
  const nav = document.getElementById('mobile-nav');
  if (trigger && nav) {
    trigger.classList.remove('active');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
  }
}

/* ==========================================
   4. ACCORDIONS & INTERACTIVE ELEMENTS
   ========================================== */
function initAccordions() {
  // Home 2 solutions accordion
  const solutions = document.querySelectorAll('.solution-item');
  solutions.forEach(item => {
    const header = item.querySelector('.solution-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active-solution');
      
      // Close all others
      solutions.forEach(s => s.classList.remove('active-solution'));
      
      if (!isActive) {
        item.classList.add('active-solution');
      }
    });
  });

  // FAQ Accordion
  const faqs = document.querySelectorAll('.faq-item');
  faqs.forEach(item => {
    item.addEventListener('click', () => {
      const isActive = item.classList.contains('active-faq');
      
      // Close all
      faqs.forEach(f => f.classList.remove('active-faq'));
      
      if (!isActive) {
        item.classList.add('active-faq');
      }
    });
  });
}

/* ==========================================
   5. COUNTER METRICS ANIMATIONS
   ========================================== */
function initCounterAnimations() {
  // Trigger counters initially on page load if Home 1 is active
  const home1 = document.getElementById('view-home-1');
  if (home1 && home1.classList.contains('active-view')) {
    resetAndRunCounters();
  }
}

function resetAndRunCounters() {
  const counters = document.querySelectorAll('.stat-number');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'), 10);
    const text = counter.innerText;
    const suffix = text.includes('%') ? '%' : (text.includes('m+') ? 'm+' : '');
    
    let count = 0;
    
    const updateCount = () => {
      const increment = Math.ceil(target / 40); // step increments
      if (count < target) {
        count += increment;
        if (count > target) count = target;
        counter.innerText = count + suffix;
        setTimeout(updateCount, 40);
      } else {
        counter.innerText = target + suffix;
      }
    };
    
    counter.innerText = '0' + suffix;
    updateCount();
  });
}

/* ==========================================
   6. CONTACT SECURE FORM SUBMISSIONS
   ========================================== */
function handleContactSubmit(event, type) {
  event.preventDefault();

  const formId = type === 'client' ? 'secure-client-form' : 'secure-candidate-form';
  const successId = type === 'client' ? 'client-form-success' : 'candidate-form-success';

  const form = document.getElementById(formId);
  const successAlert = document.getElementById(successId);

  if (form && successAlert) {
    // Add smooth transition
    form.style.opacity = '0';
    setTimeout(() => {
      form.classList.add('hidden');
      successAlert.classList.remove('hidden');
      successAlert.style.opacity = '1';
    }, 300);
  }
}

/* ==========================================
   7. USER RESUME PREVIEW SYNC & CONTROLS
   ========================================== */
function initResumePreviewSync() {
  const anonNameCheckbox = document.getElementById('toggle-anon-name');
  const anonCompCheckbox = document.getElementById('toggle-anon-company');

  const previewName = document.getElementById('preview-anon-name');
  const previewComp = document.getElementById('preview-anon-comp');

  if (anonNameCheckbox && previewName) {
    anonNameCheckbox.addEventListener('change', () => {
      if (anonNameCheckbox.checked) {
        previewName.innerText = 'Candidate #CH-8802 (Confidential)';
      } else {
        previewName.innerText = 'Richard Sterling';
      }
    });
  }

  if (anonCompCheckbox && previewComp) {
    anonCompCheckbox.addEventListener('change', () => {
      if (anonCompCheckbox.checked) {
        previewComp.innerText = 'Leading Biotech Entity';
      } else {
        previewComp.innerText = 'Sterling Bio-Therapeutics Inc.';
      }
    });
  }
}

/* ==========================================
   8. ADMIN PORTAL METRICS BOARD (KANBAN MOVEMENT)
   ========================================== */
function moveKanbanCard(cardElement, nextColId) {
  const targetColumn = document.getElementById(nextColId);
  if (!targetColumn) return;

  const cardsList = targetColumn.querySelector('.kanban-cards-list');
  if (cardsList) {
    // Smooth transition
    cardElement.style.opacity = '0.3';
    setTimeout(() => {
      cardsList.appendChild(cardElement);
      cardElement.style.opacity = '1';
      
      // Update the headers' card counts dynamically
      updateKanbanCounts();
    }, 250);
  }
}

function updateKanbanCounts() {
  const columns = document.querySelectorAll('.kanban-column');
  columns.forEach(col => {
    const header = col.querySelector('.col-header');
    const cards = col.querySelectorAll('.kanban-card');
    const titleText = header.innerText.split(' (')[0];
    header.innerText = `${titleText} (${cards.length})`;
  });
}

// Global functions for routing and client setup
function initNavigation() {
  // Setup click triggers on all anchor tags linking to views
  const hash = window.location.hash;
  if (hash) {
    const viewId = hash.substring(1);
    navigateTo(viewId);
    if (viewId === 'home-2') {
      initLeafletMap();
    }
  }
}

/* ==========================================
   9. LEAFLET MAP INITIALIZATION & THEMING
   ========================================== */
let mapInstance = null;
let mapTileLayer = null;

function initLeafletMap() {
  const mapContainer = document.getElementById('leaflet-map');
  if (!mapContainer) return;
  
  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 200);
    return;
  }

  const locations = [
    { name: "New York (HQ)", coords: [40.7128, -74.0060] },
    { name: "London", coords: [51.5074, -0.1278] },
    { name: "Zurich", coords: [47.3769, 8.5417] },
    { name: "Singapore", coords: [1.3521, 103.8198] },
    { name: "Tokyo", coords: [35.6762, 139.6503] }
  ];

  mapInstance = L.map('leaflet-map', {
    center: [30.0, 15.0],
    zoom: 2,
    zoomControl: false,
    attributionControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  const isLight = document.documentElement.classList.contains('light-theme');
  const tileUrl = isLight 
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  mapTileLayer = L.tileLayer(tileUrl, {
    maxZoom: 19
  }).addTo(mapInstance);

  const goldIcon = L.divIcon({
    className: 'custom-map-pin',
    html: '<div class="pin-dot"></div><div class="pin-pulse"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  locations.forEach(loc => {
    L.marker(loc.coords, { icon: goldIcon })
      .addTo(mapInstance)
      .bindTooltip(loc.name, {
        permanent: true,
        direction: 'top',
        className: 'custom-tooltip'
      });
  });

  setTimeout(() => mapInstance.invalidateSize(), 300);
}

function updateMapTheme(isLight) {
  if (!mapInstance || !mapTileLayer) return;
  const newUrl = isLight 
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  mapTileLayer.setUrl(newUrl);
}

function toggleDashboardSidebar() {
  const activeDashboard = document.querySelector('.dashboard-layout-view.active-view');
  if (activeDashboard) {
    const sidebar = activeDashboard.querySelector('.dashboard-sidebar');
    const overlay = activeDashboard.querySelector('.dashboard-sidebar-overlay');
    if (sidebar) {
      sidebar.classList.toggle('sidebar-open');
    }
    if (overlay) {
      overlay.classList.toggle('active');
    }
  }
}

function closeDashboardSidebar() {
  const sidebars = document.querySelectorAll('.dashboard-sidebar');
  sidebars.forEach(sidebar => sidebar.classList.remove('sidebar-open'));
  const overlays = document.querySelectorAll('.dashboard-sidebar-overlay');
  overlays.forEach(overlay => overlay.classList.remove('active'));
}

// Global Exports for inline HTML onclick handlers
window.navigateTo = navigateTo;
window.switchDashboardTab = switchDashboardTab;
window.handleContactSubmit = handleContactSubmit;
window.moveKanbanCard = moveKanbanCard;
window.toggleDashboardSidebar = toggleDashboardSidebar;
window.closeDashboardSidebar = closeDashboardSidebar;
