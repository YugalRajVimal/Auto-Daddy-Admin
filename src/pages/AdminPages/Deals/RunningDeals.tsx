// // import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';

// // const API_URL = import.meta.env.VITE_API_URL || '';

// // // Interfaces
// // interface Service {
// //   _id: string;
// //   name: string;
// // }
// // interface Vehicle {
// //   id: string;
// //   name: string;
// //   model: string;
// //   year: string;
// // }
// // interface CreatedBy {
// //   _id: string;
// //   businessName?: string;
// //   businessEmail?: string;
// // }
// // interface RunningDeal {
// //   _id: string;
// //   dealType: string;
// //   serviceId?: Service;
// //   partName?: string;
// //   description: string;
// //   selectedVehicle?: {
// //     id?: Vehicle;
// //     name: string;
// //     model: string;
// //     year: string;
// //   };
// //   discountedPrice: number;
// //   offerEndsOnDate: string;
// //   createdBy: CreatedBy;
// //   dealImage?: string | null;
// // }

// // // Modern Card-based UI Component
// // const RunningDeals: React.FC = () => {
// //   const [deals, setDeals] = useState<RunningDeal[]>([]);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const headerRef = useRef<HTMLDivElement>(null);
// //   const [mainContentMinHeight, setMainContentMinHeight] = useState<string>('100vh');

// //   // Dynamically adjust height for proper scroll
// //   useLayoutEffect(() => {
// //     function onResize() {
// //       const headerHeight = headerRef.current?.offsetHeight || 0;
// //       setMainContentMinHeight(`calc(100vh - ${headerHeight}px)`);
// //     }
// //     onResize();
// //     window.addEventListener('resize', onResize);
// //     return () => window.removeEventListener('resize', onResize);
// //   }, []);

// //   useEffect(() => {
// //     setLoading(true);
// //     setError(null);
// //     fetch(`${API_URL}/api/admin/deals/running`, {
// //       credentials: 'include',
// //       headers: {
// //         'Accept': 'application/json',
// //       },
// //     })
// //       .then(async (res) => {
// //         if (!res.ok) {
// //           const error = await res.json().catch(() => ({}));
// //           throw new Error(error.message || 'Failed to fetch running deals');
// //         }
// //         return res.json();
// //       })
// //       .then((data) => {
// //         setDeals(data.data || []);
// //         setLoading(false);
// //       })
// //       .catch((err: Error) => {
// //         setError(err.message);
// //         setLoading(false);
// //       });
// //   }, []);

// //   return (
// //     <div
// //         // You may use Tailwind class if setup, or fallback to CSS below.
// //         className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans"
      
// //       >
// //       <div ref={headerRef} style={{padding: '32px 24px 0 24px', background:'#f8fafc'}}>
// //         <h2 style={{
// //           fontWeight: 700,
// //           fontSize: '2rem',
// //           marginBottom: 12,
// //           letterSpacing: '-1px',
// //           color: '#1e293b'
// //         }}>
// //           <span style={{
// //             background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
// //             backgroundClip: 'text',
// //             WebkitBackgroundClip: 'text',
// //             color: 'transparent',
// //             WebkitTextFillColor: 'transparent',
// //           }}>Running Deals</span>
// //         </h2>
// //         <p style={{color: '#64748b', marginBottom: '28px'}}>All currently active offers and deals for Auto Shop Owners</p>
// //       </div>
// //       <div
// //       className='mb-10'
// //         style={{
// //           padding: '0 24px 32px 24px',
// //           flex: 1,
// //           minHeight: mainContentMinHeight,
// //           overflowY: 'auto',
          
