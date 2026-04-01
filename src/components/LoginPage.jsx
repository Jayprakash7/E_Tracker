import { useState } from "react";
import { Wallet, UserPlus, ArrowLeft, Lock, RotateCcw, KeyRound, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { users, login, register } = useAuth();

  const [mode,        setMode]        = useState("login");  // "login" | "signup"
  const [step,        setStep]        = useState("name");   // "name" | "pin"
  const [name,        setName]        = useState("");
  const [pin,         setPin]         = useState("");
  const [confirmPin,  setConfirmPin]  = useState("");
  const [createStep,  setCreateStep]  = useState("pin1");   // "pin1" | "pin2"
  const [nameError,   setNameError]   = useState("");
  const [error,       setError]       = useState("");
  const [shake,       setShake]       = useState(false);

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const reset = (newMode) => {
    setMode(newMode); setStep("name");
    setName(""); setPin(""); setConfirmPin("");
    setCreateStep("pin1"); setNameError(""); setError("");
  };

  const handleNameContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) { setNameError("Please enter your name"); return; }
    if (trimmed.length < 2) { setNameError("Name must be at least 2 characters"); return; }
    if (mode === "signup" && users.some(u => u.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError("That name is already taken"); return;
    }
    if (mode === "login" && !users.some(u => u.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError("No account found with that name"); return;
    }
    setNameError(""); setStep("pin"); setPin(""); setCreateStep("pin1"); setError("");
  };

  const handleNumpad = (digit) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin); setError("");
    if (newPin.length === 4) {
      setTimeout(async () => {
        if (mode === "login") {
          const result = await login(name.trim(), newPin);
          if (!result.ok) { doShake(); setError(result.error); setPin(""); }
        } else {
          if (createStep === "pin1") {
            setConfirmPin(newPin); setPin(""); setCreateStep("pin2");
          } else {
            if (newPin !== confirmPin) {
              doShake(); setError("PINs did not match. Try again.");
              setPin(""); setConfirmPin(""); setCreateStep("pin1");
            } else {
              const result = await register(name.trim(), newPin);
              if (!result.ok) { setError(result.error); setPin(""); setCreateStep("pin1"); }
            }
          }
        }
      }, 120);
    }
  };

  const handleBackspace = () => { setPin(p => p.slice(0, -1)); setError(""); };

  const pinLabel = () => {
    if (mode === "login") return "Enter your PIN";
    if (createStep === "pin1") return "Create a 4-digit PIN";
    return "Confirm your PIN";
  };

  const PinIcon = () => {
    if (mode === "login") return <Lock size={14} />;
    if (createStep === "pin1") return <KeyRound size={14} />;
    return <RotateCcw size={14} />;
  };

  //  NAME SCREEN 
  if (step === "name") {
    return (
      <div className="lp-root">
        <div className="lp-glow lp-glow--a" />
        <div className="lp-glow lp-glow--b" />
        <div className="lp-glow lp-glow--c" />

        <div className="lp-header">
          <div className="lp-logo"><Wallet size={28} strokeWidth={1.8} /></div>
          <h1 className="lp-title">E-Tracker</h1>
          <p className="lp-sub">Your personal expense tracker</p>
        </div>

        <div className="lp-card">
          <div className="lp-tabs">
            <button
              className={"lp-tab" + (mode === "login" ? " lp-tab--active" : "")}
              onClick={() => reset("login")}
            >
              <LogIn size={14} /> Login
            </button>
            <button
              className={"lp-tab" + (mode === "signup" ? " lp-tab--active" : "")}
              onClick={() => reset("signup")}
            >
              <UserPlus size={14} /> Sign Up
            </button>
          </div>

          <div style={{ padding: "4px 0 8px" }}>
            <p className="lp-card-label" style={{ marginBottom: 14 }}>
              {mode === "login" ? "Your name" : "Choose a name"}
            </p>

            {mode === "signup" && name.trim().length > 0 && (
              <div className="lp-name-preview">
                <div className="lp-preview-avatar">
                  {name.trim().slice(0, 2).toUpperCase()}
                </div>
                <span className="lp-preview-name">{name.trim()}</span>
              </div>
            )}

            <input
              autoFocus
              type="text"
              className={"lp-input" + (nameError ? " lp-input--error" : "")}
              placeholder="Enter your name"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(""); }}
              onKeyDown={e => e.key === "Enter" && handleNameContinue()}
              maxLength={30}
            />
            {nameError && <p className="lp-field-error">{nameError}</p>}

            <button className="lp-btn-primary" style={{ marginTop: 14 }} onClick={handleNameContinue}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  //  PIN SCREEN 
  const dotColor = "#6366f1";

  return (
    <div className="lp-root">
      <div className="lp-glow lp-glow--a" />
      <div className="lp-glow lp-glow--b" />

      <div className="lp-header">
        <div className="lp-pin-avatar" style={{ background: "#e0e7ff", color: dotColor }}>
          {name.trim().slice(0, 2).toUpperCase()}
        </div>
        <h2 className="lp-pin-name">{name.trim()}</h2>
        <p className="lp-pin-hint">
          <PinIcon /> {pinLabel()}
        </p>
      </div>

      <div className="lp-card">
        <div className={"lp-dots-wrap" + (shake ? " lp-dots-wrap--shake" : "")}>
          <div className="lp-dots">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={"lp-dot" + (i < pin.length ? " lp-dot--filled" : "")}
                style={i < pin.length ? { background: dotColor, borderColor: dotColor } : {}}
              />
            ))}
          </div>
          {error && <p className="lp-pin-error">{error}</p>}
        </div>

        <div className="lp-numpad">
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} className="lp-key" onClick={() => handleNumpad(String(d))}>{d}</button>
          ))}
          <div />
          <button className="lp-key" onClick={() => handleNumpad("0")}>0</button>
          <button className="lp-key lp-key--back" onClick={handleBackspace} aria-label="backspace">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
            </svg>
          </button>
        </div>

        <button className="lp-back" onClick={() => { setStep("name"); setPin(""); setError(""); setCreateStep("pin1"); }}>
          <ArrowLeft size={13} /> Back
        </button>
      </div>
    </div>
  );
}