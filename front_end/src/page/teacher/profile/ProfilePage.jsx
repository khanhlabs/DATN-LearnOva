import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Globe, Link2, Loader2, Upload, User } from "lucide-react";
import { getMyInstructorProfile, updateMyInstructorProfile } from "../../../api/teacher/InstructorProfileApi.js";
import { generateUploadUrl } from "../../../api/teacher/UploadApi.js";
import { getFileUrl } from "../../../api/teacher/CourseApi.js";
import { uploadFileToS3 } from "../../../services/UploadService.js";
import "./ProfilePage.css";

const SOCIAL_FIELDS = [
  { key: "website", label: "Website", icon: Globe },
  { key: "linkedin", label: "LinkedIn", icon: Link2 },
  { key: "github", label: "GitHub", icon: Link2 },
  { key: "facebook", label: "Facebook", icon: Link2 },
];

const ProfilePage = () => {
  const [form, setForm] = useState({
    headline: "",
    description: "",
    expertise: "",
    avatarKey: "",
    socialLinks: {},
  });
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getMyInstructorProfile();
        setForm({
          headline: profile.headline || "",
          description: profile.description || "",
          expertise: profile.expertise || "",
          avatarKey: profile.avatarKey || "",
          socialLinks: profile.socialLinks || {},
        });
        if (profile.avatarKey) {
          try {
            setAvatarPreviewUrl(await getFileUrl(profile.avatarKey));
          } catch {
            // fallback to default avatar icon
          }
        }
      } catch {
        toast.error("Failed to load your profile.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleAvatarChange = async (e) => {
    const [file] = e.target.files;
    if (!file) return;
    e.target.value = "";

    setIsUploadingAvatar(true);
    try {
      const { uploadUrl, fileKey } = await generateUploadUrl({
        type: "AVATAR",
        fileName: file.name,
        contentType: file.type,
      });
      await uploadFileToS3(uploadUrl, file);
      setForm((prev) => ({ ...prev, avatarKey: fileKey }));
      setAvatarPreviewUrl(URL.createObjectURL(file));
    } catch {
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSocialChange = (key, value) => {
    setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: value } }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cleanedSocialLinks = Object.fromEntries(
        Object.entries(form.socialLinks).filter(([, value]) => value && value.trim())
      );
      await updateMyInstructorProfile({ ...form, socialLinks: cleanedSocialLinks });
      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Failed to update instructor profile:", error?.response?.status, error?.response?.data || error);
      toast.error(error?.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="teacher-page teacher-profile-page">
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading profile…</div>
      </section>
    );
  }

  return (
    <section className="teacher-page teacher-profile-page">
      <header className="teacher-profile-header">
        <p>
          This information is shown to students on your public instructor page.
        </p>
      </header>

      <form className="teacher-profile-form" onSubmit={handleSave}>
        <div className="teacher-profile-avatar">
          {avatarPreviewUrl ? (
            <img src={avatarPreviewUrl} alt="Avatar" />
          ) : (
            <div className="teacher-profile-avatar__placeholder">
              <User size={32} />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? <Loader2 size={14} className="teacher-spin" /> : <Upload size={14} />}
            {isUploadingAvatar ? "Uploading…" : "Change avatar"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </div>

        <div className="teacher-profile-field">
          <label htmlFor="headline">Headline</label>
          <input
            id="headline"
            type="text"
            maxLength={150}
            placeholder="e.g. Senior Full-stack Developer & Educator"
            value={form.headline}
            onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
          />
        </div>

        <div className="teacher-profile-field">
          <label htmlFor="expertise">Expertise</label>
          <input
            id="expertise"
            type="text"
            maxLength={255}
            placeholder="e.g. React, Node.js, System Design"
            value={form.expertise}
            onChange={(e) => setForm((prev) => ({ ...prev, expertise: e.target.value }))}
          />
        </div>

        <div className="teacher-profile-field">
          <label htmlFor="description">About you</label>
          <textarea
            id="description"
            rows={6}
            placeholder="Tell students about your background and teaching style…"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="teacher-profile-field">
          <label>Social links</label>
          <div className="teacher-profile-social-grid">
            {SOCIAL_FIELDS.map(({ key, label, icon: Icon }) => (
              <div key={key} className="teacher-profile-social-item">
                <Icon size={16} />
                <input
                  type="url"
                  placeholder={label}
                  value={form.socialLinks[key] || ""}
                  onChange={(e) => handleSocialChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="teacher-profile-actions">
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ProfilePage;
