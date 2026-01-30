import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuctionResult {
  id: number;
  diamondId: number;
  diamond: {
    id: number;
    name: string;
    carat: number;
    clarity: string;
    color: string;
    cut: string;
  };
  baseBidPrice: number;
  highestBid: {
    id: number;
    amount: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
    createdAt: string;
  };
  totalBidders: number;
  startTime: string;
  endTime: string;
  status: string;
  resultDeclared: boolean;
  result?: {
    id: number;
    winnerId: number;
    winningAmount: number;
    declaredAt: string;
    winner: {
      name: string;
      email: string;
    };
  };
}

const ResultsManagement: React.FC = () => {
  const [results, setResults] = useState<AuctionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'declared'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/results', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.data || []);
      } else {
        console.error('Failed to fetch results');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclareResult = async (auctionId: number, diamondName: string) => {
    const auction = results.find(r => r.id === auctionId);
    const winnerInfo = auction?.highestBid ? 
      `${auction.highestBid.user.name} with $${auction.highestBid.amount.toLocaleString()}` : 
      'No bids placed';
    
    if (!confirm(`Declare result for "${diamondName}"?\n\n🏆 Winner: ${winnerInfo}\n\nThis will make the result official and notify all users.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/results', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bidId: auctionId
        })
      });
      
      if (response.ok) {
        alert(`🎉 Result declared successfully!\n\nWinner: ${winnerInfo}\n\nAll users can now see the results.`);
        fetchResults();
      } else {
        const errorData = await response.json();
        alert('Error declaring result: ' + errorData.message);
      }
    } catch (error) {
      alert('Error declaring result: ' + error);
    }
  };

  const filteredResults = results.filter(result => {
    if (filter === 'pending') return !result.resultDeclared && result.status === 'CLOSED';
    if (filter === 'declared') return result.resultDeclared;
    return true;
  });

  const getStatusBadge = (result: AuctionResult) => {
    if (result.resultDeclared) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Result Declared</span>;
    }
    if (result.status === 'CLOSED') {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 animate-pulse">Pending Declaration</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Active</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auction results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🏆 Auction Results</h1>
              <p className="mt-2 text-gray-600">Manage auction winners and declare results</p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Auctions</p>
                <p className="text-2xl font-bold text-gray-900">{results.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Results</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {results.filter(r => !r.resultDeclared && r.status === 'CLOSED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Results Declared</p>
                <p className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.resultDeclared).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bidders</p>
                <p className="text-2xl font-bold text-purple-600">
                  {results.reduce((sum, r) => sum + r.totalBidders, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setFilter('all')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  filter === 'all'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Auctions ({results.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  filter === 'pending'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Declaration ({results.filter(r => !r.resultDeclared && r.status === 'CLOSED').length})
              </button>
              <button
                onClick={() => setFilter('declared')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  filter === 'declared'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Results Declared ({results.filter(r => r.resultDeclared).length})
              </button>
            </nav>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-6">
          {filteredResults.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Auctions Found</h3>
              <p className="text-gray-500">
                {filter === 'pending' ? 'No pending results to declare.' : 
                 filter === 'declared' ? 'No results have been declared yet.' :
                 'No auctions found.'}
              </p>
            </div>
          ) : (
            filteredResults.map((result) => (
              <div key={result.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {result.diamond?.name || 'Diamond Auction'}
                        </h3>
                        {getStatusBadge(result)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Carat:</span>
                          <span className="ml-2 font-medium">{result.diamond?.carat || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Base Price:</span>
                          <span className="ml-2 font-medium">${result.baseBidPrice?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Bidders:</span>
                          <span className="ml-2 font-medium text-blue-600">{result.totalBidders}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">End Time:</span>
                          <span className="ml-2 font-medium">
                            {result.endTime ? `${new Date(result.endTime).toLocaleDateString()} ${new Date(result.endTime).toLocaleTimeString()}` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Winner Information */}
                  {result.highestBid && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-yellow-600 font-bold">🏆</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {result.resultDeclared ? 'Winner' : 'Highest Bidder'}
                              </p>
                              <p className="text-lg font-bold text-green-600">
                                {result.highestBid.user.name}
                              </p>
                              <p className="text-sm text-gray-500">{result.highestBid.user.email}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Winning Amount</p>
                            <p className="text-xl font-bold text-green-600">
                              ${result.highestBid.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2">
                          {!result.resultDeclared && result.status === 'CLOSED' && (
                            <button
                              onClick={() => handleDeclareResult(result.id, result.diamond?.name || 'Diamond Auction')}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium animate-pulse flex items-center justify-center"
                            >
                              🎯 Declare Result
                            </button>
                          )}
                          
                          {result.resultDeclared && (
                            <div className="text-center">
                              <div className="text-xs bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                                ✅ Declared on {result.result?.declaredAt ? new Date(result.result.declaredAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Bids Case */}
                  {!result.highestBid && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-center py-4">
                          <p className="text-gray-500">No bids were placed for this auction</p>
                        </div>
                        
                        {result.status === 'CLOSED' && !result.resultDeclared && (
                          <button
                            onClick={() => handleDeclareResult(result.id, result.diamond?.name || 'Diamond Auction')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                          >
                            Close Auction (No Winner)
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsManagement;
