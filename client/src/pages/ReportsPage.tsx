import { useEffect, useState } from "react";
import { DailyReading } from "../types";
import { fetchXReading, postZReading, fetchReadings } from "../api/reports";
import { ApiError } from "../api/client";
import { useCurrentStaff } from "../context/CurrentStaffContext";
import { formatBusinessDate, formatCurrency, formatDateTime } from "../lib/format";
import { Loading } from "../components/common/Loading";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { EmptyState } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";

function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ReadingSummary({ reading }: { reading: DailyReading }) {
  return (
    <div className="reading-summary">
      <div className="reading-summary-row reading-summary-row--total">
        <span>Net Sales</span>
        <span>{formatCurrency(reading.netSales)}</span>
      </div>
      <div className="reading-summary-row">
        <span>Gross Sales</span>
        <span>{formatCurrency(reading.grossSales)}</span>
      </div>
      <div className="reading-summary-row">
        <span>VATable Sales</span>
        <span>{formatCurrency(reading.vatableSales)}</span>
      </div>
      <div className="reading-summary-row">
        <span>VAT (12%)</span>
        <span>{formatCurrency(reading.vatAmount)}</span>
      </div>
      <div className="reading-summary-row">
        <span>VAT-Exempt Sales</span>
        <span>{formatCurrency(reading.vatExemptSales)}</span>
      </div>
      <div className="reading-summary-row">
        <span>Senior/PWD Discounts</span>
        <span>-{formatCurrency(reading.discountTotal)}</span>
      </div>
      <div className="reading-summary-row">
        <span>Transactions</span>
        <span>{reading.transactionCount}</span>
      </div>
      <div className="reading-summary-row">
        <span>Cancelled Orders</span>
        <span>{reading.cancelledCount}</span>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const { currentStaff } = useCurrentStaff();
  const [date, setDate] = useState(todayDateString());
  const [xReading, setXReading] = useState<DailyReading | null>(null);
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [closing, setClosing] = useState(false);

  const isManager = currentStaff?.role === "MANAGER";

  function loadHistory() {
    if (!currentStaff) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchReadings(currentStaff.id)
      .then(setReadings)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load readings"))
      .finally(() => setLoading(false));
  }

  useEffect(loadHistory, [currentStaff?.id]);

  async function handleRunXReading() {
    if (!currentStaff) return;
    setRunning(true);
    setError(null);
    try {
      const reading = await fetchXReading(currentStaff.id, date);
      setXReading(reading);
      loadHistory();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to run X-reading");
    } finally {
      setRunning(false);
    }
  }

  async function handleCloseDay() {
    if (!currentStaff) return;
    setClosing(true);
    setError(null);
    try {
      await postZReading(currentStaff.id, date);
      setConfirmingClose(false);
      loadHistory();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to close the day");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
      </div>

      {!currentStaff && <ErrorBanner message="Select a staff member from the header to run reports." />}
      {error && <ErrorBanner message={error} />}

      <div className="card reports-panel" style={{ padding: 16 }}>
        <div className="reports-controls">
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Business Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!currentStaff || running}
            onClick={handleRunXReading}
          >
            {running ? "Running…" : "Run X-Reading"}
          </button>
          {isManager && (
            <button
              type="button"
              className="btn btn-danger"
              disabled={!currentStaff || closing}
              onClick={() => setConfirmingClose(true)}
            >
              Close Day (Z-Reading)
            </button>
          )}
        </div>

        {xReading && (
          <>
            <h2 style={{ fontSize: 16 }}>X-Reading — {formatBusinessDate(xReading.businessDate)}</h2>
            <ReadingSummary reading={xReading} />
          </>
        )}
      </div>

      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Reading History</h2>
        {loading ? (
          <Loading />
        ) : readings.length === 0 ? (
          <EmptyState message="No readings yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Business Date</th>
                  <th>Net Sales</th>
                  <th>Transactions</th>
                  <th>Generated By</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className={`reading-type-badge reading-type-badge--${r.type}`}>{r.type}</span>
                    </td>
                    <td>{formatBusinessDate(r.businessDate)}</td>
                    <td>{formatCurrency(r.netSales)}</td>
                    <td>{r.transactionCount}</td>
                    <td>{r.generatedBy.name}</td>
                    <td>{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmingClose && (
        <Modal title="Close Day (Z-Reading)" onClose={() => !closing && setConfirmingClose(false)}>
          <p>
            Close out {date} with a Z-reading? This finalizes the day's totals and can't be run again for the same
            date.
          </p>
          <div className="form-actions cancel-order-actions">
            <button type="button" className="btn" onClick={() => setConfirmingClose(false)} disabled={closing}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleCloseDay} disabled={closing}>
              {closing ? "Closing…" : "Close Day"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
