import { useState } from "react";
import { UserPlus } from "lucide-react";
import Modal from "../../common/Modal";
import { BranchScopeField, RoleField, RoleSummary } from "../AccessPicker";
import { roleById, type RoleId } from "../users-data";
import "./index.css";

/**
 * Add user: person first, access second.
 *
 * The permission matrix is deliberately absent. At creation time the question
 * is "what job does this person do", not "may they void a sale" — so step 2
 * offers a role and shows its plain-language consequences, and the matrix
 * stays on the Roles screen for when someone actually wants to audit it.
 *
 * Submitting sends an invitation rather than creating a user, keeping the
 * Invitation → User model intact: they become a user when they accept.
 */

export interface NewUserInput {
  name: string;
  email: string;
  phone: string;
  roleId: RoleId;
  branchIds: string[];
}

interface AddUserModalProps {
  branches: { id: string; name: string; city: string }[];
  onClose: () => void;
  onInvite: (input: NewUserInput) => void;
}

function AddUserModal({ branches, onClose, onInvite }: AddUserModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState<RoleId>("pharmacist");
  const [branchIds, setBranchIds] = useState<string[]>([branches[0]?.id].filter(Boolean) as string[]);

  const role = roleById(roleId);
  const canContinue = name.trim() !== "" && email.trim().includes("@");
  // A pharmacy-wide role needs no branches; everyone else needs at least one,
  // or the invitation would grant access to nowhere.
  const canSend = role.scope === "all" || branchIds.length > 0;

  function handleRoleChange(next: RoleId) {
    setRoleId(next);
    const scope = roleById(next).scope;
    // A single-branch role can't inherit a multi-branch selection, so trim it
    // rather than silently keeping a scope the role can't express.
    if (scope === "single" && branchIds.length > 1) setBranchIds(branchIds.slice(0, 1));
    if (scope === "single" && branchIds.length === 0 && branches[0]) setBranchIds([branches[0].id]);
  }

  return (
    <Modal
      icon={<UserPlus />}
      title="Add a team member"
      subtitle={step === 1 ? "Who are they?" : "What can they do, and where?"}
      onClose={onClose}
      footer={
        step === 1 ? (
          <>
            <button type="button" className="panel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="panel-btn panel-btn--primary"
              disabled={!canContinue}
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </>
        ) : (
          <>
            <button type="button" className="panel-btn" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              className="panel-btn panel-btn--primary"
              disabled={!canSend}
              onClick={() => {
                onInvite({
                  name: name.trim(),
                  email: email.trim(),
                  phone: phone.trim(),
                  roleId,
                  branchIds,
                });
                onClose();
              }}
            >
              Send invitation
            </button>
          </>
        )
      }
    >
      <ol className="add-user-steps">
        <li className={step === 1 ? "add-user-step--on" : "add-user-step--done"}>
          <span>1</span>Person
        </li>
        <li className={step === 2 ? "add-user-step--on" : ""}>
          <span>2</span>Access
        </li>
      </ol>

      {step === 1 ? (
        <>
          <label className="panel-field">
            <span className="panel-label">Name</span>
            <input
              className="panel-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Johnson"
              autoFocus
            />
          </label>

          <label className="panel-field">
            <span className="panel-label">Email</span>
            <input
              className="panel-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
            />
          </label>

          <label className="panel-field">
            <span className="panel-label">
              Phone number <em>optional</em>
            </span>
            <input
              className="panel-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0803 000 0000"
            />
          </label>
        </>
      ) : (
        <>
          <RoleField value={roleId} onChange={handleRoleChange} />
          <BranchScopeField
            roleId={roleId}
            value={branchIds}
            onChange={setBranchIds}
            branches={branches}
          />
          <RoleSummary role={role} />
          <p className="modal-note">
            {name.trim() || "They"} will get an email invitation. They become a user once
            they accept it and set up their account.
          </p>
        </>
      )}
    </Modal>
  );
}

export default AddUserModal;
