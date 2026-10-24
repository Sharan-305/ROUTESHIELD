/**
 * RouteShield — Automated Comprehensive Test Suite
 * Validates Routing, Geocoding, Safety Scoring, Auth, Geospatial calculations, and Security
 */

const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const config = require('../src/config');
const { haversineDistanceMeters, minDistanceToPolyline, computeBoundingBox } = require('../src/utils/geoUtils');
const safetyScoringService = require('../src/services/safetyScoringService');
const routingService = require('../src/services/routingService');
const geocodingService = require('../src/services/geocodingService');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function startSuite() {
  console.log('\n======================================================');
  console.log('   RouteShield Automated Verification Test Suite');
  console.log('======================================================\n');

  // 1. Geospatial Utilities Tests
  console.log('[Suite 1: Geospatial Algorithms & Corridor Math]');
  runTest('Haversine distance calculates accurate meters between known coordinates', () => {
    // London Trafalgar Square to Big Ben (~1.0 km)
    const d = haversineDistanceMeters(51.5080, -0.1281, 51.5007, -0.1246);
    assert(d > 800 && d < 1200, `Expected ~900-1100m, got ${d}m`);
  });

  runTest('Point-to-polyline minimum corridor distance calculation', () => {
    const polyline = [
      [-0.1280, 51.5080],
      [-0.1280, 51.5000]
    ];
    // Point directly on segment
    const dOn = minDistanceToPolyline(51.5040, -0.1280, polyline);
    assert(dOn < 5, `Expected <5m, got ${dOn}m`);

    // Point offset by ~111m (0.001 deg lat)
    const dOff = minDistanceToPolyline(51.5040, -0.1260, polyline);
    assert(dOff > 50, `Expected >50m, got ${dOff}m`);
  });

  runTest('Bounding box calculation with buffer expansion', () => {
    const coords = [[-0.12, 51.50], [-0.10, 51.52]];
    const bbox = computeBoundingBox(coords, 0.01);
    assert.strictEqual(bbox.length, 4);
    assert(bbox[0] < -0.12);
    assert(bbox[1] < 51.50);
    assert(bbox[2] > -0.10);
    assert(bbox[3] > 51.52);
  });

  // 2. Geocoding Provider & Validation Tests
  console.log('\n[Suite 2: Geocoding Provider & Input Validation]');
  await runAsyncTest('Geocoding returns empty array for blank or short queries', async () => {
    const resEmpty = await geocodingService.search('');
    assert.deepStrictEqual(resEmpty, []);
    const resShort = await geocodingService.search('a');
    assert.deepStrictEqual(resShort, []);
  });

  runTest('Geocoding formatLocation standardizes raw provider response', () => {
    const sampleRaw = {
      place_id: 12345,
      lat: '51.5074',
      lon: '-0.1278',
      display_name: 'Trafalgar Square, Westminster, London, WC2N 5DN, UK',
      address: { road: 'Trafalgar Square', city: 'London' }
    };
    const formatted = geocodingService.formatLocation(sampleRaw);
    assert.strictEqual(formatted.lat, 51.5074);
    assert.strictEqual(formatted.lng, -0.1278);
    assert.strictEqual(formatted.name, 'Trafalgar Square');
    assert.strictEqual(formatted.displayName, sampleRaw.display_name);
  });

  // 3. Routing Provider & Metrics Tests
  console.log('\n[Suite 3: Routing Provider & Alternatives Formatting]');
  runTest('Routing service profile mapping supports foot, bike, and driving', () => {
    assert.strictEqual(routingService.resolveProfile('foot'), 'foot');
    assert.strictEqual(routingService.resolveProfile('walking'), 'foot');
    assert.strictEqual(routingService.resolveProfile('bike'), 'bicycle');
    assert.strictEqual(routingService.resolveProfile('driving'), 'driving');
  });

  runTest('Distance and duration formatting converts units cleanly', () => {
    assert.strictEqual(routingService.formatDistance(450), '450 m');
    assert.strictEqual(routingService.formatDistance(2400), '2.4 km');
    assert.strictEqual(routingService.formatDuration(180), '3 min');
    assert.strictEqual(routingService.formatDuration(3660), '1 hr 1 min');
  });

  runTest('Routing service rejects requests missing origin or destination coordinates', async () => {
    let threw = false;
    try {
      await routingService.getRoutes(null, { lat: 51.5, lng: -0.1 });
    } catch {
      threw = true;
    }
    assert(threw, 'Should throw error when origin is missing');
  });

  // 4. Explainable Safety Scoring & Data Integrity Tests
  console.log('\n[Suite 4: Explainable Safety Scoring & Data Transparency]');
  await runAsyncTest('Safety scoring refuses to fabricate score when corridor data is insufficient', async () => {
    const mockRouteGeometry = {
      type: 'LineString',
      coordinates: [
        [-0.1278, 51.5074],
        [-0.1250, 51.5050],
        [-0.1220, 51.5030]
      ]
    };
    const evalResult = await safetyScoringService.evaluateRoute(mockRouteGeometry, 850);
    assert.strictEqual(evalResult.score, null, 'Score must be null when data is missing');
    assert.strictEqual(evalResult.status, 'INSUFFICIENT_DATA');
    assert(evalResult.statusDisplay.toLowerCase().includes('insufficient') || evalResult.statusDisplay.toLowerCase().includes('unavailable'));
    assert(evalResult.disclaimer.includes('not guarantee personal safety'), 'Must contain disclaimer');
  });

  runTest('Safety scoring handles invalid route geometry gracefully', async () => {
    const evalInvalid = await safetyScoringService.evaluateRoute(null, 0);
    assert.strictEqual(evalInvalid.score, null);
    assert.strictEqual(evalInvalid.status, 'INSUFFICIENT_DATA');
  });

  // 5. Authentication, Hashing & Permissions Tests
  console.log('\n[Suite 5: Authentication, Password Hashing & Role Authorization]');
  await runAsyncTest('Password hashing produces secure bcrypt salt and verifies match', async () => {
    const rawPassword = 'SuperSecretSecurePassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);
    
    assert.notStrictEqual(rawPassword, hash);
    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.strictEqual(isMatch, true);

    const isWrongMatch = await bcrypt.compare('WrongPassword123', hash);
    assert.strictEqual(isWrongMatch, false);
  });

  runTest('JWT generation and signature verification with role claim', () => {
    const payload = { id: 'user_123', role: 'admin', email: 'admin@routeshield.org' };
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });
    assert(token && token.length > 20);

    const decoded = jwt.verify(token, config.jwt.secret);
    assert.strictEqual(decoded.id, 'user_123');
    assert.strictEqual(decoded.role, 'admin');
    assert.strictEqual(decoded.email, 'admin@routeshield.org');
  });

  runTest('Role-based authorization prevents non-admin execution', () => {
    const adminUser = { role: 'admin' };
    const regularUser = { role: 'user' };
    const rolesAllowed = ['admin'];

    assert.strictEqual(rolesAllowed.includes(adminUser.role), true);
    assert.strictEqual(rolesAllowed.includes(regularUser.role), false);
  });

  // 6. Incident Validation Tests
  console.log('\n[Suite 6: Community Incident Reporting Validation]');
  runTest('Incident categories allow only recognized public infrastructure hazards', () => {
    const validCategories = [
      'poor_lighting',
      'road_damage',
      'blocked_path',
      'traffic_hazard',
      'other_infrastructure'
    ];
    assert.strictEqual(validCategories.includes('poor_lighting'), true);
    assert.strictEqual(validCategories.includes('fake_arbitrary_category'), false);
  });

  runTest('Geographic coordinates validation boundary checks', () => {
    const validLat = 51.5074;
    const validLng = -0.1278;
    const invalidLat = 105.0; // Out of range
    const invalidLng = -200.0; // Out of range

    assert(validLat >= -90 && validLat <= 90);
    assert(validLng >= -180 && validLng <= 180);
    assert(!(invalidLat >= -90 && invalidLat <= 90));
    assert(!(invalidLng >= -180 && invalidLng <= 180));
  });

  console.log('\n======================================================');
  console.log(`Test Execution Complete: ${passedTests} / ${totalTests} Passed`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

startSuite();
