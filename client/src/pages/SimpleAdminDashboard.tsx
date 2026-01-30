import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

const SimpleAdminDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDiamonds: 0,
    activeBids: 0,
    completedAuctions: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddDiamondModal, setShowAddDiamondModal] = useState(false);
  const [showAddBidModal, setShowAddBidModal] = useState(false);
  const [isAddingDiamond, setIsAddingDiamond] = useState(false);
  const [isAddingBid, setIsAddingBid] = useState(false);
  const [availableDiamonds, setAvailableDiamonds] = useState<any[]>([]);
  const [bidDetails, setBidDetails] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [endedAuctions, setEndedAuctions] = useState<any[]>([]);
  
  const [diamondForm, setDiamondForm] = useState({
    name: '',
    basePrice: 0,
    description: '',
    image_url: ''
  });
  
  const [bidForm, setBidForm] = useState({
    diamondId: 0,
    baseBidPrice: 0,
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    fetchDashboardStats();
    fetchBidDetails();
    fetchResults();
    fetchEndedAuctions();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch users count
      const usersResponse = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch diamonds count
      const diamondsResponse = await fetch('http://localhost:5000/api/diamonds', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch bids count
      const bidsResponse = await fetch('http://localhost:5000/api/bids', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (usersResponse.ok && diamondsResponse.ok && bidsResponse.ok) {
        const usersData = await usersResponse.json();
        const diamondsData = await diamondsResponse.json();
        const bidsData = await bidsResponse.json();
        
        setStats({
          totalUsers: usersData.data?.users?.length || 0,
          totalDiamonds: diamondsData.data?.diamonds?.length || 0,
          activeBids: bidsData.data?.bids?.filter((bid: any) => bid.status === 'ACTIVE').length || 0,
          completedAuctions: bidsData.data?.bids?.filter((bid: any) => bid.status === 'CLOSED').length || 0
        });
        
        // Store diamonds for the bid form
        setAvailableDiamonds(diamondsData.data?.diamonds || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBidDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Admin Debug - Token:', token ? 'Present' : 'Missing');
      console.log('🔍 Admin Debug - Fetching LIVE bid details...');
      
      const response = await fetch('http://localhost:5000/api/bids/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Admin Debug - Response status:', response.status);
      console.log('🔍 Admin Debug - Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Admin Debug - Response data:', data);
        const activeBids = data.data?.bids || [];
        console.log('🔍 Admin Debug - Active bids count:', activeBids.length);
        
        // Process the bids to add additional info needed for admin display
        const processedBids = activeBids.map(bid => ({
          ...bid,
          highestBid: bid.userBids && bid.userBids.length > 0 
            ? bid.userBids.reduce((max, userBid) => 
                userBid.amount > (max?.amount || 0) ? userBid : max, null)
            : null,
          totalBidders: bid.userBids ? bid.userBids.length : 0,
          recentBids: bid.userBids ? [...bid.userBids].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []
        }));
        
        console.log('🔍 Admin Debug - Processed bids:', processedBids);
        setBidDetails(processedBids);
      } else {
        const errorText = await response.text();
        console.error('❌ Admin Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Admin Error fetching live bid details:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/results', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.data?.results || []);
      }
    } catch (error) {
      console.error('❌ Error fetching results:', error);
    }
  };

  const fetchEndedAuctions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/ended-auctions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEndedAuctions(data.data?.auctions || []);
      }
    } catch (error) {
      console.error('❌ Error fetching ended auctions:', error);
    }
  };

  const handleAddDiamond = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingDiamond(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/diamonds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(diamondForm)
      });
      
      if (response.ok) {
        alert('Diamond added successfully!');
        setShowAddDiamondModal(false);
        setDiamondForm({ name: '', basePrice: 0, description: '', image_url: '' });
        fetchDashboardStats(); // Refresh stats
      } else {
        const errorData = await response.json();
        alert('Error adding diamond: ' + errorData.message);
      }
    } catch (error) {
      alert('Error adding diamond: ' + error);
    } finally {
      setIsAddingDiamond(false);
    }
  };

  const handleAddBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingBid(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bids', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bidForm)
      });
      
      if (response.ok) {
        alert('Auction created successfully!');
        setShowAddBidModal(false);
        setBidForm({ diamondId: 0, baseBidPrice: 0, startTime: '', endTime: '' });
        fetchDashboardStats(); // Refresh stats
      } else {
        const errorData = await response.json();
        alert('Error creating auction: ' + errorData.message);
      }
    } catch (error) {
      alert('Error creating auction: ' + error);
    } finally {
      setIsAddingBid(false);
    }
  };

  const handleDeleteAllBids = async () => {
    if (!confirm('Are you sure you want to delete ALL bids? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/delete-all-bids', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchDashboardStats(); // Refresh stats
        fetchBidDetails(); // Refresh bid details
      } else {
        const errorData = await response.json();
        alert('Error deleting bids: ' + errorData.message);
      }
    } catch (error) {
      alert('Error deleting bids: ' + error);
    }
  };

  const handleDeleteAuction = async (auctionId: number, diamondName: string) => {
    if (!confirm(`Are you sure you want to delete the auction for "${diamondName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/force-delete-bid/${auctionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchDashboardStats(); // Refresh stats
        fetchBidDetails(); // Refresh bid details
      } else {
        const errorData = await response.json();
        alert('Error deleting auction: ' + errorData.message);
      }
    } catch (error) {
      alert('Error deleting auction: ' + error);
    }
  };

  const handleCleanDatabase = async () => {
    if (!confirm('⚠️ WARNING: This will delete all duplicate tables from the database!\n\nThis action cannot be undone.\n\nAre you sure you want to continue?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/clean-database', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}\n\nDropped tables: ${data.droppedTables.length}\nKept tables: ${data.keptTables.length}\n\nFinal tables: ${data.finalTables.join(', ')}`);
        fetchDashboardStats(); // Refresh stats
        fetchBidDetails(); // Refresh bid details
      } else {
        const errorData = await response.json();
        alert('Error cleaning database: ' + errorData.message);
      }
    } catch (error) {
      alert('Error cleaning database: ' + error);
    }
  };

  const handleCleanAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/clean-admins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}\n\nFinal admin count: ${data.finalAdminCount || data.adminCount}`);
        fetchDashboardStats(); // Refresh stats
      } else {
        const errorData = await response.json();
        alert('Error cleaning admins: ' + errorData.message);
      }
    } catch (error) {
      alert('Error cleaning admins: ' + error);
    }
  };

  const handleFixAdminRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/fix-admin-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}\n\nPlease logout and login again to refresh your permissions.`);
        // Force logout to refresh token
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        const errorData = await response.json();
        alert('Error fixing admin role: ' + errorData.message);
      }
    } catch (error) {
      alert('Error fixing admin role: ' + error);
    }
  };

  const handleDeclareResult = async (auctionId: number, diamondName: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // First get highest bid info
      const highestBidResponse = await fetch(`http://localhost:5000/api/ended-auctions/${auctionId}/highest-bid`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!highestBidResponse.ok) {
        alert('Error fetching auction details');
        return;
      }

      const highestBidData = await highestBidResponse.json();
      const winnerInfo = highestBidData.data.highestBid ? 
        `${highestBidData.data.highestBid.user?.name} with $${highestBidData.data.highestBid.amount.toLocaleString()}` : 
        'No bids placed';
      
      if (!confirm(`Declare result for "${diamondName}"?\n\n🏆 Winner: ${winnerInfo}\n\nThis will make the result official and notify all users.`)) {
        return;
      }
      
      // Declare result
      const response = await fetch(`http://localhost:5000/api/ended-auctions/${auctionId}/declare-result`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Result declared successfully!\n\nWinner: ${result.data.winner?.name || 'No winner'}\nAmount: $${result.data.winningAmount.toLocaleString()}`);
        
        // Refresh all data
        fetchResults();
        fetchEndedAuctions();
        fetchBidDetails();
        fetchDashboardStats();
      } else {
        const errorData = await response.json();
        alert('Error declaring result: ' + errorData.message);
      }
    } catch (error) {
      alert('Error declaring result: ' + error);
    }
  };

  const handleCreateActiveAuction = async () => {
    if (!confirm('Create an active auction immediately? This will start bidding right away.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Get available diamonds
      const diamondsResponse = await fetch('http://localhost:5000/api/diamonds', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!diamondsResponse.ok) {
        alert('Error fetching diamonds');
        return;
      }
      
      const diamondsData = await diamondsResponse.json();
      const diamonds = diamondsData.data?.diamonds || [];
      
      if (diamonds.length === 0) {
        alert('No diamonds available. Please create a diamond first.');
        return;
      }
      
      // Use the first available diamond
      const diamond = diamonds[0];
      const basePrice = parseFloat(diamond.basePrice);
      
      const response = await fetch('http://localhost:5000/api/admin/create-active-auction', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          diamondId: diamond.id,
          baseBidPrice: basePrice,
          durationMinutes: 5 // 5 minutes for testing
        })
      });
      
      if (response.ok) {
        await response.json();
        alert(`Active auction created for "${diamond.name}"! Users can now bid.`);
        fetchDashboardStats(); // Refresh stats
        fetchBidDetails(); // Refresh bid details
      } else {
        const errorData = await response.json();
        alert('Error creating active auction: ' + errorData.message);
      }
    } catch (error) {
      alert('Error creating active auction: ' + error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Welcome back, {user.name}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Administrator
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
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Diamonds</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalDiamonds}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Bids</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeBids}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.completedAuctions}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <button 
                onClick={() => navigate('/admin/users')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Manage Users
              </button>
              <button 
                onClick={() => setShowAddDiamondModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Add Diamond
              </button>
              <button 
                onClick={() => navigate('/admin/create-auction')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
              >
                Create Auction
              </button>
              <button 
                onClick={handleCreateActiveAuction}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
              >
                Start Active Auction
              </button>
              <button 
                onClick={handleDeleteAllBids}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Delete All Bids
              </button>
              <button 
                onClick={() => navigate('/admin/results')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center"
              >
                🏆 Results Management
              </button>
              {/* <button 
                onClick={handleFixAdminRole}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center"
              >
                🔧 Fix Admin Access
              </button> */}
              {/* <button 
                onClick={handleCleanAdmins}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
              >
                🧹 Clean Multiple Admins
              </button> */}
              {/* <button 
                onClick={handleCleanDatabase}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center"
              >
                🗑️ Clean Database Tables
              </button> */}
            </div>
          </div>
        </div>

        {/* Bid Details Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">🔴 Live Bidding Activity</h3>
              <button
                onClick={() => {
                  console.log('🔄 Admin refresh triggered');
                  fetchBidDetails();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center text-sm"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            {bidDetails.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Bids Yet</h3>
                <p className="text-gray-500">Start an auction to see bid details here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {bidDetails.map((bid) => (
                  <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-gray-900">
                        💎 {bid.diamond?.name || 'Diamond Auction'}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          bid.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          bid.status === 'CLOSED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bid.status}
                        </span>
                        <button
                          onClick={() => handleDeleteAuction(bid.id, bid.diamond?.name || 'Diamond Auction')}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
                        >
                          Delete
                        </button>
                        {bid.status === 'CLOSED' && (
                          <div className="flex flex-col space-y-2">
                            {bid.highestBid && (
                              <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                🏆 Winner: {bid.highestBid.user?.name} - ${bid.highestBid.amount.toLocaleString()}
                              </div>
                            )}
                            <button
                              onClick={() => handleDeclareResult(bid.id, bid.diamond?.name || 'Diamond Auction')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium animate-pulse"
                            >
                              🎯 Declare Result
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-sm">
                        <span className="text-gray-500">Base Price:</span>
                        <span className="ml-2 font-medium">${bid.baseBidPrice?.toLocaleString()}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Highest Bid:</span>
                        <span className="ml-2 font-medium text-green-600">
                          ${bid.highestBid ? bid.highestBid.amount.toLocaleString() : 'No bids yet'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Total Bidders:</span>
                        <span className="ml-2 font-medium text-blue-600">{bid.totalBidders}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Live Activity:</span>
                        <span className="ml-2">
                          {bid.userBids && bid.userBids.length > 0 ? (
                            <span className="inline-flex items-center">
                              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                              <span className="font-medium text-green-600">Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center">
                              <span className="h-2 w-2 bg-gray-400 rounded-full mr-1"></span>
                              <span className="font-medium text-gray-500">No Activity</span>
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Live User Activity */}
                    {bid.liveActivity && bid.recentBids && bid.recentBids.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                          <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse mr-2"></span>
                          🟢 Live Bidding Activity
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {bid.recentBids.map((userBid: any) => (
                            <div key={userBid.id} className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                              <div className="flex items-center">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                  <UserIcon className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{userBid.user?.name || 'Unknown User'}</p>
                                  <p className="text-xs text-gray-500">{userBid.user?.email || 'No email'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-green-600">${userBid.amount?.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(userBid.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bid.recentBids && bid.recentBids.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">📋 Live Bid History:</h5>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {bid.recentBids.map((userBid: any, index: number) => (
                                <tr key={userBid.id} className={index === 0 ? 'bg-green-50' : ''}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {userBid.user?.name || 'Unknown User'}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-green-600">
                                    ${userBid.amount?.toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(userBid.createdAt).toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    {index === 0 ? (
                                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                        🏆 Leading
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                        Outbid
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Management Section */}
        <div className="bg-white shadow rounded-lg mt-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">🏆 Auction Results & Winners</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    fetchResults();
                    fetchEndedAuctions();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center text-sm"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Results
                </button>
              </div>
            </div>

            {/* Ended Auctions Needing Result Declaration */}
            {endedAuctions.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-red-600 mb-3">⏳ Awaiting Result Declaration</h4>
                <div className="space-y-3">
                  {endedAuctions.map((auction) => (
                    <div key={auction.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">💎 {auction.diamond?.name}</h5>
                          <p className="text-sm text-gray-600">
                            Ended: {new Date(auction.endTime).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Bidders: {auction.userBids?.length || 0}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeclareResult(auction.id, auction.diamond?.name)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium animate-pulse"
                        >
                          🎯 Declare Result
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Declared Results */}
            <div>
              <h4 className="text-md font-semibold text-green-600 mb-3">✅ Declared Winners</h4>
              {results.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                  <p className="text-gray-500">Auction results will appear here once declared</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Diamond</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Winner</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Winning Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Declared By</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Declared At</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((result: any) => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className="mr-2">💎</span>
                              {result.bid?.diamond?.name || 'Unknown Diamond'}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            {result.winner ? (
                              <div className="flex items-center">
                                <span className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                  <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                                <div>
                                  <p className="font-medium text-gray-900">{result.winner?.name}</p>
                                  <p className="text-xs text-gray-500">{result.winner?.email}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">No winner</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-green-600">
                            ${result.winningAmount?.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {result.declarer?.name || 'System'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(result.declaredAt).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              ✅ Declared
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Diamond Modal */}
        {showAddDiamondModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Diamond</h3>
                <form onSubmit={handleAddDiamond}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        required
                        value={diamondForm.name}
                        onChange={(e) => setDiamondForm({...diamondForm, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Diamond Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Base Price</label>
                      <input
                        type="number"
                        required
                        value={diamondForm.basePrice}
                        onChange={(e) => setDiamondForm({...diamondForm, basePrice: parseFloat(e.target.value)})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={diamondForm.description}
                        onChange={(e) => setDiamondForm({...diamondForm, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        rows={3}
                        placeholder="Diamond description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Image URL</label>
                      <input
                        type="url"
                        value={diamondForm.image_url}
                        onChange={(e) => setDiamondForm({...diamondForm, image_url: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="https://example.com/diamond.jpg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddDiamondModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingDiamond}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                      {isAddingDiamond ? 'Adding...' : 'Add Diamond'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Bid Modal */}
        {showAddBidModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Auction</h3>
                <form onSubmit={handleAddBid}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Diamond</label>
                      <select
                        required
                        value={bidForm.diamondId}
                        onChange={(e) => setBidForm({...bidForm, diamondId: parseInt(e.target.value)})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select Diamond</option>
                        {availableDiamonds.map(diamond => (
                          <option key={diamond.id} value={diamond.id}>
                            {diamond.name} - ${diamond.basePrice}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Base Bid Price</label>
                      <input
                        type="number"
                        required
                        value={bidForm.baseBidPrice}
                        onChange={(e) => setBidForm({...bidForm, baseBidPrice: parseFloat(e.target.value)})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={bidForm.startTime}
                        onChange={(e) => setBidForm({...bidForm, startTime: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={bidForm.endTime}
                        onChange={(e) => setBidForm({...bidForm, endTime: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddBidModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingBid}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                      {isAddingBid ? 'Creating...' : 'Create Auction'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleAdminDashboard;
