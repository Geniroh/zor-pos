import { useState } from "react";
import { Laptop, LogOut, MapPin, Smartphone, Tablet } from "lucide-react";
import UsersShell from "../../components/users/UsersShell";
import Switch from "../../components/common/Switch";
import TwoFactorModal from "../../components/users/TwoFactorModal";
import { useUsers } from "../../context/UsersContext";
import { useSettings } from "../../context/SettingsContext";
import {
  activeUsers,
  formatRelative,
  formatUserDate,
  roleById,
  usersNeeding2fa,
} from "../../components/users/users-data";
import "./index.css";

/**
 * Where the pharmacy account is being used, and the controls over it.
 *
 * Devices come first because that's the question an owner actually opens this
 * page with — "who is signed in, and from where" — with the security switches
 * as the final section, per the spec's ordering.
 *
 * Location is always labelled "approx." because it's IP-derived and would
 * otherwise read as a precise claim about where a member of staff is.
 */

const KIND_ICON = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
};

function DevicesSecurity() {
  const { users, devices, revokeDevice, security, updateSecurity, flash } = useUsers();
  const { branches } = useSettings();
  const [tfaOpen, setTfaOpen] = useState(false);

  const active = activeUsers(users);
  const outstanding = usersNeeding2fa(users);
  const enabled = active.length - outstanding.length;
  const pct = active.length === 0 ? 0 : (enabled / active.length) * 100;

  return (
    <UsersShell
      title="Devices & Security"
      subtitle="Where your pharmacy account is being accessed, and how it's protected."
      backTo="/dashboard/users-roles"
    >
      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Signed-in devices</h2>
            <p>
              {devices.length} {devices.length === 1 ? "device" : "devices"} currently have
              access to this pharmacy.
            </p>
          </div>
        </div>

        <div className="ds-grid">
          {devices.map((device) => {
            const owner = users.find((u) => u.id === device.userId);
            const branch = branches.find((b) => b.id === device.branchId);
            const Icon = KIND_ICON[device.kind];

            return (
              <div key={device.id} className="ds-card">
                <div className="ds-card-head">
                  <span className="ds-icon">
                    <Icon />
                  </span>
                  <span className="ds-client">
                    <strong>{device.client}</strong>
                    <small>{device.os}</small>
                  </span>
                  {device.current && <span className="panel-pill panel-pill--on">This device</span>}
                </div>

                <span className="ds-line">
                  <MapPin className="ds-line-icon" />
                  {device.location} · Approx.
                </span>
                <span className="ds-line ds-branch">{branch?.name ?? "Unknown branch"}</span>

                <div className="ds-owner">
                  <span className="ds-owner-text">
                    <strong>{owner?.name ?? "Removed user"}</strong>
                    <small>{owner ? roleById(owner.roleId).name : "No longer has access"}</small>
                  </span>
                </div>

                <span className="ds-meta">
                  Last active {formatRelative(device.lastActiveAt)} · Signed in{" "}
                  {formatUserDate(device.signedInAt)}
                </span>

                {/* You can't sign this session out from inside itself. */}
                <button
                  type="button"
                  className="panel-btn panel-btn--sm panel-btn--danger ds-revoke"
                  disabled={device.current}
                  onClick={() => {
                    revokeDevice(device.id);
                    flash((owner?.name ?? "Device") + " signed out of " + device.client);
                  }}
                >
                  <LogOut />
                  {device.current ? "Current session" : "Remove access"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Two-factor authentication</h2>
            <p>An extra code at sign-in, on top of a password.</p>
          </div>
        </div>

        <div className="panel-rows">
          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Require 2FA for all users</strong>
              <small>
                Staff set it up the next time they sign in — nobody is locked out
                immediately. New users must set it up before they can get in.
              </small>
            </span>
            <Switch
              checked={security.require2fa}
              onChange={(require2fa) => {
                updateSecurity({ require2fa });
                flash(require2fa ? "2FA is now required" : "2FA is now optional");
              }}
              ariaLabel="Require 2FA for all users"
            />
          </div>
        </div>

        <button type="button" className="ds-tfa" onClick={() => setTfaOpen(true)}>
          <span className="ds-tfa-head">
            <strong>
              {enabled} of {active.length} users have enabled 2FA
            </strong>
            <span className="ds-tfa-link">
              {outstanding.length === 0
                ? "Everyone is set up"
                : outstanding.length + " still need to set it up"}
            </span>
          </span>
          <span className="panel-meter">
            <span className="panel-meter-fill" style={{ width: pct + "%" }} />
          </span>
        </button>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Login security</h2>
            <p>How sessions and sign-in attempts are handled.</p>
          </div>
        </div>

        <div className="panel-rows">
          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Sign out inactive sessions</strong>
              <small>Automatically end a session after 30 minutes of inactivity.</small>
            </span>
            <Switch
              checked={security.signOutInactive}
              onChange={(signOutInactive) => {
                updateSecurity({ signOutInactive });
                flash("Login security updated");
              }}
              ariaLabel="Sign out inactive sessions"
            />
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Login alerts</strong>
              <small>Email the pharmacy owner when someone signs in from a new device.</small>
            </span>
            <Switch
              checked={security.loginAlerts}
              onChange={(loginAlerts) => {
                updateSecurity({ loginAlerts });
                flash("Login security updated");
              }}
              ariaLabel="Login alerts"
            />
          </div>
        </div>
      </section>

      {tfaOpen && (
        <TwoFactorModal
          outstanding={outstanding}
          total={active.length}
          branches={branches}
          onClose={() => setTfaOpen(false)}
          onRemind={(user) => flash("Reminder sent to " + user.name)}
        />
      )}
    </UsersShell>
  );
}

export default DevicesSecurity;