// //         }}
// //       >
// //         {loading && (
// //           <div style={{
// //             display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px'
// //           }}>
// //             <div className="lds-ring" style={{marginRight: 12}}><div /><div /><div /><div /></div>
// //             <span style={{fontSize: '1.1rem', color:'#334155'}}>Loading running deals...</span>
// //             {/* Spinner animation */}
// //             <style>{`
// //               .lds-ring {
// //                 display: inline-block;
// //                 position: relative;
// //                 width: 32px;
// //                 height: 32px;
// //               }
// //               .lds-ring div {
// //                 box-sizing: border-box;
// //                 display: block;
// //                 position: absolute;
// //                 width: 24px;
// //                 height: 24px;
// //                 margin: 4px;
// //                 border: 3px solid #0ea5e9;
// //                 border-radius: 50%;
// //                 animation: lds-ring 1s linear infinite;
// //                 border-color: #0ea5e9 transparent transparent transparent;
// //               }
// //               .lds-ring div:nth-child(1) {
// //                 animation-delay: -0.45s;
// //               }
// //               .lds-ring div:nth-child(2) {
// //                 animation-delay: -0.3s;
// //               }
// //               .lds-ring div:nth-child(3) {
// //                 animation-delay: -0.15s;
// //               }
// //               @keyframes lds-ring {
// //                 0% { transform: rotate(0deg); }
// //                 100% { transform: rotate(360deg); }
// //               }
// //             `}</style>
// //           </div>
// //         )}
// //         {error && <div style={{
// //           backgroundColor:'#fee2e2', color: '#b91c1c', padding: '16px', borderRadius:8, marginBottom: 18
// //         }}>Error: {error}</div>}
// //         {!loading && !error && deals.length === 0 && (
// //           <div style={{
// //             background:'#f1f5f9',
// //             color:'#475569',
// //             border: '1px dashed #81e6d9',
// //             padding: 32,
// //             textAlign:'center',
// //             borderRadius:16,
// //             fontSize: '1.2rem'
// //           }}>
// //             No running deals found.
// //           </div>
// //         )}

