import { validateUrl, isPrivateOrLoopbackHost, validatePackageName, suggestPackageName } from './validation.ts';

function runTests() {
  console.log('--- Running Validation Unit Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      console.log(`✓ PASS: ${testName}`);
    } else {
      failed++;
      console.error(`✗ FAIL: ${testName}`);
    }
  }

  // 1. SSRF Protection Tests
  assert(isPrivateOrLoopbackHost('localhost'), 'SSRF: blocks localhost');
  assert(isPrivateOrLoopbackHost('127.0.0.1'), 'SSRF: blocks 127.0.0.1');
  assert(isPrivateOrLoopbackHost('10.0.0.1'), 'SSRF: blocks 10.x.x.x');
  assert(isPrivateOrLoopbackHost('172.20.0.5'), 'SSRF: blocks 172.16-31');
  assert(isPrivateOrLoopbackHost('192.168.1.1'), 'SSRF: blocks 192.168.x.x');
  assert(isPrivateOrLoopbackHost('169.254.169.254'), 'SSRF: blocks AWS metadata IP');
  assert(!isPrivateOrLoopbackHost('example.com'), 'SSRF: allows public domain example.com');
  assert(!isPrivateOrLoopbackHost('8.8.8.8'), 'SSRF: allows public IP 8.8.8.8');

  // 2. URL Protocol & Scheme Tests
  assert(!validateUrl('javascript:alert(1)').valid, 'URL: blocks javascript: scheme');
  assert(!validateUrl('data:text/html,test').valid, 'URL: blocks data: scheme');
  assert(!validateUrl('file:///etc/passwd').valid, 'URL: blocks file: scheme');
  assert(!validateUrl('http://127.0.0.1/').valid, 'URL: blocks local loopback');
  assert(validateUrl('https://mywebsite.com').valid, 'URL: accepts clean https URL');
  assert(validateUrl('mywebsite.com').valid, 'URL: auto-prepends https');
  assert(validateUrl('http://mywebsite.com').valid, 'URL: accepts http with isHttp flag');

  // 3. Android Package Name Validation Tests
  assert(validatePackageName('com.example.app').valid, 'Pkg: accepts valid 3-part package');
  assert(validatePackageName('io.github.project').valid, 'Pkg: accepts io.github.project');
  assert(!validatePackageName('com.example-app.demo').valid, 'Pkg: rejects hyphens in segment');
  assert(!validatePackageName('com.class.app').valid, 'Pkg: rejects Java keyword "class"');
  assert(!validatePackageName('com.default.android').valid, 'Pkg: rejects Java keyword "default"');
  assert(!validatePackageName('com.123app.test').valid, 'Pkg: rejects number starting segment');
  assert(!validatePackageName('single').valid, 'Pkg: rejects single segment');
  assert(!validatePackageName('com..app').valid, 'Pkg: rejects empty segment');

  // 4. Package Name Auto-suggest Tests
  const suggested1 = suggestPackageName('https://my-store.example.com');
  assert(suggested1.startsWith('com.example.'), `Pkg Suggest: correctly suggests reversed package (${suggested1})`);
  assert(validatePackageName(suggested1).valid, `Pkg Suggest: suggested package is valid Java identifier`);

  const suggested2 = suggestPackageName('brand-new.org');
  assert(validatePackageName(suggested2).valid, `Pkg Suggest: handles hyphens safely (${suggested2})`);

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

// Execute if run directly via tsx
runTests();
