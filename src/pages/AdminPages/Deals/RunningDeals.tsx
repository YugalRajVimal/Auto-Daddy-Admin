import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';

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

// Modern Card-based UI Component
const RunningDeals: React.FC = () => {
  const [deals, setDeals] = useState<RunningDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [mainContentMinHeight, setMainContentMinHeight] = useState<string>('100vh');

  // Dynamically adjust height for proper scroll
  useLayoutEffect(() => {
    function onResize() {
      const headerHeight = headerRef.current?.offsetHeight || 0;
      setMainContentMinHeight(`calc(100vh - ${headerHeight}px)`);
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/admin/deals/running`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
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
      style={{
        padding: '0',
        maxWidth: 1300,
        margin: '0 auto',
        background: '#f8fafc',
        minHeight: '80vh',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
      overflow: 'hidden',
 
     
 
      }}
    >
      <div ref={headerRef} style={{padding: '32px 24px 0 24px', background:'#f8fafc'}}>
        <h2 style={{
          fontWeight: 700,
          fontSize: '2rem',
          marginBottom: 12,
          letterSpacing: '-1px',
          color: '#1e293b'
        }}>
          <span style={{
            background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
          }}>Running Deals</span>
        </h2>
        <p style={{color: '#64748b', marginBottom: '28px'}}>All currently active offers and deals for Auto Shop Owners</p>
      </div>
      <div
        style={{
          padding: '0 24px 32px 24px',
          flex: 1,
          minHeight: mainContentMinHeight,
          overflowY: 'auto',
          
        }}
      >
        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px'
          }}>
            <div className="lds-ring" style={{marginRight: 12}}><div /><div /><div /><div /></div>
            <span style={{fontSize: '1.1rem', color:'#334155'}}>Loading running deals...</span>
            {/* Spinner animation */}
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
                border: 3px solid #0ea5e9;
                border-radius: 50%;
                animation: lds-ring 1s linear infinite;
                border-color: #0ea5e9 transparent transparent transparent;
              }
              .lds-ring div:nth-child(1) {
                animation-delay: -0.45s;
              }
              .lds-ring div:nth-child(2) {
                animation-delay: -0.3s;
              }
              .lds-ring div:nth-child(3) {
                animation-delay: -0.15s;
              }
              @keyframes lds-ring {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        {error && <div style={{
          backgroundColor:'#fee2e2', color: '#b91c1c', padding: '16px', borderRadius:8, marginBottom: 18
        }}>Error: {error}</div>}
        {!loading && !error && deals.length === 0 && (
          <div style={{
            background:'#f1f5f9',
            color:'#475569',
            border: '1px dashed #81e6d9',
            padding: 32,
            textAlign:'center',
            borderRadius:16,
            fontSize: '1.2rem'
          }}>
            No running deals found.
          </div>
        )}

        {!loading && !error && deals.length > 0 && (
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '32px',
          }}>
            {deals.map((deal) => (
              <div key={deal._id} style={{
                background:'#fff',
                borderRadius: '16px',
                boxShadow: '0 2px 16px rgba(20,40,80,.08)',
                overflow:'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 380,
                transition: 'box-shadow 0.2s',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  height: 170,
                  background:'#f1f5f9',
                  display: 'flex',
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  {deal.dealImage ? (
                    <img
                      src={
                        deal.dealImage.startsWith('http')
                          ? deal.dealImage
                          : `${API_URL}/${deal.dealImage.replace(/^\/+/, '')}`
                      }
                      alt="deal"
                      style={{
                        width: '100%',
                        maxHeight: 170,
                        objectFit: 'cover',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    />
                  ) : (
                    <span style={{
                      color:'#94a3b8', fontSize:'1.5rem'
                    }}>No Image</span>
                  )}
                </div>
                <div style={{
                  flex:1,
                  display: 'flex',
                  flexDirection:'column',
                  padding: '24px 20px'
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6
                  }}>
                    <span style={{
                      background: deal.dealType === 'Service' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.11)',
                      color: deal.dealType === 'Service' ? '#0f766e' : '#2563eb',
                      padding: '4px 13px',
                      borderRadius: '999px',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      letterSpacing: '.5px'
                    }}>{deal.dealType}</span>
                    <span style={{
                      color:'#64748b', fontSize:'0.97em',
                      fontWeight:400
                    }}>
                      {deal.dealType === 'Service'
                        ? (deal.serviceId as Service)?.name
                        : deal.partName}
                    </span>
                  </div>
                  <div style={{marginBottom: 10, color:'#334155', fontWeight:600}} title={deal.description}>
                    {deal.description.length > 70 ? `${deal.description.slice(0,67)}...` : deal.description}
                  </div>
                  <div style={{display:'flex', gap:12, flexWrap:'wrap', marginBottom:10}}>
                    <div style={{color:'#64748b', fontSize:'0.99em', marginRight:12}}>
                      <span style={{fontWeight:600, color:'#0e7490'}}>Vehicle:</span>{' '}
                      {deal.selectedVehicle
                        ? `${deal.selectedVehicle.name} ${deal.selectedVehicle.model} ${deal.selectedVehicle.year}`
                        : <span style={{color:'#cbd5e1'}}>Any</span>}
                    </div>
                    <div style={{color:'#64748b', fontSize:'0.99em'}}>
                      <span style={{fontWeight:600, color:'#f59e42'}}>Ends:</span>{' '}
                      {new Date(deal.offerEndsOnDate).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}
                    </div>
                  </div>
                  <div style={{
                    display:'flex', alignItems:'center', gap: 8, marginBottom: 15
                  }}>
                    <div style={{
                      background:'#ecfeff',
                      color:'#0ea5e9',
                      fontWeight:700,
                      fontSize:'1.28em',
                      padding:'3px 15px',
                      borderRadius: 10,
                      border: '1px solid #bae6fd',
                      letterSpacing:'.5px'
                    }} title={"Discounted Price"}>
                      ${deal.discountedPrice}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginTop: 'auto'
                  }}>
                    <div style={{
                      flex:1,
                      padding: 0,
                      borderTop: '1px solid #e2e8f0',
                      marginTop: 10
                    }}>
                      <div style={{
                        marginTop: 7,
                        fontWeight: 500,
                        color: '#16a34a',
                        fontSize: '1em',
                        display:'flex',
                        alignItems:'center',
                        gap: 4,
                      }}>
                        <svg width={18} height={18} viewBox="0 0 20 20" fill="none" style={{marginRight:2}}>
                          <circle cx="10" cy="10" r="9" fill="#bbf7d0" />
                          <path d="M7.5 10.5L9.5 12.5L13 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span>
                          {deal.createdBy.businessName || 'Business'}
                        </span>
                      </div>
                      <div style={{
                        color:'#64748b', fontSize: '0.97em',
                        marginTop:'2px'
                      }}>
                        {deal.createdBy.businessEmail
                          ? <span>{deal.createdBy.businessEmail}</span>
                          : <span>ID: {deal.createdBy._id}</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RunningDeals;