// //         {!loading && !error && deals.length > 0 && (
// //           <div style={{
// //             display:'grid',
// //             gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))',
// //             gap: '32px',
// //           }}>
// //             {deals.map((deal) => (
// //               <div key={deal._id} style={{
// //                 background:'#fff',
// //                 borderRadius: '16px',
// //                 boxShadow: '0 2px 16px rgba(20,40,80,.08)',
// //                 overflow:'hidden',
// //                 display: 'flex',
// //                 flexDirection: 'column',
// //                 minHeight: 380,
// //                 transition: 'box-shadow 0.2s',
// //                 border: '1px solid #e2e8f0'
// //               }}>
// //                 <div style={{
// //                   height: 170,
// //                   background:'#f1f5f9',
// //                   display: 'flex',
// //                   alignItems: 'center', 
// //                   justifyContent: 'center'
// //                 }}>
// //                   {deal.dealImage ? (
// //                     <img
// //                       src={
// //                         deal.dealImage.startsWith('http')
// //                           ? deal.dealImage
// //                           : `${API_URL}/${deal.dealImage.replace(/^\/+/, '')}`
// //                       }
// //                       alt="deal"
// //                       style={{
// //                         width: '100%',
// //                         maxHeight: 170,
// //                         objectFit: 'cover',
// //                         borderBottom: '1px solid #e2e8f0'
// //                       }}
// //                     />
// //                   ) : (
// //                     <span style={{
// //                       color:'#94a3b8', fontSize:'1.5rem'
// //                     }}>No Image</span>
// //                   )}
// //                 </div>
// //                 <div style={{
// //                   flex:1,
// //                   display: 'flex',
// //                   flexDirection:'column',
// //                   padding: '24px 20px'
// //                 }}>
// //                   <div style={{
// //                     display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6
// //                   }}>
// //                     <span style={{
// //                       background: deal.dealType === 'Service' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.11)',
// //                       color: deal.dealType === 'Service' ? '#0f766e' : '#2563eb',
// //                       padding: '4px 13px',
// //                       borderRadius: '999px',
// //                       fontSize: '0.92rem',
// //                       fontWeight: 600,
// //                       letterSpacing: '.5px'
// //                     }}>{deal.dealType}</span>
// //                     <span style={{
// //                       color:'#64748b', fontSize:'0.97em',
// //                       fontWeight:400
// //                     }}>
// //                       {deal.dealType === 'Service'
// //                         ? (deal.serviceId as Service)?.name
// //                         : deal.partName}
// //                     </span>
// //                   </div>
// //                   <div style={{marginBottom: 10, color:'#334155', fontWeight:600}} title={deal.description}>
// //                     {deal.description.length > 70 ? `${deal.description.slice(0,67)}...` : deal.description}
// //                   </div>
// //                   <div style={{display:'flex', gap:12, flexWrap:'wrap', marginBottom:10}}>
// //                     <div style={{color:'#64748b', fontSize:'0.99em', marginRight:12}}>
// //                       <span style={{fontWeight:600, color:'#0e7490'}}>Vehicle:</span>{' '}
// //                       {deal.selectedVehicle
// //                         ? `${deal.selectedVehicle.name} ${deal.selectedVehicle.model} ${deal.selectedVehicle.year}`
// //                         : <span style={{color:'#cbd5e1'}}>Any</span>}
// //                     </div>
// //                     <div style={{color:'#64748b', fontSize:'0.99em'}}>
// //                       <span style={{fontWeight:600, color:'#f59e42'}}>Ends:</span>{' '}
// //                       {new Date(deal.offerEndsOnDate).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}
// //                     </div>
// //                   </div>
// //                   <div style={{
// //                     display:'flex', alignItems:'center', gap: 8, marginBottom: 15
// //                   }}>
// //                     <div style={{
// //                       background:'#ecfeff',
// //                       color:'#0ea5e9',
// //                       fontWeight:700,
// //                       fontSize:'1.28em',
// //                       padding:'3px 15px',
// //                       borderRadius: 10,
// //                       border: '1px solid #bae6fd',
// //                       letterSpacing:'.5px'
// //                     }} title={"Discounted Price"}>
// //                       ${deal.discountedPrice}
// //                     </div>
// //                   </div>
// //                   <div style={{
// //                     display: 'flex',
// //                     alignItems: 'flex-start',
// //                     gap: 8,
// //                     marginTop: 'auto'
// //                   }}>
// //                     <div style={{
// //                       flex:1,
// //                       padding: 0,
// //                       borderTop: '1px solid #e2e8f0',
// //                       marginTop: 10
// //                     }}>
// //                       <div style={{
// //                         marginTop: 7,
// //                         fontWeight: 500,
// //                         color: '#16a34a',
// //                         fontSize: '1em',
// //                         display:'flex',
// //                         alignItems:'center',
// //                         gap: 4,
// //                       }}>
// //                         <svg width={18} height={18} viewBox="0 0 20 20" fill="none" style={{marginRight:2}}>
// //                           <circle cx="10" cy="10" r="9" fill="#bbf7d0" />
// //                           <path d="M7.5 10.5L9.5 12.5L13 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
// //                         </svg>
// //                         <span>
// //                           {deal.createdBy.businessName || 'Business'}
// //                         </span>
// //                       </div>
// //                       <div style={{
// //                         color:'#64748b', fontSize: '0.97em',
// //                         marginTop:'2px'
// //                       }}>
// //                         {deal.createdBy.businessEmail
// //                           ? <span>{deal.createdBy.businessEmail}</span>
// //                           : <span>ID: {deal.createdBy._id}</span>
// //                         }
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default RunningDeals;

// import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';

// const API_URL = import.meta.env.VITE_API_URL || '';

// // Interfaces
// interface Service {
//   _id: string;
//   name: string;
// }
// interface Vehicle {
//   id: string;
//   name: string;
//   model: string;
//   year: string;
// }
// interface CreatedBy {
//   _id: string;
//   businessName?: string;
//   businessEmail?: string;
// }
// interface RunningDeal {
//   _id: string;
//   dealType: string;
//   serviceId?: Service;
//   partName?: string;
//   description: string;
//   selectedVehicle?: {
//     id?: Vehicle;
//     name: string;
//     model: string;
//     year: string;
//   };
//   discountedPrice: number;
//   offerEndsOnDate: string;
//   createdBy: CreatedBy;
//   dealImage?: string | null;
// }

