import React, { useState } from 'react';

// ALLOWED_IMAGE_TYPES and allowedExtensions for client-side validation
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/pjpeg',
];
const allowedExtensions = /\.(jpe?g|png)$/i;

const FileInput = ({
  label,
  accept,
  value,
  error,
  loading,
  onChange,
  name,
  required = true,
  preview,
}: {
  label: string;
  accept: string;
  value: File | null;
  error?: string | null;
  loading: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  name: string;
  required?: boolean;
  preview?: boolean;
}) => (
  <div>
    <label className="block text-sm font-semibold tracking-wide text-gray-800 mb-1">
      {label}
    </label>
    <div
      className={`
        flex items-center border border-gray-200 rounded-lg px-3 py-2
        bg-slate-50/80 shadow-sm space-x-2
        ${error ? 'ring-2 ring-red-300' : 'focus-within:ring-2 focus-within:ring-blue-200'}
      `}
    >
      <input
        type="file"
        accept={accept}
        name={name}
        onChange={onChange}
        className="flex-1 text-base file:mr-4 file:rounded-lg file:bg-blue-50 file:text-blue-900 file:py-1 file:px-3 file:border-none file:cursor-pointer disabled:file:bg-gray-100"
        disabled={loading}
        required={required}
        style={{ minWidth: 0 }}
      />
      {/* File preview thumbnail */}
      {preview && value && (
        <img
          alt="Preview"
          src={URL.createObjectURL(value)}
          className="w-10 h-10 object-cover rounded shadow"
        />
      )}
      {!preview && value && (
        <span className="text-xs text-green-800 font-medium truncate max-w-[160px]" title={value.name}>
          {value.name}
        </span>
      )}
    </div>
    {error && (
      <span className="block text-xs text-red-600 mt-1 font-medium">{error}</span>
    )}
  </div>
);

