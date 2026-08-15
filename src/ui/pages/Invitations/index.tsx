import { useState } from "react";
import { Link } from "react-router-dom";
import { MailPlus, RotateCw, X } from "lucide-react";
import UsersShell from "../../components/users/UsersShell";
import AddUserModal from "../../components/users/AddUserModal";
import { useUsers } from "../../context/UsersContext";
import { useSettings } from "../../context/SettingsContext";
import {
  INVITE_VALID_DAYS,
  formatRelative,
  roleById,
  scopeLabel,
} from "../../components/users/users-data";
import "./index.css";

/**
 * An invitation is not a user yet — that distinction is the whole reason this
 * screen exists separately from Users.
 *
 * Accepted invitations deliberately never appear here: once accepted the
 * person becomes a User and belongs on that screen instead. Keeping them in
 * both places would blur the Invitation → User model into two lists of the
 * same people.
 */

function Invitations() {
  const { invitations, inviteUser, resendInvitation, cancelInvitation, flash } = useUsers();
  const { branches } = useSettings();
  const [addOpen, setAddOpen] = useState(false);

  const pending = invitations.filter((i) => i.status === "Pending");
  const closed = invitations.filter((i) => i.status !== "Pending");

  return (
    <UsersShell
      title="Invitations"
      subtitle="People who have been invited but haven't joined yet."
      backTo="/dashboard/users-roles"
      controls={
        <button
          type="button"
          className="panel-btn panel-btn--primary"
          onClick={() => setAddOpen(true)}
        >
          <MailPlus />
          Invite someone
        </button>
      }
    >
      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Pending</h2>
            <p>
              Invitations expire after {INVITE_VALID_DAYS} days. Resending starts the clock
              again.
            </p>
          </div>
          <span className="panel-pill">{pending.length}</span>
        </div>

        {pending.length === 0 ? (
          <p className="inv-empty">
            No invitations waiting. Everyone you've invited has either joined or been
            cancelled.
          </p>
        ) : (
          <div className="inv-grid">
            {pending.map((invite) => (
              <div key={invite.id} className="inv-card">
                <strong className="inv-name">{invite.name}</strong>
                <span className="inv-email">{invite.email}</span>
                <span className="inv-access">
                  {roleById(invite.roleId).name} ·{" "}
                  {scopeLabel({ roleId: invite.roleId, branchIds: invite.branchIds }, branches)}
                </span>
                <span className="inv-meta">
                  Invited {formatRelative(invite.invitedAt)} by {invite.invitedBy}
                </span>

                <div className="inv-actions">
                  <button
                    type="button"
                    className="panel-btn panel-btn--sm"
                    onClick={() => {
                      resendInvitation(invite.id);
                      flash("Invitation resent to " + invite.email);
                    }}
                  >
                    <RotateCw />
                    Resend
                  </button>
                  <button
                    type="button"
                    className="panel-btn panel-btn--sm panel-btn--danger"
                    onClick={() => {
                      cancelInvitation(invite.id);
                      flash("Invitation to " + invite.name + " cancelled");
                    }}
                  >
                    <X />
                    Cancel invitation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {closed.length > 0 && (
        <section className="panel-card">
          <div className="panel-card-head">
            <div>
              <h2>Expired &amp; cancelled</h2>
              <p>Kept so you can see who was invited before. Resend to try again.</p>
            </div>
          </div>

          <div className="panel-rows">
            {closed.map((invite) => (
              <div key={invite.id} className="panel-row inv-closed">
                <span className="panel-row-text">
                  <strong>{invite.name}</strong>
                  <small>
                    {invite.email} · {roleById(invite.roleId).name} · invited{" "}
                    {formatRelative(invite.invitedAt)}
                  </small>
                </span>
                <div className="panel-row-control">
                  <span className="panel-pill panel-pill--off">{invite.status}</span>
                  <button
                    type="button"
                    className="panel-btn panel-btn--sm"
                    onClick={() => {
                      resendInvitation(invite.id);
                      flash("Invitation resent to " + invite.email);
                    }}
                  >
                    Resend
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="inv-note">
        Once someone accepts, they stop appearing here and show up in{" "}
        <Link to="/dashboard/users-roles/users">Users</Link>.
      </p>

      {addOpen && (
        <AddUserModal
          branches={branches}
          onClose={() => setAddOpen(false)}
          onInvite={(input) => {
            inviteUser(input);
            flash("Invitation sent to " + input.email);
          }}
        />
      )}
    </UsersShell>
  );
}

export default Invitations;
