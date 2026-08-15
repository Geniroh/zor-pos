import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ImageUp,
  KeyRound,
  Lock,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";
import UsersShell from "../../components/users/UsersShell";
import { useUsers } from "../../context/UsersContext";
import { useSettings } from "../../context/SettingsContext";
import {
  formatRelative,
  formatUserDate,
  initialsOf,
  roleById,
  scopeLabel,
} from "../../components/users/users-data";
import "./index.css";

/**
 * My Profile — my own identity, as opposed to everything else in this section,
 * which is other people's access.
 *
 * The split that matters here is editable versus not. Name, photo, email and
 * phone are mine to change. Role and branch access are not: they were granted
 * to me, so they render as facts with who assigned them, never as inputs I can
 * quietly edit to give myself more access.
 */

function MyProfile() {
  const { currentUser, updateUser, devices, security, flash } = useUsers();
  const { branches } = useSettings();
  const photoInput = useRef<HTMLInputElement>(null);

  const role = roleById(currentUser.roleId);
  const myDevices = devices.filter((d) => d.userId === currentUser.id);

  return (
    <UsersShell
      title="My Profile"
      subtitle="Your details, your access, and how your account is secured."
      backTo="/dashboard/users-roles"
    >
      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Your details</h2>
            <p>How you appear to colleagues and on the records you create.</p>
          </div>
        </div>

        <div className="panel-card-body">
          <div className="mp-identity">
            <span className="mp-avatar">{initialsOf(currentUser.name)}</span>
            <div className="mp-photo-actions">
              <span className="panel-label">Profile photo</span>
              <p className="panel-hint">
                Shown next to your name across the app. Nothing is uploaded — this is a
                local preview only.
              </p>
              <button
                type="button"
                className="panel-btn panel-btn--sm"
                onClick={() => photoInput.current?.click()}
              >
                <ImageUp />
                Choose photo
              </button>
              <input
                ref={photoInput}
                type="file"
                accept="image/*"
                className="mp-file-input"
                onChange={(e) => {
                  if (e.target.files?.[0]) flash("Profile photos aren't stored yet");
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="panel-grid-2">
            <label className="panel-field">
              <span className="panel-label">Full name</span>
              <input
                className="panel-input"
                value={currentUser.name}
                onChange={(e) => updateUser(currentUser.id, { name: e.target.value })}
                onBlur={() => flash("Profile updated")}
              />
            </label>

            <label className="panel-field">
              <span className="panel-label">Phone number</span>
              <input
                className="panel-input"
                value={currentUser.phone}
                onChange={(e) => updateUser(currentUser.id, { phone: e.target.value })}
                onBlur={() => flash("Profile updated")}
              />
            </label>
          </div>

          <label className="panel-field">
            <span className="panel-label">Email</span>
            <input
              className="panel-input"
              type="email"
              value={currentUser.email}
              onChange={(e) => updateUser(currentUser.id, { email: e.target.value })}
              onBlur={() => flash("Profile updated")}
            />
          </label>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Your access</h2>
            <p>Granted to you. Ask an administrator if this needs to change.</p>
          </div>
          <span className="panel-pill">
            <Lock className="mp-lock" />
            Read-only
          </span>
        </div>

        <div className="panel-rows">
          <div className="panel-row">
            <span className="panel-row-text">
              <strong className="mp-fact">
                <KeyRound className="mp-fact-icon" />
                {role.name}
              </strong>
              <small>
                {role.summary} · Assigned by {currentUser.roleAssignedBy}
              </small>
            </span>
            <Link
              to={"/dashboard/users-roles/roles/" + role.id}
              className="panel-btn panel-btn--sm panel-btn--ghost"
            >
              What this means
            </Link>
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong className="mp-fact">
                <Building2 className="mp-fact-icon" />
                {scopeLabel(currentUser, branches)}
              </strong>
              <small>
                {role.scope === "all"
                  ? "Your role covers the whole pharmacy."
                  : "The branches you can work in."}
              </small>
            </span>
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Member since</strong>
              <small>{formatUserDate(currentUser.joinedAt)}</small>
            </span>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Security</h2>
            <p>How you sign in.</p>
          </div>
        </div>

        <div className="panel-rows">
          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Password</strong>
              <small>Last changed {formatRelative(currentUser.joinedAt)}</small>
            </span>
            <button
              type="button"
              className="panel-btn panel-btn--sm"
              onClick={() => flash("Password changes aren't wired up yet")}
            >
              Change password
            </button>
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong className="mp-fact">
                <ShieldCheck
                  className={
                    "mp-fact-icon" + (currentUser.twoFactorEnabled ? "" : " mp-fact-icon--off")
                  }
                />
                Two-factor authentication
              </strong>
              <small>
                {currentUser.twoFactorEnabled
                  ? "Enabled. You'll be asked for a code when you sign in."
                  : security.require2fa
                    ? "Required by your pharmacy — set it up at your next sign-in."
                    : "Not set up."}
              </small>
            </span>
            <span
              className={
                "panel-pill " +
                (currentUser.twoFactorEnabled ? "panel-pill--on" : "panel-pill--off")
              }
            >
              {currentUser.twoFactorEnabled ? "Enabled" : "Not set up"}
            </span>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Recent login activity</h2>
            <p>Devices you're currently signed in on.</p>
          </div>
          <Link
            to="/dashboard/users-roles/devices"
            className="panel-btn panel-btn--sm panel-btn--ghost"
          >
            All devices
          </Link>
        </div>

        {myDevices.length === 0 ? (
          <p className="mp-empty">No active sessions.</p>
        ) : (
          <div className="panel-rows">
            {myDevices.map((device) => (
              <div key={device.id} className="panel-row">
                <span className="panel-row-text">
                  <strong className="mp-fact">
                    <MonitorSmartphone className="mp-fact-icon" />
                    {device.client} · {device.os}
                  </strong>
                  <small>
                    {device.location} · Approx. location · Last active{" "}
                    {formatRelative(device.lastActiveAt)}
                  </small>
                </span>
                {device.current && <span className="panel-pill panel-pill--on">This device</span>}
              </div>
            ))}
          </div>
        )}
      </section>
    </UsersShell>
  );
}

export default MyProfile;
