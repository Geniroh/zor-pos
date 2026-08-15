import { ShieldAlert } from "lucide-react";
import Modal from "../../common/Modal";
import { roleById, scopeLabel, type User } from "../users-data";
import "./index.css";

/**
 * Who still hasn't set up 2FA. The overview card answers "how many"; an admin's
 * very next question is "who do I chase", so this names them and offers a
 * reminder per row rather than sending them off to filter a table.
 */

interface TwoFactorModalProps {
  outstanding: User[];
  total: number;
  branches: { id: string; name: string }[];
  onClose: () => void;
  onRemind: (user: User) => void;
}

function TwoFactorModal({ outstanding, total, branches, onClose, onRemind }: TwoFactorModalProps) {
  return (
    <Modal
      icon={<ShieldAlert />}
      title="Two-factor setup outstanding"
      subtitle={outstanding.length + " of " + total + " users haven't set it up"}
      onClose={onClose}
      danger={outstanding.length > 0}
      footer={
        <button type="button" className="panel-btn panel-btn--primary" onClick={onClose}>
          Done
        </button>
      }
    >
      {outstanding.length === 0 ? (
        <p className="tfa-empty">Everyone has two-factor authentication set up.</p>
      ) : (
        <>
          <div className="tfa-list">
            {outstanding.map((user) => (
              <div key={user.id} className="tfa-row">
                <span className="tfa-row-text">
                  <strong>{user.name}</strong>
                  <small>
                    {roleById(user.roleId).name} · {scopeLabel(user, branches)}
                  </small>
                </span>
                <button
                  type="button"
                  className="panel-btn panel-btn--sm"
                  onClick={() => onRemind(user)}
                >
                  Send reminder
                </button>
              </div>
            ))}
          </div>

          <p className="modal-note">
            They aren't locked out. Each is prompted to set up two-factor
            authentication the next time they sign in.
          </p>
        </>
      )}
    </Modal>
  );
}

export default TwoFactorModal;
