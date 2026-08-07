import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import introImg from "../../../images/intro-img.png";
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  PhoneIcon,
  ShieldIcon,
  CloudIcon,
  ChartIcon,
  LogInIcon,
  SunIcon,
  MoonIcon,
} from "../components/icons";
import "./Login.css";

type Tab = "email" | "phone";
type Theme = "light" | "dark";

const FEATURES = [
  {
    icon: ShieldIcon,
    title: "Secure & Reliable",
    description: "Your data is safe with us.",
  },
  {
    icon: CloudIcon,
    title: "Accessible",
    description: "Access your business anytime, anywhere.",
  },
  {
    icon: ChartIcon,
    title: "Insightful",
    description: "Smart reports for better decisions.",
  },
];

function Login() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>("light");
  const [tab, setTab] = useState<Tab>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    navigate("/dashboard");
  }

  return (
    <div className={`login-page login-page--${theme}`}>
      <div className="login-card">
        <section className="login-brand">
          <div className="brand-mark">
            <span>zorpill</span>
            <i className="brand-underline" aria-hidden="true" />
          </div>

          <h1 className="login-heading">
            Manage your pharmacy.
            <br />
            <span className="accent">Simplify your operations.</span>
          </h1>
          <p className="login-subtext">
            Inventory, sales, and everything in between.
            <br />
            All in one place.
          </p>

          <img
            className="login-illustration"
            src={introImg}
            alt="Illustration of pharmacy inventory, delivery and checkout"
          />

          <ul className="login-features">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <Icon className="feature-icon" />
                <div>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
              </li>
            ))}
          </ul>

          <p className="login-copyright">
            © {new Date().getFullYear()} Zorpill. All rights reserved.
          </p>
        </section>

        <section className="login-form-panel">
          <div className="login-form-header">
            <div>
              <h2>
                Welcome back <span aria-hidden="true">👋</span>
              </h2>
              <p>Sign in to continue to your account</p>
            </div>
            <div className="theme-toggle" role="group" aria-label="Theme">
              <button
                type="button"
                className={theme === "light" ? "active" : ""}
                aria-pressed={theme === "light"}
                aria-label="Light theme"
                onClick={() => setTheme("light")}
              >
                <SunIcon />
              </button>
              <button
                type="button"
                className={theme === "dark" ? "active" : ""}
                aria-pressed={theme === "dark"}
                aria-label="Dark theme"
                onClick={() => setTheme("dark")}
              >
                <MoonIcon />
              </button>
            </div>
          </div>

          <div className="login-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "email"}
              className={tab === "email" ? "active" : ""}
              onClick={() => setTab("email")}
            >
              <MailIcon /> Email & Password
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "phone"}
              className={tab === "phone" ? "active" : ""}
              onClick={() => setTab("phone")}
            >
              <PhoneIcon /> Phone & OTP
            </button>
          </div>

          {tab === "email" ? (
            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                Email address
                <div className="input-wrap">
                  <MailIcon />
                  <input type="email" placeholder="you@pharmacy.com" required />
                </div>
              </label>

              <label>
                Password
                <div className="input-wrap">
                  <LockIcon />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>

              <div className="login-row">
                <label className="checkbox">
                  <input type="checkbox" />
                  Remember me
                </label>
                <a href="#" className="link">
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="btn-primary">
                <LogInIcon /> Sign in
              </button>

              <div className="divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="btn-outline"
                onClick={() => setTab("phone")}
              >
                <PhoneIcon /> Sign in with Phone & OTP
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                Phone number
                <div className="input-wrap">
                  <PhoneIcon />
                  <input type="tel" placeholder="+234 800 000 0000" required />
                </div>
              </label>

              {otpSent && (
                <label>
                  One-time code
                  <div className="input-wrap">
                    <LockIcon />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit code"
                      required
                    />
                  </div>
                </label>
              )}

              <button
                type="button"
                className="btn-outline"
                onClick={() => setOtpSent(true)}
              >
                {otpSent ? "Resend code" : "Send code"}
              </button>

              {otpSent && (
                <button type="submit" className="btn-primary">
                  <LogInIcon /> Verify & sign in
                </button>
              )}

              <div className="divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="btn-outline"
                onClick={() => setTab("email")}
              >
                <MailIcon /> Sign in with Email & Password
              </button>
            </form>
          )}

          <p className="login-footer">
            Don&apos;t have an account?{" "}
            <a href="#" className="link">
              Contact your administrator
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default Login;
