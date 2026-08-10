import React, { useState } from 'react';
import { Star, MessageSquareCode, CheckCircle, Award } from 'lucide-react';
import { Review } from '../types';

interface ReviewsTabProps {
    reviews: Review[];
    onAddReview: (review: Omit<Review, 'id' | 'date'>) => void;
    avgRating: number;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({
                                                          reviews,
                                                          onAddReview,
                                                          avgRating,
                                                      }) => {
    const [newAuthor, setNewAuthor] = useState('');
    const [newRole, setNewRole] = useState('');
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [successMsg, setSuccessMsg] = useState(false);

    // Dynamic distribution stats
    const ratingsCount = reviews.length;
    const ratingDistribution = [
        { stars: 5, count: reviews.filter(r => r.rating === 5).length },
        { stars: 4, count: reviews.filter(r => r.rating === 4).length },
        { stars: 3, count: reviews.filter(r => r.rating === 3).length },
        { stars: 2, count: reviews.filter(r => r.rating === 2).length },
        { stars: 1, count: reviews.filter(r => r.rating === 1).length },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAuthor.trim() || !newComment.trim()) return;

        onAddReview({
            author: newAuthor,
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoJUUrW3GzuR1U3jpw9RWBZ6DPPbrlipDjaLBchxclI-oIzbcnVRDWYLMUS70i-tjRnk9iCsIdiph4ZYuYAkJ8GIaS5Io5BwFD-MvOlquXosEljR8vRWjxteCvpjij2oLSIqCKcJZqrPj1atoeo8Co8EeOMSHvPiNnZYZxh4hw2WpFW5ptaRrEaQIZXfvrkIOVuqYMs6TqQeoxl6J2NWTgweb1FumU3jTe78eLIdBYJ_xzgNKkDwLkbzgdrEMnou78Jvs9U3DC1vQ', // fallback user
            role: newRole || 'Học viên ngành Web',
            rating: newRating,
            comment: newComment,
        });

        setNewAuthor('');
        setNewRole('');
        setNewComment('');
        setNewRating(5);
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
    };

    return (
        <div className="space-y-6">
            {/* Dynamic Summary Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col md:flex-row gap-6 justify-between items-center">
                <div className="text-center md:text-left">
                    <h2 className="font-display font-bold text-lg text-slate-800 mb-1">Đánh Giá Từ Học Viên</h2>
                    <p className="text-slate-400 text-xs">Phản hồi thực chất từ những học viên đã tốt nghiệp các khoá học của Tung.</p>

                    <div className="flex items-center gap-2 mt-4 justify-center md:justify-start">
                        <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={18}
                                    className={i < Math.floor(avgRating) ? 'text-brand-gold fill-brand-gold shrink-0' : 'text-slate-200 shrink-0'}
                                />
                            ))}
                        </div>
                        <span className="font-display font-black text-2xl text-slate-900">{avgRating.toFixed(1)}</span>
                        <span className="text-slate-400 text-xs">({reviews.length} đánh giá thực tế)</span>
                    </div>
                </div>

                {/* Dynamic score ratings bar columns */}
                <div className="w-full md:w-64 space-y-1.5 shrink-0">
                    {ratingDistribution.map((dist) => {
                        const percentage = ratingsCount > 0 ? (dist.count / ratingsCount) * 100 : 0;
                        return (
                            <div key={dist.stars} className="flex items-center gap-2 text-xs">
                                <span className="w-3 text-slate-500 font-bold shrink-0">{dist.stars}</span>
                                <Star size={11} className="text-brand-gold fill-brand-gold shrink-0 mb-0.5" />
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="bg-brand-gold h-full rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <span className="w-8 text-right text-slate-400 shrink-0">{dist.count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Review list cards: Left span */}
                <div className="lg:col-span-7 space-y-4">
                    {reviews.map((rev) => (
                        <div key={rev.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-3">
                            <div className="flex gap-3 justify-between items-start">
                                <div className="flex gap-3 items-center min-w-0">
                                    <img
                                        src={rev.avatar}
                                        alt={rev.author}
                                        className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold font-display text-slate-800 leading-tight">{rev.author}</p>
                                        <p className="text-[10px] text-slate-400 truncate leading-snug mt-0.5">{rev.role}</p>
                                    </div>
                                </div>

                                <span className="text-[9.5px] text-slate-400 font-medium shrink-0 bg-slate-50 px-2 py-0.5 rounded-full">{rev.date}</span>
                            </div>

                            {/* Stars Row */}
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        size={13}
                                        className={i < rev.rating ? 'text-brand-gold fill-brand-gold shrink-0' : 'text-slate-100 shrink-0'}
                                    />
                                ))}
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed italic">&ldquo;{rev.comment}&rdquo;</p>
                        </div>
                    ))}
                </div>

                {/* Dynamic add review block form: Right span */}
                <div className="lg:col-span-5">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <h3 className="font-display font-bold text-[14px] text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
                            <MessageSquareCode className="text-brand-blue" size={16} />
                            Gửi Phản Hồi Của Bạn
                        </h3>

                        {successMsg ? (
                            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-xl text-center text-xs space-y-1">
                                <CheckCircle className="mx-auto text-emerald-500 mb-1" size={24} />
                                <p className="font-semibold">Đăng phản hồi thành công!</p>
                                <p className="text-slate-500">Cảm ơn góp ý của bạn, điểm giáo viên đã được cập nhật.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">

                                <div>
                                    <label className="block text-slate-500 font-semibold mb-1">Đánh giá số sao:</label>
                                    <div className="flex gap-1 items-center">
                                        {Array.from({ length: 5 }).map((_, idx) => {
                                            const starVal = idx + 1;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setNewRating(starVal)}
                                                    className="text-amber-400 hover:scale-110 active:scale-90 transition-all font-bold shrink-0 cursor-pointer"
                                                >
                                                    <Star
                                                        size={20}
                                                        className={starVal <= newRating ? 'fill-brand-gold text-brand-gold' : 'text-slate-200'}
                                                    />
                                                </button>
                                            );
                                        })}
                                        <span className="text-slate-400 font-bold ml-1.5">({newRating}/5 Sao)</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-500 font-semibold mb-1">Họ tên của bạn</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="VD: Nguyễn Văn A"
                                        className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium text-slate-700 bg-white"
                                        value={newAuthor}
                                        onChange={(e) => setNewAuthor(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-500 font-semibold mb-1">Chức danh / Nghề nghiệp</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="VD: Fullstack Developer tại FPT"
                                        className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium text-slate-700 bg-white"
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-500 font-semibold mb-1">Nội dung nhận xét</label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Chia sẻ trải nghiệm học tập của bạn về tài liệu, thời lượng bài học..."
                                        className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium text-slate-700 bg-white"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-brand-navy hover:bg-slate-900 text-white font-bold tracking-wide py-2.5 rounded-lg active:scale-95 transition-all shadow-xs uppercase font-display"
                                >
                                    Đăng Đánh Giá
                                </button>
                            </form>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
