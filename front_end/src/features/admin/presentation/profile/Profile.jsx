import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { adminNotifySuccess } from "../../../notification/infrastructure/api/NotificationApi";
import {
  getAdminPresignedUploadUrl,
  getAdminProfileApi,
  updateAdminProfileApi,
  uploadAdminAvatarApi,
} from "../../infrastructure/api/AdminProfileApi";
import { uploadFileToS3 } from "../../../../shared/services/UploadService";
import { useAuth } from "../../../../shared/hooks/useAuth";
import Form from "./Form";
import "./Profile.css";

const EMPTY_PROFILE = {
  fullName: "",
  email: "",
  phone: "",
  avatar: "",
  coverImage: "",
  dateOfBirth: "",
  gender: "",
  status: "",
};

const Profile = () => {
  const { loading: authLoading, setCurrentUser } = useAuth();
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileData, setProfileData] = useState(EMPTY_PROFILE);

  const validateProfile = () => {
    const nextErrors = {};

    if (!profileData.fullName?.trim()) {
      nextErrors.fullName = "Full name is required";
    }

    if (!profileData.phone?.trim()) {
      nextErrors.phone = "Phone is required";
    } else if (!/^\d{9,11}$/.test(profileData.phone)) {
      nextErrors.phone = "Phone must be 9-11 digits";
    }

    if (!profileData.dateOfBirth) {
      nextErrors.dateOfBirth = "Date of birth is required";
    }

    if (!profileData.gender) {
      nextErrors.gender = "Gender is required";
    }

    return nextErrors;
  };

  useEffect(() => {
    if (authLoading) return;

    const fetchProfile = async () => {
      try {
        const data = await getAdminProfileApi();
        setProfileData({
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          avatar: data.avatar || "",
          coverImage: data.coverImage || "",
          dateOfBirth: data.dateOfBirth || "",
          gender: data.gender || "",
          status: data.status || "",
        });
      } catch (error) {
        console.error("Failed to load admin profile", error);
        toast.error("Failed to load profile.");
      }
    };

    fetchProfile();
  }, [authLoading]);

  const handleInputChange = (field, value) => {
    setProfileData((current) => ({ ...current, [field]: value }));
    setSaveSuccess(false);
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      toast.error("Please choose a JPG, PNG, or WEBP image.");
      return;
    }

    const contentType = file.type || "image/jpeg";
    setUploadingAvatar(true);

    try {
      // Same flow as user: presigned URL → PUT file to S3 → save avatarKey
      const presign = await getAdminPresignedUploadUrl({
        type: "AVATAR",
        fileName: file.name || `avatar-${Date.now()}.jpg`,
        contentType,
      });

      const uploadUrl = presign?.uploadUrl;
      const fileKey = presign?.fileKey;

      if (!uploadUrl || !fileKey) {
        throw new Error("Missing uploadUrl or fileKey from server");
      }

      await uploadFileToS3(uploadUrl, new File([file], file.name, { type: contentType }));

      const res = await uploadAdminAvatarApi(fileKey);
      const avatar = res?.avatar;

      if (!avatar) {
        throw new Error("Server did not return avatar URL");
      }

      setProfileData((prev) => ({ ...prev, avatar }));
      setCurrentUser((prev) => ({ ...prev, avatar }));
      toast.success("Avatar uploaded to S3 successfully!");
    } catch (error) {
      console.error("Admin avatar upload failed", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Upload failed. Image was not saved to S3."
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      const response = await updateAdminProfileApi({
        fullName: profileData.fullName,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
      });

      setProfileData((prev) => ({
        ...prev,
        ...response,
        avatar: response.avatar || prev.avatar,
      }));

      setCurrentUser((prev) => ({
        ...prev,
        fullName: response.fullName ?? prev?.fullName,
        ...(response.avatar ? { avatar: response.avatar } : {}),
      }));

      setSaveSuccess(true);
      await adminNotifySuccess("Profile updated successfully!", { title: "Profile" });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed!");
    }
  };

  return (
    <div className="admin-profile-page">
      <div className="admin-profile-panel">
        <Form
          profileData={profileData}
          saveSuccess={saveSuccess}
          uploadingAvatar={uploadingAvatar}
          onInputChange={handleInputChange}
          onSaveProfile={handleSaveProfile}
          onAvatarChange={handleAvatarChange}
          errors={errors}
        />
      </div>
    </div>
  );
};

export default Profile;
