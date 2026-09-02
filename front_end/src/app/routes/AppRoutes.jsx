import {BrowserRouter, Routes, Route, Outlet, Navigate} from "react-router-dom";
import RequireRole from "./RequireRole";
import AuthPage from "../../features/auth/presentation/AuthPage";
import ForgotPassword from "../../features/auth/presentation/components/forgot_password/ForgotPassword";
import ResetPassword from "../../features/auth/presentation/components/reset_password/ResetPassword";
import Home from "../../features/home/presentation/Home";
import HomeLayout from "../layouts/home/HomeLayout";
import DashboardLayout from "../layouts/admin/DashboardLayout";
import Dashboard from "../../features/admin/presentation/dashboard/Dashboard";
import UserManagement from "../../features/admin/presentation/user_management/UserManagement";
import TeacherManagement from "../../features/admin/presentation/teacher_management/TeacherManagement";
import Course from "../../features/admin/presentation/course/Course";
import CourseApprovalPage from "../../features/admin/presentation/courses_approval/CourseApprovalPage";
import Revenue from "../../features/admin/presentation/revenue/Revenue";
import RevenueTopRankings from "../../features/admin/presentation/revenue/top_ranking/RevenueTopRankings";
import RevenueTransactions from "../../features/admin/presentation/revenue/transactions/RevenueTransactions";
import Reports from "../../features/admin/presentation/reports/Reports";
import Vouchers from "../../features/admin/presentation/vouchers/Vouchers";
import VoucherCreate from "../../features/admin/presentation/vouchers/voucher_create/VoucherCreate";
import Category from "../../features/admin/presentation/category/Category";
import ViolationReports from "../../features/admin/presentation/violation_reports/ViolationReports";
import TeacherLayout from "../layouts/teacher/TeacherLayout";
import OverviewPage from "../../features/instructor/presentation/teacher/overview/OverviewPage";
import CoursesPage from "../../features/instructor/presentation/teacher/courses/CoursesPage";
import CourseCreationPage from "../../features/instructor/presentation/teacher/courses/create/CourseCreationPage";
import PromotionsPage from "../../features/instructor/presentation/teacher/promotions/PromotionsPage";
import AnnouncementsPage from "../../features/instructor/presentation/teacher/announcements/AnnouncementsPage";
import StudentsPage from "../../features/instructor/presentation/teacher/students/StudentsPage";
import ReviewsPage from "../../features/instructor/presentation/teacher/reviews/ReviewsPage";
import QAInboxPage from "../../features/instructor/presentation/teacher/qa/QAInboxPage";
import RevenuePage from "../../features/instructor/presentation/teacher/revenue/RevenuePage";
import EarningsPage from "../../features/instructor/presentation/teacher/earnings/EarningsPage";
import AnalyticsPage from "../../features/instructor/presentation/teacher/analytics/AnalyticsPage";
import ProfilePage from "../../features/instructor/presentation/teacher/profile/ProfilePage";
import UserLayout from "../layouts/user/UserLayout";
import InstructorsPage from "../../features/user/presentation/intructor";
import InstructorDetail from "../../features/instructor/presentation/user/intructorDetail/intructorDetail";
import AboutView from "../../features/home/presentation/about/About";
import ProfileViewProps from "../../features/profile/presentation/profileView/profile";
import CoursePage from "../../features/course/presentation/user/CourseNew";
import PublicCourseDetail from "../../features/home/presentation/courses/courses_detail/CourseDetail";
import LearningCourseDetail from "../../features/course/presentation/user/courses_detail/CourseDetail";
import Cart from "../../features/home/presentation/cart/Cart";
import OAuth2Success from "../../features/auth/presentation/components/oauth2/OAuth2Success";
import PaymentSuccess from "../../features/home/presentation/payment/PaymentSuccess";
import PaymentCancel from "../../features/home/presentation/payment/PaymentCancel";
import ApplyTeacherPage from "../../features/teacher-application/presentation/ApplyTeacherPage";
import TeacherApplicationPage from "../../features/admin/presentation/teacher_application/TeacherApplicationPage";
import Profile from "../../features/admin/presentation/profile/Profile";
import Settings from "../../features/admin/presentation/settings/Settings";
import SupportChatPage from "../../features/admin/presentation/support_chat/SupportChatPage";
import VerifyCertificatePage from "../../features/certificate/presentation/VerifyCertificatePage";


