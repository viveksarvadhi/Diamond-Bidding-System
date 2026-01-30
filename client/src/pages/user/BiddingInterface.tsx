import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bidService, userBidService } from '../../services';
import {
  ClockIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import type { Bid, UserBid, BidHistory } from '../../services';

const BiddingInterface = () => {
  const { user } = useAuth();
  const [activeBids, setActiveBids] = useState<Bid[]>([]);
  const [myBids, setMyBids] = useState<UserBid[]>([]);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);
  const [highestBids, setHighestBids] = useState<Record<number, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [bidAmount, setBidAmount] = useState('');
  const [editBidAmount, setEditBidAmount] = useState('');

  // Fetch active bids
  const fetchActiveBids = async (page = 1) => {
    try {
      const response = await bidService.getActiveBids({ page, limit: 10 });
      if (response.success && response.data && response.data.bids) {
        setActiveBids(response.data.bids);
        setTotalPages(response.data.pagination.totalPages);
        
        // Fetch highest bids for each active bid
        const highestBidPromises = response.data.bids.map(bid =>
          userBidService.getHighestBid(bid.id)
        );
        
        const highestBidResults = await Promise.all(highestBidPromises);
        const highestBidMap: Record<number, any> = {};
        highestBidResults.forEach((result, index) => {
          if (result.success && response.data && response.data.bids[index]) {
            highestBidMap[response.data.bids[index].id] = result.data;
          }
        });
        setHighestBids(highestBidMap);
      }
    } catch (error) {
      console.error('Error fetching active bids:', error);
    }
  };

  // Fetch user's bids
  const fetchMyBids = async () => {
    try {
      const response = await userBidService.getMyBids();
      if (response.success && response.data) {
        setMyBids(response.data.userBids);
      }
    } catch (error) {
      console.error('Error fetching my bids:', error);
    }
  };

  useEffect(() => {
    fetchActiveBids(currentPage);
    fetchMyBids();
  }, [currentPage]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBid || !bidAmount) return;
    
    try {
      const response = await userBidService.placeBid({
        bidId: selectedBid.id,
        amount: parseFloat(bidAmount)
      });
      
      if (response.success) {
        setShowBidModal(false);
        setBidAmount('');
        setSelectedBid(null);
        fetchActiveBids(currentPage);
        fetchMyBids();
        
        // Update highest bid for this bid
        const highestBidResponse = await userBidService.getHighestBid(selectedBid.id);
        if (highestBidResponse.success) {
          setHighestBids(prev => ({
            ...prev,
            [selectedBid.id]: highestBidResponse.data
          }));
        }
      }
    } catch (error: any) {
      console.error('Error placing bid:', error);
    }
  };

  const handleEditBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBid || !editBidAmount) return;
    
    try {
      const userBid = myBids.find(ub => ub.bidId === selectedBid.id);
      if (!userBid) return;
      
      const response = await userBidService.editBid(userBid.id, {
        amount: parseFloat(editBidAmount)
      });
      
      if (response.success) {
        setShowEditModal(false);
        setEditBidAmount('');
        setSelectedBid(null);
        fetchMyBids();
        
        // Update highest bid
        const highestBidResponse = await userBidService.getHighestBid(selectedBid.id);
        if (highestBidResponse.success) {
          setHighestBids(prev => ({
            ...prev,
            [selectedBid.id]: highestBidResponse.data
          }));
        }
      }
    } catch (error: any) {
      console.error('Error editing bid:', error);
    }
  };

  const handleDeleteBid = async (userBidId: number) => {
    if (!confirm('Are you sure you want to delete this bid?')) return;
    
    try {
      const response = await userBidService.deleteBid(userBidId);
      if (response.success) {
        fetchMyBids();
      }
    } catch (error: any) {
      console.error('Error deleting bid:', error);
    }
  };

  const handleViewHistory = async (userBidId: number) => {
    try {
      const response = await userBidService.getBidHistory(userBidId);
      if (response.success && response.data) {
        setBidHistory(response.data.bidHistory);
        setShowHistoryModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching bid history:', error);
    }
  };

  const openBidModal = (bid: Bid) => {
    setSelectedBid(bid);
    setBidAmount(bid.baseBidPrice.toString());
    setShowBidModal(true);
  };

  const openEditModal = (bid: Bid) => {
    const userBid = myBids.find(ub => ub.bidId === bid.id);
    if (userBid) {
      setSelectedBid(bid);
      setEditBidAmount(userBid.amount.toString());
      setShowEditModal(true);
    }
  };

  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-gray-400 mr-3" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bidding Arena</h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Place bids on active diamond auctions
                    </p>
                  </div>
                </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  {user?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* My Bids Section */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">My Bids</h2>
          {myBids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBids.map((userBid) => (
                <div key={userBid.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {userBid.bid?.diamond?.name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      userBid.bid?.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {userBid.bid?.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Your Bid:</span>
                      <span className="text-lg font-bold text-blue-600">
                        ${userBid.amount.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Base Price:</span>
                      <span className="text-sm">
                        ${userBid.bid?.baseBidPrice?.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Time Left:</span>
                      <span className="text-sm font-medium">
                        {userBid.bid?.endTime && formatTimeRemaining(userBid.bid.endTime)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => openEditModal(userBid.bid!)}
                      disabled={userBid.bid?.status !== 'ACTIVE'}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleViewHistory(userBid.id)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      History
                    </button>
                    <button
                      onClick={() => handleDeleteBid(userBid.id)}
                      disabled={userBid.bid?.status !== 'ACTIVE'}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bids Yet</h3>
              <p className="text-gray-500">Start bidding on active auctions below!</p>
            </div>
          )}
        </div>

        {/* Active Auctions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Active Auctions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBids.map((bid) => {
              const highestBid = highestBids[bid.id];
              const myBid = myBids.find(ub => ub.bidId === bid.id);
              const isHighest = myBid && highestBid?.highestBid?.user?.id === user?.id;
              
              return (
                <div key={bid.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {bid.diamond?.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatTimeRemaining(bid.endTime)}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Base Price:</span>
                        <span className="text-sm font-medium">
                          ${bid.baseBidPrice.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Highest Bid:</span>
                        <span className="text-sm font-bold text-green-600">
                          {highestBid?.highestBid ? 
                            `$${highestBid.highestBid.amount.toLocaleString()}` : 
                            'No bids yet'
                          }
                        </span>
                      </div>
                      
                      {highestBid?.highestBid && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Leader:</span>
                          <span className="text-sm font-medium">
                            {highestBid.highestBid.user.name}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      {myBid ? (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-blue-900">Your Bid</p>
                            <p className="text-lg font-bold text-blue-600">
                              ${myBid.amount.toLocaleString()}
                            </p>
                          </div>
                          {isHighest && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Leading!
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => openBidModal(bid)}
                          className="w-full px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Place Bid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 text-sm font-medium text-gray-700">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && selectedBid && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Place Bid - {selectedBid.diamond?.name}
            </h3>
            <form onSubmit={handlePlaceBid}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bid Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={selectedBid.baseBidPrice}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum bid: ${selectedBid.baseBidPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBidModal(false);
                    setBidAmount('');
                    setSelectedBid(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Place Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bid Modal */}
      {showEditModal && selectedBid && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Bid - {selectedBid.diamond?.name}
            </h3>
            <form onSubmit={handleEditBid}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Bid Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={selectedBid.baseBidPrice}
                    value={editBidAmount}
                    onChange={(e) => setEditBidAmount(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum bid: ${selectedBid.baseBidPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditBidAmount('');
                    setSelectedBid(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Update Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bid History</h3>
            <div className="space-y-3">
              {bidHistory.map((history) => (
                <div key={history.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {history.oldAmount ? (
                        <>Changed from ${history.oldAmount.toLocaleString()}</>
                      ) : (
                        <>Initial bid: ${history.newAmount.toLocaleString()}</>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(history.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${history.newAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiddingInterface;
