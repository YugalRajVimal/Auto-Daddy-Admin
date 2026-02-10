

const handleLogout = () => {
  // Remove the user token (modify according to token storage key)
  localStorage.removeItem('user-token');
  // Optionally clear all localStorage/sessionStorage related to user auth
  // localStorage.clear();
  // Redirect to login/signin page
  window.location.href = '/signin';
};

const KycApprovalPending = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-50 to-blue-100 px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 flex flex-col items-center">
        <img
          src="https://cdn-icons-png.flaticon.com/512/6658/6658791.png"
          alt="KYC Pending"
          className="w-20 h-20 mb-4"
        />
        <h1 className="text-2xl font-bold text-yellow-700 mb-2">
          KYC Verification Pending
        </h1>
        <p className="text-gray-700 text-center mb-6">
          Thank you for submitting your KYC documents. Your information is now under review. 
          <br />
          <br />
          <b>
            You will be notified once your KYC is approved. This may take up to 24-48 hours. 
          </b>
        </p>
        <button
          onClick={handleLogout}
          className="mt-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-medium shadow"
        >
          Logout
        </button>
      </div>
      <div className="mt-6 text-sm text-gray-400">If you need help, contact&nbsp;
        <a href="mailto:support@promohatt.com" className="text-blue-600 underline">
          support@promohatt.com
        </a>
      </div>
    </div>
  );
};

export default KycApprovalPending;