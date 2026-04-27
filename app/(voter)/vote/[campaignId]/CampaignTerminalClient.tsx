"use client"

import { useState, useEffect } from "react"
import { checkVoterCode, initiateSession, getSessionStatus, castVotes, cancelSession } from "./actions"

export function CampaignTerminalClient({ 
  campaignId, 
  terminalName, 
  ip, 
  initialVoterData,
  initialSessionData, 
  initialSessionStatus, 
  initialError, 
  isRegistered
}: any) {
  const [view, setView] = useState<'LOGIN' | 'VERIFY' | 'PENDING' | 'VOTING' | 'REVIEW' | 'SUCCESS' | 'CANCELLED'>(
    initialError ? 'LOGIN' : 
    initialSessionStatus?.status === 'ACTIVE' ? 'VOTING' :
    initialSessionStatus?.status === 'PENDING' ? 'PENDING' :
    initialSessionStatus?.status === 'CANCELLED' ? 'CANCELLED' :
    initialVoterData ? 'VERIFY' : 'LOGIN'
  )

  const [voterData, setVoterData] = useState(initialVoterData)
  const [sessionData, setSessionData] = useState(initialSessionData)
  const [sessionStatus, setSessionStatus] = useState(initialSessionStatus)
  const [error, setError] = useState(initialError)
  const [selections, setSelections] = useState<any[]>([])
  const [electionIdx, setElectionIdx] = useState(0)
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(() => {
    const start = sessionStatus?.createdAt || sessionData?.createdAt;
    if (!start) return 300;
    const passed = Math.floor((Date.now() - new Date(start).getTime()) / 1000);
    return Math.max(0, 300 - passed);
  })

  const isAdminDevice = terminalName && terminalName.toUpperCase().includes("ADMIN");

  // Timer effect
  useEffect(() => {
    if (view === 'VOTING' || view === 'REVIEW') {
      const interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            handleCancel();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [view]);

  // Polling effect
  useEffect(() => {
    if (view === 'PENDING' && sessionData?.sessionId) {
      const interval = setInterval(async () => {
        try {
          const status = await getSessionStatus(sessionData.sessionId);
          if (status.status === 'ACTIVE') {
            setSessionStatus(status);
            setView('VOTING');
          } else if (status.status === 'CANCELLED') {
            setView('CANCELLED');
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [view, sessionData]);

  if (!isRegistered && !isAdminDevice) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center" style={{ fontFamily: 'sans-serif' }}>
        <div style={{ width: '128px', height: '128px', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', border: '4px solid rgba(239, 68, 68, 0.3)' }}>
           <div style={{ fontSize: '64px' }}>🛡️</div>
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 900, color: 'white', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.05em', marginBottom: '16px', margin: 0 }}>Unauthorized Device</h1>
        <p style={{ fontSize: '20px', color: '#94a3b8', fontWeight: 500, maxWidth: '32rem', lineHeight: 1.625, margin: 0 }}>This hardware has not been registered.</p>
        <div style={{ marginTop: '48px', padding: '24px', backgroundColor: '#1e293b', borderRadius: '2rem', border: '1px solid #334155', width: '100%', maxWidth: '24rem' }}>
          <p style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', margin: 0 }}>Device IP Address</p>
          <code style={{ color: '#34d399', fontFamily: 'monospace', fontSize: '20px' }}>{ip}</code>
        </div>
      </div>
    );
  }

  const cleanPath = (p: string) => {
    if (!p) return '';
    let path = p.replace(/\\/g, '/');
    if (path.toLowerCase().indexOf('public') > -1) {
       path = path.substring(path.toLowerCase().indexOf('public') + 6);
    }
    if (path[0] !== '/') path = '/' + path;
    return path;
  };

  const handleLogin = async () => {
    if (pin.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const data = await checkVoterCode(campaignId, pin);
      setVoterData(data);
      setView('VERIFY');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const data = await initiateSession(campaignId, pin);
      setSessionData(data);
      const status = await getSessionStatus(data.sessionId);
      setSessionStatus(status);
      setView(status.status === 'PENDING' ? 'PENDING' : status.status === 'ACTIVE' ? 'VOTING' : 'CANCELLED');
    } catch (e: any) {
      setError(e.message);
      setView('LOGIN');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidateId: string) => {
    const electionId = sessionStatus.elections[electionIdx].id;
    const newSels = selections.filter(s => s.electionId !== electionId);
    newSels.push({ electionId, candidateId });
    setSelections(newSels);

    if (electionIdx < sessionStatus.elections.length - 1) {
      setElectionIdx(electionIdx + 1);
    } else {
      setView('REVIEW');
    }
  };

  const handleCastVote = async () => {
    setLoading(true);
    try {
      await castVotes(sessionData.sessionId, selections);
      setView('SUCCESS');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (sessionData?.sessionId) {
      await cancelSession(sessionData.sessionId);
    }
    window.location.reload();
  };

  const cLogo = cleanPath(voterData?.campaignLogo);
  const vPhoto = cleanPath(voterData?.photo);

  // Helper for Success Timer
  const [successCount, setSuccessCount] = useState(5);
  useEffect(() => {
    if (view === 'SUCCESS') {
      const interval = setInterval(() => {
        setSuccessCount(c => {
          if (c <= 1) {
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [view]);

  if (view === 'SUCCESS') {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '50px', border: '4px solid #ecfdf5', boxShadow: '0 30px 80px rgba(0,0,0,0.05)', maxWidth: '600px', width: '90%' }}>
          <div style={{ fontSize: '120px', marginBottom: '30px' }}>✅</div>
          <h1 style={{ fontSize: '44px', fontWeight: 900, color: '#0f172a', margin: 0 }}>THANK YOU</h1>
          <p style={{ color: '#64748b', fontSize: '22px', marginTop: '20px', fontWeight: 'bold' }}>Your vote has been recorded.</p>
          <div style={{ marginTop: '50px' }}>
             {successCount > 0 ? (
               <p style={{ color: '#94a3b8', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>Terminal will reset in {successCount} seconds...</p>
             ) : (
               <button onClick={() => window.location.reload()} style={{ textDecoration: 'none', padding: '25px 60px', background: '#059669', color: 'white', border: 'none', borderRadius: '20px', fontSize: '28px', fontWeight: 900, boxShadow: '0 10px 0 #047857', cursor: 'pointer' }}>DONE</button>
             )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'CANCELLED') {
    return (
      <div style={{ minHeight: '100vh', background: '#fff1f2', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'white', padding: '15px 50px', borderBottom: '3px solid #fecaca', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {cLogo ? <img src={cLogo} style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }} /> : <div style={{ fontSize: '40px' }}>🗳️</div>}
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{voterData?.campaignName}</h1>
           </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ background: 'white', padding: '50px', borderRadius: '40px', textAlign: 'center', width: '100%', maxWidth: '500px', border: '3px solid #fecaca', boxShadow: '0 20px 50px rgba(225, 29, 72, 0.1)' }}>
             <div style={{ fontSize: '80px', marginBottom: '20px' }}>❌</div>
             <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#e11d48' }}>APPROVAL REJECTED</h1>
             <p style={{ color: '#64748b', fontSize: '18px', marginTop: '15px', fontWeight: 'bold' }}>The Polling Officer has denied your access request.</p>
             <div style={{ marginTop: '30px' }}>
                <button onClick={() => window.location.reload()} style={{ display: 'inline-block', textDecoration: 'none', padding: '15px 40px', background: '#e11d48', color: 'white', borderRadius: '15px', fontWeight: 900, border: 'none', borderBottom: '5px solid #9f1239', cursor: 'pointer' }}>TRY AGAIN</button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'PENDING') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'white', padding: '15px 50px', borderBottom: '3px solid #e2e8f0', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {cLogo ? <img src={cLogo} style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }} /> : <div style={{ fontSize: '40px' }}>🗳️</div>}
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{voterData?.campaignName}</h1>
           </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ background: 'white', padding: '50px', borderRadius: '40px', textAlign: 'center', width: '100%', maxWidth: '500px', border: '3px solid #e2e8f0' }}>
             <div style={{ fontSize: '80px', marginBottom: '20px' }}>⏳</div>
             <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>AWAITING APPROVAL</h1>
             <p style={{ color: '#64748b', fontSize: '18px', marginTop: '15px', fontWeight: 'bold' }}>Waiting for Polling Officer...</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'VOTING' || view === 'REVIEW') {
    const elections = sessionStatus.elections || [];
    const currentElection = elections[electionIdx];

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'white', padding: '15px 40px', borderBottom: '3px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '110px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {cLogo ? <img src={cLogo} style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }} /> : <div style={{ fontSize: '40px' }}>🗳️</div>}
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{voterData?.campaignName}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '6px 15px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', background: '#eee' }}>
                   {vPhoto ? <img src={vPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                </div>
                <div style={{ textAlign: 'left' }}>
                   <p style={{ margin:0, fontSize: '15px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>{voterData?.voterName}</p>
                   <p style={{ margin:0, fontSize: '10px', fontWeight: 800, color: '#64748b' }}>ID: {voterData?.voterId}</p>
                </div>
             </div>
             <div style={{ background: '#0f172a', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, fontSize: '24px', fontFamily: 'monospace' }}>
                {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
             </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {view === 'REVIEW' ? (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h1 style={{ fontSize: '40px', fontWeight: 900, color: '#0f172a', marginBottom: '30px' }}>Review Ballot</h1>
              {elections.map((e: any) => {
                const sel = selections.find(s => s.electionId === e.id);
                const candidate = e.candidates?.find((c: any) => c.id === sel?.candidateId);
                const cPhoto = cleanPath(candidate?.photo);
                return (
                  <div key={e.id} style={{ background: 'white', border: '2px solid #e2e8f0', padding: '15px 25px', borderRadius: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '6px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '10px', background: '#f8fafc', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                        {cPhoto ? <img src={cPhoto} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '👤'}
                      </div>
                      <div>
                        <p style={{ margin:0, fontSize: '10px', fontWeight: 900, color: '#2563eb' }}>{e.name}</p>
                        <h3 style={{ margin:0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>{candidate?.name || '---'}</h3>
                      </div>
                    </div>
                    <div style={{ color: '#059669', fontSize: '24px', fontWeight: 900 }}>✓</div>
                  </div>
                );
              })}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '40px' }}>
                 <button onClick={() => { setElectionIdx(0); setView('VOTING'); }} style={{ padding:'25px', background:'#f1f5f9', color:'#0f172a', borderRadius:'20px', textAlign:'center', fontWeight:900, border:'none', borderBottom:'6px solid #cbd5e1', fontSize: '20px', cursor: 'pointer' }}>EDIT ALL</button>
                 <button onClick={handleCastVote} disabled={loading} style={{ padding:'35px', background:'#059669', color:'white', borderRadius:'30px', textAlign:'center', fontWeight:900, border:'none', borderBottom:'12px solid #047857', fontSize: '32px', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
                   {loading ? 'RECORDING...' : 'CONFIRM & CAST VOTE'}
                 </button>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: '1300px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 900, color: '#2563eb', textTransform: 'uppercase' }}>STEP {electionIdx + 1} OF {elections.length}</p>
                <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: '2px 0' }}>{currentElection.name}</h1>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', flex: 1 }}>
                 {currentElection.candidates.map((c: any) => {
                   const cPhoto = cleanPath(c.photo);
                   return (
                    <button key={c.id} onClick={() => handleSelectCandidate(c.id)} style={{ border: 'none', background: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
                      <div style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: '15px', overflow: 'hidden', height: '100%', borderBottom: '8px solid #cbd5e1', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ aspectRatio: '1.2/1', width: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: '2px solid #f1f5f9' }}>
                           {cPhoto ? <img src={cPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize:'50px' }}>👤</span>}
                        </div>
                        <div style={{ padding: '10px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{c.name}</h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase' }}>{c.party || 'IND'}</p>
                        </div>
                      </div>
                    </button>
                   );
                 })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'VERIFY') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'white', padding: '15px 40px', borderBottom: '3px solid #e2e8f0', height: '110px', display: 'flex', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {cLogo ? <img src={cLogo} style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }} /> : <div style={{ fontSize: '40px' }}>🗳️</div>}
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{voterData?.campaignName}</h1>
           </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '30px', textAlign: 'center', width: '100%', maxWidth: '450px', border: '3px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '160px', height: '160px', background: '#f8fafc', borderRadius: '20px', margin: '0 auto 25px auto', border: '3px solid #f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {vPhoto ? <img src={vPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize:'80px' }}>👤</span>}
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, color: '#0f172a' }}>{voterData.voterName}</h1>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#64748b', marginTop: '5px' }}>VOTER ID: {voterData.voterId}</p>
            <div style={{ marginTop: '35px' }}>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>Is this you?</p>
              <button onClick={handleConfirm} disabled={loading} style={{ width: '100%', border: 'none', display: 'block', textDecoration: 'none', marginTop: '20px', padding: '20px', background: '#059669', color: 'white', borderRadius: '15px', fontSize: '22px', fontWeight: 900, boxShadow: '0 6px 0 #047857', cursor: 'pointer' }}>
                {loading ? 'INITIATING...' : 'YES, IT IS ME'}
              </button>
              <button onClick={() => setView('LOGIN')} style={{ width: '100%', border: 'none', background: 'none', display: 'block', textDecoration: 'none', marginTop: '15px', color: '#ef4444', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>NO, GO BACK</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '80px', fontWeight: 900, color: '#0f172a', margin: 0 }}>DIGITAL <span style={{ color:'#2563eb' }}>EVM</span></h1>
      <p style={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '5px', marginBottom: '30px' }}>SECURE TERMINAL</p>
      <div style={{ background: 'white', padding: '40px', borderRadius: '50px', border: '3px solid #e2e8f0', width: '100%', maxWidth: '450px' }}>
        {error && <p style={{ color:'#ef4444', fontWeight:'bold', textAlign:'center', marginBottom:'20px' }}>{error === 'VOTER_ALREADY_VOTED' ? '❌ You have already cast your vote.' : '⚠️ ' + error}</p>}
        <div style={{ width: '100%', height: '80px', fontSize: '50px', textAlign: 'center', letterSpacing: '15px', borderRadius: '20px', border: '4px solid #e2e8f0', background: '#f8fafc', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {'•'.repeat(pin.length).padEnd(6, ' ')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => setPin(p => (p + n).slice(0, 6))} style={{ height:'80px', fontSize:'32px', fontWeight: 900, borderRadius:'20px', border:'2px solid #e2e8f0', background:'white', borderBottom:'6px solid #cbd5e1', cursor: 'pointer' }}>{n}</button>)}
          <button onClick={() => setPin("")} style={{ height:'80px', fontSize:'32px', fontWeight: 900, borderRadius:'20px', background:'#fff1f2', color:'#ef4444', borderBottom:'8px solid #fecaca', cursor: 'pointer' }}>C</button>
          <button onClick={() => setPin(p => (p + '0').slice(0, 6))} style={{ height:'80px', fontSize:'32px', fontWeight: 900, borderRadius:'20px', border:'2px solid #e2e8f0', background:'white', borderBottom:'6px solid #cbd5e1', cursor: 'pointer' }}>0</button>
          <button onClick={handleLogin} disabled={loading} style={{ height:'80px', background:'#2563eb', color:'white', borderRadius:'20px', fontSize: '28px', fontWeight: 900, border:'none', borderBottom:'10px solid #1e40af', cursor: 'pointer' }}>
            {loading ? '...' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}
