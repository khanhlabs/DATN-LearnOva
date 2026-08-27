import { describe, expect, it } from "vitest";
import { getNotificationDestination, getSupportConversationId } from "./notificationNavigation";

describe("notification navigation", () => {
  it("uses the persisted link for a normal notification", () => {
    expect(getNotificationDestination({ type: "NEW_REVIEW", link: "/learnova/teacher/reviews" }, "teacher"))
      .toEqual({ path: "/learnova/teacher/reviews" });
  });

  it("opens a followed instructor's new course through the public course route", () => {
    expect(getNotificationDestination({
      type: "INSTRUCTOR_NEW_COURSE",
      link: "/learnova/user/CoursesDetail/42",
      metadata: { courseId: 42 },
    }, "user")).toEqual({ path: "/learnova/courses/detail/42" });
  });

  it("uses support metadata rather than a legacy link for a learner", () => {
    const notification = { type: "SUPPORT_MESSAGE", metadata: { conversationId: 42 } };

    expect(getSupportConversationId(notification)).toBe("42");
    expect(getNotificationDestination(notification, "user")).toEqual({
      path: "/learnova/home",
      conversationId: "42",
      state: { supportConversationId: "42", openSupportConversation: true },
    });
  });

  it("routes an admin support notification to the conversation", () => {
    expect(getNotificationDestination({ type: "SUPPORT_MESSAGE", metadata: { conversationId: 9 } }, "admin"))
      .toEqual({ path: "/learnova/admin/support-chat?conversationId=9", conversationId: "9" });
  });
});
