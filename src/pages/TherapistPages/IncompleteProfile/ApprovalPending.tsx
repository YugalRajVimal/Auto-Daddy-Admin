
const ApprovalPending = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-tr from-violet-200 via-indigo-200 to-amber-100 px-4 py-20">
      <div className="bg-white bg-opacity-70 shadow-xl rounded-3xl px-7 py-10 max-w-xl mx-auto flex flex-col items-center">
        <img
          src="/logo.webp"
          alt="Approval pending"
          className="w-36 mb-6"
        />
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-900 mb-3 text-center">
          Thank you for completing your profile!
        </h1>
        <p className="text-lg text-indigo-800 mb-2 text-center">
          We're delighted to have you as part of the Nupal community.
        </p>
        <p className="text-base text-indigo-700 mb-4 text-center">
          Your details have been received and are being reviewed by our team.
        </p>
        <p className="text-base text-indigo-700 mb-6 text-center">
          Once your information is verified, you'll receive an email letting you know you can start using your therapist panel. This usually takes a short while. In the meantime, feel free to reach out to us if you have any questions!
        </p>
        <p className="text-sm text-gray-600 text-center">
          <span role="img" aria-label="sparkles">
            ✨
          </span>{" "}
          Thank you for your patience and for choosing Nupal!
        </p>
      <button
        onClick={() => (window.location.href = "/")}
        className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow font-semibold text-base transition"
      >
        Return to Home
      </button>
      <button
        onClick={() => (window.location.href = "/therapist/logout")}
        className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md shadow font-semibold text-base transition"
      >
        Logout
      </button>
      </div>
    </div>
  );
};

export default ApprovalPending;