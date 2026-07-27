import { useState } from "react";
import { Search, FileText } from "lucide-react";
import AdminHoverSelect from "../../shared/AdminHoverSelect";
import "./TransactionLog.css";
import { useTranslation } from "react-i18next";

const transactions = [
  {
    id: "GD-20240603-001",
    student: "Nguyễn Thị An",
    course: "Basic English Communication",
    gateway: "VNPay",
    amount: "$240",
    status: "Successful",
    type: "Completed",
  },
  {
    id: "GD-20240603-002",
    student: "Trần Minh Quân",
    course: "Next.js Development from Beginner to Advanced",
    gateway: "Momo",
    amount: "$360",
    status: "Pending",
    type: "Payment",
  },
  {
    id: "GD-20240603-003",
    student: "Lê Thị Hương",
    course: "UX/UI Design for Online Learning Products",
    gateway: "Banking",
    amount: "$180",
    status: "Failed",
    type: "Refund",
  },
  {
    id: "GD-20240603-004",
    student: "Phạm Văn Dũng",
    course: "Data Analysis with Python",
    gateway: "VNPay",
    amount: "$420",
    status: "Successful",
    type: "Payment",
  },
  {
    id: "GD-20240603-005",
    student: "Hoàng Ngọc Mai",
    course: "Agile Project Management for Instructors",
    gateway: "Momo",
    amount: "$95",
    status: "Successful",
    type: "Completed",
  },
  {
    id: "GD-20240603-006",
    student: "Đỗ Đức Anh",
    course: "Course Marketing on Digital Platforms",
    gateway: "Banking",
    amount: "$275",
    status: "Pending",
    type: "Payment",
  },
  {
    id: "GD-20240603-007",
    student: "Nguyễn Thị Thu",
    course: "Creating Interactive Video Content",
    gateway: "VNPay",
    amount: "$150",
    status: "Successful",
    type: "Completed",
  },
  {
    id: "GD-20240603-008",
    student: "Trần Duy Khang",
    course: "Developing Online Teaching Skills",
    gateway: "Momo",
    amount: "$310",
    status: "Successful",
    type: "Payment",
  },
  {
    id: "GD-20240603-009",
    student: "Vũ Ngọc Mai",
    course: "Advanced SEO for Courses",
    gateway: "Banking",
    amount: "$135",
    status: "Successful",
    type: "Completed",
  },
  {
    id: "GD-20240603-010",
    student: "Phạm Quốc Bảo",
    course: "Building Corporate Learning Paths",
    gateway: "VNPay",
    amount: "$530",
    status: "Pending",
    type: "Payment",
  },
  {
    id: "GD-20240603-011",
    student: "Hà Thanh Vân",
    course: "Interactive Livestreaming Techniques",
    gateway: "Momo",
    amount: "$210",
    status: "Successful",
    type: "Completed",
  },
  {
    id: "GD-20240603-012",
    student: "Trần Minh Tâm",
    course: "Course Sales Strategy on LearnOva",
    gateway: "Banking",
    amount: "$390",
    status: "Successful",
    type: "Payment",
  },
];

const statusClasses = {
  Successful: "statusSuccess",
  Pending: "statusPending",
  Failed: "statusFailed",
};

const PAGE_SIZE = 7;

const TransactionLog = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedGateway, setSelectedGateway] = useState("All Payment Gateways");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const currentTransactions = transactions.slice(
    pageStart,
    pageStart + PAGE_SIZE,
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
  };
  const categoryOptions = ["All Categories", ...new Set(transactions.map((item) => item.type))];
  const gatewayOptions = ["All Payment Gateways", ...new Set(transactions.map((item) => item.gateway))];
  const statusOptions = ["All Statuses", ...new Set(transactions.map((item) => item.status))];

  return (
    <section
      className="transactionLogSection"
      aria-label="Revenue transaction log"
    >
      <div className="transactionLogHeader">
        <div>
          <h2 className="transactionLogTitle">{t("revenueDetails.log")}</h2>
          <p className="transactionLogSubtitle">
            {t("revenueDetails.logDesc")}
          </p>
        </div>
      </div>

      <div className="transactionLogCard">
        <div className="transactionLogControls">
          <label className="transactionSearch">
            <Search size={16} />
            <input placeholder={t("revenueDetails.search")} />
          </label>
          <div className="transactionFilters">
            <AdminHoverSelect
              className="transactionFilterSelect"
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
              ariaLabel="Filter transactions by category"
            />
            <AdminHoverSelect
              className="transactionFilterSelect transactionFilterSelectWide"
              options={gatewayOptions}
              value={selectedGateway}
              onChange={setSelectedGateway}
              ariaLabel="Filter transactions by payment gateway"
            />
            <AdminHoverSelect
              className="transactionFilterSelect"
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              ariaLabel="Filter transactions by status"
            />
          </div>
        </div>

        <div className="transactionLogTableWrapper">
          <table className="transactionLogTable">
            <thead>
              <tr>
                <th>{t("revenueDetails.transactionId")}</th><th>{t("revenueDetails.student")}</th><th>{t("revenueDetails.courseName")}</th><th>{t("revenueDetails.gateway")}</th><th>{t("revenueDetails.value")}</th><th>{t("revenueDetails.status")}</th><th>{t("revenueDetails.action")}</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.id}</td>
                  <td>{transaction.student}</td>
                  <td>{transaction.course}</td>
                  <td>{transaction.gateway}</td>
                  <td className="textRight">{transaction.amount}</td>
                  <td>
                    <span
                      className={`transactionStatus ${statusClasses[transaction.status]}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="textCenter">
                    <button
                      type="button"
                      className="transactionActionButton"
                      aria-label={`View invoice ${transaction.id}`}
                    >
                      <FileText size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="transactionLogPagination">
            <button
              type="button"
              className="paginationButton"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                type="button"
                className={`paginationButton ${
                  currentPage === index + 1 ? "active" : ""
                }`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button
              type="button"
              className="paginationButton"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default TransactionLog;
