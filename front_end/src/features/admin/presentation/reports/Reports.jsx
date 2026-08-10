import ReportCards from "./report_card/ReportCards";
import ReportFilter from "./report_filter/ReportFilter";
import ReportCharts from "./report_chart/ReportCharts";
import "./Reports";

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
