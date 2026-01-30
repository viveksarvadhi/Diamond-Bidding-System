import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClockIcon, 
  CurrencyDollarIcon, 
  SparklesIcon, 
  FireIcon,
  ArrowPathIcon,
  UserIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import RealTimeBidding from '../components/RealTimeBidding';

const BiddingPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeBids, setActiveBids] = useState<any[]>([]);
  const [userBids, setUserBids] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingBid, setPlacingBid] = useState(false);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState<{[key: number]: string}>({});

  useEffect(() => {
    fetchActiveBids();
    fetchUserBids();
    fetchUserResults();
    
    // Update timer every second
    const timer = setInterval(() => {
      updateTimeLeft();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchActiveBids = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Debug - Token:', token ? 'Present' : 'Missing');
      console.log('🔍 Debug - Token length:', token?.length || 0);
      
      if (!token) {
        console.error('❌ No token found in localStorage');
        navigate('/login');
        return;
      }

      console.log('🔍 Debug - Fetching active bids...');
      const response = await fetch('http://localhost:5000/api/bids/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 Debug - Response status:', response.status);
      console.log('🔍 Debug - Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Debug - Response data:', data);
        console.log('🔍 Debug - Active bids count:', data.data?.bids?.length || 0);
        setActiveBids(data.data?.bids || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        if (response.status === 401) {
          console.log('🔄 Redirecting to login due to 401');
          navigate('/login');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching active bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBids = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user-bids', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserBids(data.data?.userBids || []);
      }
    } catch (error) {
      console.error('Error fetching user bids:', error);
    }
  };

  const fetchUserResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/results/my-results', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserResults(data.data?.results || []);
      }
    } catch (error) {
      console.error('Error fetching user results:', error);
    }
  };

  const updateTimeLeft = () => {
    const newTimeLeft = {};
    let shouldRefresh = false;
    
    activeBids.forEach(bid => {
      const endTime = new Date(bid.endTime);
      const now = new Date();
      const diff = endTime - now;
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        newTimeLeft[bid.id] = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        newTimeLeft[bid.id] = 'Ended';
        // Check if this auction just ended and we need to refresh
        if (bid.status === 'ACTIVE') {
          shouldRefresh = true;
        }
      }
    });
    
    setTimeLeft(newTimeLeft);
    
    // Auto-refresh when auctions end
    if (shouldRefresh) {
      console.log('🔄 Auction ended, refreshing data...');
      fetchActiveBids();
      fetchUserBids();
      fetchUserResults();
    }
  };

  const handlePlaceBid = async (bidId) => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    setPlacingBid(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user-bids', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bidId: bidId,
          amount: parseFloat(bidAmount)
        })
      });
      
      if (response.ok) {
        console.log('✅ Bid placed successfully!');
        alert('Bid placed successfully!');
        setBidAmount('');
        setSelectedBid(null);
        console.log('🔄 Refreshing bid data...');
        await fetchActiveBids();
        await fetchUserBids();
        console.log('✅ Bid data refreshed');
      } else {
        const errorData = await response.json();
        alert('Error placing bid: ' + errorData.message);
      }
    } catch (error) {
      alert('Error placing bid: ' + error);
    } finally {
      setPlacingBid(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getHighestBid = (bidId) => {
    const bidsForAuction = userBids.filter(ub => ub.bidId === bidId);
    if (bidsForAuction.length === 0) return bidId.baseBidPrice;
    return Math.max(...bidsForAuction.map(b => b.amount));
  };

  const getUserBidForAuction = (bidId: any) => {
    return userBids.find(ub => ub.bidId === bidId && ub.userId === user.id);
  };

  const getBidResult = (bidId: any) => {
    return userResults.find(result => result.bidId === bidId);
  };

  const getBidStatus = (userBid: any) => {
    const result = getBidResult(userBid.bidId);
    if (result) {
      return result.winnerUserId === user.id ? 'WON' : 'LOST';
    }
    
    const bid = activeBids.find(b => b.id === userBid.bidId);
    if (!bid) return 'UNKNOWN';
    
    const now = new Date();
    if (now >= bid.endTime) {
      const highestBid = getHighestBid(userBid.bidId);
      const isWinning = userBid.amount >= highestBid;
      return isWinning ? 'WON' : 'LOST';
    }
    
    const highestBid = getHighestBid(userBid.bidId);
    const isWinning = userBid.amount >= highestBid;
    return isWinning ? 'WINNING' : 'OUTBID';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Diamond Auctions</h1>
                <p className="mt-1 text-sm text-gray-500">Place your bids on premium diamonds</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Auctions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FireIcon className="h-6 w-6 text-orange-500 mr-2" />
              Active Auctions
            </h2>
            <button
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                fetchActiveBids();
                fetchUserBids();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
          
          {activeBids.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Auctions</h3>
              <p className="text-gray-500">Check back later for new diamond auctions!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {activeBids.filter((bid, index, self) => 
                index === self.findIndex((b) => b.id === bid.id)
              ).map((bid) => (
                <RealTimeBidding
                  key={bid.id}
                  auctionId={bid.id}
                  diamondName={bid.diamond?.name || 'Diamond Auction'}
                  basePrice={parseFloat(bid.baseBidPrice)}
                  endTime={bid.endTime}
                  onBidPlaced={async (newBid) => {
                    // Update user bids when a new bid is placed or updated
                    console.log('🔄 Refreshing user bids after bid placed/updated');
                    await fetchUserBids();
                    await fetchActiveBids(); // Also refresh active bids to get updated highest bid
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* My Bids */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 text-green-500 mr-2" />
            My Bids
          </h2>
          
          {userBids.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bids Yet</h3>
              <p className="text-gray-500">Start bidding on active auctions above!</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Diamond
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Your Bid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Left
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userBids.map((userBid) => {
                      const bid = activeBids.find(b => b.id === userBid.bidId);
                      const bidStatus = getBidStatus(userBid);
                      
                      return (
                        <tr key={userBid.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {bid?.diamond?.name || 'Diamond'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ${userBid.amount?.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              bidStatus === 'WON' ? 'bg-green-100 text-green-800' :
                              bidStatus === 'WINNING' ? 'bg-blue-100 text-blue-800' :
                              bidStatus === 'LOST' ? 'bg-red-100 text-red-800' :
                              bidStatus === 'OUTBID' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {bidStatus === 'WON' ? (
                                <>
                                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                                  WON
                                </>
                              ) : bidStatus === 'WINNING' ? (
                                <>
                                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                                  WINNING
                                </>
                              ) : bidStatus === 'LOST' ? (
                                <>
                                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                                  LOST
                                </>
                              ) : bidStatus === 'OUTBID' ? (
                                <>
                                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                                  OUTBID
                                </>
                              ) : (
                                'UNKNOWN'
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {timeLeft[userBid.bidId] || 'Loading...'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiddingPage;
