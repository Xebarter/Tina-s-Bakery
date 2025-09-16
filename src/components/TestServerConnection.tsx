import React, { useState, useEffect } from 'react';

export function TestServerConnection() {
  const [serverStatus, setServerStatus] = useState<string>('Checking...');
  const [serverData, setServerData] = useState<any>(null);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/health');
        const data = await response.json();
        setServerStatus('Connected');
        setServerData(data);
      } catch (error) {
        console.error('Server connection error:', error);
        setServerStatus('Connection Failed');
        setServerData(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    checkServer();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Server Connection Test</h2>
      <div className="mb-2">
        <span className="font-semibold">Status:</span> {serverStatus}
      </div>
      {serverData && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(serverData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}