// const RunningDeals: React.FC = () => {
//   const [deals, setDeals] = useState<RunningDeal[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const headerRef = useRef<HTMLDivElement>(null);
//   const [mainContentMinHeight, setMainContentMinHeight] = useState<string>('100vh');

//   useLayoutEffect(() => {
//     function onResize() {
//       const headerHeight = headerRef.current?.offsetHeight || 0;
//       setMainContentMinHeight(`calc(100vh - ${headerHeight}px)`);
//     }
//     onResize();
//     window.addEventListener('resize', onResize);
//     return () => window.removeEventListener('resize', onResize);
//   }, []);

//   useEffect(() => {
//     setLoading(true);
//     setError(null);
//     fetch(`${API_URL}/api/admin/deals/running`, {
//       credentials: 'include',
//       headers: { 'Accept': 'application/json' },
//     })
//       .then(async (res) => {
//         if (!res.ok) {
//           const error = await res.json().catch(() => ({}));
//           throw new Error(error.message || 'Failed to fetch running deals');
//         }
//         return res.json();
//       })
//       .then((data) => {
//         setDeals(data.data || []);
//         setLoading(false);
//       })
//       .catch((err: Error) => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, []);

//   return (
//     <div className="min-h-screen bg-[#ecf0f5] p-5">
//       {/* Heading */}
//       <div ref={headerRef}>
//         <h1 className="mb-1 text-[52px] font-light text-[#333]">Running Deals</h1>
//         <p className="mb-6 text-[15px] text-[#777]">
//           All currently active offers and deals for Auto Shop Owners
//         </p>
//       </div>

//       {/* Card */}
//       <div className="overflow-hidden rounded border border-[#d2d6de] bg-white shadow-sm">
//         {/* Header */}
//         <div className="border-b border-[#f4f4f4] px-6 py-4">
//           <h3 className="text-[18px] font-normal text-[#444]">Deals List</h3>
//         </div>

//         {/* Body */}
//         <div className="p-6" style={{ minHeight: mainContentMinHeight }}>
//           {loading && (
//             <div className="flex items-center justify-center py-10">
//               <div className="lds-ring mr-3"><div /><div /><div /><div /></div>
//               <span className="text-[16px] text-[#555]">Loading running deals...</span>
//               <style>{`
//                 .lds-ring {
//                   display: inline-block;
//                   position: relative;
//                   width: 32px;
//                   height: 32px;
//                 }
//                 .lds-ring div {
//                   box-sizing: border-box;
//                   display: block;
//                   position: absolute;
//                   width: 24px;
//                   height: 24px;
//                   margin: 4px;
//                   border: 3px solid #007bff;
//                   border-radius: 50%;
//                   animation: lds-ring 1s linear infinite;
//                   border-color: #007bff transparent transparent transparent;
//                 }
//                 .lds-ring div:nth-child(1) { animation-delay: -0.45s; }
//                 .lds-ring div:nth-child(2) { animation-delay: -0.3s; }
//                 .lds-ring div:nth-child(3) { animation-delay: -0.15s; }
//                 @keyframes lds-ring {
//                   0% { transform: rotate(0deg); }
//                   100% { transform: rotate(360deg); }
//                 }
//               `}</style>
//             </div>
//           )}

//           {error && (
//             <div className="rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-3 text-[#721c24]">
//               Error: {error}
//             </div>
//           )}

//           {!loading && !error && deals.length === 0 && (
//             <div className="rounded border border-dashed border-[#d2d6de] bg-[#f9fafc] p-10 text-center text-[17px] text-[#777]">
//               No running deals found.
//             </div>
//           )}

