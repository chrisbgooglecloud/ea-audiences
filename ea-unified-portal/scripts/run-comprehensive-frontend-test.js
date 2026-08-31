const http = require('http');

const BASE_URL = 'http://localhost:3000';

const UI_ROUTES = [
  { path: '/', name: 'Portal Gateway (Home)' },
  { path: '/audiences', name: 'Act 1: Audiences & Briefs' },
  { path: '/creative', name: 'Act 2: Creative Intelligence Studio' },
  { path: '/measurement', name: 'Act 3: Measurement Hub' },
  { path: '/measurement/scenario', name: 'Act 3: Scenario Simulator' },
  { path: '/measurement/attribution', name: 'Act 3: Tactical Attribution' },
  { path: '/measurement/geospine', name: 'Act 3: GeoSpine Nielsen DMAs' },
  { path: '/measurement/multimodal', name: 'Act 3: Multimodal Ad Analyzer' },
  { path: '/measurement/intake', name: 'Act 3: Campaign Intake' },
  { path: '/measurement/shapley', name: 'Act 3: Shapley Decomposition' },
  { path: '/commerce', name: 'Act 4: The City & Arena Commerce' },
];

const API_ROUTES = [
  { path: '/api/admin/config', method: 'GET', name: 'Admin Config API', validate: (d) => d.branding && d.navigation },
  {
    path: '/api/audiences/nl-query',
    method: 'POST',
    body: JSON.stringify({ query: 'Show The City MyCAREER players with high tilt and high VC spend', franchise: 'NBA 2K26' }),
    name: 'Audience NL Query API',
    validate: (d) => d && (d.nodes || d.insights || d.explanation || d.answer || Array.isArray(d))
  },
  {
    path: '/api/synthetic/deepsona/debate',
    method: 'POST',
    body: JSON.stringify({ prompt: 'Should we offer a $4.99 The City Streak-Shield pack with 5,000 VC?', franchise: 'NBA 2K26', price: 4.99 }),
    name: 'DeepSona Synthetic Debate API',
    validate: (d) => d && (d.debate_turns || d.synthesis)
  }
];

const ASSET_ROUTES = [
  { path: '/videos/short_video_similar_to_a_mobil.mp4', name: 'Video: Short Video Asset' },
  { path: '/videos/the_sims_4_free_base_game_launch_trailer__dynv44qr14g_.mp4', name: 'Video: Sims 4 Launch Trailer' }
];

function fetchRoute(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'User-Agent': 'ComprehensiveFrontendTester/1.0',
        ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {})
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message,
        body: ''
      });
    });

    if (body) req.write(body);
    req.end();
  });
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING 2K EXECUTIVE BRIEFING CENTER TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Test All UI Routes
  console.log('📋 SECTION 1: USER INTERFACE ROUTES (SSR & HTTP INTEGRITY)');
  console.log('------------------------------------------------------');
  for (const route of UI_ROUTES) {
    const res = await fetchRoute(route.path);
    const hasActual404 = res.body.includes('<h1 class="next-error-h1">404</h1>');
    const isOk = res.statusCode === 200 && !hasActual404;

    if (isOk) {
      console.log(`  ✅ [PASS] ${route.name.padEnd(42)} HTTP 200 OK (${(res.body.length / 1024).toFixed(1)} KB)`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${route.name.padEnd(42)} HTTP ${res.statusCode}`);
      failed++;
    }
  }

  // 2. Test Key API Routes
  console.log('\n📋 SECTION 2: BACKEND & AI INTEGRATION API ENDPOINTS');
  console.log('------------------------------------------------------');
  for (const api of API_ROUTES) {
    const res = await fetchRoute(api.path, api.method, api.body);
    let isOk = res.statusCode >= 200 && res.statusCode < 300;
    let validPayload = false;

    if (isOk) {
      try {
        const json = JSON.parse(res.body);
        validPayload = api.validate ? !!api.validate(json) : true;
      } catch (e) {
        validPayload = false;
      }
    }

    if (isOk && validPayload) {
      console.log(`  ✅ [PASS] ${api.name.padEnd(42)} HTTP ${res.statusCode} (Valid JSON Payload)`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${api.name.padEnd(42)} HTTP ${res.statusCode}`);
      failed++;
    }
  }

  // 3. Test Static Assets
  console.log('\n📋 SECTION 3: MEDIA & VIDEO ASSET ENDPOINTS');
  console.log('------------------------------------------------------');
  for (const asset of ASSET_ROUTES) {
    const res = await fetchRoute(asset.path);
    if (res.statusCode === 200) {
      console.log(`  ✅ [PASS] ${asset.name.padEnd(42)} HTTP 200 OK (${(res.body.length / 1024).toFixed(1)} KB)`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${asset.name.padEnd(42)} HTTP ${res.statusCode}`);
      failed++;
    }
  }

  console.log('\n======================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
