import { CheckCircle2, X } from "lucide-react";
import { PRESET_AVATARS } from "../data/profileData";

const AvatarModal = ({
  profileData,
  customAvatarUrl,
  setCustomAvatarUrl,
  onClose,
  onSelectAvatar,
  onCustomAvatarSubmit,
}) => (
  <div className="modal-overlay">
    <div className="modal-content avatar-modal">
      <button onClick={onClose} className="modal-close" type="button">
        <X size={20} />
      </button>

      <h3>Choose Your Profile Picture</h3>
      <p>
        Select one of the preset avatars below or provide a custom image URL of
        your own.
      </p>

      <div className="avatar-grid">
        {PRESET_AVATARS.map((url, index) => (
          <button
            key={url}
            onClick={() => onSelectAvatar(url)}
            className={`avatar-option ${profileData.avatar === url ? "selected" : ""}`}
            type="button"
          >
            <img src={url} alt={`Preset ${index + 1}`} />
            {profileData.avatar === url && (
              <div className="selected-check">
                <CheckCircle2 size={20} />
              </div>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={onCustomAvatarSubmit} className="custom-avatar-form">
        <label>Enter a Custom Image URL</label>
        <div className="input-group">
          <input
            type="url"
            placeholder="https://images.unsplash.com/... or any image URL"
            value={customAvatarUrl}
            onChange={(event) => setCustomAvatarUrl(event.target.value)}
            className="form-input"
          />
          <button type="submit" className="btn btn-secondary">
            Chọn
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default AvatarModal;
