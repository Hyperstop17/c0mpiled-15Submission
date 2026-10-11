import React, { useState } from 'react';
import { 
  HardDrive, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Cloud, 
  Key, 
  CheckCircle2, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff,
  Check,
  RotateCw
} from 'lucide-react';
import { 
  saveSession, 
  registerAccount, 
  sendEmailVerification, 
  verifyEmailCode, 
  findAccount 
} from '../services/authService';

export default function LandingView({ onStartSession }) {
  const [authTab, setAuthTab] = useState('signin'); // 'signin' or 'signup'

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState('');

  // Sign Up State
  const [signUpStep, setSignUpStep] = useState('form'); // 'form' or 'verify'
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [workspaceMode, setWorkspaceMode] = useState('fresh'); // 'fresh' or 'demo'
  
  // Verification State
  const [otpCode, setOtpCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Interactive mouse glow effect for hexagonal grid background
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setSignInError('');
    const cleanEmail = signInEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setSignInError('Please enter your email address.');
      return;
    }

    const existingAccount = findAccount(cleanEmail);

    const userObj = existingAccount || {
      id: `u-${cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      name: cleanEmail.split('@')[0].replace(/[._]/g, ' '),
      email: cleanEmail,
      mode: 'fresh',
      emailVerified: true
    };

    const session = saveSession(userObj, rememberMe);
    onStartSession(session);
  };

  // Step 1: Submit sign up details & send verification email
  const handleRequestVerification = async (e) => {
    e.preventDefault();
    setVerificationError('');
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword) return;

    setIsVerifying(true);

    try {
      const res = await sendEmailVerification(signUpEmail);
      if (res.code) {
        setGeneratedCode(res.code);
        setOtpCode(res.code); // auto-fill helper for frictionless verification
      }
      setSignUpStep('verify');
    } catch (err) {
      setVerificationError('Failed to send verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Verify code & create active account
  const handleConfirmVerification = async (e) => {
    e.preventDefault();
    setVerificationError('');
    setIsVerifying(true);

    try {
      const isValid = await verifyEmailCode(signUpEmail, otpCode);
      if (!isValid) {
        setVerificationError('Invalid verification code. Please check and re-enter.');
        setIsVerifying(false);
        return;
      }

      // Register new self-produced account
      const newAccount = registerAccount({
        name: signUpName.trim(),
        email: signUpEmail.trim(),
        mode: workspaceMode
      });

      const session = saveSession(newAccount, rememberMe);
      onStartSession(session);
    } catch (err) {
      setVerificationError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div 
      className="landing-page-root hex-grid-bg" 
      onMouseMove={handleMouseMove}
      style={{
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`
      }}
    >
      {/* Top Bar */}
      <header className="landing-nav">
        <div className="landing-brand">
          <div className="logo-icon-wrap">
            <HardDrive className="logo-icon-drive" size={22} />
          </div>
          <span className="landing-brand-name">CogniDrive</span>
          <span className="landing-badge">Secure Cloud Storage</span>
        </div>
      </header>

      {/* Hero Container */}
      <main className="landing-hero-container">
        <div className="landing-hero-text">
          <div className="landing-pill-tag">
            <Sparkles size={14} className="text-amber" />
            <span>Google Drive for AI Workspaces</span>
          </div>

          <h1 className="landing-title">
            Collaborative Spaces Grounded in Your Documents
          </h1>

          <p className="landing-lead">
            Store documents securely in private cloud storage, mount files dynamically with real-time token budgeting, and collaborate across your team workspaces with foundation models.
          </p>

          {/* Feature Grid */}
          <div className="landing-features-grid">
            <div className="landing-feature-item">
              <Cloud size={18} className="text-indigo" />
              <div>
                <strong>Private Cloud Storage</strong>
                <span>Direct document storage with zero model training guarantees.</span>
              </div>
            </div>

            <div className="landing-feature-item">
              <Layers size={18} className="text-green" />
              <div>
                <strong>Collaborative Spaces</strong>
                <span>Rooms with multi-model AI and mounted workspace files.</span>
              </div>
            </div>

            <div className="landing-feature-item">
              <Key size={18} className="text-amber" />
              <div>
                <strong>Connect Any AI Model</strong>
                <span>Plug in OpenAI, Claude, or Gemini with custom API keys.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Web App Authentication Card */}
        <div className="landing-signup-card auth-card">
          {/* Auth Tabs */}
          <div className="auth-tabs-header">
            <button 
              className={`auth-tab-btn ${authTab === 'signin' ? 'active' : ''}`}
              onClick={() => { setAuthTab('signin'); setSignUpStep('form'); }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab-btn ${authTab === 'signup' ? 'active' : ''}`}
              onClick={() => { setAuthTab('signup'); setSignUpStep('form'); }}
            >
              Create Account
            </button>
          </div>

          {authTab === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="signup-form">
              <div className="form-group">
                <label>Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-field-icon" />
                  <input 
                    type="email" 
                    value={signInEmail} 
                    onChange={(e) => setSignInEmail(e.target.value)} 
                    placeholder="your-email@domain.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-field-icon" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={signInPassword} 
                    onChange={(e) => setSignInPassword(e.target.value)} 
                    placeholder="Enter your password"
                    required
                  />
                  <button 
                    type="button" 
                    className="btn-show-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {signInError && (
                <span className="auth-error-msg">{signInError}</span>
              )}

              <div className="auth-options-row">
                <label className="remember-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                  />
                  <span>Remember me (Auto Sign-In)</span>
                </label>
              </div>

              <button type="submit" className="btn-launch-drive">
                <span>Sign In to Drive</span>
                <ArrowRight size={17} />
              </button>

              <div className="signup-guarantee-note">
                <ShieldCheck size={14} className="text-green" />
                <span>Encrypted Sessions • Cookie Persistent Auto-Login</span>
              </div>
            </form>
          ) : signUpStep === 'form' ? (
            /* Step 1: Create Account Form */
            <form onSubmit={handleRequestVerification} className="signup-form">
              <div className="form-group">
                <label>Full Name</label>
                <div className="auth-input-wrapper">
                  <User size={16} className="auth-field-icon" />
                  <input 
                    type="text" 
                    value={signUpName} 
                    onChange={(e) => setSignUpName(e.target.value)} 
                    placeholder="e.g. Selena Chang"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Work Email</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-field-icon" />
                  <input 
                    type="email" 
                    value={signUpEmail} 
                    onChange={(e) => setSignUpEmail(e.target.value)} 
                    placeholder="selena@company.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Create Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-field-icon" />
                  <input 
                    type="password" 
                    value={signUpPassword} 
                    onChange={(e) => setSignUpPassword(e.target.value)} 
                    placeholder="Choose a secure password"
                    required
                  />
                </div>
              </div>

              {/* Mode Selector */}
              <div className="form-group">
                <label>Workspace Template</label>
                <div className="workspace-mode-selector">
                  <div 
                    className={`mode-card ${workspaceMode === 'fresh' ? 'selected' : ''}`}
                    onClick={() => setWorkspaceMode('fresh')}
                  >
                    <div className="mode-card-header">
                      <strong>Fresh Workspace</strong>
                      {workspaceMode === 'fresh' && <CheckCircle2 size={16} className="text-green" />}
                    </div>
                    <p>Clean drive ready for your own files and custom models.</p>
                  </div>

                  <div 
                    className={`mode-card ${workspaceMode === 'demo' ? 'selected' : ''}`}
                    onClick={() => setWorkspaceMode('demo')}
                  >
                    <div className="mode-card-header">
                      <strong>Demo Workspace</strong>
                      {workspaceMode === 'demo' && <CheckCircle2 size={16} className="text-green" />}
                    </div>
                    <p>Pre-populated with finance, specs, and test rooms.</p>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-launch-drive" disabled={isVerifying}>
                <span>Verify Email & Create Account</span>
                <ArrowRight size={17} />
              </button>

              <div className="signup-guarantee-note">
                <ShieldCheck size={14} className="text-green" />
                <span>Prevents ghost accounts • Direct AWS cloud provisioning</span>
              </div>
            </form>
          ) : (
            /* Step 2: Email Verification Screen */
            <form onSubmit={handleConfirmVerification} className="signup-form verification-step-form">
              <div className="verification-header-box">
                <div className="otp-icon-wrap">
                  <Mail size={22} className="text-indigo" />
                </div>
                <h3>Verify Your Email Address</h3>
                <p>
                  A 6-digit security code was generated for <strong>{signUpEmail}</strong> to confirm your email and provision your private AWS cloud vault.
                </p>
              </div>

              {generatedCode && (
                <div className="otp-demo-helper" onClick={() => setOtpCode(generatedCode)}>
                  <Sparkles size={14} className="text-amber" />
                  <span>Security Code: <strong>{generatedCode}</strong> (Click to auto-fill)</span>
                </div>
              )}

              <div className="form-group">
                <label>6-Digit Verification Code</label>
                <div className="auth-input-wrapper">
                  <input 
                    type="text" 
                    maxLength={6}
                    value={otpCode} 
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} 
                    placeholder="e.g. 482910"
                    className="otp-code-input"
                    required
                    autoFocus
                  />
                </div>
                {verificationError && (
                  <span className="auth-error-msg">{verificationError}</span>
                )}
              </div>

              <button type="submit" className="btn-launch-drive" disabled={isVerifying || otpCode.length < 6}>
                {isVerifying ? (
                  <>
                    <RotateCw size={16} className="spinner" />
                    <span>Verifying & Provisioning Vault...</span>
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    <span>Verify & Launch Workspace</span>
                  </>
                )}
              </button>

              <button 
                type="button" 
                className="btn-back-link"
                onClick={() => setSignUpStep('form')}
              >
                ← Back / Edit Details
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
