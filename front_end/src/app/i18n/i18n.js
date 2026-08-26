import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi";
import en from "./locales/en";

export const LANGUAGE_STORAGE_KEY = "learnova_lang";

const voucherOpsSupplement = {
    vi: {
        archive: "Lưu trữ chương trình giảm giá", archiveSubtitle: "Quản lý các chương trình giảm giá đã tạo và trạng thái hoạt động.", countItems: "Số lượng: {{count}} mục", searchVoucher: "Tìm mã hoặc chiến dịch...", filterStatus: "Lọc mã theo trạng thái", code: "MÃ", campaignName: "TÊN CHIẾN DỊCH", discount: "GIẢM GIÁ", usedCapacity: "ĐÃ DÙNG / SỨC CHỨA", expiryDate: "NGÀY HẾT HẠN", status: "TRẠNG THÁI", actions: "THAO TÁC", loadingVouchers: "Đang tải mã giảm giá...", noVouchers: "Không tìm thấy mã giảm giá phù hợp.", previous: "Trước", next: "Sau", createVoucher: "Tạo mã giảm giá mới", deleteVoucherQuestion: "Xóa mã giảm giá?", deleteVoucherDescription: "Mã {{code}} sẽ được đánh dấu đã xóa và vẫn hiển thị trong kho lưu trữ.", cancel: "Hủy", deleting: "Đang xóa...", confirmDelete: "Xác nhận xóa", history: "Lịch sử sử dụng mã", historySubtitle: "Xem các giao dịch đăng ký khóa học sử dụng mã giảm giá.", showingItems: "Hiển thị {{start}}-{{end}} trên tổng {{count}}", searchHistory: "Tìm tên học viên, mã...", student: "HỌC VIÊN", registeredCourse: "KHÓA HỌC ĐĂNG KÝ", appliedCode: "MÃ ĐÃ DÙNG", originalPrice: "GIÁ GỐC", paid: "ĐÃ THANH TOÁN", usedAt: "THỜI GIAN DÙNG", loadingHistory: "Đang tải lịch sử sử dụng mã...", noHistory: "Không tìm thấy lịch sử sử dụng mã phù hợp.", discountCode: "Mã giảm giá", discountType: "Loại giảm giá", fixedAmount: "Số tiền cố định", percent: "Phần trăm", usdHint: "USD (theo danh mục). Cho phép số thập phân, ví dụ 57.97", usageLimit: "Giới hạn sử dụng", active: "Đang hoạt động", inactive: "Không hoạt động", startDate: "Ngày bắt đầu", endDate: "Ngày kết thúc", edit: "Chỉnh sửa", saving: "Đang lưu...", saveChanges: "Lưu thay đổi", close: "Đóng", preview: "Xem trước mã giảm giá", livePreview: "XEM TRƯỚC TRỰC TIẾP", newCampaign: "Chiến dịch mới", identifyUser: "Không xác định được người dùng. Vui lòng đăng nhập lại.", codeDescriptionRequired: "Mã và mô tả là bắt buộc.", discountPositive: "Giá trị giảm giá phải lớn hơn 0.", discountPercentMax: "Phần trăm giảm giá không được vượt quá 100.", discountAmountMax: "Số tiền giảm không được vượt quá 99.999.999,99 USD.", usageLimitNegative: "Giới hạn sử dụng không được âm.", endDateInvalid: "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.", voucherDetails: "Chi tiết mã giảm giá", editVoucher: "Chỉnh sửa mã giảm giá", createVoucherTitle: "Tạo mã giảm giá", viewVoucherSubtitle: "Xem thông tin mã giảm giá. Nhấn Chỉnh sửa để thay đổi.", editVoucherSubtitle: "Chỉnh sửa thông tin mã giảm giá.", createVoucherSubtitle: "Nhập thông tin để tạo mã giảm giá.", status: { allstatuses: "Tất cả trạng thái", active: "Đang hoạt động", inactive: "Không hoạt động", expiringsoon: "Sắp hết hạn", delete: "Đã xóa" }
    },
    en: {
        archive: "Discount Program Archive", archiveSubtitle: "Manage created discount programs and activity status.", countItems: "Count: {{count}} items", searchVoucher: "Search code or campaign...", filterStatus: "Filter vouchers by status", code: "CODE", campaignName: "CAMPAIGN NAME", discount: "DISCOUNT", usedCapacity: "USED / CAPACITY", expiryDate: "EXPIRY DATE", status: "STATUS", actions: "ACTIONS", loadingVouchers: "Loading vouchers...", noVouchers: "No matching vouchers found.", previous: "Prev", next: "Next", createVoucher: "Create New Voucher", deleteVoucherQuestion: "Delete voucher?", deleteVoucherDescription: "Voucher {{code}} will be marked as deleted and remain visible in the archive.", cancel: "Cancel", deleting: "Deleting...", confirmDelete: "Confirm Delete", history: "Voucher Usage History", historySubtitle: "View course registration transactions using discount codes.", showingItems: "Showing {{start}}-{{end}} of {{count}}", searchHistory: "Search student name, code...", student: "STUDENT", registeredCourse: "REGISTERED COURSE", appliedCode: "APPLIED CODE", originalPrice: "ORIGINAL PRICE", paid: "PAID", usedAt: "USED AT", loadingHistory: "Loading voucher usage history...", noHistory: "No matching voucher usage history found.", discountCode: "Discount Code", discountType: "Discount Type", fixedAmount: "Fixed amount", percent: "Percent", usdHint: "USD (catalog). Decimals allowed, e.g. 57.97", usageLimit: "Usage Limit", active: "Active", inactive: "Inactive", startDate: "Start Date", endDate: "End Date", edit: "Edit", saving: "Saving...", saveChanges: "Save Changes", close: "Close", preview: "Voucher preview", livePreview: "LIVE PREVIEW", newCampaign: "New Campaign", identifyUser: "Failed to identify user. Please login again.", codeDescriptionRequired: "Code and description are required.", discountPositive: "Discount value must be greater than 0.", discountPercentMax: "Discount percentage cannot exceed 100.", discountAmountMax: "Discount amount cannot exceed $99,999,999.99.", usageLimitNegative: "Usage limit cannot be negative.", endDateInvalid: "End date must be greater than or equal to start date.", voucherDetails: "Voucher Details", editVoucher: "Edit Voucher", createVoucherTitle: "Create Voucher", viewVoucherSubtitle: "View voucher information. Click Edit to modify.", editVoucherSubtitle: "Modify voucher details.", createVoucherSubtitle: "Enter information to create a new voucher.", status: { allstatuses: "All statuses", active: "Active", inactive: "Inactive", expiringsoon: "Expiring Soon", delete: "Deleted" }
    }
};

const adminSupplement = {
    vi: { supportChat: "Hỗ trợ khách hàng" },
    en: { supportChat: "Support Chat" },
};

const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

i18n.use(initReactI18next).init({
    resources: {
        vi: { translation: { ...vi, admin: { ...vi.admin, ...adminSupplement.vi }, opsAdmin: { ...vi.opsAdmin, ...voucherOpsSupplement.vi } } },
        en: { translation: { ...en, admin: { ...en.admin, ...adminSupplement.en }, opsAdmin: { ...en.opsAdmin, ...voucherOpsSupplement.en } } },
    },
    lng: storedLanguage || "vi",
    fallbackLng: "vi",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
