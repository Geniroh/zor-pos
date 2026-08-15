import { AlertTriangle, BellOff, CalendarClock, PackageCheck, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";
import SettingsShell from "../../components/settings/SettingsShell";
import { useSettings } from "../../context/SettingsContext";
import {
  NOTIFICATION_CHANNELS,
  enabledAlertCount,
} from "../../components/settings/settings-data";
import "./index.css";

/**
 * Notifications. Each alert carries its own channel chips and an alert with no
 * chip lit is simply off — there is no separate enable switch, and no global
 * "where should we send notifications?" block.
 *
 * That was a deliberate simplification of the original spec, which had both: a
 * per-alert toggle *and* a global channel picker is the same duplication the
 * POS panels were refactored to remove, and it makes "email me expiry warnings
 * but only ping me in-app for purchase orders" impossible to express.
 */

const ALERT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "low-stock": AlertTriangle,
  expiry: CalendarClock,
  "purchase-order": PackageCheck,
  "daily-summary": TrendingUp,
};

function SettingsNotifications() {
  const { alerts, toggleAlertChannel, flash } = useSettings();
  const enabled = enabledAlertCount(alerts);

  return (
    <SettingsShell
      title="Notifications"
      subtitle="Choose which alerts you receive, and where each one reaches you."
    >
      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Alerts</h2>
            <p>Pick a channel to turn an alert on. Clear them all to switch it off.</p>
          </div>
          <span className="panel-pill">
            {enabled} of {alerts.length} on
          </span>
        </div>

        <div className="panel-rows">
          {alerts.map((alert) => {
            const Icon = ALERT_ICONS[alert.id] ?? AlertTriangle;
            const off = alert.channels.length === 0;

            return (
              <div key={alert.id} className={"notif-row" + (off ? " notif-row--off" : "")}>
                <div className="notif-main">
                  <span className="notif-icon">
                    {off ? <BellOff className="notif-glyph" /> : <Icon className="notif-glyph" />}
                  </span>
                  <span className="panel-row-text">
                    <strong>{alert.title}</strong>
                    <small>{alert.description}</small>
                  </span>
                </div>

                <div className="notif-channels" role="group" aria-label={alert.title + " channels"}>
                  {NOTIFICATION_CHANNELS.map((channel) => {
                    const on = alert.channels.includes(channel);
                    return (
                      <button
                        key={channel}
                        type="button"
                        className={"panel-chip" + (on ? " panel-chip--active" : "")}
                        aria-pressed={on}
                        onClick={() => {
                          toggleAlertChannel(alert.id, channel);
                          flash(
                            on
                              ? channel + " off for " + alert.title.toLowerCase()
                              : channel + " on for " + alert.title.toLowerCase(),
                          );
                        }}
                      >
                        <span className="panel-chip-dot" />
                        {channel}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="notif-note">
        Notifications go to the email address and phone number on your account. In-app
        alerts appear in the bell in the title bar.
      </p>
    </SettingsShell>
  );
}

export default SettingsNotifications;
