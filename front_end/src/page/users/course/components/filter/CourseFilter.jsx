import React from "react";
import "../css/CourseFilter.css";

export default function CourseFilter() {
    return (
        <aside className="course-filter">
            <h4>Bộ lọc</h4>
            <div className="filter-group categories-list">
                <b>Danh mục</b>
                <label>
                    <input type="checkbox" /> Công nghệ
                </label>
                <label>
                    <input type="checkbox" /> Kinh doanh
                </label>
                <label>
                    <input type="checkbox" /> Thiết kế
                </label>
                <label>
                    <input type="checkbox" /> Marketing
                </label>
                <label>
                    <input type="checkbox" /> Ngoại ngữ
                </label>
                <label>
                    <input type="checkbox" /> Kỹ năng mềm
                </label>
                <label>
                    <input type="checkbox" /> Kỹ năng mềm
                </label>
                <label>
                    <input type="checkbox" /> Kỹ năng mềm
                </label>
                <label>
                    <input type="checkbox" /> Kỹ năng mềm
                </label>
                <label>
                    <input type="checkbox" /> Kỹ năng mềm
                </label>

            </div>
            <div className="filter-group">
                <b>Trình độ</b>
                <div><input type="checkbox" /> Cơ bản</div>
                <div><input type="checkbox" /> Trung bình</div>
                <div><input type="checkbox" /> Nâng cao</div>
            </div>
            <div className="filter-group">
                <b>Khoảng giá</b>
                <input type="range" min="0" max="3000000" />
                <div>0đ - 3.000.000đ</div>
            </div>
            <div className="filter-group">
                <b>Đánh giá</b>
                <div><input type="checkbox" /> 5 sao</div>
                <div><input type="checkbox" /> 4 sao trở lên</div>
            </div>
        </aside>
    );
}