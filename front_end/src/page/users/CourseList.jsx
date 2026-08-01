import React, { useState } from "react";
import CourseFilter from "./course/components/CourseFilter.jsx";
import CourseCard from "./course/components/CourseCard.jsx";
import "./course/css/CourseList.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Dữ liệu mẫu, bạn có thể thay bằng API sau
const courses = [
    {
        id: 1,
        title: "Lập trình Fullstack Master Node.js",
        author: "Nguyễn Văn A",
        price: 1290000,
        rating: 4.9,
        reviews: 2400,
        category: "Công nghệ",
        tag: "Bestseller",
        image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 2,
        title: "Phân tích dữ liệu kinh doanh",
        author: "Trần Thị B",
        price: 990000,
        rating: 4.8,
        reviews: 1600,
        category: "Marketing",
        image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 3,
        title: "Thiết kế UI/UX Chuyên sâu",
        author: "Lê Hoàng C",
        price: 1590000,
        rating: 4.7,
        reviews: 1800,
        category: "Thiết kế",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 4,
        title: "Digital Marketing Mastery",
        author: "Phạm Thị D",
        price: 690000,
        rating: 4.8,
        reviews: 1200,
        category: "Marketing",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 5,
        title: "Quản trị nhân sự hiện đại",
        author: "Nguyễn Văn E",
        price: 1100000,
        rating: 4.9,
        reviews: 3200,
        category: "Kỹ năng mềm",
        image: "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 6,
        title: "Python for Data Science",
        author: "Vũ Diên F",
        price: 1390000,
        rating: 4.9,
        reviews: 2100,
        category: "Công nghệ",
        image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 7,
        title: "Nghệ thuật thuyết trình",
        author: "Vũ Thị G",
        price: 560000,
        rating: 4.7,
        reviews: 1400,
        category: "Kinh doanh",
        image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 8,
        title: "Tiếng Anh giao tiếp cơ bản",
        author: "Nguyễn Thị H",
        price: 2100000,
        rating: 4.8,
        reviews: 2600,
        category: "Ngoại ngữ",
        image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80",
    },
];
const heroVideo =
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

export default function CourseList() {
    const [search, setSearch] = useState("");

    return (
        <div className="course-list-page">

            <div className="hero-section">
                <video className="hero-video" autoPlay muted loop playsInline>
                    <source src={heroVideo} type="video/mp4" />
                </video>

                <div className="hero-overlay"></div>

                <div className="hero-content">
                    <h1>Khám phá khóa học chất lượng</h1>
                    <p>Học mọi lúc, phát triển kỹ năng cùng Learnova</p>
                </div>
            </div>
            <div className="course-list-content">
                <CourseFilter />
                <main className="course-list-main">
                    <div className="course-list-info">
                        <div className="sort-wrapper">
                            <span className="sort-label">Sắp xếp:</span>

                            <select className="sort-select">
                                <option>Phổ biến nhất</option>
                                <option>Mới nhất</option>
                                <option>Giá tăng dần</option>
                                <option>Giá giảm dần</option>
                            </select>
                        </div>
                    </div>
                    <div className="course-list-grid">
                        {courses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>

                    <div className="pagination">
                        <button>{"<"}</button>
                        <button className="active">1</button>
                        <button>2</button>
                        <button>3</button>
                        <span>...</span>
                        <button>11</button>
                        <button>{">"}</button>
                    </div>
                </main>
            </div>
            <ToastContainer position="top-right" autoClose={2000} />

        </div>
    );
}
