import {BrowserRouter, Routes, Route, Outlet} from "react-router-dom";
import RequireRole from "./RequireRole.jsx";
import AuthPage from "../page/auth/AuthPage.jsx";
import ForgotPassword from "../page/auth/ForgotPassword.jsx";
import ResetPassword from "../page/auth/ResetPassword.jsx";
import Home from "../page/home/Home.jsx";
import HomeLayout from "../layout/home/HomeLayout.jsx";
import DashboardLayout from "../layout/admin/DashboardLayout.jsx";
import Dashboard from "../page/admin/dashboard/Dashboard.jsx";
import UserManagement from "../page/admin/userManagement/UserManagement.jsx";
import InstructorManagement from "../page/admin/instructorManagement/InstructorManagement.jsx";
import Course from "../page/admin/course/Course.jsx";
import CourseApprovalPage from "../page/admin/courseApproval/CourseApprovalPage.jsx";
import Revenue from "../page/admin/revenue/Revenue.jsx";
import RevenueTopRankings from "../page/admin/revenue/RevenueTopRankings.jsx";
import RevenueTransactions from "../page/admin/revenue/RevenueTransactions.jsx";
import Reports from "../page/admin/reports/Reports.jsx";
import Vouchers from "../page/admin/vouchers/Vouchers.jsx";
import VoucherCreate from "../page/admin/vouchers/voucherCreate/VoucherCreate.jsx";
import Category from "../page/admin/category/Category.jsx";
import Tag from "../page/admin/tag/Tag.jsx";
import ViolationReports from "../page/admin/violationReports/ViolationReports.jsx";
import TeacherLayout from "../layout/teacher/TeacherLayout.jsx";
import OverviewPage from "../page/teacher/overview/OverviewPage.jsx";
import CoursesPage from "../page/teacher/courses/CoursesPage.jsx";
import CourseCreationPage from "../page/teacher/courses/create/CourseCreationPage.jsx";
import PromotionsPage from "../page/teacher/promotions/PromotionsPage.jsx";
import AnnouncementsPage from "../page/teacher/announcements/AnnouncementsPage.jsx";
import StudentsPage from "../page/teacher/students/StudentsPage.jsx";
import ReviewsPage from "../page/teacher/reviews/ReviewsPage.jsx";
import QAInboxPage from "../page/teacher/qa/QAInboxPage.jsx";
import RevenuePage from "../page/teacher/revenue/RevenuePage.jsx";
import AnalyticsPage from "../page/teacher/analytics/AnalyticsPage.jsx";
import ProfilePage from "../page/teacher/profile/ProfilePage.jsx";
import UserLayout from "../layout/user/UserLayout.jsx";
import InstructorsPage from "../page/users/intructor.jsx";
import InstructorDetail from "../page/users/intructor/intructorDetail/intructorDetail.jsx";
import AboutView from "../page/users/About/About.jsx";
import ProfileViewProps from "../page/users/profile/profileView/profile.jsx";
import CoursePage from "../page/users/course/CourseNew.jsx";
import CourseDetail from "../page/users/course/CourseDetail/CourseDetail.jsx";
import CourseDetaill from "../page/home/courses/CourseDetail.jsx";
import Cart from "../page/home/cart/Cart.jsx";
import OAuth2Success from "../page/auth/OAuth2Success.jsx";
import PaymentSuccess from "../page/home/payment/PaymentSuccess.jsx";
import PaymentCancel from "../page/home/payment/PaymentCancel.jsx";
import ApplyTeacherPage from "../page/teacherApplication/ApplyTeacherPage.jsx";
import TeacherApplicationPage from "../page/admin/teacherApplication/TeacherApplicationPage.jsx";
import AdminPayoutRequestsPage from "../page/admin/payoutRequests/AdminPayoutRequestsPage.jsx";
import AdminProfilePage from "../page/admin/profile/AdminProfilePage.jsx";
import Settings from "../page/admin/settings/Settings.jsx";
import VerifyCertificatePage from "../page/certificate/VerifyCertificatePage.jsx";


const App = () => {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/learnova/auth/login" element={<AuthPage/>}/>
                <Route path="/forgot-password" element={<ForgotPassword/>}/>
                <Route path="/reset-password" element={<ResetPassword/>}/>
                <Route path="/learnova/user/courses-detail" element={<CourseDetail/>}/>
                <Route path="/learnova/user/courses-detail/:courseId" element={<CourseDetail/>}/>
                <Route path="/oauth2-success" element={<OAuth2Success />}/>
                <Route path="/payment/success" element={<PaymentSuccess />}/>
                <Route path="/payment/cancel" element={<PaymentCancel />}/>
                <Route path="/learnova/certificate/verify/:code" element={<VerifyCertificatePage/>}/>

                <Route element={<HomeLayout/>}>
                    <Route path="/" element={<Home/>}/>
                </Route>

                {/* Admin */}
                <Route path="/learnova/admin" element={<RequireRole role="ROLE_ADMIN"><DashboardLayout/></RequireRole>}>
                    <Route index element={<Dashboard/>}/>
                    <Route path="users" element={<UserManagement/>}/>
                    <Route path="teachers" element={<InstructorManagement/>}/>
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
                    <Route path="categories" element={<Category/>}/>
                    <Route path="tags" element={<Tag/>}/>
                    <Route path="violation-reports" element={<ViolationReports/>}/>
                    <Route path="teacher-applications" element={<TeacherApplicationPage/>}/>
                    <Route path="teacher-applications/:applicationId" element={<TeacherApplicationPage/>}/>
                    <Route path="payout-requests" element={<AdminPayoutRequestsPage/>}/>
                    <Route path="payout-requests/:requestId" element={<AdminPayoutRequestsPage/>}/>
                    <Route path="profile" element={<AdminProfilePage/>}/>
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
                    <Route path="analytics" element={<AnalyticsPage/>}/>
                    <Route path="profile" element={<ProfilePage/>}/>
                </Route>

                {/* User */}
                <Route element={<UserLayout/>}>
                    <Route path="/learnova/courses" element={<CoursePage/>}/>
                    <Route path="/learnova/cart" element={<Cart/>}/>
                    <Route path="/learnova/courses/detail/:id" element={<CourseDetaill/>}/>
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
