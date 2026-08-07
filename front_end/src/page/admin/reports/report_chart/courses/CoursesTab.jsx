import { createElement } from "react";
import LaunchChart from "./launch_chart/LaunchChart.jsx";
import CategoryChart from "./category_chart/CategoryChart.jsx";
import SignupChart from "./signup_chart/SignupChart.jsx";
import "./CoursesTab.css";

const charts = [
  { id: "launch", component: LaunchChart },
  { id: "category", component: CategoryChart },
  { id: "signup", component: SignupChart },
];

const CoursesTab = () => {
  return (
    <div className="coursesTabContent">
      <div className="coursesChartsGrid">
        {charts.map(({ id, component: ChartComponent }) => (
          createElement(ChartComponent, { key: id })
        ))}
      </div>
    </div>
  );
};

export default CoursesTab;
