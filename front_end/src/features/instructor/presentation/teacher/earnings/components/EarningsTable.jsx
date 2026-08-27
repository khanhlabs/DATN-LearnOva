import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { formatVnd } from "../earningsPageUtils";

const PAGE_SIZE = 8;

const EarningsTable = ({ items = [], onView }) => {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = items.slice(start, start + PAGE_SIZE);

  return (
    <div className="teacher-earnings-panel">
      <div className="teacher-earnings-table-wrap">
        <table className="teacher-earnings-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Paid amount</th>
              <th>Platform fee</th>
              <th>Net earnings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="teacher-earnings-empty">
                  No course transactions yet.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr key={item.orderItemId}>
                  <td>{item.studentName || "—"}</td>
                  <td>
                    <span className="teacher-earnings-course" title={item.courseTitle}>
                      {item.courseTitle || "—"}
                    </span>
                  </td>
                  <td>{formatVnd(item.paidAmount)}</td>
                  <td>{formatVnd(item.platformFee)}</td>
                  <td>{formatVnd(item.instructorIncome)}</td>
                  <td>
                    <button
                      type="button"
                      className="teacher-earnings-view-btn"
                      onClick={() => onView(item)}
                      aria-label={`View receipt ${item.transactionId || item.orderId}`}
                      title="View receipt"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {items.length > PAGE_SIZE ? (
        <div className="teacher-earnings-pagination">
          <button
            type="button"
            className="teacher-earnings-page-btn"
            disabled={safePage === 1}
            onClick={() => setPage((value) => value - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              type="button"
              className={`teacher-earnings-page-btn ${
                safePage === index + 1 ? "is-active" : ""
              }`}
              onClick={() => setPage(index + 1)}
              aria-label={`Page ${index + 1}`}
              aria-current={safePage === index + 1 ? "page" : undefined}
            >
              {index + 1}
            </button>
          ))}
          <button
            type="button"
            className="teacher-earnings-page-btn"
            disabled={safePage === totalPages}
            onClick={() => setPage((value) => value + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default EarningsTable;
