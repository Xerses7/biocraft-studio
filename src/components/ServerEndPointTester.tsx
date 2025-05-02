'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

// You can place this component in a development-only route like /dev/test-endpoints
export default function ServerEndpointTester() {
  const [backendUrl, setBackendUrl] = useState(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
  const [token, setToken] = useState('');
  const [endpoint, setEndpoint] = useState('/signout');
  const [method, setMethod] = useState('POST');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  // Load token from localStorage if available
  React.useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('biocraft_auth');
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        if (parsedAuth.token) {
          setToken(parsedAuth.token);
        }
      }
    } catch (e) {
      console.error('Error loading token from localStorage:', e);
    }
  }, []);

  const testEndpoint = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    setStatus(null);

    const url = `${backendUrl}${endpoint}`;
    console.log(`Testing endpoint: ${method} ${url}`);
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const options: RequestInit = {
        method,
        headers,
        credentials: 'include',
      };
      
      const response = await fetch(url, options);
      setStatus(response.status);
      
      try {
        const data = await response.json();
        setResult(data);
      } catch (e) {
        // If the response is not JSON
        const text = await response.text();
        setResult({ text });
      }
      
      if (!response.ok) {
        setError(`Request failed with status: ${response.status}`);
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error occurred');
      console.error('Error testing endpoint:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const testServerConnection = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    setStatus(null);
    
    try {
      // Test basic connectivity to the server root endpoint
      const response = await fetch(backendUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      setStatus(response.status);
      
      try {
        const data = await response.json();
        setResult(data);
      } catch (e) {
        const text = await response.text();
        setResult({ text });
      }
      
      if (response.ok) {
        console.log('Server connection successful');
      } else {
        setError(`Server connection test failed with status: ${response.status}`);
      }
    } catch (e: any) {
      setError(e.message || 'Server connection test failed');
      console.error('Server connection error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Backend API Endpoint Tester</CardTitle>
          <CardDescription>
            Test API endpoints to diagnose connection issues
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="endpoint">
            <TabsList className="mb-4">
              <TabsTrigger value="endpoint">Test Endpoint</TabsTrigger>
              <TabsTrigger value="connection">Server Connection</TabsTrigger>
            </TabsList>
            
            <TabsContent value="endpoint" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="backendUrl" className="text-sm font-medium">
                    Backend URL
                  </label>
                  <Input
                    id="backendUrl"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="http://localhost:3001"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="endpoint" className="text-sm font-medium">
                    Endpoint
                  </label>
                  <Input
                    id="endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/signout"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="method" className="text-sm font-medium">
                    HTTP Method
                  </label>
                  <select
                    id="method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="token" className="text-sm font-medium">
                    Auth Token
                  </label>
                  <Input
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="JWT token"
                  />
                </div>
              </div>
              
              <Button onClick={testEndpoint} disabled={isLoading} className="w-full mt-4">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Endpoint'
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="connection" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="serverUrl" className="text-sm font-medium">
                  Server Base URL
                </label>
                <Input
                  id="serverUrl"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="http://localhost:3001"
                />
              </div>
              
              <Button onClick={testServerConnection} disabled={isLoading} className="w-full mt-4">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Server Connection'
                )}
              </Button>
            </TabsContent>
          </Tabs>
          
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-destructive font-medium">Error:</p>
              <p className="font-mono text-sm">{error}</p>
            </div>
          )}
          
          {status !== null && (
            <div className={`mt-4 p-4 ${status >= 200 && status < 300 ? 'bg-green-100' : 'bg-amber-100'} rounded-md`}>
              <p className="font-medium">Status: {status}</p>
            </div>
          )}
          
          {result && (
            <div className="mt-4 p-4 bg-secondary rounded-md">
              <p className="font-medium mb-2">Response:</p>
              <pre className="whitespace-pre-wrap overflow-auto max-h-80 font-mono text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}