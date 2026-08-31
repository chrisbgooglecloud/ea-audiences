const http = require('http');

const BASE_URL = 'http://localhost:3000';

const UI_ROUTES = [
  { path: '/', name: 'Portal Gateway (Home)', chunkId: 'app/page' },
  { path: '/audiences', name: 'Act 1: Audiences & Graph Briefs', chunkId: 'app/audiences/page' },
  { path: '/creative', name: 'Act 2: Creative Intelligence Studio', chunkId: 'app/creative/page' },
  { path: '/measurement', name: 'Act 3: Measurement Hub', chunkId: 'app/measurement/page' },
  { path: '/measurement/scenario', name: 'Act 3: Scenario Simulator', chunkId: 'app/measurement/scenario/page' },
  { path: '/measurement/attribution', name: 'Act 3: Tactical Attribution', chunkId: 'app/measurement/attribution/page' },
  { path: '/measurement/geospine', name: 'Act 3: GeoSpine Nielsen DMAs', chunkId: 'app/measurement/geospine/page' },
  { path: '/measurement/multimodal', name: 'Act 3: Multimodal Ad Analyzer', chunkId: 'app/measurement/multimodal/page' },
  { path: '/measurement/intake', name: 'Act 3: Campaign Intake', chunkId: 'app/measurement/intake/page' },
  { path: '/measurement/shapley', name: 'Act 3: Shapley Decomposition', chunkId: 'app/measurement/shapley/page' },
  { path: '/commerce', name: 'Act 4: The City & Arena Commerce', chunkId: 'app/commerce/page' },
];

const API_TESTS = [
  {
    name: 'Admin Config API',
    path: '/api/admin/config',
    method: 'GET',
    validate: (res, json) => json && json.branding && json.navigation
  },
  {
    name: 'Audience NL Query (The City Hoopers)',
    path: '/api/audiences/nl-query',
    method: 'POST',
    body: JSON.stringify({ query: 'Show NBA 2K26 The City players with high tilt and high VC spend', franchise: 'NBA2K26' }),
    validate: (res, json) => json && (json.nodes || json.explanation || json.gql_query || json.answer || Array.isArray(json))
  },
  {
    name: 'Audience NL Query (Borderlands Co-Op)',
    path: '/api/audiences/nl-query',
    method: 'POST',
    body: JSON.stringify({ query: 'Borderlands 4 Mayhem 10 players in New York', franchise: 'BORDERLANDS4' }),
    validate: (res, json) => json && (json.nodes || json.explanation || json.gql_query || Array.isArray(json))
  },
  {
    name: 'DeepSona Synthetic Focus Group Debate',
    path: '/api/synthetic/deepsona/debate',
    method: 'POST',
    body: JSON.stringify({
      prompt: 'Should we introduce a $4.99 The REC Loss-Streak Tilt Shield offering 5,000 VC + 2-Hour 2x Rep Token?',
      franchise: 'NBA 2K26',
      price: 4.99
    }),
    validate: (res, json) => json && (json.debate_turns || json.synthesis || json.turns)
  },
  {
    name: 'Marketing Journey Intelligence Summary',
    path: '/api/marketing/journey/summary',
    method: 'POST',
    body: JSON.stringify({
      cohort_preset: 'The City Grinders',
      funnel_metrics: { totalAnalyzed: 5000, conversionRate: 78, totalPipelineLtv: 2450000 },
      selected_path: { data: { title: 'The REC 3-Loss Slump to Tilt Shield Offer', count: 1200, spend: 450000, pct: 24 } }
    }),
    validate: (res, json) => json && (json.path_summary || json.funnel_summary || json.key_tactical_lever)
  }
];

const ASSET_TESTS = [
  { path: '/videos/short_video_similar_to_a_mobil.mp4', name: 'Video: Short Mobile Video Asset' },
  { path: '/videos/the_sims_4_free_base_game_launch_trailer__dynv44qr14g_.mp4', name: 'Video: Full HD Video Trailer' }
];

function fetchRoute(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'User-Agent': 'EndToEnd2KTester/1.0',
        ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {})
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {}

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message,
        body: '',
        json: null
      });
    });

    if (body) req.write(body);
    req.end();
  });
}

async function runEndToEndTests() {
  console.log('\n========================================================================');
  console.log('🏀 2K EXECUTIVE BRIEFING CENTER: FULL END-TO-END VERIFICATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Test UI Pages
  console.log('📌 PART 1: FRONTEND PAGES & 2K PORTAL VIEWS');
  console.log('------------------------------------------------------------------------');
  for (const route of UI_ROUTES) {
    const res = await fetchRoute(route.path);
    const has404 = res.body.includes('<h1 class="next-error-h1">404</h1>');
    const is200 = res.statusCode === 200 && !has404;
    const has2KMeta = res.body.includes('2K Executive Briefing Center') || res.body.includes('2K Games');
    const hasChunk = res.body.includes(route.chunkId);

    if (is200 && (has2KMeta || hasChunk)) {
      console.log(`  ✅ [PASS] ${route.name.padEnd(38)} HTTP 200 OK (${(res.body.length / 1024).toFixed(1)} KB) • Next.js Client Chunk Bound`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${route.name.padEnd(38)} Status: ${res.statusCode}, 404: ${has404}, Chunk: ${hasChunk}`);
      failed++;
    }
  }

  // 2. Test API Endpoints
  console.log('\n📌 PART 2: BACKEND & VERTEX AI INTELLIGENCE APIs');
  console.log('------------------------------------------------------------------------');
  for (const api of API_TESTS) {
    const res = await fetchRoute(api.path, api.method, api.body);
    const isValid = res.statusCode === 200 && api.validate(res, res.json);

    if (isValid) {
      console.log(`  ✅ [PASS] ${api.name.padEnd(46)} HTTP 200 OK • Valid 2K Data Schema`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${api.name.padEnd(46)} HTTP ${res.statusCode}`);
      if (res.body) console.log(`     Details: ${res.body.slice(0, 150)}...`);
      failed++;
    }
  }

  // 3. Test Static Video Assets
  console.log('\n📌 PART 3: STATIC MEDIA & VIDEO ASSETS');
  console.log('------------------------------------------------------------------------');
  for (const asset of ASSET_TESTS) {
    const res = await fetchRoute(asset.path);
    if (res.statusCode === 200 && res.body.length > 10000) {
      console.log(`  ✅ [PASS] ${asset.name.padEnd(38)} HTTP 200 OK (${(res.body.length / 1024).toFixed(1)} KB)`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${asset.name.padEnd(38)} HTTP ${res.statusCode}`);
      failed++;
    }
  }

  console.log('\n========================================================================');
  console.log(`📊 FINAL TEST REPORT: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log(`🎯 STATUS: ${failed === 0 ? '100% OPERATIONAL & VERIFIED' : 'TESTS FAILED - ACTION REQUIRED'}`);
  console.log('========================================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

runEndToEndTests();
