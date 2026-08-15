import { Link, Navigate, useParams } from "react-router-dom";
import { Boxes, ChevronRight, Printer, ShieldCheck, Users } from "lucide-react";
import SettingsShell from "../../components/settings/SettingsShell";
import HoursEditor from "../../components/settings/HoursEditor";
import Switch from "../../components/common/Switch";
import { useSettings } from "../../context/SettingsContext";
import { useUsers } from "../../context/UsersContext";
import { hasBranchAccess } from "../../components/users/users-data";
import {
  MANAGERS,
  PAPER_WIDTHS,
  weekSummary,
} from "../../components/settings/settings-data";
import "./index.css";

/**
 * One branch's full configuration — everything from the branch-level column of
 * the settings model in one place: contact details, its own opening hours, its
 * receipt printer, and pointers to the inventory and staff it owns.
 *
 * The hours editor is embedded here as well as living on the Hours screen on
 * purpose. They are two routes onto the same data (the shared HoursEditor
 * writing through the same setBranchHours), reached from two different
 * intents: "set opening times" versus "finish setting up this location".
 */

function SettingsBranchDetail() {
  const { branchId } = useParams();
  const { branches, updateBranch, setBranchHours, flash } = useSettings();
  const { users } = useUsers();

  const branch = branches.find((b) => b.id === branchId);

  // A stale or hand-typed id shouldn't render an empty shell.
  if (!branch) return <Navigate to="/dashboard/settings/branches" replace />;

  // Derived from the real user records rather than stored on the branch, so
  // Settings and Users & Roles can't disagree about who works where — and
  // suspending someone updates this immediately.
  const staffHere = users.filter((u) => hasBranchAccess(u, branch.id)).length;

  function patch(changes: Parameters<typeof updateBranch>[1], message = "Branch updated") {
    updateBranch(branch!.id, changes);
    flash(message);
  }

  return (
    <SettingsShell
      title={branch.name}
      subtitle={branch.address + ", " + branch.city}
      backTo="/dashboard/settings/branches"
      backLabel="Location & Branches"
      controls={
        <span
          className={
            "panel-pill " + (branch.active ? "panel-pill--on" : "panel-pill--off")
          }
        >
          {branch.active ? "Active" : "Inactive"}
        </span>
      }
    >
      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Details</h2>
            <p>How customers and suppliers reach this location.</p>
          </div>
          {branch.isMain && (
            <span className="panel-pill">
              <ShieldCheck className="branch-detail-pill-icon" />
              Main branch
            </span>
          )}
        </div>

        <div className="panel-card-body">
          <label className="panel-field">
            <span className="panel-label">Branch name</span>
            <input
              className="panel-input"
              value={branch.name}
              onChange={(e) => updateBranch(branch.id, { name: e.target.value })}
              onBlur={() => flash("Branch updated")}
            />
          </label>

          <div className="panel-grid-2">
            <label className="panel-field">
              <span className="panel-label">Street address</span>
              <input
                className="panel-input"
                value={branch.address}
                onChange={(e) => updateBranch(branch.id, { address: e.target.value })}
                onBlur={() => flash("Branch updated")}
              />
            </label>

            <label className="panel-field">
              <span className="panel-label">City / area</span>
              <input
                className="panel-input"
                value={branch.city}
                onChange={(e) => updateBranch(branch.id, { city: e.target.value })}
                onBlur={() => flash("Branch updated")}
              />
            </label>
          </div>

          <div className="panel-grid-2">
            <label className="panel-field">
              <span className="panel-label">Phone number</span>
              <input
                className="panel-input"
                value={branch.phone}
                onChange={(e) => updateBranch(branch.id, { phone: e.target.value })}
                onBlur={() => flash("Branch updated")}
              />
            </label>

            <label className="panel-field">
              <span className="panel-label">Email</span>
              <input
                className="panel-input"
                value={branch.email}
                onChange={(e) => updateBranch(branch.id, { email: e.target.value })}
                onBlur={() => flash("Branch updated")}
              />
            </label>
          </div>

          <label className="panel-field branch-detail-manager">
            <span className="panel-label">Branch manager</span>
            <select
              className="panel-input"
              value={branch.manager}
              onChange={(e) => patch({ manager: e.target.value })}
            >
              {MANAGERS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Opening hours</h2>
            <p>When this branch trades. Each location keeps its own week.</p>
          </div>
          <span className="panel-pill">{weekSummary(branch.hours)}</span>
        </div>

        <HoursEditor
          hours={branch.hours}
          onChange={(hours) => {
            setBranchHours(branch.id, hours);
            flash("Hours updated");
          }}
        />
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Receipt printer</h2>
            <p>The printer this till prints sales receipts on.</p>
          </div>
          <span className="branch-detail-printer-icon">
            <Printer />
          </span>
        </div>

        <div className="panel-card-body">
          <label className="panel-field">
            <span className="panel-label">Printer</span>
            <input
              className="panel-input"
              value={branch.printer.name}
              onChange={(e) =>
                updateBranch(branch.id, { printer: { ...branch.printer, name: e.target.value } })
              }
              onBlur={() => flash("Printer updated")}
              placeholder="Xprinter XP-58IIH"
            />
          </label>

          <div className="panel-field">
            <span className="panel-label">Paper width</span>
            <div className="branch-detail-widths">
              {PAPER_WIDTHS.map((width) => (
                <button
                  key={width}
                  type="button"
                  className={
                    "panel-chip" +
                    (branch.printer.paperWidth === width ? " panel-chip--active" : "")
                  }
                  aria-pressed={branch.printer.paperWidth === width}
                  onClick={() =>
                    patch({ printer: { ...branch.printer, paperWidth: width } }, "Printer updated")
                  }
                >
                  {width}
                </button>
              ))}
            </div>
          </div>

          <Switch
            checked={branch.printer.autoCut}
            onChange={(autoCut) =>
              patch({ printer: { ...branch.printer, autoCut } }, "Printer updated")
            }
            label="Cut paper automatically"
            hint="Trigger the cutter after each receipt prints"
          />
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>What this branch holds</h2>
            <p>Stock and staff belong to a location. Manage them in their own sections.</p>
          </div>
        </div>

        <div className="panel-rows">
          <Link to="/dashboard/inventory" className="panel-row branch-detail-link">
            <div className="branch-detail-link-left">
              <span className="branch-detail-link-icon">
                <Boxes />
              </span>
              <span className="panel-row-text">
                <strong>Inventory</strong>
                <small>
                  {branch.productCount === 0
                    ? "No products yet"
                    : branch.productCount + " products at this branch"}
                </small>
              </span>
            </div>
            <ChevronRight className="branch-detail-link-arrow" />
          </Link>

          <Link to="/dashboard/users-roles/users" className="panel-row branch-detail-link">
            <div className="branch-detail-link-left">
              <span className="branch-detail-link-icon">
                <Users />
              </span>
              <span className="panel-row-text">
                <strong>Staff</strong>
                <small>
                  {staffHere === 0
                    ? "No staff assigned yet"
                    : staffHere + (staffHere === 1 ? " member assigned" : " members assigned")}
                </small>
              </span>
            </div>
            <ChevronRight className="branch-detail-link-arrow" />
          </Link>
        </div>
      </section>

      <section className="panel-card branch-detail-danger">
        <div className="panel-row">
          <span className="panel-row-text">
            <strong>{branch.active ? "Deactivate this branch" : "Reactivate this branch"}</strong>
            <small>
              {branch.isMain
                ? "Your main branch can't be deactivated. Make another branch the main one first."
                : branch.active
                  ? "It stops appearing in the branch switcher and can't take sales. Its records are kept."
                  : "It appears in the branch switcher again and can take sales."}
            </small>
          </span>
          <button
            type="button"
            className={
              "panel-btn panel-btn--sm" + (branch.active ? " panel-btn--danger" : "")
            }
            disabled={branch.isMain}
            onClick={() =>
              patch(
                { active: !branch.active },
                branch.active ? branch.name + " deactivated" : branch.name + " reactivated",
              )
            }
          >
            {branch.active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </section>
    </SettingsShell>
  );
}

export default SettingsBranchDetail;
