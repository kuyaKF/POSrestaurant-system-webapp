import { useState } from "react";
import { Staff } from "../../types";
import { useCurrentStaff } from "../../context/CurrentStaffContext";
import { Modal } from "../common/Modal";

export function PinConfirmModal({
  staff,
  onClose,
  onSuccess,
}: {
  staff: Staff;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { verifyAndSwitch } = useCurrentStaff();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function handleConfirm() {
    if (!pin || verifying) return;
    setVerifying(true);
    setError(null);
    const err = await verifyAndSwitch(staff.id, pin);
    setVerifying(false);
    if (err) {
      setError(err);
      setPin("");
      return;
    }
    onSuccess();
  }

  return (
    <Modal title={`Enter PIN for ${staff.name}`} onClose={onClose}>
      <div className="form-row">
        <label>PIN</label>
        <input
          className="input"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
        />
      </div>
      {error && <p className="pin-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn" onClick={onClose} disabled={verifying}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={verifying || !pin}>
          {verifying ? "Verifying…" : "Confirm"}
        </button>
      </div>
    </Modal>
  );
}
