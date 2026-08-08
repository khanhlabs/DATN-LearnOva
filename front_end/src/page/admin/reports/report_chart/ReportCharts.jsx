import { useState } from "react";
import { reportChartTabs } from "./reportChartTabs.js";
import "./ReportCharts.css";

const DEFAULT_TAB_ID = "dashboard";

const ReportCharts = () => {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB_ID);

  const activeTabConfig =
    reportChartTabs.find((tab) => tab.id === activeTab) ?? reportChartTabs[0];
  const ActiveTabContent = activeTabConfig.Component;

  return (
    <section className="reportChartsSection">
      <div className="reportChartsHeader">
        <h2>ANALYTICS DETAILS</h2>
      </div>

      <div className="reportChartsTabNav">
        <div className="tabNavContainer">
          {reportChartTabs.map((tab) => (
            <button
              key={tab.id}
              className={`tabNavButton ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="reportChartsContent">
        <ActiveTabContent />
      </div>
    </section>
  );
};

export default ReportCharts;
