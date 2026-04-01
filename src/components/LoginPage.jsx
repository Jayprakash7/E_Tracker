import { useState } from "react";
import { Wallet, UserPlus, ArrowLeft, Pencil, X, Trash2, Lock, RotateCcw, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { users, login, register, removeUser } = useAuth();

  const [step,         setStep]         = useState("select");
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin,          setPin]          = useState("");
  const [error,        setError]        = useState("");
  const [shake,        setShake]        = useState(false);
  const [editMode,     setEditMode]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [newName,    setNewName]    = useState("");
  const [nameError,  setNameError]  = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [createStep, setCreateStep] = useState("pin1");

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const resetToSelect = () => {
    setStep("select"); setSelectedUser(null); setPin(""); setError("");
    setNewName(""); setNameError(""); setConfirmPin(""); setCreateStep("pin1");
    setEditMode(false); setDeleteTarget(null);
  };

  const handleLoginNumpad = (digit) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin); setError("");
    if (newPin.length === 4) {
      setTimeout(() => {
        const ok = login(selectedUser.id, newPin);
        if (!ok) { doShake(); setError("Wrong PIN. Try again."); setPin(""); }
      }, 120);
    }
  };

  const handleRegisterNumpad = (digit) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin); setError("");
    if (newPin.length === 4) {
      setTimeout(() => {
        if (createStep === "pin1") {
          setConfirmPin(newPin); setPin(""); setCreateStep("pin2");
        } else {
          if (newPin !== confirmPin) {
            doShake(); setError("PINs did not match. Start again.");
            setPin(""); setConfirmPin(""); setCreateStep("pin1");
          } else {
            const result = register(newName.trim(), newPin);
            if (!result.ok) { setError(result.error); setPin(""); setCreateStep("pin1"); }
          }
        }
      }, 120);
    }
  };

  const handleBackspace = () => { setPin(p => p.slice(0, -1)); setError(""); };

  const handleNameNext = () => {
    const trimmed = newName.trim();
    if (!trimmed) { setNameError("Please enter your name"); return; }
    if (trimmed.length < 2) { setNameError("Name must be at least 2 characters"); return; }
    if (users.some(u => u.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError("That name is already taken"); return;
    }
    setNameError(""); setStep("create-pin"); setCreateStep("pin1");
    setPin(""); setConfirmPin(""); setError("");
  };

  const handleDelete = (user) => {
    removeUser(user.id); setDeleteTarget(null);
    if (users.length <= 1) setEditMode(false);
  };

  const pinLabel = () => {
    if (step === "pin") return "Enter your PIN";
    if (createStep === "pin1") return "Create a 4-digit PIN";
    return "Confirm your PIN";
  };

  const PinIcon = () => {
    if (step === "pin") return <Lock size={14} />;
    if (createStep === "pin1") return <KeyRound size={14} />;
    return <RotateCcw size={14} />;
  };

  const activeColor = selectedUser?.color || "#6366f1";

  //  SELECT SCREEN 
  if (step === "select") {
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
          {users.length === 0 ? (
            <div className="lp-welcome">
              <div className="lp-welcome-icon">
                <Wallet size={36} strokeWidth={1.4} />
              </div>
              <h2 className="lp-welcome-title">Welcome aboard</h2>
              <p className="lp-welcome-body">Create your first profile to start tracking expenses.</p>
              <button className="lp-btn-primary" onClick={() => setStep("create-name")}>
                <UserPlus size={16} /> Create my profile
              </button>
            </div>
          ) : (
            <>
              <div className="lp-card-top">
                <p className="lp-card-label">Select profile</p>
                <button
                  className={"lp-edit-toggle" + (editMode ? " lp-edit-toggle--on" : "")}
                  onClick={() => { setEditMode(e => !e); setDeleteTarget(null); }}
                >
                  {editMode ? <><X size={12} /> Done</> : <><Pencil size={12} /> Edit</>}
                </button>
              </div>

              <div className="lp-profiles">
                {users.map(user => (
                  <div key={user.id} className="lp-profile-wrap">
                    {editMode && (
                      <button
                        className="lp-delete-badge"
                        onClick={() => setDeleteTarget(user)}
                        title={"Remove " + user.name}
                      >
                        <X size={10} />
                      </button>
                    )}
                    <button
                      className={"lp-profile" + (editMode ? " lp-profile--wiggle" : "")}
                      onClick={() => {
                        if (editMode) return;
                        setSelectedUser(user); setStep("pin"); setPin(""); setError("");
                      }}
                      style={{ "--accent": user.color, "--accent-bg": user.bg }}
                    >
                      <div className="lp-profile-avatar" style={{ background: user.bg, color: user.color }}>
                        {user.initials}
                      </div>
                      <span className="lp-profile-name">{user.name}</span>
                      {!editMode && <span className="lp-profile-cta" style={{ color: user.color }}>Login</span>}
                    </button>
                  </div>
                ))}
              </div>

              <button className="lp-add-profile" onClick={() => { setEditMode(false); setStep("create-name"); }}>
                <UserPlus size={14} /> Add profile
              </button>
            </>
          )}
        </div>

        {deleteTarget && (
          <div className="lp-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="lp-dialog" onClick={e => e.stopPropagation()}>
              <div className="lp-dialog-avatar" style={{ background: deleteTarget.bg, color: deleteTarget.color }}>
                {deleteTarget.initials}
              </div>
              <h3 className="lp-dialog-title">Remove {deleteTarget.name}?</h3>
              <p className="lp-dialog-body">
                All expenses and data for <strong>{deleteTarget.name}</strong> will be permanently deleted.
              </p>
              <div className="lp-dialog-actions">
                <button className="lp-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="lp-btn-danger" onClick={() => handleDelete(deleteTarget)}>
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  //  CREATE NAME SCREEN 
  if (step === "create-name") {
    return (
      <div className="lp-root">
        <div className="lp-glow lp-glow--a" />
        <div className="lp-glow lp-glow--b" />

        <div className="lp-header">
          <div className="lp-logo"><UserPlus size={26} strokeWidth={1.8} /></div>
          <h1 className="lp-title">New Profile</h1>
          <p className="lp-sub">Set up your personal account</p>
        </div>

        <div className="lp-card">
          <p className="lp-card-label" style={{ marginBottom: 20 }}>What is your name?</p>

          {newName.trim().length > 0 && (
            <div className="lp-name-preview">
              <div className="lp-preview-avatar">
                {newName.trim().slice(0, 2).toUpperCase()}
              </div>
              <span className="lp-preview-name">{newName.trim()}</span>
            </div>
          )}

          <input
            autoFocus
            type="text"
            className={"lp-input" + (nameError ? " lp-input--error" : "")}
            placeholder="e.g. Jay, Kirti, Pritam..."
            value={newName}
            onChange={e => { setNewName(e.target.value); setNameError(""); }}
            onKeyDown={e => e.key === "Enter" && handleNameNext()}
            maxLength={30}
          />
          {nameError && <p className="lp-field-error">{nameError}</p>}

          <button className="lp-btn-primary" style={{ marginTop: 12 }} onClick={handleNameNext}>
            Continue
          </button>

          <button className="lp-back" onClick={resetToSelect}>
            <ArrowLeft size={13} /> Back
          </button>
        </div>
      </div>
    );
  }

  //  PIN SCREEN 
  const isLogin       = step === "pin";
  const numpadHandler = isLogin ? handleLoginNumpad : handleRegisterNumpad;
  const dotColor      = isLogin ? activeColor : "#6366f1";
  const avatarBg      = isLogin ? selectedUser.bg : "#e0e7ff";

  return (
    <div className="lp-root">
      <div className="lp-glow lp-glow--a" />
      <div className="lp-glow lp-glow--b" />

      <div className="lp-header">
        <div className="lp-pin-avatar" style={{ background: avatarBg, color: dotColor }}>
          {isLogin ? selectedUser.initials : newName.trim().slice(0, 2).toUpperCase()}
        </div>
        <h2 className="lp-pin-name">{isLogin ? selectedUser.name : newName.trim()}</h2>
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
            <button key={d} className="lp-key" onClick={() => numpadHandler(String(d))}>{d}</button>
          ))}
          <div />
          <button className="lp-key" onClick={() => numpadHandler("0")}>0</button>
          <button className="lp-key lp-key--back" onClick={handleBackspace} aria-label="backspace">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
            </svg>
          </button>
        </div>

        <button className="lp-back" onClick={resetToSelect}>
          <ArrowLeft size={13} /> {isLogin ? "Switch profile" : "Back"}
        </button>
      </div>
    </div>
  );
}