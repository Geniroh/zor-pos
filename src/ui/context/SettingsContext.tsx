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
  INITIAL_ALERTS,
  INITIAL_BRANCHES,
  INITIAL_CREDITS,
  INITIAL_DOCUMENTS,
  INITIAL_PREFERENCES,
  INITIAL_PROFILE,
  INITIAL_RECEIPT,
  INITIAL_SUBSCRIPTION,
  type AiCredits,
  type AlertSetting,
  type Branch,
  type BusinessDocument,
  type NotificationChannel,
  type PharmacyProfile,
  type Preferences,
  type ReceiptSettings,
  type Subscription,
  type WeekHours,
} from "../components/settings/settings-data";

/**
 * App-wide settings state.
 *
 * Lifted into context rather than held per page for the same reason
 * SidebarContext was: the six settings screens are siblings, and edits made on
 * one have to be visible on the hub card and on the others. Scope was signed
 * off as "survives navigation, not restart" — there is deliberately no
 * localStorage or IPC write-through here, matching the rest of the app, which
 * is dummy data over local state.
 *
 * Save model is instant: every setter commits immediately and callers pair it
 * with `flash()`, so no screen owns a Save button or dirty state.
 */

interface SettingsValue {
  profile: PharmacyProfile;
  updateProfile: (patch: Partial<PharmacyProfile>) => void;
  setLogo: (file: File) => void;
  clearLogo: () => void;

  documents: BusinessDocument[];
  replaceDocument: (id: string, file: File) => void;

  receipt: ReceiptSettings;
  updateReceipt: (patch: Partial<ReceiptSettings>) => void;

  branches: Branch[];
  /** Which branch the branch-level screens (Hours, printer) are editing. */
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
  activeBranch: Branch;
  mainBranch: Branch;
  updateBranch: (id: string, patch: Partial<Branch>) => void;
  setBranchHours: (id: string, hours: WeekHours) => void;
  addBranch: (input: Pick<Branch, "name" | "address" | "city" | "phone" | "email" | "manager">) => Branch;

  preferences: Preferences;
  updateSales: (patch: Partial<Preferences["sales"]>) => void;
  updateMedicines: (patch: Partial<Preferences["medicines"]>) => void;
  updateReceiptPrefs: (patch: Partial<Preferences["receipts"]>) => void;

  alerts: AlertSetting[];
  toggleAlertChannel: (id: string, channel: NotificationChannel) => void;

  subscription: Subscription;
  credits: AiCredits;
  changePlan: (planId: string) => void;
  cancelPlan: () => void;
  resumePlan: () => void;

  toast: string;
  flash: (message: string) => void;
}

