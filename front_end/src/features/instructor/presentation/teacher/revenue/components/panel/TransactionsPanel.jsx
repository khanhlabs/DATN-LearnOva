import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate } from "../../data/revenuePageData";

const ITEMS_PER_PAGE = 8;

const TransactionsPanel = ({ transactions = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedTransactions = transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <section className="teacher-revenue-panel-wrap">
      <header className="teacher-revenue-panel-title">
        <h2>Latest transactions</h2>
      </header>

      <article className="teacher-revenue-panel teacher-revenue-transactions">
      <table>
        <colgroup>
          <col style={{ width: "24%" }} />
          <col style={{ width: "34%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "8%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Amount</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pagedTransactions.length === 0 ? (
            <tr>
              <td colSpan={5} className="teacher-revenue-empty">No transactions yet.</td>
            </tr>
          ) : (
            pagedTransactions.map((transaction) => (
              <tr key={`${transaction.orderId}-${transaction.courseTitle}`}>
                <td>{transaction.studentName}</td>
                <td>
                  <span className="teacher-revenue-transactions__course" title={transaction.courseTitle}>
                    {transaction.courseTitle}
                  </span>
                </td>
                <td>{formatCurrency(transaction.amount)}</td>
                <td>{formatDate(transaction.paidAt)}</td>
                <td>
                  <span className="teacher-revenue-transactions__status" title="Completed" aria-label="Completed">
                    <CheckCircle2 size={15} />
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="teacher-revenue-transactions__pagination">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      </article>
    </section>
  );
};

export default TransactionsPanel;
