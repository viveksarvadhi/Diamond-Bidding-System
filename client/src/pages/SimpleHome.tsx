import { useNavigate } from 'react-router-dom';

const SimpleHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-4">Diamond Bidding System</h1>
        <p className="text-gray-600 text-center mb-6">Frontend is working!</p>
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ React App: Running
          </div>
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            ✅ Tailwind CSS: Working
          </div>
          <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-3 rounded">
            ✅ Components: Rendering
          </div>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Login,
        </button>
        <button 
          onClick={() => navigate('/register')}
          className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};

export default SimpleHome;
