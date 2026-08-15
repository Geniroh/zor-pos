import SettingsShell from "../../components/settings/SettingsShell";
import BranchPicker from "../../components/settings/BranchPicker";
import HoursEditor from "../../components/settings/HoursEditor";
import { useSettings } from "../../context/SettingsContext";
import { weekSummary } from "../../components/settings/settings-data";
import "./index.css";

/**
 * Hours. Opening times are a property of a location, not of the business, so
 * this screen edits one branch at a time and says which in its header. The
 * picker is the only thing distinguishing it from the pharmacy-level screens —
 * there is no "branch settings" section to find, and no inheritance model to
 * understand.
 */

function SettingsHours() {
  const { activeBranch, setBranchHours, flash } = useSettings();

  return (
    <SettingsShell
      title="Hours"
      subtitle="When this location is open for customers."
      controls={<BranchPicker label="Hours for" />}
    >
      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Opening hours</h2>
            <p>
              Turn a day off to close it, or add a second period to break for lunch.
            </p>
          </div>
          <span className="panel-pill">{weekSummary(activeBranch.hours)}</span>
        </div>

        <HoursEditor
          hours={activeBranch.hours}
          onChange={(hours) => {
            setBranchHours(activeBranch.id, hours);
            flash("Hours updated");
          }}
        />
      </section>

      <p className="hours-page-note">
        These hours apply to <strong>{activeBranch.name}</strong> only. Use the picker
        above to set hours for another location.
      </p>
    </SettingsShell>
  );
}

export default SettingsHours;