const CompleteKYC = () => {
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFrontFile, setAadharFrontFile] = useState<File | null>(null);
  const [aadharBackFile, setAadharBackFile] = useState<File | null>(null);
  const [panNumber, setPanNumber] = useState('');
  const [panFile, setPanFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [redirect, setRedirect] = useState(false);

  // For per-file error messages
  const [fileErrors, setFileErrors] = useState<{[key: string]: string | null}>({});

  // Handler for logging out user (redirect to /user/logout)
  const handleLogout = () => {
    window.location.href = '/user/logout';
  };

  // File validation helper
  const isValidFile = (file: File | null) => {
    if (!file) return false;
    const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isValidExt = allowedExtensions.test(file.name);
    return isValidType && isValidExt;
  };

  // Unified handler for file inputs
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'aadharFront' | 'aadharBack' | 'pan'
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!isValidFile(file)) {
        setFileErrors(prev => ({
          ...prev,
          [type]: 'Only JPEG, JPG, and PNG files are allowed.',
        }));
        // Remove the chosen file if invalid
        if (type === 'aadharFront') setAadharFrontFile(null);
        else if (type === 'aadharBack') setAadharBackFile(null);
        else if (type === 'pan') setPanFile(null);
        return;
      }
      setFileErrors(prev => ({
        ...prev,
        [type]: null,
      }));
      if (type === 'aadharFront') setAadharFrontFile(file);
      else if (type === 'aadharBack') setAadharBackFile(file);
      else if (type === 'pan') setPanFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    let hasInvalidFile = false;
    if (!aadharFrontFile || !isValidFile(aadharFrontFile)) {
      setFileErrors(prev => ({
        ...prev,
        aadharFront: 'Only JPEG, JPG, and PNG files are allowed.',
      }));
      hasInvalidFile = true;
    }
    if (!aadharBackFile || !isValidFile(aadharBackFile)) {
      setFileErrors(prev => ({
        ...prev,
        aadharBack: 'Only JPEG, JPG, and PNG files are allowed.',
      }));
      hasInvalidFile = true;
    }
    if (!panFile || !isValidFile(panFile)) {
      setFileErrors(prev => ({
        ...prev,
        pan: 'Only JPEG, JPG, and PNG files are allowed.',
      }));
      hasInvalidFile = true;
    }

    if (
      !aadharNumber ||
      !aadharFrontFile ||
      !aadharBackFile ||
      !panNumber ||
      !panFile ||
      hasInvalidFile
    ) {
      setMessage('Please fill all fields and upload valid images.');
      setLoading(false);
      return;
    }

    // Compose FormData as expected by backend
    const formData = new FormData();
    formData.append('aadharNumber', aadharNumber.trim());
    formData.append('aadharFrontFile', aadharFrontFile);
    formData.append('aadharBackFile', aadharBackFile);
    formData.append('panNumber', panNumber.trim().toUpperCase());
    formData.append('panFile', panFile);

    try {
      const token = localStorage.getItem('user-token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user/kyc/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: token || '',
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(
          data.message ||
            'KYC documents uploaded successfully! Please wait for verification.'
        );
        setAadharNumber('');
        setAadharFrontFile(null);
        setAadharBackFile(null);
        setPanNumber('');
        setPanFile(null);
        setFileErrors({});
        setTimeout(() => { setRedirect(true); }, 1200);
      } else {
        setMessage(data.message || 'Failed to upload KYC documents.');
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If redirect was triggered after uploading KYC, route away
  if (redirect) {
    window.location.href = '/user';
    return null;
  }

  return (
    <main className="min-h-screen h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-slate-200 flex flex-col items-center px-2 py-8">

      <div className="w-full flex justify-end max-w-7xl mx-auto mb-4">
        <button
          className="inline-flex gap-2 items-center px-5 py-2 rounded-full bg-slate-100 text-gray-700 font-semibold text-sm tracking-wide shadow hover:bg-slate-200 hover:text-blue-700 transition"
          onClick={handleLogout}
          disabled={loading}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Logout
        </button>
      </div>

      <div className='h-full flex justify-center items-center'>
         <section className="bg-white/95  shadow-xl rounded-xl px-8 pt-7 pb-10 w-full max-w-lg flex flex-col items-center border border-slate-100 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-tr from-blue-400 to-blue-700 rounded-full shadow-lg p-3">
          <svg width="40" height="40" className="text-white" fill="none" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 8 1.34 8 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2c0-2.66 5.3-4 8-4zm0-2A4 4 0 1 0 12 4a4 4 0 0 0 0 8z" fill="currentColor"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-blue-800 tracking-tighter mb-1 mt-5 text-center">
          Complete Your KYC
        </h2>
        <p className="text-slate-700 text-sm text-center mb-1">
          Help us verify your identity by uploading below documents.
        </p>
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="inline-block text-xs rounded px-2 py-0.5 bg-blue-100 text-blue-700 font-semibold">
            Only JPG/JPEG/PNG images allowed
          </span>
        </div>
        <form
          className="w-full mt-3 space-y-5"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          autoComplete="off"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Aadhar Number */}
            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1">
                Aadhaar Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={aadharNumber}
                onChange={e =>
                  setAadharNumber(
                    e.target.value.replace(/\D/g, '').slice(0, 12)
                  )
                }
                pattern="\d{12}"
                maxLength={12}
                minLength={12}
                className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 text-blue-900 font-medium placeholder-gray-400"
                disabled={loading}
                required
                placeholder="12-digit Aadhaar"
              />
            </div>
            {/* PAN Number */}
            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                autoComplete="off"
                value={panNumber}
                onChange={e =>
                  setPanNumber(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '')
                      .slice(0, 10)
                  )
                }
                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                maxLength={10}
                minLength={10}
                className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 text-blue-900 font-medium placeholder-gray-400"
                disabled={loading}
                required
                placeholder="ABCDE1234F"
              />
            </div>
          </div>
          {/* Aadhaar Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FileInput
              label="Upload Aadhaar Front"
              accept=".jpg,.jpeg,.png"
              name="aadharFrontFile"
              value={aadharFrontFile}
              error={fileErrors.aadharFront}
              loading={loading}
              onChange={e => handleFileChange(e, 'aadharFront')}
              preview
            />
            <FileInput
              label="Upload Aadhaar Back"
              accept=".jpg,.jpeg,.png"
              name="aadharBackFile"
              value={aadharBackFile}
              error={fileErrors.aadharBack}
              loading={loading}
              onChange={e => handleFileChange(e, 'aadharBack')}
              preview
            />
          </div>
          {/* PAN Card Image */}
          <FileInput
            label="Upload PAN Card"
            accept=".jpg,.jpeg,.png"
            name="panFile"
            value={panFile}
            error={fileErrors.pan}
            loading={loading}
            onChange={e => handleFileChange(e, 'pan')}
            preview
          />

          <button
            type="submit"
            className={`
              w-full py-2.5 rounded-md font-bold text-white 
              bg-gradient-to-tr from-blue-600 via-blue-500 to-blue-800 shadow-md
              text-lg transition hover:from-blue-700 hover:to-blue-900
              flex items-center justify-center
              ${loading ? 'opacity-60 cursor-not-allowed' : ''}
            `}
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white opacity-80"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              >
                <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {loading ? 'Uploading...' : 'Submit KYC'}
          </button>

          {message && (
            <div
              className={`
                mt-2 text-center px-4 py-2 rounded
                border
                ${message.toLowerCase().includes('success')
                  ? 'border-green-200 bg-green-50 text-green-700 font-semibold'
                  : 'border-red-200 bg-red-50 text-red-700 font-semibold'
                }
              `}
            >
              {message}
            </div>
          )}
        </form>
      </section>
      </div>

   
    </main>
  );
};

export default CompleteKYC;