const App = () => {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/learnova/auth/login" element={<AuthPage/>}/>
                <Route path="/forgot-password" element={<ForgotPassword/>}/>
                <Route path="/reset-password" element={<ResetPassword/>}/>
                <Route path="/learnova/user/courses-detail" element={<RequireRole><LearningCourseDetail/></RequireRole>}/>
                <Route path="/learnova/user/courses-detail/:courseId" element={<RequireRole><LearningCourseDetail/></RequireRole>}/>
                <Route path="/oauth2-success" element={<OAuth2Success />}/>
                <Route path="/payment/success" element={<PaymentSuccess />}/>
                <Route path="/payment/cancel" element={<PaymentCancel />}/>
                <Route path="/learnova/certificate/verify/:code" element={<VerifyCertificatePage/>}/>

                <Route element={<HomeLayout/>}>
                    <Route path="/" element={<Home/>}/>
                    <Route path="/learnova/home" element={<Home/>}/>
                </Route>

                {/* Admin */}
                <Route path="/learnova/admin" element={<RequireRole role="ROLE_ADMIN"><DashboardLayout/></RequireRole>}>
                    <Route index element={<Dashboard/>}/>
                    <Route path="users" element={<UserManagement/>}/>
                    <Route path="teachers" element={<TeacherManagement/>}/>
                    <Route path="courses" element={<Course/>}/>
                    <Route path="courses/edit/:courseId" element={<CourseCreationPage/>}/>
                    <Route path="course-approval" element={<CourseApprovalPage/>}/>
                    <Route path="course-approval/:courseId" element={<CourseApprovalPage/>}/>
                    <Route path="revenue" element={<Revenue/>}/>
                    <Route path="revenue/top-rankings" element={<RevenueTopRankings/>}/>
                    <Route path="revenue/transactions" element={<RevenueTransactions/>}/>
                    <Route path="reports" element={<Reports/>}/>
                    <Route path="vouchers" element={<Vouchers/>}/>
                    <Route path="vouchers/create" element={<VoucherCreate/>}/>
                    <Route path="support-chat" element={<SupportChatPage/>}/>
                    <Route path="categories" element={<Category/>}/>
                    <Route path="violation-reports" element={<ViolationReports/>}/>
                    <Route path="teacher-applications" element={<TeacherApplicationPage/>}/>
                    <Route path="teacher-applications/:applicationId" element={<TeacherApplicationPage/>}/>
                    <Route path="profile" element={<Profile/>}/>
                    <Route path="settings" element={<Settings/>}/>
                </Route>

                {/* Teacher */}
                <Route path="/learnova/teacher" element={<RequireRole role="ROLE_TEACHER"><TeacherLayout/></RequireRole>}>
                    <Route index element={<OverviewPage/>}/>
                    <Route path="courses" element={<CoursesPage/>}/>
                    <Route path="courses/create" element={<CourseCreationPage/>}/>
                    <Route path="courses/edit/:courseId" element={<CourseCreationPage/>}/>
                    <Route path="promotions" element={<PromotionsPage/>}/>
                    <Route path="announcements" element={<AnnouncementsPage/>}/>
                    <Route path="students" element={<StudentsPage/>}/>
                    <Route path="reviews" element={<ReviewsPage/>}/>
                    <Route path="qna" element={<QAInboxPage/>}/>
                    <Route path="revenue" element={<RevenuePage/>}/>
                    <Route path="earnings" element={<EarningsPage/>}/>
                    <Route path="analytics" element={<AnalyticsPage/>}/>
                    <Route path="profile" element={<ProfilePage/>}/>
                </Route>

                {/* User */}
                <Route element={<UserLayout/>}>
                    <Route path="/learnova/courses" element={<CoursePage/>}/>
                    <Route path="/learnova/cart" element={<Cart/>}/>
                    <Route path="/learnova/courses/detail/:id" element={<PublicCourseDetail/>}/>
                    <Route path="/learnova/intructors" element={<InstructorsPage/>}/>
                    <Route path="/learnova/intructorDetail/:instructorId" element={<InstructorDetail/>}/>
                    <Route path="/learnova/intructorDetail/:id" element={<InstructorDetail/>}/>
                    <Route path="/learnova/about" element={<AboutView/>}/>

                    <Route element={<RequireRole><Outlet/></RequireRole>}>
                        <Route path="/learnova/user/profile" element={<ProfileViewProps key="profile" initialTab="profile"/>}/>
                        <Route path="/learnova/user/profile/courses" element={<ProfileViewProps key="courses" initialTab="courses"/>}/>
                        <Route path="/learnova/user/profile/favorites" element={<ProfileViewProps key="favorites" initialTab="favorites"/>}/>
                        <Route path="/learnova/user/profile/payments" element={<ProfileViewProps key="payments" initialTab="payments"/>}/>
                        <Route path="/learnova/user/profile/vouchers" element={<ProfileViewProps key="vouchers" initialTab="vouchers"/>}/>
                        <Route path="/learnova/user/profile/security" element={<ProfileViewProps key="security" initialTab="security"/>}/>
                        <Route path="/learnova/apply-teacher" element={<ApplyTeacherPage/>}/>
                    </Route>
                </Route>

            </Routes>
        </BrowserRouter>
    );
};

export default App;