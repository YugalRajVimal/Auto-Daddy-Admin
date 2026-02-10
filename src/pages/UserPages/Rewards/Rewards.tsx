

const Rewards = () => {
  // Static value for now
  const points = 2450;

  return (
    <div className=" mx-auto mt-7 p-8 bg-gradient-to-tr from-[#f7fafc] via-[#eaf5fa] to-[#f4fcfa] rounded-xl shadow-[0_5px_24px_rgba(43,73,135,0.09),0_1.5px_7px_rgba(80,70,185,0.07)] font-sans">
      <h2 className="text-3xl font-extrabold mb-7 tracking-tight bg-gradient-to-r from-[#b393fa] to-[#6bc7ef] bg-clip-text text-transparent">
        My Rewards
      </h2>

      <div className="mb-8 flex items-center gap-4">
        <span className="font-bold text-lg text-violet-800 mr-2">Total Reward Points:</span>
        <span className="tracking-widest font-extrabold text-2xl text-blue-700 bg-blue-100 px-6 py-2 rounded-lg border border-blue-200 select-all">
          {points}
        </span>
      </div>
      <div className="px-6 py-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" className="block mx-auto mb-3">
          <rect width="38" height="38" rx="12" fill="#faf8ef"/>
          <path d="M11 21L17.5 27.5L29 16" stroke="#ffe299" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xl font-bold text-yellow-700 block mb-1">Rewards not announced yet</span>
        <span className="text-gray-700 text-base">
          You will get a reward according to your reward points.<br/>
          Stay tuned for the official announcement!
        </span>
      </div>
    </div>
  );
};

export default Rewards;