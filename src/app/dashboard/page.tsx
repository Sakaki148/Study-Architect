'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StudySession } from '@/types';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndSessions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }
      
      setUser(session.user);

      try {
        const response = await fetch(`/api/sessions?userId=${session.user.id}`);
        const data = await response.json();
        
        if (response.ok) {
          const sorted = (data.sessions || []).sort((a: StudySession, b: StudySession) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setSessions(sorted);
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndSessions();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const totalDocuments = sessions.reduce((acc, sess) => acc + (sess.materials?.length || 0), 0);
  const totalFlashcards = sessions.reduce((acc, sess) => acc + (sess.flashcards?.length || 0), 0);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid #3d3d3d', borderTopColor: '#f9f9f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Mono:wght@300;400;500&display=swap');

        .dashboard-container {
          --ink-900: #0a0a0a;
          --ink-800: #111111;
          --ink-700: #1a1a1a;
          --ink-600: #242424;
          --ink-500: #2e2e2e;
          --ink-400: #3d3d3d;
          --ink-300: #5a5a5a;
          --ink-200: #888888;
          --ink-100: #b8b8b8;
          --ink-50:  #d8d8d8;
          --ink-10:  #f0f0f0;
          --white: #f9f9f7;
          --rule: 1px solid rgba(255,255,255,0.07);

          background: var(--ink-900);
          color: var(--ink-10);
          font-family: 'DM Mono', monospace;
          font-weight: 300;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        .dashboard-container *, .dashboard-container *::before, .dashboard-container *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Noise texture overlay ── */
        .dashboard-container::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1000;
          opacity: 0.4;
        }

        .dash-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 64px;
          border-bottom: var(--rule);
          background: rgba(10,10,10,0.95);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 100;
          animation: slideDown 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .brand-icon {
          width: 28px;
          height: 28px;
          border: 1.5px solid var(--ink-200);
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .brand-icon::before {
          content: '';
          position: absolute;
          inset: 3px;
          border: 1px solid var(--ink-50);
          border-radius: 2px;
          opacity: 0.5;
        }

        .brand-icon::after {
          content: '';
          position: absolute;
          width: 60%;
          height: 1.5px;
          background: var(--white);
          box-shadow: 0 4px 0 var(--ink-100), 0 8px 0 var(--ink-200);
          top: 9px;
          border-radius: 1px;
        }

        .brand-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: var(--white);
        }

        .brand-name span {
          color: var(--ink-200);
          font-weight: 300;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .nav-email {
          font-size: 11px;
          color: var(--ink-200);
          letter-spacing: 0.06em;
        }

        .btn-signout {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: var(--ink-100);
          background: transparent;
          border: 1px solid var(--ink-400);
          border-radius: 4px;
          padding: 6px 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
        }

        .btn-signout:hover {
          border-color: var(--ink-100);
          color: var(--white);
          background: var(--ink-700);
        }

        .btn-signout svg { width: 12px; height: 12px; opacity: 0.7; }

        .dash-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 56px 40px 80px;
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s both;
          position: relative;
          z-index: 1;
        }

        @keyframes fadeUp {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 48px;
          gap: 24px;
        }

        .page-eyebrow {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-300);
          margin-bottom: 8px;
        }

        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          font-weight: 300;
          line-height: 1;
          color: var(--white);
          letter-spacing: -0.01em;
        }

        .page-subtitle {
          margin-top: 8px;
          font-size: 12px;
          color: var(--ink-200);
          letter-spacing: 0.04em;
        }

        .btn-upload {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-900);
          background: var(--white);
          border: none;
          border-radius: 6px;
          padding: 14px 24px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
          text-decoration: none;
        }

        .btn-upload::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.06) 100%);
        }

        .btn-upload:hover {
          background: var(--ink-10);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }

        .btn-upload:active { transform: translateY(0); }
        .btn-upload svg { width: 14px; height: 14px; }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--ink-600);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 32px;
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s both;
        }

        @media (max-width: 768px) {
          .stats-row {
            grid-template-columns: 1fr;
          }
          .page-header {
            flex-direction: column;
          }
        }

        .stat-card {
          background: var(--ink-800);
          padding: 24px 28px;
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
        }

        .stat-card:hover { background: var(--ink-700); }

        .stat-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-300);
          margin-bottom: 10px;
        }

        .stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 300;
          color: var(--white);
          line-height: 1;
        }

        .stat-sub {
          margin-top: 4px;
          font-size: 11px;
          color: var(--ink-300);
          letter-spacing: 0.04em;
        }

        .stat-card::after {
          content: '';
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          border: 1px solid var(--ink-500);
          border-radius: 50%;
          opacity: 0.5;
        }

        .empty-card {
          border: 1px solid var(--ink-600);
          border-radius: 10px;
          background: var(--ink-800);
          padding: 80px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both;
        }

        .empty-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .empty-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 60% at 50% 50%, transparent 40%, var(--ink-800) 100%);
          pointer-events: none;
        }

        .empty-icon-wrap {
          position: relative;
          z-index: 1;
          margin-bottom: 28px;
        }

        .empty-icon-outer {
          width: 72px;
          height: 72px;
          border: 1px solid var(--ink-500);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--ink-700);
          position: relative;
          animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.04); }
          50%       { box-shadow: 0 0 0 12px rgba(255,255,255,0); }
        }

        .empty-icon-outer svg {
          width: 28px;
          height: 28px;
          color: var(--ink-100);
        }

        .empty-title {
          position: relative;
          z-index: 1;
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 400;
          color: var(--white);
          margin-bottom: 12px;
          letter-spacing: 0.01em;
        }

        .empty-desc {
          position: relative;
          z-index: 1;
          font-size: 12px;
          color: var(--ink-200);
          letter-spacing: 0.04em;
          line-height: 1.8;
          max-width: 340px;
          margin-bottom: 36px;
        }

        .btn-cta {
          position: relative;
          z-index: 1;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--white);
          background: transparent;
          border: 1px solid var(--ink-400);
          border-radius: 6px;
          padding: 13px 32px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .btn-cta::after {
          content: '→';
          font-size: 14px;
          transition: transform 0.2s ease;
        }

        .btn-cta:hover {
          border-color: var(--ink-50);
          color: var(--white);
          background: var(--ink-700);
        }

        .btn-cta:hover::after { transform: translateX(4px); }

        .feature-pills {
          display: flex;
          gap: 8px;
          margin-top: 48px;
          flex-wrap: wrap;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-300);
          border: 1px solid var(--ink-600);
          border-radius: 100px;
          padding: 6px 14px;
          background: var(--ink-800);
        }

        .pill-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--ink-300);
        }

        .footer-rule {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 56px;
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.45s both;
        }

        .footer-rule::before,
        .footer-rule::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--ink-600);
        }

        .footer-text {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-400);
          white-space: nowrap;
        }

        .sessions-list-title {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-300);
          margin-bottom: 16px;
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both;
        }

        .sessions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s both;
        }

        .session-card {
          border: 1px solid var(--ink-600);
          border-radius: 8px;
          background: var(--ink-800);
          padding: 24px;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .session-card:hover {
          border-color: var(--ink-400);
          background: var(--ink-700);
          transform: translateY(-2px);
        }

        .session-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .session-icon {
          width: 32px;
          height: 32px;
          border: 1px solid var(--ink-500);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--ink-700);
          color: var(--ink-200);
        }

        .session-date {
          font-size: 10px;
          letter-spacing: 0.08em;
          color: var(--ink-300);
          text-transform: uppercase;
        }

        .session-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 400;
          color: var(--white);
          margin-bottom: 8px;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .session-meta {
          font-size: 11px;
          color: var(--ink-300);
          letter-spacing: 0.04em;
          margin-bottom: 24px;
        }

        .session-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--ink-600);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .session-status {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a8b09b; /* Subtle green for ready */
          border: 1px solid rgba(168, 176, 155, 0.3);
          background: rgba(168, 176, 155, 0.05);
          padding: 4px 10px;
          border-radius: 100px;
        }

        .session-arrow {
          color: var(--ink-300);
          transition: transform 0.2s, color 0.2s;
        }

        .session-card:hover .session-arrow {
          transform: translateX(4px);
          color: var(--white);
        }
      `}} />

      <nav className="dash-nav">
        <Link className="nav-brand" href="/">
          <div className="brand-icon"></div>
          <span className="brand-name">Zylo</span>
        </Link>
        <div className="nav-right">
          <span className="nav-email">{user?.email}</span>
          <button className="btn-signout" onClick={handleSignOut}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"/>
            </svg>
            Sign Out
          </button>
        </div>
      </nav>

      <main className="dash-main">
        <div className="page-header">
          <div className="page-title-group">
            <p className="page-eyebrow">Overview</p>
            <h1 className="page-title">Your Dashboard</h1>
            <p className="page-subtitle">Manage your study materials and past sessions.</p>
          </div>
          <Link href="/upload" className="btn-upload">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 11V3M4.5 6.5L8 3l3.5 3.5M2 13h12"/>
            </svg>
            Upload New Files
          </Link>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <p className="stat-label">Study Sessions</p>
            <p className="stat-value">{sessions.length}</p>
            <p className="stat-sub">{sessions.length === 0 ? 'No sessions yet' : 'Total active'}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Documents</p>
            <p className="stat-value">{totalDocuments}</p>
            <p className="stat-sub">{sessions.length === 0 ? 'Upload to begin' : 'Processed files'}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Flashcards</p>
            <p className="stat-value">{totalFlashcards}</p>
            <p className="stat-sub">Generated automatically</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon-wrap">
              <div className="empty-icon-outer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6M9 16h6M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2M9 4a2 2 0 002 2h2a2 2 0 002-2M9 4a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
            </div>

            <h2 className="empty-title">No study sessions yet</h2>
            <p className="empty-desc">
              Upload your first PDF or document to generate AI-powered notes, quizzes, and flashcards tailored to your material.
            </p>

            <Link href="/upload" className="btn-cta">Get Started</Link>

            <div className="feature-pills">
              <div className="pill"><span className="pill-dot"></span>AI Notes</div>
              <div className="pill"><span className="pill-dot"></span>Smart Quizzes</div>
              <div className="pill"><span className="pill-dot"></span>Flashcards</div>
              <div className="pill"><span className="pill-dot"></span>PDF &amp; Docs</div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="sessions-list-title">Recent Activity</h3>
            <div className="sessions-grid">
              {sessions.map((session) => (
                <Link href={`/study?sessionId=${session.id}`} key={session.id} className="session-card">
                  <div className="session-header">
                    <div className="session-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                      </svg>
                    </div>
                    <span className="session-date">{formatDate(session.createdAt)}</span>
                  </div>
                  
                   <h4 className="session-title">{session.title}</h4>
                   
                   <p className="session-meta">
                     {session.notes?.subject ? <span>{session.notes.subject} • </span> : ''}
                     {session.materials?.length || 0} file{(session.materials?.length || 0) !== 1 ? 's' : ''} • {session.studyDepth === '1hr' ? 'Fast review' : session.studyDepth === 'detailed' ? 'In-depth study' : 'Standard depth'}
                   </p>
                  
                  <div className="session-footer">
                    <span className="session-status">Ready</span>
                    <svg className="session-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="footer-rule">
          <span className="footer-text">Zylo &mdash; Beta</span>
        </div>
      </main>
    </div>
  );
}

