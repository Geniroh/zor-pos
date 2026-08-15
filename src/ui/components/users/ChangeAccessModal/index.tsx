import { useState } from "react";
import { Building2, KeyRound } from "lucide-react";
import Modal from "../../common/Modal";
import { BranchScopeField, RoleField, RoleSummary } from "../AccessPicker";
import { roleById, scopeLabel, type RoleId, type User } from "../users-data";

/**
 * "Change role" and "Change branch" are two entries in the actions menu but
 * one modal, because changing a role can force the branch scope to change with
 * it — promote a cashier to Pharmacy Administrator and their branch list stops
 * meaning anything. Splitting them into two modals would let you leave a user
 * in a state neither modal could show you.
 *
 * `mode` only decides which control leads and what the modal is called; both
 * are editable either way.
 *
 * Conditionally rendered by its parent (the DiscountModal pattern): its drafts
 * are seeded from the user's current access and must reset on each open.
 */

interface ChangeAccessModalProps {
  mode: "role" | "branch";
  user: User;
  branches: { id: string; name: string; city: string }[];
  onClose: () => void;
  onSave: (roleId: RoleId, branchIds: string[]) => void;
}

function ChangeAccessModal({ mode, user, branches, onClose, onSave }: ChangeAccessModalProps) {
  const [roleId, setRoleId] = useState<RoleId>(user.roleId);
  const [branchIds, setBranchIds] = useState<string[]>(user.branchIds);

  const role = roleById(roleId);
  const changed = roleId !== user.roleId || branchIds.join() !== user.branchIds.join();
  const valid = role.scope === "all" || branchIds.length > 0;

  function handleRoleChange(next: RoleId) {
    setRoleId(next);
    const scope = roleById(next).scope;
    if (scope === "single" && branchIds.length !== 1) {
      setBranchIds(branchIds.slice(0, 1).length ? branchIds.slice(0, 1) : [branches[0].id]);
    }
  }

  return (
    <Modal
      icon={mode === "role" ? <KeyRound /> : <Building2 />}
      title={mode === "role" ? "Change role" : "Change branch access"}
      subtitle={user.name}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="panel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="panel-btn panel-btn--primary"
            disabled={!changed || !valid}
            onClick={() => {
              onSave(roleId, role.scope === "all" ? [] : branchIds);
              onClose();
            }}
          >
            Save changes
          </button>
        </>
      }
    >
      <div className="panel-field">
        <span className="panel-label">Currently</span>
        <p className="panel-hint">
          {roleById(user.roleId).name} · {scopeLabel(user, branches)}
        </p>
      </div>

      <RoleField value={roleId} onChange={handleRoleChange} />
      <BranchScopeField
        roleId={roleId}
        value={branchIds}
        onChange={setBranchIds}
        branches={branches}
      />
      <RoleSummary role={role} />
    </Modal>
  );
}

export default ChangeAccessModal;
