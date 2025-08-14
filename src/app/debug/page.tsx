'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const { data: session, status, update } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  const [cookies, setCookies] = useState('');

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);

    // Get cookies
    setCookies(document.cookie);

    return () => clearInterval(timer);
  }, []);

  const handleRefreshSession = async () => {
    console.log('Refreshing session...');
    const updatedSession = await update();
    console.log('Updated session:', updatedSession);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Session State</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Current Time:</strong> {currentTime}</p>
            <button 
              onClick={handleRefreshSession}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Session
            </button>
          </div>
          <div>
            <h3 className="font-semibold">Session Data:</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(session, null, 2) || 'No session data'}
            </pre>
          </div>
        </div>
      </div>

      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Cookies</h2>
        <div className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
          {cookies || 'No cookies found'}
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Local Storage</h2>
        <div className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
          {typeof window !== 'undefined' 
            ? JSON.stringify(Object.entries(localStorage), null, 2)
            : 'Local storage not available'}
        </div>
      </div>
    </div>
  );
}
