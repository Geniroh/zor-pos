import { useState } from "react";
import { PauseCircle, PlayCircle, UserMinus } from "lucide-react";
import Modal from "../../common/Modal";
import { roleById, scopeLabel, type User } from "../users-data";
import "./index.css";

/**
 * Suspend, restore and remove in one modal, because they are the same
 * decision at three severities and the copy is the only real difference.
 *
 * The severity gradient is the point: suspending is reversible and confirms
 * with one click; removing is not, so it requires typing REMOVE — the same
 * treatment CancelPlanModal uses, and for the same reason.
 */

export type UserAction = "suspend" | "restore" | "remove";

const CONFIRM_WORD = "REMOVE";

interface UserActionModalProps {
  action: UserAction;
  user: User;
  branches: { id: string; name: string }[];
  onClose: () => void;
  onConfirm: () => void;
}

function UserActionModal({ action, user, branches, onClose, onConfirm }: UserActionModalProps) {
  const [typed, setTyped] = useState("");
  const first = user.name.split(" ")[0];
  const isRemove = action === "remove";
  const armed = !isRemove || typed.trim().toUpperCase() === CONFIRM_WORD;

  const copy = {
    suspend: {
      icon: <PauseCircle />,
      title: "Suspend " + first + "?",
      subtitle: "Temporary — you can restore access later",
      lead: first + " can't sign in right now.",
      points: [
        "Their account and history are kept",
        "Signed-in devices are logged out",
        "You can restore access at any time",
      ],
      cta: "Suspend user",
    },
    restore: {
      icon: <PlayCircle />,
      title: "Restore " + first + "'s access?",
      subtitle: "They'll be able to sign in again",
      lead: first + " gets their access back straight away.",
      points: [
        "They keep the role and branches they had before",
        "They'll need to sign in again on their devices",
      ],
      cta: "Restore access",
    },
    remove: {
      icon: <UserMinus />,
      title: "Remove " + first + " from this pharmacy?",
      subtitle: "This can't be undone",
      lead: first + " no longer has access to this pharmacy.",
      points: [
        "All their devices are signed out immediately",
        "Sales and records they created are kept, attributed to them",
        "You'd need to invite them again from scratch",
      ],
      cta: "Remove access",
    },
  }[action];

  return (
    <Modal
      icon={copy.icon}
      title={copy.title}
      subtitle={copy.subtitle}
      onClose={onClose}
      danger={action !== "restore"}
      footer={
        <>
          <button type="button" className="panel-btn" onClick={onClose}>
            {isRemove ? "Keep access" : "Cancel"}
          </button>
          <button
            type="button"
            className={action === "restore" ? "panel-btn panel-btn--primary" : "user-action-confirm"}
            disabled={!armed}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {copy.cta}
          </button>
        </>
      }
    >
      <div className="user-action-who">
        <span className="user-action-avatar">{first[0]}</span>
        <span className="user-action-who-text">
          <strong>{user.name}</strong>
          <small>
            {roleById(user.roleId).name} · {scopeLabel(user, branches)}
          </small>
        </span>
      </div>

      <p className="user-action-lead">{copy.lead}</p>

      <ul className={"user-action-list" + (isRemove ? " user-action-list--danger" : "")}>
        {copy.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      {isRemove && (
        <label className="panel-field">
          <span className="panel-label">
            Type <em>{CONFIRM_WORD}</em> to confirm
          </span>
          <input
            className="panel-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoFocus
          />
        </label>
      )}
    </Modal>
  );
}

export default UserActionModal;
