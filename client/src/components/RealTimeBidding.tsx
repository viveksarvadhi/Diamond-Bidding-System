import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { userBidService } from '../services';
import { 
  ClockIcon, 
  SparklesIcon, 
  FireIcon,
  UserIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

interface Bid {
  id: number;
  bidId: number;
  userId: number;
  userName: string;
  amount: number;
  timestamp: string;
}

interface AuctionData {
  id: number;
  diamondId: number;
  status: string;
  startTime: string;
  endTime: string;
  baseBidPrice: number;
  currentBids: Bid[];
  highestBid: number;
  totalBids: number;
}

interface RealTimeBiddingProps {
  auctionId: number;
  diamondName: string;
  basePrice: number;
  endTime: string;
  onBidPlaced?: (bid: Bid) => void;
}

const RealTimeBidding: React.FC<RealTimeBiddingProps> = ({
  auctionId,
  diamondName,
  basePrice,
  endTime,
  onBidPlaced
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [auctionData, setAuctionData] = useState<AuctionData | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [newBidNotification, setNewBidNotification] = useState<Bid | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // Initialize socket connection
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to real-time bidding server');
      setConnected(true);
      
      // Join the auction room
      newSocket.emit('join-auction', auctionId);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from real-time bidding server');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Listen for auction updates
    newSocket.on('auction-update', (data: AuctionData) => {
      setAuctionData(data);
      setViewerCount(prev => prev + 1); // Simulate viewer count
    });

    // Listen for new bids
    newSocket.on('new-bid', (bid: Bid) => {
      setNewBidNotification(bid);
      
      // Show notification for 3 seconds
      setTimeout(() => {
        setNewBidNotification(null);
      }, 3000);

      // Update local auction data
      if (auctionData) {
        const updatedData = {
          ...auctionData,
          currentBids: [bid, ...auctionData.currentBids.slice(0, 9)],
          highestBid: bid.amount,
          totalBids: auctionData.totalBids + 1
        };
        setAuctionData(updatedData);
      }

      // Notify parent component
      if (onBidPlaced) {
        onBidPlaced(bid);
      }
    });

    // Listen for bid confirmation
    newSocket.on('bid-confirmed', (bid: Bid) => {
      setPlacingBid(false);
      setBidAmount('');
      console.log('Bid confirmed:', bid);
    });

    // Listen for bid errors
    newSocket.on('bid-error', (error: { message: string }) => {
      setPlacingBid(false);
      alert('Bid error: ' + error.message);
    });

    // Listen for user joined notifications
    newSocket.on('user-joined', (data: { user: { id: number; name: string } }) => {
      console.log(`User ${data.user.name} joined the auction`);
    });

    // Listen for auction status changes
    newSocket.on('auction-status-changed', (data: { bidId: number; status: string }) => {
      console.log(`Auction ${data.bidId} status changed to: ${data.status}`);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.emit('leave-auction', auctionId);
        newSocket.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [auctionId]);

  useEffect(() => {
    // Update countdown timer
    const updateTimer = () => {
      const endTimeDate = new Date(endTime);
      const now = new Date();
      const diff = endTimeDate.getTime() - now.getTime();
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Ended');
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [endTime]);

  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    const minBid = (auctionData?.highestBid || basePrice) + 100;
    if (amount < minBid) {
      alert(`Minimum bid is $${minBid.toLocaleString()}`);
      return;
    }

    setPlacingBid(true);
    
    try {
      // Check if user already has a bid for this auction
      const myBidsResponse = await userBidService.getMyBids();
      const existingBid = myBidsResponse.data?.userBids?.find((ub: any) => ub.bidId === auctionId);
      
      if (existingBid) {
        // Update existing bid
        const response = await userBidService.editBid(existingBid.id, {
          amount: amount
        });
        
        if (response.success) {
          setBidAmount('');
          // Notify parent to refresh user bids
          if (onBidPlaced) {
            onBidPlaced({
              id: response.data?.userBid?.id || existingBid.id,
              bidId: auctionId,
              userId: 0,
              userName: '',
              amount: amount,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          alert('Error updating bid: ' + (response.message || 'Unknown error'));
        }
      } else {
        // Place new bid
        const response = await userBidService.placeBid({
          bidId: auctionId,
          amount: amount
        });
        
        if (response.success) {
          setBidAmount('');
          // Notify parent to refresh user bids
          if (onBidPlaced) {
            onBidPlaced({
              id: response.data?.userBid?.id || 0,
              bidId: auctionId,
              userId: 0,
              userName: '',
              amount: amount,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          alert('Error placing bid: ' + (response.message || 'Unknown error'));
        }
      }
    } catch (error: any) {
      console.error('Error placing bid:', error);
      alert('Error placing bid: ' + (error.message || 'Unknown error'));
    } finally {
      setPlacingBid(false);
    }
  };

  const currentHighestBid = auctionData?.highestBid || basePrice;
  const isAuctionActive = auctionData?.status === 'ACTIVE' && timeLeft !== 'Ended';

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIcon className="h-6 w-6 text-white mr-2" />
            <h3 className="text-lg font-semibold text-white">{diamondName}</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-white">
              <UsersIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">{viewerCount} watching</span>
            </div>
            <div className={`flex items-center ${connected ? 'text-green-300' : 'text-red-300'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-300' : 'bg-red-300'} ${connected ? 'animate-pulse' : ''}`}></div>
              <span className="text-sm">{connected ? 'Live' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* New Bid Notification */}
      {newBidNotification && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 animate-pulse">
          <div className="flex items-center">
            <ArrowUpIcon className="h-5 w-5 text-green-400 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-800">
                New bid: ${newBidNotification.amount.toLocaleString()} by {newBidNotification.userName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Current Bid Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Base Price</p>
            <p className="text-xl font-bold text-gray-900">${basePrice.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Current Bid</p>
            <p className="text-xl font-bold text-green-600">${currentHighestBid.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Time Left</p>
            <p className={`text-xl font-bold ${timeLeft === 'Ended' ? 'text-red-600' : 'text-orange-600'}`}>
              {timeLeft}
            </p>
          </div>
        </div>

        {/* Place Bid Section */}
        {isAuctionActive && (
          <div className="border-t pt-4">
            <div className="flex space-x-2">
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Min: $${(currentHighestBid + 100).toLocaleString()}`}
                min={currentHighestBid + 100}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!connected || placingBid}
              />
              <button
                onClick={handlePlaceBid}
                disabled={!connected || placingBid}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center"
              >
                {placingBid ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Placing...
                  </>
                ) : (
                  'Place Bid'
                )}
              </button>
            </div>
            {!connected && (
              <p className="text-sm text-red-600 mt-2">Connecting to live auction...</p>
            )}
          </div>
        )}

        {/* Recent Bids */}
        {auctionData?.currentBids && auctionData.currentBids.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Bids</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {auctionData.currentBids.map((bid, index) => (
                <div key={bid.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{bid.userName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">${bid.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(bid.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auction Ended */}
        {timeLeft === 'Ended' && (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Auction Ended</h3>
            <p className="text-gray-500">This auction has concluded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeBidding;
