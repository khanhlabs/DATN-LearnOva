package com.example.back_end.service;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Properties;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final String EMAIL =
            "nguyenphithong167@gmail.com";

    private static final String APP_PASSWORD =
            "lpag jica rptg bbwb";

    private Session buildSmtpSession() {
        Properties props = new Properties();
        props.setProperty("mail.smtp.auth", "true");
        props.setProperty("mail.smtp.port", "587");
        props.setProperty("mail.smtp.starttls.enable", "true");
        props.setProperty("mail.smtp.ssl.protocols", "TLSv1.2");
        props.setProperty("mail.smtp.host", "smtp.gmail.com");

        return Session.getInstance(
                props,
                new Authenticator() {
                    @Override
                    protected PasswordAuthentication getPasswordAuthentication() {
                        return new PasswordAuthentication(
                                EMAIL,
                                APP_PASSWORD
                        );
                    }
                }
        );
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = new MimeMessage(buildSmtpSession());

            message.setFrom(new InternetAddress(EMAIL, "LearnOva", StandardCharsets.UTF_8.name()));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject(subject, StandardCharsets.UTF_8.name());
            message.setContent(htmlContent, "text/html; charset=UTF-8");

            Transport.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + subject, e);
        }
    }

    public void sendVerificationEmail(
            String toEmail,
            String fullName,
            String verifyLink
    ) {

        String subject = "Verify Your LearnOva Account";

        String content = """
        <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
            <div style="
                max-width:600px;
                margin:auto;
                background:white;
                border-radius:10px;
                padding:30px;
                box-shadow:0 4px 10px rgba(0,0,0,0.1);
            ">

                <h2 style="color:#2563eb;text-align:center;">
                    Welcome to LearnOva
                </h2>

                <p>Hello %s,</p>

                <p>
                    Thank you for creating an account with LearnOva.
                </p>

                <p>
                    Please verify your email address by clicking the button below:
                </p>

                <div style="text-align:center;margin:30px 0;">
                    <a href="%s"
                       style="
                            background:#2563eb;
                            color:white;
                            text-decoration:none;
                            padding:12px 24px;
                            border-radius:8px;
                            display:inline-block;
                       ">
                        Verify Account
                    </a>
                </div>

                <p>
                    If you did not create this account, please ignore this email.
                </p>

                <br>

                <p>
                    Best regards,<br>
                    <b>LearnOva Team</b>
                </p>

            </div>
        </div>
       """.formatted(
                       fullName == null || fullName.isBlank()
                               ? "User"
                               : fullName,
                       verifyLink
               );

        sendHtmlEmail(toEmail, subject, content);
    }

    public void sendResetPasswordEmail(String toEmail, String fullName, String resetLink) {

        String subject = "Reset Your LearnOva Password";

        String content = """
        <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
            <div style="
                max-width:600px;
                margin:auto;
                background:white;
                border-radius:10px;
                padding:30px;
                box-shadow:0 4px 10px rgba(0,0,0,0.1);
            ">

                <h2 style="color:#2563eb;text-align:center;">
                    Reset Your Password
                </h2>

                <p>Hello %s,</p>

                <p>
                    We received a request to reset your LearnOva account password.
                    Click the button below to choose a new password.
                </p>

                <div style="text-align:center;margin:30px 0;">
                    <a href="%s"
                       style="
                            background:#2563eb;
                            color:white;
                            text-decoration:none;
                            padding:12px 24px;
                            border-radius:8px;
                            display:inline-block;
                       ">
                        Reset Password
                    </a>
                </div>

                <p>
                    This link will expire in 5 minutes for your security.
                </p>

                <p>
                    If you did not request a password reset, please ignore this email —
                    your password will remain unchanged.
                </p>

                <br>

                <p>
                    Best regards,<br>
                    <b>LearnOva Team</b>
                </p>

            </div>
        </div>
       """.formatted(
                       fullName == null || fullName.isBlank()
                               ? "User"
                               : fullName,
                       resetLink
               );

        sendHtmlEmail(toEmail, subject, content);
    }

    public void sendCourseApprovedEmail(String toEmail, String fullName, String courseTitle) {
        String subject = "Your course has been approved";

        String content = """
        <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
            <div style="
                max-width:600px;
                margin:auto;
                background:white;
                border-radius:10px;
                padding:30px;
                box-shadow:0 4px 10px rgba(0,0,0,0.1);
            ">
                <h2 style="color:#059669;text-align:center;">
                    Course Approved
                </h2>

                <p>Hello %s,</p>

                <p>
                    Great news! Your course <b>%s</b> has been reviewed and approved by our team.
                    It is now live and available to students on LearnOva.
                </p>

                <br>

                <p>
                    Best regards,<br>
                    <b>LearnOva Team</b>
                </p>
            </div>
        </div>
       """.formatted(
                       fullName == null || fullName.isBlank() ? "Instructor" : fullName,
                       courseTitle
               );

        sendHtmlEmail(toEmail, subject, content);
    }

    public void sendCourseRejectedEmail(String toEmail, String fullName, String courseTitle, String reason) {
        String subject = "Your course needs changes before publishing";

        String content = """
        <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
            <div style="
                max-width:600px;
                margin:auto;
                background:white;
                border-radius:10px;
                padding:30px;
                box-shadow:0 4px 10px rgba(0,0,0,0.1);
            ">
                <h2 style="color:#dc2626;text-align:center;">
                    Course Needs Changes
                </h2>

                <p>Hello %s,</p>

                <p>
                    Your course <b>%s</b> was reviewed but could not be approved yet. Reason:
                </p>

                <p style="background:#fef2f2;border-left:3px solid #dc2626;padding:12px 16px;color:#991b1b;">
                    %s
                </p>

                <p>
                    Please make the requested changes and submit the course for review again.
                </p>

                <br>

                <p>
                    Best regards,<br>
                    <b>LearnOva Team</b>
                </p>
            </div>
        </div>
       """.formatted(
                       fullName == null || fullName.isBlank() ? "Instructor" : fullName,
                       courseTitle,
                       reason
               );

        sendHtmlEmail(toEmail, subject, content);
    }

    public void sendTeacherApplicationApprovedEmail(String toEmail, String fullName) {
        String subject = "Your instructor application has been approved";

        String content = """
        <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
            <div style="
                max-width:600px;
                margin:auto;
                background:white;
                border-radius:10px;
                padding:30px;
                box-shadow:0 4px 10px rgba(0,0,0,0.1);
            ">
                <h2 style="color:#059669;text-align:center;">
                    Instructor Application Approved
                </h2>

                <p>Hello %s,</p>

                <p>
                    Congratulations! Your application to become an instructor on LearnOva has been approved.
                    You can now access your instructor dashboard and start creating courses.
                </p>

                <br>

                <p>
                    Best regards,<br>
                    <b>LearnOva Team</b>
                </p>
            </div>
        </div>
       """.formatted(
                       fullName == null || fullName.isBlank() ? "there" : fullName
               );

        sendHtmlEmail(toEmail, subject, content);
    }

    public void sendCourseCompletionEmail(
            String toEmail,
            String fullName,
            String courseTitle,
            String certificateDownloadUrl,
            String certificateCode
    ) {
        String subject = "You completed \"" + courseTitle + "\" — your certificate is ready";

        String content = """
        <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
            <div style="
                max-width:600px;
                margin:auto;
                background:white;
                border-radius:10px;
                padding:30px;
                box-shadow:0 4px 10px rgba(0,0,0,0.1);
            ">
                <h2 style="color:#059669;text-align:center;">
                    🎉 Course Completed!
                </h2>

                <p>Hello %s,</p>

                <p>
                    Congratulations on completing <b>%s</b>! Your certificate of completion is ready to download.
                </p>

                <div style="text-align:center;margin:30px 0;">
                    <a href="%s"
                       style="
                            background:#059669;
                            color:white;
                            text-decoration:none;
                            padding:12px 24px;
                            border-radius:8px;
                            display:inline-block;
                       ">
                        Download Certificate
                    </a>
                </div>

                <p style="color:#6b7280;font-size:13px;text-align:center;">
                    Certificate ID: %s
                </p>

                <p>
                    Keep up the great work — explore more courses on LearnOva to keep growing your skills.
                </p>

                <br>

                <p>
                    Best regards,<br>
                    <b>LearnOva Team</b>
                </p>
            </div>
        </div>
       """.formatted(
                       fullName == null || fullName.isBlank() ? "there" : fullName,
                       courseTitle,
                       certificateDownloadUrl,
                       certificateCode
               );

        sendHtmlEmail(toEmail, subject, content);
    }

    public void sendCourseAnnouncementEmail(
            String toEmail,
            String fullName,
            String courseTitle,
            String announcementTitle,
            String announcementContent,
            String courseUrl
    ) {
        String subject = "[" + courseTitle + "] " + announcementTitle;

        String content = """
        <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
            <div style="
                max-width:600px;
                margin:auto;
                background:white;
                border-radius:10px;
                padding:30px;
                box-shadow:0 4px 10px rgba(0,0,0,0.1);
            ">
                <h2 style="color:#2563eb;text-align:center;">
                    📢 New announcement
                </h2>

                <p>Hello %s,</p>

                <p>
                    Your instructor posted a new announcement for <b>%s</b>:
                </p>

                <div style="background:#eff6ff;border-left:3px solid #2563eb;padding:14px 18px;margin:16px 0;">
                    <p style="margin:0 0 6px;font-weight:bold;color:#1e3a8a;">%s</p>
                    <p style="margin:0;color:#1e3a8a;">%s</p>
                </div>

                <div style="text-align:center;margin:30px 0;">
                    <a href="%s"
                       style="
                            background:#2563eb;
                            color:white;
                            text-decoration:none;
                            padding:12px 24px;
                            border-radius:8px;
                            display:inline-block;
                       ">
                        View course
                    </a>
                </div>

                <br>

                <p>
                    Best regards,<br>
                    <b>LearnOva Team</b>
                </p>
            </div>
        </div>
       """.formatted(
                       fullName == null || fullName.isBlank() ? "there" : fullName,
                       courseTitle,
                       announcementTitle,
                       announcementContent,
                       courseUrl
               );

        sendHtmlEmail(toEmail, subject, content);
    }

    public record AnnouncementRecipient(String email, String fullName) {
    }

    /**
     * Sends the announcement email to every recipient in the background, so the HTTP request that
     * triggered this doesn't block on dozens of sequential SMTP sends. One recipient's failure is
     * logged and doesn't stop the rest.
     */
    @Async
    public void sendCourseAnnouncementEmailsAsync(
            List<AnnouncementRecipient> recipients,
            String courseTitle,
            String announcementTitle,
            String announcementContent,
            String courseUrl
    ) {
        for (AnnouncementRecipient recipient : recipients) {
            try {
                sendCourseAnnouncementEmail(
                        recipient.email(),
                        recipient.fullName(),
                        courseTitle,
                        announcementTitle,
                        announcementContent,
                        courseUrl
                );
            } catch (Exception e) {
                log.error("Failed to send announcement email to {} for course \"{}\"", recipient.email(), courseTitle, e);
            }
        }
    }

    public void sendTeacherApplicationRejectedEmail(String toEmail, String fullName, String reason) {
        String subject = "Update on your instructor application";

        String content = """
        <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
            <div style="
                max-width:600px;
                margin:auto;
                background:white;
                border-radius:10px;
                padding:30px;
                box-shadow:0 4px 10px rgba(0,0,0,0.1);
            ">
                <h2 style="color:#dc2626;text-align:center;">
                    Instructor Application Update
                </h2>

                <p>Hello %s,</p>

                <p>
                    Your application to become an instructor on LearnOva was reviewed but could not be approved yet. Reason:
                </p>

                <p style="background:#fef2f2;border-left:3px solid #dc2626;padding:12px 16px;color:#991b1b;">
                    %s
                </p>

                <p>
                    You are welcome to submit a new application after addressing the points above.
                </p>

                <br>

                <p>
                    Best regards,<br>
                    <b>LearnOva Team</b>
                </p>
            </div>
        </div>
       """.formatted(
                       fullName == null || fullName.isBlank() ? "there" : fullName,
                       reason
               );

        sendHtmlEmail(toEmail, subject, content);
    }
}
