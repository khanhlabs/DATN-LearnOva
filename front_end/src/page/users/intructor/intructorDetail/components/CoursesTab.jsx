import React, { useState } from 'react';
import { Star, Eye, Calendar, BookOpen, Clock, Heart, Search, Filter } from 'lucide-react';
import { Course } from '../types';

interface CoursesTabProps {
    courses: Course[];
    searchQuery: string;
    onSelectCourse: (course: Course) => void;
    onAddToCart: (course: Course) => void;
    isInCart: (course: Course) => boolean;
}

export const CoursesTab: React.FC<CoursesTabProps> = ({
                                                          courses,
                                                          searchQuery,
                                                          onSelectCourse,
                                                          onAddToCart,
                                                          isInCart,
                                                      }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [sortOption, setSortOption] = useState<string>('default');
    const [favorites, setFavorites] = useState<string[]>([]);

    // Toggle favorite list states
    const toggleFavorite = (courseId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFavorites(prev =>
            prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
        );
    };

    // 1. Dynamic Search matching
    const queriedCourses = courses.filter((c) => {
        const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchSearch;
    });

    // 2. Category matching
    const categorisedCourses = queriedCourses.filter((c) => {
        if (selectedCategory === 'All') return true;
        if (selectedCategory === 'React') return c.category.toLowerCase().includes('react');
        if (selectedCategory === 'JS') return c.category.toLowerCase().includes('javascript') || c.category.toLowerCase().includes('js');
        return true;
    });

    // 3. Sorting operation
    const sortedCourses = [...categorisedCourses].sort((a, b) => {
        if (sortOption === 'price-asc') return a.price - b.price;
        if (sortOption === 'price-desc') return b.price - a.price;
        if (sortOption === 'rating') return b.rating - a.rating;
        if (sortOption === 'students') return b.students - a.students;
        return 0; // Default order
    });

    const categories = [
        { key: 'All', label: 'Tất Cả' },
        { key: 'React', label: 'React & Frontend' },
        { key: 'JS', label: 'JavaScript Core' }
    ];

    return (
        <div className="space-y-6">
            {/* Filtering control row */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                <div className="flex bg-slate-100 rounded-lg p-0.5 self-start">
                    {categories.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                                selectedCategory === cat.key
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-850'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400" />
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue font-semibold text-slate-600 bg-white"
                    >
                        <option value="default">Mặc định</option>
                        <option value="price-asc">Giá: Thấp đến Cao</option>
                        <option value="price-desc">Giá: Cao đến Thấp</option>
                        <option value="rating">Đánh Giá: Cao Nhất</option>
                        <option value="students">Học Viên: Đông Nhất</option>
                    </select>
                </div>
            </div>

            {searchQuery && (
                <p className="text-xs text-slate-400">
                    Đang hiển thị {sortedCourses.length} kết quả phù hợp cho cụm từ tìm kiếm &ldquo;<span className="font-semibold text-slate-600">{searchQuery}</span>&rdquo;
                </p>
            )}

            {/* Primary Courses Grid */}
            {sortedCourses.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-150 text-slate-400">
                    <p className="text-sm">Không tìm thấy khóa học nào phù hợp với bộ lọc hiện tại.</p>
                    <button
                        onClick={() => { setSelectedCategory('All'); setSortOption('default'); }}
                        className="mt-3 text-xs text-brand-blue font-bold hover:underline"
                    >
                        Reset bộ lọc
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedCourses.map((course) => {
                        const added = isInCart(course);
                        const isFav = favorites.includes(course.id);
                        return (
                            <div
                                key={course.id}
                                className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex flex-col justify-between"
                                onClick={() => onSelectCourse(course)}
                            >
                                {/* Banner Wrapper */}
                                <div className="h-44 bg-slate-950 relative overflow-hidden shrink-0">
                                    <img
                                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                                        src={course.image}
                                        alt={course.title}
                                    />
                                    {course.isBestseller && (
                                        <span className="absolute top-3 left-3 bg-brand-blue text-white text-[9px] px-2.5 py-1 rounded-md font-extrabold tracking-wider shadow-sm">
                      BEST SELLER
                    </span>
                                    )}
                                    {/* Category Pill Tag */}
                                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-slate-250 text-[10px] px-2 py-0.5 rounded-sm font-semibold">
                    {course.category}
                  </span>
                                    {/* Floating click buttons */}
                                    <button
                                        onClick={(e) => toggleFavorite(course.id, e)}
                                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/70 backdrop-blur-xs hover:bg-white text-slate-700 transition-all scale-active shadow-xs"
                                        title={isFav ? 'Xóa khỏi yêu thích' : 'Lưu yêu thích'}
                                    >
                                        <Heart size={14} className={isFav ? 'fill-red-500 text-red-500' : 'text-slate-600'} />
                                    </button>
                                </div>

                                {/* Primary Info */}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-display font-bold text-[15px] text-slate-900 mb-1.5 line-clamp-2 leading-snug group-hover:text-brand-blue transition-colors">
                                            {course.title}
                                        </h3>

                                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4 flex-wrap">
                                            <div className="flex items-center gap-1">
                                                <Star className="text-brand-gold fill-brand-gold w-3.5 h-3.5 shrink-0" />
                                                <span className="font-bold text-slate-700">{course.rating}</span>
                                            </div>
                                            <span className="text-slate-200 shrink-0">|</span>
                                            <span>{(course.students / 1000).toFixed(1)}k Học viên</span>
                                            <span className="text-slate-200 shrink-0">|</span>
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                <span>{course.duration}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-slate-50 gap-2 shrink-0">
                    <span className="font-display font-extrabold text-slate-900 text-lg">
                      {course.price.toLocaleString('vi-VN')}₫
                    </span>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddToCart(course);
                                                }}
                                                className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                                                    added
                                                        ? 'bg-emerald-100 text-emerald-600 cursor-default'
                                                        : 'bg-blue-50 text-brand-blue hover:bg-brand-blue hover:text-white'
                                                }`}
                                            >
                                                {added ? 'Đã đăng ký' : 'Mua ngay'}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectCourse(course);
                                                }}
                                                className="p-1 px-2.5 rounded-md text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-1"
                                                title="Xem giáo trình"
                                            >
                                                <Eye size={12} />
                                                Chi tiết
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
