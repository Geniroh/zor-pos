import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, MapPin, Phone, Plus, Store } from "lucide-react";
import SettingsShell from "../../components/settings/SettingsShell";
import AddBranchModal from "../../components/settings/AddBranchModal";
import { useSettings } from "../../context/SettingsContext";
import { weekSummary } from "../../components/settings/settings-data";
import "./index.css";

/**
 * Location & Branches — the screen that answers "where does this pharmacy
 * operate?". The current branch gets a full summary at the top; the others are
 * a card list, each linking to its own configuration page.
 *
 * "Current" here is the same activeBranchId the Hours picker drives, so
 * switching branches in one place is reflected in the other. That is the whole
 * mechanism behind the pharmacy-level / branch-level split — the user only
 * ever sees "which branch am I looking at", never the word "level".
 */

function SettingsBranches() {
  const { branches, activeBranch, activeBranchId, setActiveBranchId, addBranch, flash } =
    useSettings();
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();

  const others = branches.filter((b) => b.id !== activeBranchId);

  return (
    <SettingsShell
      title="Location & Branches"
      subtitle="Where your pharmacy operates, and how each location is set up."
    >
      <section className="panel-card branches-current">
        <div className="panel-card-head">
          <div>
            <h2>Current branch</h2>
            <p>The location you're working in right now.</p>
          </div>
          {activeBranch.isMain && <span className="panel-pill">Main</span>}
        </div>

        <div className="branches-current-body">
          <span className="branches-avatar branches-avatar--lg">
            <Store />
          </span>

          <div className="branches-current-text">
            <strong>{activeBranch.name}</strong>
            <span className="branches-line">
              <MapPin className="branches-line-icon" />
              {activeBranch.address}, {activeBranch.city}
            </span>
            <span className="branches-line">
              <Phone className="branches-line-icon" />
              {activeBranch.phone}
            </span>
            <span className="branches-line">
              <Clock className="branches-line-icon" />
              {weekSummary(activeBranch.hours)}
            </span>
          </div>

          <Link to={activeBranch.id} className="panel-btn">
            Edit branch
          </Link>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Other branches</h2>
            <p>
              {others.length === 0
                ? "This is your only location."
                : "Switch to a branch to work in it, or open it to change its details."}
            </p>
          </div>
          <button
            type="button"
            className="panel-btn panel-btn--sm"
            onClick={() => setAddOpen(true)}
          >
            <Plus />
            Add branch
          </button>
        </div>

        {others.length > 0 && (
          <div className="branches-grid">
            {others.map((branch) => (
              <div key={branch.id} className="branches-card">
                <span className="branches-avatar">
                  <Store />
                </span>

                <div className="branches-card-text">
                  <strong>{branch.name}</strong>
                  <small>
                    {branch.address}, {branch.city}
                  </small>
                  <span
                    className={
                      "panel-pill " +
                      (branch.active ? "panel-pill--on" : "panel-pill--off")
                    }
                  >
                    {branch.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="branches-card-actions">
                  <button
                    type="button"
                    className="panel-btn panel-btn--sm panel-btn--ghost"
                    onClick={() => {
                      setActiveBranchId(branch.id);
                      flash("Now working in " + branch.name);
                    }}
                  >
                    Switch to
                  </button>
                  <Link to={branch.id} className="panel-btn panel-btn--sm">
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {addOpen && (
        <AddBranchModal
          onClose={() => setAddOpen(false)}
          onCreate={(input) => {
            const created = addBranch(input);
            flash(created.name + " added");
            // Straight into its configuration — a branch with no hours or
            // printer set isn't finished being created.
            navigate(created.id);
          }}
        />
      )}
    </SettingsShell>
  );
}

export default SettingsBranches;
