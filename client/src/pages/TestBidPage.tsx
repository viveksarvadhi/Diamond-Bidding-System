import { useState, useEffect } from 'react';

const TestBidPage = () => {
  const [activeBids, setActiveBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActiveBids();
  }, []);

  const fetchActiveBids = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Test - Token:', token ? 'Present' : 'Missing');
      console.log('🔍 Test - Token length:', token?.length || 0);
      
      if (!token) {
        console.error('❌ No token found');
        setError('No token found');
        setLoading(false);
        return;
      }

      console.log('🔍 Test - Fetching active bids...');
      const response = await fetch('http://localhost:5000/api/bids/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 Test - Response status:', response.status);
      console.log('🔍 Test - Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Test - Response data:', data);
        console.log('🔍 Test - Active bids count:', data.data?.bids?.length || 0);
        setActiveBids(data.data?.bids || []);
        setError('');
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        setError(`Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error fetching active bids:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Bid Debug Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔍 Debug Information</h2>
          <div className="space-y-2">
            <p><strong>Token Status:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            <p><strong>Active Bids Count:</strong> {activeBids.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Active Bids Data</h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : activeBids.length === 0 ? (
            <p>No active bids found</p>
          ) : (
            <div className="space-y-4">
              {activeBids.map((bid) => (
                <div key={bid.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{bid.diamond?.name}</h3>
                  <p>Base Price: ${bid.baseBidPrice}</p>
                  <p>Status: {bid.status}</p>
                  <p>User Bids: {bid.userBids?.length || 0}</p>
                  
                  {bid.userBids && bid.userBids.length > 0 && (
                    <div className="mt-2">
                      <h4 className="font-medium">Bidders:</h4>
                      <ul className="list-disc list-inside">
                        {bid.userBids.map((userBid: any) => (
                          <li key={userBid.id}>
                            {userBid.user?.name}: ${userBid.amount}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <button 
            onClick={fetchActiveBids}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestBidPage;
