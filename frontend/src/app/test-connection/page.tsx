'use client';

import { useState } from 'react';

export default function TestConnectionPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const runTests = async () => {
    setLoading(true);
    const testResults: any = {};

    // Test 1: Check environment variable
    testResults.envVar = API_URL;

    // Test 2: Check root endpoint
    try {
      const rootUrl = API_URL.replace('/api', '');
      const rootRes = await fetch(rootUrl);
      const rootData = await rootRes.json();
      testResults.rootEndpoint = {
        status: rootRes.status,
        data: rootData,
      };
    } catch (err: any) {
      testResults.rootEndpoint = { error: err.message };
    }

    // Test 3: Check health endpoint
    try {
      const healthRes = await fetch(`${API_URL}/health`);
      const healthData = await healthRes.json();
      testResults.healthEndpoint = {
        status: healthRes.status,
        data: healthData,
      };
    } catch (err: any) {
      testResults.healthEndpoint = { error: err.message };
    }

    // Test 4: Test login endpoint with test credentials
    try {
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'superadmin@nolimits.com',
          password: 'password123',
        }),
      });
      const loginData = await loginRes.json();
      testResults.loginEndpoint = {
        status: loginRes.status,
        data: loginData,
      };
    } catch (err: any) {
      testResults.loginEndpoint = { error: err.message };
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Connection Test</h1>
        
        <button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 mb-8"
        >
          {loading ? 'Testing...' : 'Run Connection Tests'}
        </button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Diagnostics</h2>
              <ul className="space-y-2">
                <li className={results.envVar ? 'text-green-600' : 'text-red-600'}>
                  ✓ Environment Variable: {results.envVar || 'NOT SET'}
                </li>
                <li className={results.rootEndpoint?.status === 200 ? 'text-green-600' : 'text-red-600'}>
                  {results.rootEndpoint?.status === 200 ? '✓' : '✗'} Root Endpoint: 
                  {results.rootEndpoint?.error || ` Status ${results.rootEndpoint?.status}`}
                </li>
                <li className={results.healthEndpoint?.status === 200 ? 'text-green-600' : 'text-red-600'}>
                  {results.healthEndpoint?.status === 200 ? '✓' : '✗'} Health Endpoint: 
                  {results.healthEndpoint?.error || ` Status ${results.healthEndpoint?.status}`}
                </li>
                <li className={results.loginEndpoint?.status === 200 ? 'text-green-600' : 'text-red-600'}>
                  {results.loginEndpoint?.status === 200 ? '✓' : '✗'} Login Endpoint: 
                  {results.loginEndpoint?.error || ` Status ${results.loginEndpoint?.status}`}
                </li>
              </ul>
            </div>

            {results.loginEndpoint?.status !== 200 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Troubleshooting Tips</h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>Check if backend is deployed and running on Render</li>
                  <li>Verify CORS settings: FRONTEND_URL in Render should be https://no-limits-seven.vercel.app</li>
                  <li>Ensure DATABASE_URL is correctly set in Render</li>
                  <li>Check Render logs for errors</li>
                  <li>Verify JWT secrets are set in Render environment variables</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
