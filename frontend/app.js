/**
 * RouteShield — Safer Route Planner
 * Frontend Core Application Logic
 */

(function () {
  'use strict';

  // Instantiate Provider Services
  const geocodingService = new GeocodingService();
  const routingService = new RoutingService();

  // Application State
  const state = {
    user: null,
    currentCoords: null,
    startCoords: null, // { lat, lng, name, displayName }
    destCoords: null,  // { lat, lng, name, displayName }
    travelMode: 'foot', // 'foot', 'bike', 'driving'
    routes: [],
    selectedRouteIndex: 0,
    pickingLocationForReport: false,
    layers: {
      streetlights: true,
      hazards: true,
      reports: true,
      infrastructure: true
    }
  };

  // Map & Layer References
  let map = null;
  const layerGroups = {
    routes: null,
    streetlights: null,
    hazards: null,
    reports: null,
    infrastructure: null,
    markers: null
  };

  // Active Map Route Polylines map
  let activePolylines = [];

  // DOM Elements Cache
  const elements = {
    mapCanvas: document.getElementById('map'),
    sidebarPanel: document.getElementById('sidebarPanel'),
    mobileToggleBtn: document.getElementById('btnMobileToggle'),
    startInput: document.getElementById('startInput'),
    destInput: document.getElementById('destInput'),
    startSuggestions: document.getElementById('startSuggestions'),
    destSuggestions: document.getElementById('destSuggestions'),
    btnCurrentLocation: document.getElementById('btnCurrentLocation'),
    btnSwapLocations: document.getElementById('btnSwapLocations'),
    btnClearDest: document.getElementById('btnClearDest'),
    btnCalculateRoute: document.getElementById('btnCalculateRoute'),
    routeResultsSection: document.getElementById('routeResultsSection'),
    routesList: document.getElementById('routesList'),
    routeCount: document.getElementById('routeCount'),
    activeRouteDetails: document.getElementById('activeRouteDetails'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    // Modals
    modalReport: document.getElementById('modalReport'),
    modalAuth: document.getElementById('modalAuth'),
    modalInfo: document.getElementById('modalInfo'),
    btnOpenReportModal: document.getElementById('btnOpenReportModal'),
    btnAuthToggle: document.getElementById('btnAuthToggle'),
    btnInfoModal: document.getElementById('btnInfoModal'),
    authBtnText: document.getElementById('authBtnText'),
    tabSignIn: document.getElementById('tabSignIn'),
    tabRegister: document.getElementById('tabRegister'),
    signInForm: document.getElementById('signInForm'),
    registerForm: document.getElementById('registerForm'),
    btnPickReportLocation: document.getElementById('btnPickReportLocation'),
    reportCoordinatesLabel: document.getElementById('reportCoordinatesLabel'),
    reportLatInput: document.getElementById('reportLatitude'),
    reportLngInput: document.getElementById('reportLongitude'),
    reportAddressInput: document.getElementById('reportLocationAddress'),
    btnToggleLegend: document.getElementById('btnToggleLegend'),
    legendContent: document.getElementById('legendContent'),
    btnMapRecenter: document.getElementById('btnMapRecenter'),
    btnMapZoomIn: document.getElementById('btnMapZoomIn'),
    btnMapZoomOut: document.getElementById('btnMapZoomOut'),
    systemStatusText: document.getElementById('systemStatusText'),
    toastContainer: document.getElementById('toastContainer')
  };

  /**
   * Debounce utility
   */
  function debounce(fn, delayMs = 300) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delayMs);
    };
  }

  /**
   * Initialize Leaflet Interactive Map
   */
  function initMap() {
    const defaultLat = 51.5074;
    const defaultLng = -0.1278;
    const defaultZoom = 13;

    map = L.map(elements.mapCanvas, {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: false
    });

    const darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    });

    darkTileLayer.addTo(map);
    elements.mapCanvas.classList.add('carto-dark');

    // Layer Groups
    layerGroups.routes = L.layerGroup().addTo(map);
    layerGroups.streetlights = L.layerGroup().addTo(map);
    layerGroups.hazards = L.layerGroup().addTo(map);
    layerGroups.reports = L.layerGroup().addTo(map);
    layerGroups.infrastructure = L.layerGroup().addTo(map);
    layerGroups.markers = L.layerGroup().addTo(map);

    map.on('click', handleMapClick);

    // Initial visual infrastructure
    loadInitialVisualIndicators(defaultLat, defaultLng);

    updateStatus('Interactive Map Initialized');
  }

  /**
   * Custom SVG Marker Icons
   */
  function createCustomIcon(type, color) {
    let svgHtml = '';
    let iconSize = [32, 32];
    let iconAnchor = [16, 32];

    if (type === 'start') {
      svgHtml = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" fill="#0A0F1D" stroke="${color || '#00F5A0'}" stroke-width="3"/>
          <circle cx="16" cy="16" r="6" fill="${color || '#00F5A0'}"/>
        </svg>
      `;
      iconAnchor = [16, 16];
    } else if (type === 'dest') {
      svgHtml = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 2C10.5 2 6 6.5 6 12C6 19.5 16 30 16 30C16 30 26 19.5 26 12C26 6.5 21.5 2 16 2Z" fill="#0A0F1D" stroke="${color || '#38BDF8'}" stroke-width="2.5"/>
          <circle cx="16" cy="12" r="4.5" fill="${color || '#38BDF8'}"/>
        </svg>
      `;
      iconAnchor = [16, 30];
    } else if (type === 'hazard') {
      svgHtml = `
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <polygon points="14,2 26,24 2,24" fill="#EF4444" fill-opacity="0.2" stroke="#EF4444" stroke-width="2.5"/>
          <line x1="14" y1="10" x2="14" y2="16" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
          <circle cx="14" cy="20" r="1.2" fill="#FFFFFF"/>
        </svg>
      `;
      iconAnchor = [14, 24];
    }

    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: svgHtml,
      iconSize: iconSize,
      iconAnchor: iconAnchor
    });
  }

  /**
   * Load visual infrastructure sample indicators for Phase 1 verification
   */
  function loadInitialVisualIndicators(lat, lng) {
    const lightOffsets = [
      [0.003, 0.002], [0.002, 0.004], [-0.001, 0.003],
      [-0.003, -0.002], [0.001, -0.004], [0.004, -0.001]
    ];

    lightOffsets.forEach(([dLat, dLng]) => {
      const circle = L.circleMarker([lat + dLat, lng + dLng], {
        radius: 4,
        color: '#FCD34D',
        fillColor: '#FDE68A',
        fillOpacity: 0.8,
        weight: 1
      });
      circle.bindPopup(`
        <div style="font-family: var(--font-family); color: #F8FAFC; background: #131E35; padding: 6px 8px; border-radius: 6px; font-size: 12px;">
          <strong style="color: #FCD34D;">Streetlight Node</strong><br>
          Verified public lighting fixture<br>
          <span style="color: #94A3B8; font-size: 10px;">Source: OpenStreetMap Infrastructure</span>
        </div>
      `);
      layerGroups.streetlights.addLayer(circle);
    });

    const hazardMarker = L.marker([lat + 0.0025, lng - 0.0035], {
      icon: createCustomIcon('hazard')
    });
    hazardMarker.bindPopup(`
      <div style="font-family: var(--font-family); color: #F8FAFC; background: #131E35; padding: 8px; border-radius: 6px; font-size: 12px; max-width: 200px;">
        <strong style="color: #EF4444;">Verified Hazard: Uneven Pavement</strong><br>
        <span style="color: #94A3B8; font-size: 11px;">Active sidewalk repair excavation. Pedestrians advised to use opposite path.</span><br>
        <span style="color: #00F5A0; font-size: 10px;">Status: Verified by Municipal Audit</span>
      </div>
    `);
    layerGroups.hazards.addLayer(hazardMarker);
  }

  /**
   * Map Click Event Handler
   */
  function handleMapClick(e) {
    if (state.pickingLocationForReport) {
      const { lat, lng } = e.latlng;
      state.pickingLocationForReport = false;
      elements.reportLatInput.value = lat.toFixed(6);
      elements.reportLngInput.value = lng.toFixed(6);
      elements.reportCoordinatesLabel.textContent = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      elements.reportAddressInput.value = `Selected Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

      showModal(elements.modalReport);
      showToast('Location selected from map.', 'success');
    }
  }

  /**
   * Geocoding Autocomplete Setup
   */
  function setupAutocomplete() {
    const handleInput = (inputEl, dropdownEl, targetCoordKey) => {
      const query = inputEl.value.trim();
      if (query.length < 3) {
        dropdownEl.innerHTML = '';
        dropdownEl.classList.add('hidden');
        return;
      }

      geocodingService.search(query)
        .then(results => {
          dropdownEl.innerHTML = '';
          if (!results || results.length === 0) {
            dropdownEl.innerHTML = '<div class="suggestion-item"><span class="suggestion-name">No matching locations found</span></div>';
            dropdownEl.classList.remove('hidden');
            return;
          }

          results.forEach(loc => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.setAttribute('role', 'option');
            item.innerHTML = `
              <span class="suggestion-name">${escapeHtml(loc.name)}</span>
              <span class="suggestion-sub">${escapeHtml(loc.displayName)}</span>
            `;

            item.addEventListener('click', () => {
              inputEl.value = loc.displayName;
              state[targetCoordKey] = {
                lat: loc.lat,
                lng: loc.lng,
                name: loc.name,
                displayName: loc.displayName
              };
              dropdownEl.classList.add('hidden');

              // Pan map smoothly to the selected location
              map.flyTo([loc.lat, loc.lng], 14);
              renderRouteEndpoints();
            });

            dropdownEl.appendChild(item);
          });

          dropdownEl.classList.remove('hidden');
        })
        .catch(err => {
          console.error(err);
          dropdownEl.classList.add('hidden');
        });
    };

    const debouncedStart = debounce(() => handleInput(elements.startInput, elements.startSuggestions, 'startCoords'), 300);
    const debouncedDest = debounce(() => handleInput(elements.destInput, elements.destSuggestions, 'destCoords'), 300);

    elements.startInput.addEventListener('input', debouncedStart);
    elements.destInput.addEventListener('input', debouncedDest);

    // Hide dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!elements.startInput.contains(e.target) && !elements.startSuggestions.contains(e.target)) {
        elements.startSuggestions.classList.add('hidden');
      }
      if (!elements.destInput.contains(e.target) && !elements.destSuggestions.contains(e.target)) {
        elements.destSuggestions.classList.add('hidden');
      }
    });
  }

  /**
   * Browser Geolocation Handler
   */
  function requestCurrentLocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    elements.btnCurrentLocation.disabled = true;
    updateStatus('Acquiring GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        elements.btnCurrentLocation.disabled = false;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        state.currentCoords = { lat, lng };

        // Attempt reverse geocode for a readable address
        try {
          const loc = await geocodingService.reverse(lat, lng);
          state.startCoords = {
            lat,
            lng,
            name: 'Current Location',
            displayName: loc.displayName || `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          };
          elements.startInput.value = state.startCoords.displayName;
        } catch {
          state.startCoords = {
            lat,
            lng,
            name: 'Current Location',
            displayName: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          };
          elements.startInput.value = state.startCoords.displayName;
        }

        map.flyTo([lat, lng], 15);
        renderRouteEndpoints();
        showToast('Acquired current GPS location', 'success');
        updateStatus('GPS Location Active');
      },
      (err) => {
        elements.btnCurrentLocation.disabled = false;
        let errMsg = 'Failed to acquire location.';
        if (err.code === err.PERMISSION_DENIED) {
          errMsg = 'Location permission was denied by browser settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errMsg = 'Location information is currently unavailable.';
        } else if (err.code === err.TIMEOUT) {
          errMsg = 'Location request timed out.';
        }
        showToast(errMsg, 'error');
        updateStatus('Map Ready');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }

  /**
   * Render Origin & Destination markers
   */
  function renderRouteEndpoints() {
    layerGroups.markers.clearLayers();

    if (state.startCoords) {
      const startMarker = L.marker([state.startCoords.lat, state.startCoords.lng], {
        icon: createCustomIcon('start')
      }).bindPopup(`<strong>Origin</strong><br>${escapeHtml(state.startCoords.displayName || state.startCoords.name)}`);
      layerGroups.markers.addLayer(startMarker);
    }

    if (state.destCoords) {
      const destMarker = L.marker([state.destCoords.lat, state.destCoords.lng], {
        icon: createCustomIcon('dest')
      }).bindPopup(`<strong>Destination</strong><br>${escapeHtml(state.destCoords.displayName || state.destCoords.name)}`);
      layerGroups.markers.addLayer(destMarker);
    }
  }

  /**
   * Calculate & Compare Routes (Feature 1 & Feature 2)
   */
  async function calculateRoutes() {
    const startText = elements.startInput.value.trim();
    const destText = elements.destInput.value.trim();

    if (!startText || !destText) {
      showToast('Please enter both origin and destination addresses.', 'warning');
      return;
    }

    elements.btnCalculateRoute.disabled = true;
    updateStatus('Calculating available routes...');

    try {
      // If user typed without clicking suggestion, geocode start
      if (!state.startCoords || state.startCoords.displayName !== startText) {
        const startResults = await geocodingService.search(startText, { limit: 1 });
        if (!startResults || startResults.length === 0) {
          throw new Error(`Could not find location for starting point: "${startText}"`);
        }
        state.startCoords = {
          lat: startResults[0].lat,
          lng: startResults[0].lng,
          name: startResults[0].name,
          displayName: startResults[0].displayName
        };
      }

      // If user typed without clicking suggestion, geocode dest
      if (!state.destCoords || state.destCoords.displayName !== destText) {
        const destResults = await geocodingService.search(destText, { limit: 1 });
        if (!destResults || destResults.length === 0) {
          throw new Error(`Could not find location for destination: "${destText}"`);
        }
        state.destCoords = {
          lat: destResults[0].lat,
          lng: destResults[0].lng,
          name: destResults[0].name,
          displayName: destResults[0].displayName
        };
      }

      renderRouteEndpoints();

      // Request routes from Routing Provider
      const routes = await routingService.getRoutes(state.startCoords, state.destCoords, {
        mode: state.travelMode
      });

      state.routes = routes;
      state.selectedRouteIndex = 0;

      // Render routes onto map and sidebar
      renderRoutesOnMap();
      renderRoutesList();

      elements.routeResultsSection.classList.remove('hidden');
      updateStatus(`Found ${routes.length} route ${routes.length === 1 ? 'option' : 'alternatives'}`);
      showToast(`Computed ${routes.length} available route(s).`, 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
      updateStatus('Routing error occurred');
    } finally {
      elements.btnCalculateRoute.disabled = false;
    }
  }

  /**
   * Render Route Polylines on Leaflet Map
   */
  function renderRoutesOnMap() {
    layerGroups.routes.clearLayers();
    activePolylines = [];

    if (!state.routes || state.routes.length === 0) return;

    const bounds = L.latLngBounds();

    state.routes.forEach((route, idx) => {
      // GeoJSON LineString coordinates are [lng, lat], Leaflet wants [lat, lng]
      const latLngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      latLngs.forEach(ll => bounds.extend(ll));

      const isSelected = idx === state.selectedRouteIndex;

      // Polyline styles: mint green for selected, subdued purple/blue for alternatives
      const polyline = L.polyline(latLngs, {
        color: isSelected ? '#00F5A0' : '#818CF8',
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 0.95 : 0.55,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: isSelected ? null : '6, 8'
      });

      // Click on route polyline directly selects it
      polyline.on('click', () => {
        selectRoute(idx);
      });

      polyline.bindTooltip(`
        <div style="font-family: var(--font-family); font-size: 11px; color: #F8FAFC;">
          <strong>${escapeHtml(route.title)}</strong><br>
          ${route.distanceDisplay} &bull; ${route.durationDisplay}
        </div>
      `, { sticky: true });

      layerGroups.routes.addLayer(polyline);
      activePolylines.push(polyline);
    });

    // Fit map bounds to view all routes
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  /**
   * Render Route Comparison Cards in Sidebar
   */
  function renderRoutesList() {
    elements.routesList.innerHTML = '';
    elements.routeCount.textContent = state.routes.length;

    state.routes.forEach((route, idx) => {
      const isSelected = idx === state.selectedRouteIndex;
      const card = document.createElement('div');
      card.className = `route-card ${isSelected ? 'active' : ''}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      card.innerHTML = `
        <div class="route-card-top">
          <div class="route-title">
            <span class="label-dot" style="background-color: ${isSelected ? '#00F5A0' : '#818CF8'};"></span>
            ${escapeHtml(route.title)}
          </div>
          <span class="route-tag" style="${isSelected ? '' : 'background: rgba(129, 140, 248, 0.1); color: #818CF8; border-color: rgba(129, 140, 248, 0.2);'}">
            ${isSelected ? 'Selected' : 'Alternative'}
          </span>
        </div>
        <div class="route-metrics">
          <div class="route-time">${escapeHtml(route.durationDisplay)}</div>
          <div class="route-dist">${escapeHtml(route.distanceDisplay)}</div>
        </div>
        <div class="route-safety-preview">
          <span class="safety-indicator-chip unavailable">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Safety data unavailable
          </span>
          <span class="confidence-chip">No score fabricated</span>
        </div>
      `;

      card.addEventListener('click', () => {
        selectRoute(idx);
      });

      elements.routesList.appendChild(card);
    });

    renderActiveRouteDetails();
  }

  /**
   * Select Active Route
   */
  function selectRoute(idx) {
    if (idx < 0 || idx >= state.routes.length) return;
    state.selectedRouteIndex = idx;

    // Update polylines
    activePolylines.forEach((poly, i) => {
      const isSelected = i === idx;
      poly.setStyle({
        color: isSelected ? '#00F5A0' : '#818CF8',
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 0.95 : 0.55,
        dashArray: isSelected ? null : '6, 8'
      });
      if (isSelected) poly.bringToFront();
    });

    // Update cards
    const cards = elements.routesList.querySelectorAll('.route-card');
    cards.forEach((card, i) => {
      if (i === idx) {
        card.classList.add('active');
        const tag = card.querySelector('.route-tag');
        if (tag) {
          tag.textContent = 'Selected';
          tag.style = '';
        }
      } else {
        card.classList.remove('active');
        const tag = card.querySelector('.route-tag');
        if (tag) {
          tag.textContent = 'Alternative';
          tag.style = 'background: rgba(129, 140, 248, 0.1); color: #818CF8; border-color: rgba(129, 140, 248, 0.2);';
        }
      }
    });

    renderActiveRouteDetails();
    showToast(`Switched to Route ${idx + 1}.`, 'info');
  }

  /**
   * Render Selected Route Details & Transparency Notice
   */
  function renderActiveRouteDetails() {
    const activeRoute = state.routes[state.selectedRouteIndex];
    if (!activeRoute) {
      elements.activeRouteDetails.classList.add('hidden');
      return;
    }

    elements.activeRouteDetails.classList.remove('hidden');
    elements.activeRouteDetails.innerHTML = `
      <div style="font-size: 0.76rem; color: var(--text-muted); background: var(--bg-darkest); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 0.5rem;">
        <div style="font-weight: 600; color: var(--text-white); margin-bottom: 0.25rem;">Routing Information & Limitations</div>
        <p>${escapeHtml(activeRoute.dataLimitations)}</p>
      </div>
    `;
  }

  /**
   * Layer Visibility Toggle Handlers
   */
  function setupLayerToggles() {
    const toggles = [
      { id: 'layerStreetlights', group: layerGroups.streetlights, key: 'streetlights' },
      { id: 'layerHazards', group: layerGroups.hazards, key: 'hazards' },
      { id: 'layerReports', group: layerGroups.reports, key: 'reports' },
      { id: 'layerInfrastructure', group: layerGroups.infrastructure, key: 'infrastructure' }
    ];

    toggles.forEach(({ id, group, key }) => {
      const checkbox = document.getElementById(id);
      if (!checkbox) return;

      checkbox.addEventListener('change', () => {
        const parentPill = checkbox.closest('.toggle-pill');
        if (checkbox.checked) {
          map.addLayer(group);
          state.layers[key] = true;
          parentPill.classList.add('active');
        } else {
          map.removeLayer(group);
          state.layers[key] = false;
          parentPill.classList.remove('active');
        }
      });
    });

    const btnResetLayers = document.getElementById('btnToggleAllLayers');
    if (btnResetLayers) {
      btnResetLayers.addEventListener('click', () => {
        toggles.forEach(({ id, group, key }) => {
          const checkbox = document.getElementById(id);
          checkbox.checked = true;
          const parentPill = checkbox.closest('.toggle-pill');
          parentPill.classList.add('active');
          if (!map.hasLayer(group)) {
            map.addLayer(group);
          }
          state.layers[key] = true;
        });
        showToast('All safety overlays enabled.', 'success');
      });
    }
  }

  /**
   * UI Setup & Event Listeners
   */
  function setupEventListeners() {
    // Mode Buttons
    elements.modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        elements.modeBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        state.travelMode = btn.dataset.mode;
        showToast(`Travel mode changed to ${btn.dataset.mode}.`, 'info');

        // If routes are already displayed, recalculate with the new travel mode
        if (state.startCoords && state.destCoords) {
          calculateRoutes();
        }
      });
    });

    // Current location button
    elements.btnCurrentLocation.addEventListener('click', requestCurrentLocation);

    // Swap inputs
    elements.btnSwapLocations.addEventListener('click', () => {
      const tempVal = elements.startInput.value;
      elements.startInput.value = elements.destInput.value;
      elements.destInput.value = tempVal;

      const tempCoords = state.startCoords;
      state.startCoords = state.destCoords;
      state.destCoords = tempCoords;

      renderRouteEndpoints();

      if (state.startCoords && state.destCoords) {
        calculateRoutes();
      }
    });

    // Clear destination
    elements.btnClearDest.addEventListener('click', () => {
      elements.destInput.value = '';
      state.destCoords = null;
      renderRouteEndpoints();
      layerGroups.routes.clearLayers();
      elements.routeResultsSection.classList.add('hidden');
    });

    // Mobile drawer toggle
    elements.mobileToggleBtn.addEventListener('click', () => {
      elements.sidebarPanel.classList.toggle('expanded');
    });

    // Map Controls
    elements.btnMapRecenter.addEventListener('click', () => {
      if (state.currentCoords) {
        map.flyTo([state.currentCoords.lat, state.currentCoords.lng], 15);
      } else if (state.startCoords) {
        map.flyTo([state.startCoords.lat, state.startCoords.lng], 14);
      } else {
        map.flyTo([51.5074, -0.1278], 13);
      }
    });

    elements.btnMapZoomIn.addEventListener('click', () => map.zoomIn());
    elements.btnMapZoomOut.addEventListener('click', () => map.zoomOut());

    // Toggle legend accordion
    elements.btnToggleLegend.addEventListener('click', () => {
      elements.legendContent.classList.toggle('hidden');
    });

    // Pick location for report
    elements.btnPickReportLocation.addEventListener('click', () => {
      hideModal(elements.modalReport);
      state.pickingLocationForReport = true;
      showToast('Click anywhere on the map to place hazard marker.', 'warning');
    });

    // Modal Triggers
    elements.btnOpenReportModal.addEventListener('click', () => showModal(elements.modalReport));
    elements.btnAuthToggle.addEventListener('click', () => showModal(elements.modalAuth));
    elements.btnInfoModal.addEventListener('click', () => showModal(elements.modalInfo));

    // Close buttons on all modals
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        const modal = document.getElementById(modalId);
        if (modal) hideModal(modal);
      });
    });

    // Close modal on click outside
    document.querySelectorAll('.modal-overlay').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal(modal);
      });
    });

    // Auth tabs
    elements.tabSignIn.addEventListener('click', () => {
      elements.tabSignIn.classList.add('active');
      elements.tabRegister.classList.remove('active');
      elements.signInForm.classList.remove('hidden');
      elements.registerForm.classList.add('hidden');
    });

    elements.tabRegister.addEventListener('click', () => {
      elements.tabRegister.classList.add('active');
      elements.tabSignIn.classList.remove('active');
      elements.registerForm.classList.remove('hidden');
      elements.signInForm.classList.add('hidden');
    });

    // Route calculation trigger
    elements.btnCalculateRoute.addEventListener('click', (e) => {
      e.preventDefault();
      calculateRoutes();
    });

    // Window resize handler for Leaflet
    window.addEventListener('resize', () => {
      if (map) {
        map.invalidateSize();
      }
    });
  }

  /**
   * Helper: Show Toast Notification
   */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00F5A0" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>';
    } else {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 3800);
  }

  function showModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('hidden');
  }

  function hideModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('hidden');
  }

  function updateStatus(text) {
    if (elements.systemStatusText) {
      elements.systemStatusText.textContent = text;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose global controller
  window.RouteShield = {
    state,
    map,
    layerGroups,
    showToast,
    updateStatus,
    createCustomIcon,
    calculateRoutes,
    selectRoute
  };

  // Initialization when DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupAutocomplete();
    setupLayerToggles();
    setupEventListeners();
  });
})();
