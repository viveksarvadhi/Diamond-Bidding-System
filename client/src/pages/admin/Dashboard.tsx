import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService, resultService } from '../../services';
import { useWebSocket } from '../../hooks/useWebSocket';
import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalResults: number;
  pendingDeclarations: number;
}

interface BidActivity {
  userBidId: number;
  userId: number;
  userName: string;
  bidId: number;
  diamondId: number;
  diamondName: string;
  amount: number;
  timestamp: string;
  updatedAt: string;
  action: 'placed' | 'updated';
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalResults: 0,
    pendingDeclarations: 0
  });
  const [loading, setLoading] = useState(true);
  const [liveBidActivities, setLiveBidActivities] = useState<BidActivity[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  // Handle incoming bid activity from WebSocket
  const handleBidActivity = useCallback((activity: BidActivity) => {
    setLiveBidActivities((prev) => {
      // Remove existing activity for the same userBidId if it exists (to avoid duplicates)
      const filtered = prev.filter(a => a.userBidId !== activity.userBidId);
      // Add new activity at the beginning
      return [activity, ...filtered].slice(0, 50); // Keep last 50 activities
    });
  }, []);

  // Set up WebSocket connection
  const { connected } = useWebSocket({
    onBidActivity: handleBidActivity,
    enabled: true
  });

  useEffect(() => {
    setWsConnected(connected);
  }, [connected]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get user stats
        const usersResponse = await userService.getUsers({ limit: 1 });
        const totalUsers = usersResponse.data?.pagination?.totalUsers || 0;

        // Get result stats
        const resultStatsResponse = await resultService.getResultStats();
        const resultStats = resultStatsResponse.data;

        setStats({
          totalUsers,
          activeUsers: Math.floor(totalUsers * 0.8), // Estimate active users
          totalResults: resultStats?.overview?.totalResults || 0,
          pendingDeclarations: resultStats?.overview?.pendingDeclarations || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome back, {user?.name}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Administrator
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalUsers.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-green-600 font-medium">
                  {stats.activeUsers.toLocaleString()} active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <SparklesIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Auctions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      3
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-blue-600 font-medium">
                  2 ending soon
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Results
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalResults}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-purple-600 font-medium">
                  This month
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Results
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.pendingDeclarations}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-orange-600 font-medium">
                  Need attention
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <a
                  href="/admin/users"
                  className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <UserGroupIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Manage Users</p>
                    <p className="text-xs text-blue-600">Create, edit, activate users</p>
                  </div>
                </a>
                
                <a
                  href="/admin/diamonds"
                  className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <SparklesIcon className="h-6 w-6 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Manage Diamonds</p>
                    <p className="text-xs text-purple-600">Add and edit diamond catalog</p>
                  </div>
                </a>
                
                <a
                  href="/admin/bids"
                  className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <ChartBarIcon className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Manage Auctions</p>
                    <p className="text-xs text-green-600">Create and monitor bids</p>
                  </div>
                </a>
                
                <a
                  href="/admin/results"
                  className="flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <CheckCircleIcon className="h-6 w-6 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">Declare Results</p>
                    <p className="text-xs text-orange-600">Review and declare winners</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Live Bidding Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <BoltIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Live Bidding Activity</h3>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-gray-500">
                  {wsConnected ? 'Live' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="p-6">
              {liveBidActivities.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {liveBidActivities.map((activity) => (
                    <div 
                      key={`${activity.userBidId}-${activity.updatedAt}`}
                      className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors animate-fade-in"
                    >
                      <div className="flex-shrink-0">
                        {activity.action === 'placed' ? (
                          <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <BoltIcon className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              <span className="font-semibold">{activity.userName}</span>
                              {' '}(ID: {activity.userId})
                              {' '}
                              {activity.action === 'placed' ? 'placed a bid' : 'updated their bid'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Auction:</span> {activity.diamondName} (ID: {activity.diamondId})
                            </p>
                            <p className="text-sm font-bold text-blue-600 mt-1">
                              Bid Amount: ${activity.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(activity.updatedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BoltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No Live Activity</h3>
                  <p className="text-xs text-gray-500">
                    {wsConnected 
                      ? 'Waiting for users to place bids...' 
                      : 'Connecting to live updates...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
