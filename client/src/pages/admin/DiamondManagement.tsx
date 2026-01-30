

const DiamondManagement = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Diamond Management</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Diamond management interface - Add, edit, and delete diamonds</p>
        <div className="mt-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Add New Diamond
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiamondManagement;