//           {!loading && !error && deals.length > 0 && (
//             <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))' }}>
//               {deals.map((deal) => (
//                 <div
//                   key={deal._id}
//                   className="flex flex-col overflow-hidden rounded border border-[#d2d6de] bg-white shadow-sm"
//                   style={{ minHeight: 380 }}
//                 >
//                   {/* Image */}
//                   <div className="flex h-[170px] items-center justify-center border-b border-[#d2d6de] bg-[#f9fafc]">
//                     {deal.dealImage ? (
//                       <img
//                         src={
//                           deal.dealImage.startsWith('http')
//                             ? deal.dealImage
//                             : `${API_URL}/${deal.dealImage.replace(/^\/+/, '')}`
//                         }
//                         alt="deal"
//                         className="h-full w-full object-cover"
//                       />
//                     ) : (
//                       <span className="text-[1.3rem] text-[#aaa]">No Image</span>
//                     )}
//                   </div>

//                   {/* Body */}
//                   <div className="flex flex-1 flex-col p-5">
//                     {/* Type + Service/Part */}
//                     <div className="mb-2 flex flex-wrap items-center gap-2">
//                       <span
//                         className={`rounded-full px-3 py-1 text-[13px] font-bold ${
//                           deal.dealType === 'Service'
//                             ? 'bg-[#28a745]/15 text-[#1c7430]'
//                             : 'bg-[#007bff]/15 text-[#0056b3]'
//                         }`}
//                       >
//                         {deal.dealType}
//                       </span>
//                       <span className="text-[14px] text-[#777]">
//                         {deal.dealType === 'Service'
//                           ? (deal.serviceId as Service)?.name
//                           : deal.partName}
//                       </span>
//                     </div>

//                     {/* Description */}
//                     <div className="mb-3 font-bold text-[#333]" title={deal.description}>
//                       {deal.description.length > 70 ? `${deal.description.slice(0, 67)}...` : deal.description}
//                     </div>

//                     {/* Vehicle / Ends */}
//                     <div className="mb-3 flex flex-wrap gap-4 text-[14px] text-[#777]">
//                       <div>
//                         <span className="font-bold text-[#17a2b8]">Vehicle:</span>{' '}
//                         {deal.selectedVehicle
//                           ? `${deal.selectedVehicle.name} ${deal.selectedVehicle.model} ${deal.selectedVehicle.year}`
//                           : <span className="text-[#bbb]">Any</span>}
//                       </div>
//                       <div>
//                         <span className="font-bold text-[#ffc107]">Ends:</span>{' '}
//                         {new Date(deal.offerEndsOnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
//                       </div>
//                     </div>

//                     {/* Price */}
//                     <div className="mb-4">
//                       <span
//                         className="inline-block rounded border border-[#bae6fd] bg-[#ecfeff] px-4 py-1 text-[1.2em] font-bold text-[#007bff]"
//                         title="Discounted Price"
//                       >
//                         ${deal.discountedPrice}
//                       </span>
//                     </div>

//                     {/* Created By */}
//                     <div className="mt-auto border-t border-[#f4f4f4] pt-3">
//                       <div className="flex items-center gap-2 font-bold text-[#28a745]">
//                         <svg width={18} height={18} viewBox="0 0 20 20" fill="none">
//                           <circle cx="10" cy="10" r="9" fill="#bbf7d0" />
//                           <path d="M7.5 10.5L9.5 12.5L13 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
//                         </svg>
//                         <span>{deal.createdBy.businessName || 'Business'}</span>
//                       </div>
//                       <div className="mt-1 text-[14px] text-[#777]">
//                         {deal.createdBy.businessEmail
//                           ? <span>{deal.createdBy.businessEmail}</span>
//                           : <span>ID: {deal.createdBy._id}</span>}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RunningDeals;

import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Interfaces
interface Service {
  _id: string;
  name: string;
}
interface Vehicle {
  id: string;
  name: string;
  model: string;
  year: string;
}
interface CreatedBy {
  _id: string;
  businessName?: string;
  businessEmail?: string;
}
interface RunningDeal {
  _id: string;
  dealType: string;
  serviceId?: Service;
  partName?: string;
  description: string;
  selectedVehicle?: {
    id?: Vehicle;
    name: string;
    model: string;
    year: string;
  };
  discountedPrice: number;
  offerEndsOnDate: string;
  createdBy: CreatedBy;
  dealImage?: string | null;
}

