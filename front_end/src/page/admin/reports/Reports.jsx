import ReportCards from "./report_card/ReportCards.jsx";
import ReportFilter from "./report_filter/ReportFilter.jsx";
import ReportCharts from "./report_chart/ReportCharts.jsx";
import "./Reports.css";

const Reports = () => {
  return (
    <div className="reportsPage">
      <div className="reportsPageInner">
        <ReportCards />
        <ReportFilter />
        <ReportCharts />
      </div>
    </div>
  );
};

export default Reports;