const SettingsContext = createContext<SettingsValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PharmacyProfile>(INITIAL_PROFILE);
  const [documents, setDocuments] = useState<BusinessDocument[]>(INITIAL_DOCUMENTS);
  const [receipt, setReceipt] = useState<ReceiptSettings>(INITIAL_RECEIPT);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [activeBranchId, setActiveBranchId] = useState(INITIAL_BRANCHES[0].id);
  const [preferences, setPreferences] = useState<Preferences>(INITIAL_PREFERENCES);
  const [alerts, setAlerts] = useState<AlertSetting[]>(INITIAL_ALERTS);
  const [subscription, setSubscription] = useState<Subscription>(INITIAL_SUBSCRIPTION);
  const [credits] = useState<AiCredits>(INITIAL_CREDITS);
  const [toast, setToast] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  const updateProfile = useCallback((patch: Partial<PharmacyProfile>) => {
    setProfile((p) => ({ ...p, ...patch }));
  }, []);

  // Object URLs are revoked as they're replaced so a session of re-picking a
  // logo doesn't leak blobs. Nothing is copied to disk — the file is only ever
  // read by the renderer for preview.
  const setLogo = useCallback((file: File) => {
    setProfile((p) => {
      if (p.logoUrl) URL.revokeObjectURL(p.logoUrl);
      return { ...p, logoUrl: URL.createObjectURL(file), logoName: file.name };
    });
  }, []);

  const clearLogo = useCallback(() => {
    setProfile((p) => {
      if (p.logoUrl) URL.revokeObjectURL(p.logoUrl);
      return { ...p, logoUrl: null, logoName: null };
    });
  }, []);

  const replaceDocument = useCallback((id: string, file: File) => {
    setDocuments((docs) =>
      docs.map((doc) => {
        if (doc.id !== id) return doc;
        if (doc.url) URL.revokeObjectURL(doc.url);
        return {
          ...doc,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: Date.now(),
          url: URL.createObjectURL(file),
        };
      }),
    );
  }, []);

  const updateReceipt = useCallback((patch: Partial<ReceiptSettings>) => {
    setReceipt((r) => ({ ...r, ...patch }));
  }, []);

  const updateBranch = useCallback((id: string, patch: Partial<Branch>) => {
    setBranches((list) => list.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const setBranchHours = useCallback((id: string, hours: WeekHours) => {
    setBranches((list) => list.map((b) => (b.id === id ? { ...b, hours } : b)));
  }, []);

  const addBranch = useCallback<SettingsValue["addBranch"]>((input) => {
    const created: Branch = {
      ...input,
      id: "branch-" + Date.now().toString(36),
      isMain: false,
      active: true,
      // A new branch starts on the main branch's week rather than blank, since
      // "same as everywhere else" is the overwhelmingly common case.
      hours: INITIAL_BRANCHES[0].hours.map((day) => ({
        closed: day.closed,
        periods: day.periods.map((p) => ({ ...p })),
      })),
      printer: { name: "Not set up", paperWidth: "58mm", autoCut: true },
      productCount: 0,
    };
    setBranches((list) => [...list, created]);
    return created;
  }, []);

  const updateSales = useCallback((patch: Partial<Preferences["sales"]>) => {
    setPreferences((p) => ({ ...p, sales: { ...p.sales, ...patch } }));
  }, []);

  const updateMedicines = useCallback((patch: Partial<Preferences["medicines"]>) => {
    setPreferences((p) => ({ ...p, medicines: { ...p.medicines, ...patch } }));
  }, []);

  const updateReceiptPrefs = useCallback((patch: Partial<Preferences["receipts"]>) => {
    setPreferences((p) => ({ ...p, receipts: { ...p.receipts, ...patch } }));
  }, []);

  const toggleAlertChannel = useCallback((id: string, channel: NotificationChannel) => {
    setAlerts((list) =>
      list.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              channels: alert.channels.includes(channel)
                ? alert.channels.filter((c) => c !== channel)
                : [...alert.channels, channel],
            }
          : alert,
      ),
    );
  }, []);

  const changePlan = useCallback((planId: string) => {
    setSubscription((s) => ({ ...s, planId, cancelled: false }));
  }, []);

  const cancelPlan = useCallback(() => {
    setSubscription((s) => ({ ...s, cancelled: true }));
  }, []);

  const resumePlan = useCallback(() => {
    setSubscription((s) => ({ ...s, cancelled: false }));
  }, []);

  const value = useMemo<SettingsValue>(() => {
    const activeBranch = branches.find((b) => b.id === activeBranchId) ?? branches[0];
    const mainBranch = branches.find((b) => b.isMain) ?? branches[0];

    return {
      profile,
      updateProfile,
      setLogo,
      clearLogo,
      documents,
      replaceDocument,
      receipt,
      updateReceipt,
      branches,
      activeBranchId,
      setActiveBranchId,
      activeBranch,
      mainBranch,
      updateBranch,
      setBranchHours,
      addBranch,
      preferences,
      updateSales,
      updateMedicines,
      updateReceiptPrefs,
      alerts,
      toggleAlertChannel,
      subscription,
      credits,
      changePlan,
      cancelPlan,
      resumePlan,
      toast,
      flash,
    };
  }, [
    profile,
    updateProfile,
    setLogo,
    clearLogo,
    documents,
    replaceDocument,
    receipt,
    updateReceipt,
    branches,
    activeBranchId,
    updateBranch,
    setBranchHours,
    addBranch,
    preferences,
    updateSales,
    updateMedicines,
    updateReceiptPrefs,
    alerts,
    toggleAlertChannel,
    subscription,
    credits,
    changePlan,
    cancelPlan,
    resumePlan,
    toast,
    flash,
  ]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
}