const RunningDeals: React.FC = () => {
  const [deals, setDeals] = useState<RunningDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/admin/deals/running`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || 'Failed to fetch running deals');
        }
        return res.json();
      })
      .then((data) => {
        setDeals(data.data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
<div
        // You may use Tailwind class if setup, or fallback to CSS below.
        className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans"
      
      >
      {/* Heading */}
      <h1 className="mb-1 text-[52px] font-light text-[#333]">Running Deals</h1>
      <p className="mb-6 text-[15px] text-[#777]">
        All currently active offers and deals for Auto Shop Owners
      </p>

      {/* Card */}
      <div className="mb-10 overflow-hidden rounded border border-[#d2d6de] bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-[#f4f4f4] px-6 py-4">
          <h3 className="text-[18px] font-normal text-[#444]">Deals List</h3>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="lds-ring mr-3"><div /><div /><div /><div /></div>
              <span className="text-[16px] text-[#555]">Loading running deals...</span>
              <style>{`
                .lds-ring {
                  display: inline-block;
                  position: relative;
                  width: 32px;
                  height: 32px;
                }
                .lds-ring div {
                  box-sizing: border-box;
                  display: block;
                  position: absolute;
                  width: 24px;
                  height: 24px;
                  margin: 4px;
                  border: 3px solid #007bff;
                  border-radius: 50%;
                  animation: lds-ring 1s linear infinite;
                  border-color: #007bff transparent transparent transparent;
                }
                .lds-ring div:nth-child(1) { animation-delay: -0.45s; }
                .lds-ring div:nth-child(2) { animation-delay: -0.3s; }
                .lds-ring div:nth-child(3) { animation-delay: -0.15s; }
                @keyframes lds-ring {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {error && (
            <div className="rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-3 text-[#721c24]">
              Error: {error}
            </div>
          )}

          {!loading && !error && deals.length === 0 && (
            <div className="rounded border border-dashed border-[#d2d6de] bg-[#f9fafc] p-10 text-center text-[17px] text-[#777]">
              No running deals found.
            </div>
          )}

          {!loading && !error && deals.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Image</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Type</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Service / Part</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Description</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Vehicle</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Price</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Ends On</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => (
                      <tr key={deal._id}>
                        <td className="border border-[#d2d6de] px-4 py-5">
                          {deal.dealImage ? (
                            <img
                              src={
                                deal.dealImage.startsWith('http')
                                  ? deal.dealImage
                                  : `${API_URL}/${deal.dealImage.replace(/^\/+/, '')}`
                              }
                              alt="deal"
                              className="h-14 w-20 rounded border border-[#f1f5f9] object-cover"
                            />
                          ) : (
                            <span className="italic text-[#bbb]">No Image</span>
                          )}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5">
                          <span
                            className={`inline-block rounded px-3 py-1 text-xs font-bold ${
                              deal.dealType === 'Service'
                                ? 'bg-[#28a745] text-white'
                                : 'bg-[#007bff] text-white'
                            }`}
                          >
                            {deal.dealType}
                          </span>
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5">
                          {deal.dealType === 'Service'
                            ? (deal.serviceId as Service)?.name || '-'
                            : deal.partName || '-'}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5 max-w-[260px]" title={deal.description}>
                          {deal.description.length > 70 ? `${deal.description.slice(0, 67)}...` : deal.description}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5">
                          {deal.selectedVehicle
                            ? `${deal.selectedVehicle.name} ${deal.selectedVehicle.model} ${deal.selectedVehicle.year}`
                            : <span className="text-[#bbb]">Any</span>}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5 font-bold text-[#007bff]">
                          ${deal.discountedPrice}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5">
                          {new Date(deal.offerEndsOnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5">
                          <div className="font-bold text-[#28a745]">{deal.createdBy.businessName || 'Business'}</div>
                          <div className="text-[13px] text-[#777]">
                            {deal.createdBy.businessEmail || `ID: ${deal.createdBy._id}`}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-[15px] text-[#333]">
                  Showing 1 to {deals.length} of {deals.length} entries
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunningDeals;