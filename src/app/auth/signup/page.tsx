'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { data: authData, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      if (authData.user) {
        // Claim any anonymous sessions created before signup
        const anonSessions = JSON.parse(localStorage.getItem('anonSessions') || '[]');
        if (anonSessions.length > 0) {
          await fetch('/api/sessions/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionIds: anonSessions, userId: authData.user.id })
          });
          localStorage.removeItem('anonSessions');
        }
      }
      router.push('/dashboard');
    }
  };

  function getStrength(pw: string): number {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 4);
  }

  const strength = getStrength(password);

  const strengthColors = ["#222", "#555", "#777", "#aaa", "#d4d4d4"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthTextColors = ["#555", "#555", "#666", "#888", "#aaa"];

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#080808",
        fontFamily: "'DM Sans', sans-serif",
        padding: "2rem 1rem",
        position: "relative"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #141414 inset !important;
          -webkit-text-fill-color: #e0e0e0 !important;
          caret-color: #e0e0e0;
        }
      `}</style>

      <Link href="/" style={{ position: 'absolute', top: '2rem', left: '2rem', color: '#888', textDecoration: 'none', fontSize: 14 }}>
        &larr; Back home
      </Link>

      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#0d0d0d",
          border: "0.5px solid #2a2a2a",
          borderRadius: 20,
          padding: "2.5rem 2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, #555, transparent)",
          }}
        />

        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "#1a1a1a",
            border: "0.5px solid #333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={22}
            height={22}
            stroke="#d4d4d4"
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16L4 20h16" />
          </svg>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 22,
            fontWeight: 600,
            color: "#f0f0f0",
            margin: "0 0 6px",
            letterSpacing: "-0.4px",
          }}
        >
          Create an account
        </p>
        <p
          style={{
            textAlign: "center",
            fontSize: 13.5,
            color: "#666",
            fontWeight: 400,
            margin: "0 0 2rem",
            letterSpacing: "0.1px",
          }}
        >
          Start your journey with Zylo
        </p>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "10px", background: "rgba(220, 38, 38, 0.1)", color: "#ef4444", fontSize: 13, borderRadius: 8, border: "0.5px solid rgba(220, 38, 38, 0.3)", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#888",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                marginBottom: 7,
              }}
            >
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="off"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#141414",
                border: "0.5px solid #2c2c2c",
                borderRadius: 10,
                padding: "11px 14px",
                fontSize: 14,
                color: "#e0e0e0",
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
                letterSpacing: "0.1px",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#888";
                e.target.style.background = "#161616";
                e.target.style.boxShadow = "0 0 0 3px rgba(120,120,120,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#2c2c2c";
                e.target.style.background = "#141414";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#888",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                marginBottom: 7,
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#141414",
                  border: "0.5px solid #2c2c2c",
                  borderRadius: 10,
                  padding: "11px 44px 11px 14px",
                  fontSize: 14,
                  color: "#e0e0e0",
                  fontFamily: "'DM Sans', sans-serif",
                  outline: "none",
                  letterSpacing: "0.1px",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#888";
                  e.target.style.background = "#161616";
                  e.target.style.boxShadow = "0 0 0 3px rgba(120,120,120,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#2c2c2c";
                  e.target.style.background = "#141414";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  color: showPassword ? "#888" : "#555",
                }}
              >
                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    width={16}
                    height={16}
                    stroke="currentColor"
                    fill="none"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width={16}
                    height={16}
                    stroke="currentColor"
                    fill="none"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 2,
                    borderRadius: 2,
                    background: i < strength ? strengthColors[strength] : "#222",
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: 11,
                color: strengthTextColors[strength],
                marginTop: 5,
                height: 14,
                transition: "color 0.3s",
              }}
            >
              {strengthLabels[strength]}
            </div>
          </div>

          <div
            style={{
              height: "0.5px",
              background: "#1e1e1e",
              margin: "1.5rem 0",
            }}
          />

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "13px",
              background: "#f0f0f0",
              color: "#0d0d0d",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: isLoading ? "not-allowed" : "pointer",
              letterSpacing: "0.2px",
              marginBottom: "1.25rem",
              opacity: isLoading ? 0.7 : 1,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              !isLoading && ((e.target as HTMLButtonElement).style.background = "#ffffff")
            }
            onMouseLeave={(e) =>
              !isLoading && ((e.target as HTMLButtonElement).style.background = "#f0f0f0")
            }
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "#555",
            margin: 0,
          }}
        >
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            style={{
              color: "#b0b0b0",
              textDecoration: "none",
              fontWeight: 500,
              borderBottom: "0.5px solid #555",
              paddingBottom: 1,
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
