import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, ClockIcon, CurrencyDollarIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface Diamond {
  id: number;
  name: string;
  basePrice?: number;
  [key: string]: any;
}

interface FormErrors {
  diamondId?: string;
  baseBidPrice?: string;
  startTime?: string;
  endTime?: string;
}

const CreateAuction = () => {
  const navigate = useNavigate();
  const [diamonds, setDiamonds] = useState<Diamond[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    diamondId: '',
    baseBidPrice: '',
    startTime: '',
    endTime: '',
    description: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Format for local datetime-local input (YYYY-MM-DDTHH:MM)
  const formatLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    fetchDiamonds();
    // Set default times - start time should be now, end time should be 5 minutes later for testing
    const now = new Date();
    const endTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
    
    setFormData({
      diamondId: '',
      baseBidPrice: '',
      startTime: formatLocalDateTime(now), // Use local time
      endTime: formatLocalDateTime(endTime), // Use local time
      description: ''
    });
  }, []);

  const fetchDiamonds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/diamonds', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiamonds(data.data?.diamonds || []);
      }
    } catch (error) {
      console.error('Error fetching diamonds:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentTime = () => {
    const now = new Date();
    const endTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
    
    setFormData(prev => ({
      ...prev,
      startTime: formatLocalDateTime(now),
      endTime: formatLocalDateTime(endTime)
    }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.diamondId) {
      newErrors.diamondId = 'Please select a diamond';
    }
    
    if (!formData.baseBidPrice || parseFloat(formData.baseBidPrice) <= 0) {
      newErrors.baseBidPrice = 'Please enter a valid base price';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Please select start time';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'Please select end time';
    }
    
    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      newErrors.endTime = 'End time must be after start time';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Debug: Log the times being sent
      const startTimeISO = new Date(formData.startTime).toISOString();
      const endTimeISO = new Date(formData.endTime).toISOString();
      console.log('🕐 Debug - Form startTime:', formData.startTime);
      console.log('🕐 Debug - Form endTime:', formData.endTime);
      console.log('🕐 Debug - ISO startTime:', startTimeISO);
      console.log('🕐 Debug - ISO endTime:', endTimeISO);
      console.log('🕐 Debug - Current time:', new Date().toISOString());
      
      const response = await fetch('http://localhost:5000/api/bids', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          diamondId: parseInt(formData.diamondId),
          baseBidPrice: parseFloat(formData.baseBidPrice),
          startTime: startTimeISO,
          endTime: endTimeISO
        })
      });
      
      if (response.ok) {
        alert('Auction created successfully!');
        navigate('/admin');
      } else {
        const errorData = await response.json();
        console.error('❌ Full error response:', errorData);
        alert('Error creating auction: ' + (errorData.message || errorData.error || JSON.stringify(errorData)));
      }
    } catch (error) {
      alert('Error creating auction: ' + error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/admin')}
                  className="mr-4 text-gray-600 hover:text-gray-900"
                >
                  ← Back to Dashboard
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Create New Auction</h1>
                  <p className="mt-1 text-sm text-gray-500">Set up a new diamond auction</p>
                </div>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-white mr-3" />
              <h2 className="text-xl font-semibold text-white">Auction Details</h2>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Diamond Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center">
                    <SparklesIcon className="h-4 w-4 mr-1" />
                    Select Diamond
                  </span>
                </label>
                <select
                  value={formData.diamondId}
                  onChange={(e) => setFormData({...formData, diamondId: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.diamondId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Choose a diamond...</option>
                  {diamonds.map((diamond) => (
                    <option key={diamond.id} value={diamond.id}>
                      {diamond.name} - ${diamond.basePrice?.toLocaleString()}
                    </option>
                  ))}
                </select>
                {errors.diamondId && (
                  <p className="mt-1 text-sm text-red-600">{errors.diamondId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    Base Bid Price ($)
                  </span>
                </label>
                <input
                  type="number"
                  value={formData.baseBidPrice}
                  onChange={(e) => setFormData({...formData, baseBidPrice: e.target.value})}
                  placeholder="50000"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.baseBidPrice ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.baseBidPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.baseBidPrice}</p>
                )}
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center justify-between">
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Start Time
                    </span>
                    <button
                      type="button"
                      onClick={updateCurrentTime}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      Use Current Time
                    </button>
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.startTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    End Time
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.endTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Selected Diamond Preview */}
            {formData.diamondId && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Diamond Preview</h3>
                {diamonds.find(d => d.id === parseInt(formData.diamondId)) && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {diamonds.find(d => d.id === parseInt(formData.diamondId))?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Base Price: ${diamonds.find(d => d.id === parseInt(formData.diamondId))?.basePrice?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Auction Base</p>
                      <p className="font-semibold text-purple-600">
                        ${formData.baseBidPrice || '0'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Auction
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Select a diamond from your inventory</li>
            <li>• Set a competitive base bid price</li>
            <li>• Choose appropriate start and end times</li>
            <li>• Once created, users can start placing bids</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateAuction;
