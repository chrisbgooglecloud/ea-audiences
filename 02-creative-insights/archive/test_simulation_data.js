import { SIMULATION_PRODUCTS } from './data/simulationData.js';
import fs from 'fs';
import path from 'path';

const STANDARD_AUDIENCES = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'configuration', 'standard_audiences.json'), 'utf-8')
);

function runTests() {
  console.log('--- simulationData.ts Unit Test ---');
  let passCount = 0;
  let failCount = 0;

  try {
    // Test 1: SIMULATION_PRODUCTS is an array of strings
    if (Array.isArray(SIMULATION_PRODUCTS) && SIMULATION_PRODUCTS.length > 0 && typeof SIMULATION_PRODUCTS[0] === 'string') {
      console.log('PASS: SIMULATION_PRODUCTS is a non-empty array of strings.');
      passCount++;
    } else {
      throw new Error('SIMULATION_PRODUCTS should be a non-empty array of strings.');
    }

    // Test 2: STANDARD_AUDIENCES is an array of objects
    if (Array.isArray(STANDARD_AUDIENCES) && STANDARD_AUDIENCES.length > 0 && typeof STANDARD_AUDIENCES[0] === 'object') {
      console.log('PASS: STANDARD_AUDIENCES is a non-empty array of objects.');
      passCount++;
    } else {
      throw new Error('STANDARD_AUDIENCES should be a non-empty array of objects.');
    }

    console.log(`\nTests finished: ${passCount} PASS, ${failCount} FAIL`);
    process.exit(failCount > 0 ? 1 : 0);
  } catch (err) {
    console.error('FAIL: Test failed with error:', err.message);
    process.exit(1);
  }
}

runTests();
