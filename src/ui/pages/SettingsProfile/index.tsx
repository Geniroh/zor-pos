import { useRef, useState } from "react";
import { ChevronRight, FileText, ImageUp, Receipt, Trash2, Upload } from "lucide-react";
import SettingsShell from "../../components/settings/SettingsShell";
import ReceiptDrawer from "../../components/settings/ReceiptDrawer";
import { useSettings } from "../../context/SettingsContext";
import {
  formatFileSize,
  formatSettingsDate,
} from "../../components/settings/settings-data";
import "./index.css";

/**
 * Profile & Branding — how the pharmacy identifies itself to customers and on
 * documents. Everything here is pharmacy-level, which is why this screen shows
 * no branch picker: nothing on it varies by location.
 *
 * File handling is real but in-memory: picking a logo or a document reads the
 * actual file and shows its real name, size and preview via an object URL.
 * Nothing is copied to disk and nothing survives a restart — there is no
 * backend, and inventing a main-process file-write for a mock screen would be
 * a bigger commitment than this section warrants.
 */

function SettingsProfile() {
  const {
    profile,
    updateProfile,
    setLogo,
    clearLogo,
    documents,
    replaceDocument,
    flash,
  } = useSettings();

  const [receiptOpen, setReceiptOpen] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);
  const pendingDoc = useRef<string | null>(null);

  function handleLogoPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setLogo(file);
      flash("Logo updated");
    }
    // Reset so picking the same file twice still fires a change event.
    event.target.value = "";
  }

  function handleDocPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const id = pendingDoc.current;
    if (file && id) {
      replaceDocument(id, file);
      flash("Document uploaded");
    }
    pendingDoc.current = null;
    event.target.value = "";
  }

  function requestDoc(id: string) {
    pendingDoc.current = id;
    docInput.current?.click();
  }

  function viewDoc(url: string | null) {
    if (url) {
      window.open(url, "_blank", "noopener");
    } else {
      // Honest about the seeded rows: they describe a file we never had.
      flash("No local copy — upload a replacement to preview it");
    }
  }

  return (
    <>
      <SettingsShell
        title="Profile & Branding"
        subtitle="How your pharmacy identifies itself to customers and on documents."
      >
        <section className="panel-card">
          <div className="panel-card-head">
            <div>
              <h2>Basic information</h2>
              <p>Your registered details and the name customers see.</p>
            </div>
          </div>

          <div className="panel-card-body">
            <div className="profile-identity">
              <div className="profile-logo">
                {profile.logoUrl ? (
                  <img src={profile.logoUrl} alt="Pharmacy logo" />
                ) : (
                  <span className="profile-logo-fallback">
                    {profile.displayName.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="profile-logo-actions">
                <span className="panel-label">Logo</span>
                <p className="panel-hint">
                  Square works best. Used on receipts, invoices and the login screen.
                  {profile.logoName && <> Current file: {profile.logoName}.</>}
                </p>
                <div className="profile-logo-buttons">
                  <button
                    type="button"
                    className="panel-btn panel-btn--sm"
                    onClick={() => logoInput.current?.click()}
                  >
                    <ImageUp />
                    {profile.logoUrl ? "Replace logo" : "Upload logo"}
                  </button>
                  {profile.logoUrl && (
                    <button
                      type="button"
                      className="panel-btn panel-btn--sm panel-btn--ghost"
                      onClick={() => {
                        clearLogo();
                        flash("Logo removed");
                      }}
                    >
                      <Trash2 />
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/*"
                  className="profile-file-input"
                  onChange={handleLogoPick}
                />
              </div>
            </div>

            <div className="panel-grid-2">
              <label className="panel-field">
                <span className="panel-label">Pharmacy / store name</span>
                <input
                  className="panel-input"
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  onBlur={() => flash("Profile updated")}
                />
              </label>

              <label className="panel-field">
                <span className="panel-label">
                  Display name <em>what customers see</em>
                </span>
                <input
                  className="panel-input"
                  value={profile.displayName}
                  onChange={(e) => updateProfile({ displayName: e.target.value })}
                  onBlur={() => flash("Profile updated")}
                />
              </label>
            </div>

            <label className="panel-field">
              <span className="panel-label">License / registration number</span>
              <input
                className="panel-input"
                value={profile.licenseNumber}
                onChange={(e) => updateProfile({ licenseNumber: e.target.value })}
                onBlur={() => flash("Profile updated")}
              />
            </label>

            <label className="panel-field">
              <span className="panel-label">
                Description <em>optional</em>
              </span>
              <textarea
                className="panel-input panel-textarea"
                value={profile.description}
                onChange={(e) => updateProfile({ description: e.target.value })}
                onBlur={() => flash("Profile updated")}
                placeholder="A short description of your pharmacy"
              />
            </label>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-card-head">
            <div>
              <h2>Business documents</h2>
              <p>Keep your licenses and registration up to date.</p>
            </div>
          </div>

          <div className="panel-rows">
            {documents.map((doc) => (
              <div key={doc.id} className="panel-row">
                <div className="profile-doc">
                  <span
                    className={
                      "profile-doc-icon" + (doc.fileName ? "" : " profile-doc-icon--empty")
                    }
                  >
                    <FileText />
                  </span>
                  <span className="panel-row-text">
                    <strong>{doc.label}</strong>
                    <small>
                      {doc.uploadedAt
                        ? "Uploaded " +
                          formatSettingsDate(doc.uploadedAt) +
                          (doc.fileSize ? " · " + formatFileSize(doc.fileSize) : "")
                        : doc.hint}
                    </small>
                  </span>
                </div>

                <div className="panel-row-control">
                  {doc.fileName && (
                    <button
                      type="button"
                      className="panel-btn panel-btn--sm panel-btn--ghost"
                      onClick={() => viewDoc(doc.url)}
                    >
                      View
                    </button>
                  )}
                  <button
                    type="button"
                    className="panel-btn panel-btn--sm"
                    onClick={() => requestDoc(doc.id)}
                  >
                    <Upload />
                    {doc.fileName ? "Replace" : "Upload"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <input
            ref={docInput}
            type="file"
            accept="application/pdf,image/*"
            className="profile-file-input"
            onChange={handleDocPick}
          />
        </section>

        <button
          type="button"
          className="profile-receipt-card"
          onClick={() => setReceiptOpen(true)}
        >
          <span className="profile-receipt-icon">
            <Receipt />
          </span>
          <span className="profile-receipt-text">
            <strong>Receipt appearance</strong>
            <span>Customize what customers see on their receipts.</span>
          </span>
          <ChevronRight className="profile-receipt-arrow" />
        </button>
      </SettingsShell>

      <ReceiptDrawer open={receiptOpen} onClose={() => setReceiptOpen(false)} />
    </>
  );
}

export default SettingsProfile;
