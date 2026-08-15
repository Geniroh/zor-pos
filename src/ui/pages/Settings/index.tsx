import { Link } from "react-router-dom";
import { Bell, Clock, CreditCard, MapPin, SlidersHorizontal, Store } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import {
  PLANS,
  enabledAlertCount,
  formatShortDate,
  weekSummary,
} from "../../components/settings/settings-data";
import "../../components/common/folder-cards.css";
import "./index.css";

/**
 * Settings hub — the chooser every other section in this app lands on.
 *
 * Uses the shared folder-card treatment (components/common/folder-cards.css)
 * so Settings, Customers & Care and Users & Roles read as one family, laid out
 * three-up with no illustration panel: six cards fit 3×2 cleanly, and the
 * three illustrations in /images each already belong to another screen.
 *
 * Every meta line is derived from live SettingsContext state rather than
 * written out, so editing hours or muting an alert is visible on the hub the
 * moment you navigate back.
 */

function Settings() {
  const { profile, branches, mainBranch, alerts, preferences, subscription } = useSettings();

  const plan = PLANS.find((p) => p.id === subscription.planId) ?? PLANS[0];
  const enabled = enabledAlertCount(alerts);

  const sections = [
    {
      icon: Store,
      title: "Profile & Branding",
      subtitle: "Pharmacy name, logo, documents and receipts",
      meta: profile.displayName,
      path: "profile",
      tint: "green",
    },
    {
      icon: MapPin,
      title: "Location & Branches",
      subtitle: "Manage your pharmacy locations",
      meta: branches.length + (branches.length === 1 ? " branch" : " branches"),
      path: "branches",
      tint: "navy",
    },
    {
      icon: Clock,
      title: "Hours",
      subtitle: "Set when your pharmacy is open",
      meta: weekSummary(mainBranch.hours),
      path: "hours",
      tint: "sand",
    },
    {
      icon: SlidersHorizontal,
      title: "Preferences",
      subtitle: "Control sales, medicines and pharmacy operations",
      meta: "VAT " + preferences.sales.vatRate + "%",
      path: "preferences",
      tint: "plum",
    },
    {
      icon: Bell,
      title: "Notifications",
      subtitle: "Choose which alerts you receive",
      meta: enabled + (enabled === 1 ? " notification enabled" : " notifications enabled"),
      path: "notifications",
      tint: "teal",
    },
    {
      icon: CreditCard,
      title: "Plan & Billing",
      subtitle: "Manage your plan, AI credits and invoices",
      meta: subscription.cancelled
        ? plan.name + " · Ends " + formatShortDate(subscription.nextPaymentAt)
        : plan.name + " · Renews " + formatShortDate(subscription.nextPaymentAt),
      path: "billing",
      tint: "clay",
    },
  ];

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <p className="settings-page-subtitle">
        Manage how your pharmacy operates and how customers experience it.
      </p>

      <div className="folder-grid settings-folders">
        {sections.map(({ icon: Icon, title, subtitle, meta, path, tint }) => (
          <Link key={path} to={path} className={"folder-card folder-" + tint}>
            <span className="folder-card-tab" />
            <span className="folder-card-body">
              <span className="folder-card-icon">
                <Icon className="folder-card-glyph" />
              </span>
              <span className="folder-card-text">
                <strong>{title}</strong>
                <span>{subtitle}</span>
              </span>
              <span className="folder-card-meta">{meta}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Settings;
