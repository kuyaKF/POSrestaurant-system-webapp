import { Order } from "../../types";
import { Modal } from "../common/Modal";

export function CancelOrderModal({
  order,
  submitting,
  onClose,
  onConfirm,
}: {
  order: Order;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const subject = order.orderType === "TAKEOUT" ? "this takeout order" : `the order for Table ${order.table?.number}`;

  return (
    <Modal title="Cancel Order" onClose={onClose}>
      <p>
        Cancel {subject}? This removes it from the pipeline and can't be undone.
      </p>
      <div className="form-actions cancel-order-actions">
        <button type="button" className="btn" onClick={onClose} disabled={submitting}>
          Keep Order
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={submitting}>
          {submitting ? "Cancelling…" : "Cancel Order"}
        </button>
      </div>
    </Modal>
  );
}
