import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENT_USER_ID,
  INITIAL_DEVICES,
  INITIAL_INVITATIONS,
  INITIAL_SECURITY,
  USERS,
  roleById,
  type Device,
  type Invitation,
  type RoleId,
  type SecuritySettings,
  type User,
} from "../components/users/users-data";

/**
 * Users & Roles state. Same contract as SettingsContext, deliberately: edits
 * survive navigation within a session but not a restart, there is no
 * localStorage and no backend. Held in context rather than per page because
 * the hub's counts, the users table, invitations, devices and the 2FA overview
 * all read the same records.
 */

interface UsersValue {
  users: User[];
  currentUser: User;

  addUser: (user: User) => void;
  changeRole: (userId: string, roleId: RoleId, branchIds: string[]) => void;
  changeBranches: (userId: string, branchIds: string[]) => void;
  updateUser: (userId: string, patch: Partial<User>) => void;
  setSuspended: (userId: string, suspended: boolean) => void;
  removeUser: (userId: string) => void;

  invitations: Invitation[];
  inviteUser: (input: {
    name: string;
    email: string;
    phone: string;
    roleId: RoleId;
    branchIds: string[];
  }) => Invitation;
  resendInvitation: (id: string) => void;
  cancelInvitation: (id: string) => void;

  devices: Device[];
  revokeDevice: (id: string) => void;

  security: SecuritySettings;
  updateSecurity: (patch: Partial<SecuritySettings>) => void;

  toast: string;
  flash: (message: string) => void;
}

const UsersContext = createContext<UsersValue | undefined>(undefined);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(USERS);
  const [invitations, setInvitations] = useState<Invitation[]>(INITIAL_INVITATIONS);
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [security, setSecurity] = useState<SecuritySettings>(INITIAL_SECURITY);
  const [toast, setToast] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  const updateUser = useCallback((userId: string, patch: Partial<User>) => {
    setUsers((list) => list.map((u) => (u.id === userId ? { ...u, ...patch } : u)));
  }, []);

  const addUser = useCallback((user: User) => {
    setUsers((list) => [...list, user]);
  }, []);

  /**
   * Role and branch scope move together because the role constrains what scope
   * is even valid — promoting a cashier to Pharmacy Administrator has to clear
   * their branch list, or they'd carry a stale scope that the UI would then
   * render as "All branches" anyway.
   */
  const changeRole = useCallback((userId: string, roleId: RoleId, branchIds: string[]) => {
    const scope = roleById(roleId).scope;
    setUsers((list) =>
      list.map((u) =>
        u.id === userId
          ? {
              ...u,
              roleId,
              branchIds: scope === "all" ? [] : branchIds,
            }
          : u,
      ),
    );
  }, []);

  const changeBranches = useCallback((userId: string, branchIds: string[]) => {
    setUsers((list) => list.map((u) => (u.id === userId ? { ...u, branchIds } : u)));
  }, []);

  const setSuspended = useCallback((userId: string, suspended: boolean) => {
    setUsers((list) =>
      list.map((u) => (u.id === userId ? { ...u, status: suspended ? "Suspended" : "Active" } : u)),
    );
  }, []);

  const removeUser = useCallback((userId: string) => {
    setUsers((list) => list.filter((u) => u.id !== userId));
    // A removed user's sessions go with them — leaving live devices behind
    // would misreport who still has access.
    setDevices((list) => list.filter((d) => d.userId !== userId));
  }, []);

  const inviteUser = useCallback<UsersValue["inviteUser"]>((input) => {
    const scope = roleById(input.roleId).scope;
    const created: Invitation = {
      id: "inv-" + Date.now().toString(36),
      name: input.name,
      email: input.email,
      phone: input.phone,
      roleId: input.roleId,
      branchIds: scope === "all" ? [] : input.branchIds,
      status: "Pending",
      invitedAt: Date.now(),
      invitedBy: USERS.find((u) => u.id === CURRENT_USER_ID)?.name ?? "You",
    };
    setInvitations((list) => [created, ...list]);
    return created;
  }, []);

  const resendInvitation = useCallback((id: string) => {
    // Resending restarts the clock, which is what makes an expired invite
    // usable again rather than needing to be recreated.
    setInvitations((list) =>
      list.map((i) => (i.id === id ? { ...i, invitedAt: Date.now(), status: "Pending" } : i)),
    );
  }, []);

  const cancelInvitation = useCallback((id: string) => {
    setInvitations((list) =>
      list.map((i) => (i.id === id ? { ...i, status: "Cancelled" } : i)),
    );
  }, []);

  const revokeDevice = useCallback((id: string) => {
    setDevices((list) => list.filter((d) => d.id !== id));
  }, []);

  const updateSecurity = useCallback((patch: Partial<SecuritySettings>) => {
    setSecurity((s) => ({ ...s, ...patch }));
  }, []);

  const value = useMemo<UsersValue>(() => {
    const currentUser = users.find((u) => u.id === CURRENT_USER_ID) ?? users[0];
    return {
      users,
      currentUser,
      addUser,
      changeRole,
      changeBranches,
      updateUser,
      setSuspended,
      removeUser,
      invitations,
      inviteUser,
      resendInvitation,
      cancelInvitation,
      devices,
      revokeDevice,
      security,
      updateSecurity,
      toast,
      flash,
    };
  }, [
    users,
    addUser,
    changeRole,
    changeBranches,
    updateUser,
    setSuspended,
    removeUser,
    invitations,
    inviteUser,
    resendInvitation,
    cancelInvitation,
    devices,
    revokeDevice,
    security,
    updateSecurity,
    toast,
    flash,
  ]);

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers(): UsersValue {
  const context = useContext(UsersContext);
  if (!context) throw new Error("useUsers must be used within a UsersProvider");
  return context;
}
