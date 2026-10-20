import { Order } from "../../types";
import { formatCurrency } from "../../lib/format";

export function VatBreakdown({ order }: { order: Order }) {
  return (
    <div className="vat-breakdown">
      {order.discountType ? (
        <>
          <div className="vat-breakdown-row">
            <span>VAT-Exempt Sales</span>
            <span>{formatCurrency(order.vatExemptSales)}</span>
          </div>
          <div className="vat-breakdown-row vat-breakdown-row--discount">
            <span>Less: {order.discountType === "SENIOR" ? "Senior Citizen" : "PWD"} Discount (20%)</span>
            <span>-{formatCurrency(order.discountAmount)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="vat-breakdown-row">
            <span>VATable Sales</span>
            <span>{formatCurrency(order.vatableSales)}</span>
          </div>
          <div className="vat-breakdown-row">
            <span>VAT (12%)</span>
            <span>{formatCurrency(order.vatAmount)}</span>
          </div>
        </>
      )}
    </div>
  );
}
