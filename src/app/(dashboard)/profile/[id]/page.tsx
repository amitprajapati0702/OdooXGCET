"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Mail, Phone, MapPin, Briefcase, User as UserIcon } from "lucide-react";
import styles from "./profile.module.css";
import SalaryInfo from "./SalaryInfo";

enum Tab {
  RESUME = "Resume",
  PRIVATE = "Private Info",
  SALARY = "Salary Info",
  SECURITY = "Security",
}

export default function ProfilePage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.RESUME);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit States
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";
  const isSelf = session?.user?.id === id;
  const canViewSensitive = isAdmin || isSelf;
  const canViewSalary = isAdmin;
  const canEdit = isSelf || isAdmin;

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setFormData(data); // Init form data
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedFields: any) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setFormData(data);
        setEditingSection(null);
      } else {
        alert("Failed to save");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving");
    }
  };

  const updateArrayField = (
    field: string,
    action: "add" | "remove",
    value: string
  ) => {
    let currentArray = [...(user[field] || [])];

    if (action === "add") {
      if (!value.trim() || currentArray.includes(value)) return;
      currentArray.push(value);
    } else {
      currentArray = currentArray.filter((i) => i !== value);
    }

    handleSave({ [field]: currentArray });
    if (field === "skills") setNewSkill("");
    if (field === "certifications") setNewCert("");
  };

  // File Upload Logic
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    if (canEdit && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          handleSave({ avatar: data.url });
        }
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
    }
  };

  if (loading) return <div className={styles.loading}>Loading Profile...</div>;
  if (!user) return <div className={styles.error}>User not found</div>;

  const renderEditableText = (
    field: string,
    title: string,
    placeholder: string
  ) => {
    const isEditing = editingSection === field;

    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>{title}</div>
          {canEdit && !isEditing && (
            <button
              className={styles.editBtn}
              onClick={() => setEditingSection(field)}
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div>
            <textarea
              className={styles.editableArea}
              value={formData[field] || ""}
              onChange={(e) =>
                setFormData({ ...formData, [field]: e.target.value })
              }
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className={styles.saveBtn}
                onClick={() => handleSave({ [field]: formData[field] })}
              >
                Save
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setEditingSection(null);
                  setFormData(user); // Reset
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.placeholderText}>{user[field] || placeholder}</p>
        )}
      </div>
    );
  };

  const renderEditableInline = (
    field: string,
    value: string,
    placeholder: string,
    icon?: React.ReactNode
  ) => {
    const isEditing = editingSection === field;

    if (isEditing) {
      return (
        <div
          className={styles.inlineEditContainer}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            className={styles.inlineInput}
            value={formData[field] || ""}
            onChange={(e) =>
              setFormData({ ...formData, [field]: e.target.value })
            }
            autoFocus
          />
          <button
            className={styles.saveBtnSmall}
            onClick={() => handleSave({ [field]: formData[field] })}
          >
            ✓
          </button>
          <button
            className={styles.cancelBtnSmall}
            onClick={() => {
              setEditingSection(null);
              setFormData(user);
            }}
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div
        className={styles.editableInline}
        onClick={
          canEdit
            ? () => {
                setEditingSection(field);
                setFormData(user);
              }
            : undefined
        }
      >
        {icon}
        <span className={styles.inlineValue}>{value || placeholder}</span>
        {canEdit && <span className={styles.editPencil}>✎</span>}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer} onClick={handleAvatarClick}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
              accept="image/*"
            />
            {user.avatar ? (
              <img src={user.avatar} className={styles.avatar} alt="Profile" />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <UserIcon size={48} />
              </div>
            )}
            {canEdit && (
              <div className={styles.avatarOverlay}>
                <Briefcase size={24} />
              </div>
            )}
          </div>

          <div className={styles.headerInfo}>
            <h1 className={styles.name}>
              {user.firstName} {user.lastName}
            </h1>
            <div className={styles.jobInfo}>
              <span>{user.jobPosition || "Job Position"}</span>
              <span className={styles.dot}>•</span>
              <span>{user.department || "Department"}</span>
            </div>
            <div className={styles.contactRow}>
              <div className={styles.contactItem}>
                <Mail size={14} /> {user.email}
              </div>
              <div className={styles.contactItem}>
                {renderEditableInline(
                  "phone",
                  user.phone,
                  "No Phone",
                  <Phone size={14} />
                )}
              </div>
              <div className={styles.contactItem}>
                {renderEditableInline(
                  "location",
                  user.location,
                  "No Location",
                  <MapPin size={14} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Manager:</span>
            {renderEditableInline("manager", user.manager, "-", null)}
          </div>
          {/* Location duplicated in wireframe, removing right side one if handled in contact row, or keeping both synced. keeping simple. */}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[Tab.RESUME, Tab.PRIVATE, Tab.SALARY, Tab.SECURITY].map((tab) =>
          tab === Tab.SALARY && !canViewSalary ? null : tab === Tab.PRIVATE &&
            !canViewSensitive ? null : tab === Tab.SECURITY &&
            !canViewSensitive ? null : (
            <button
              key={tab}
              className={`${styles.tab} ${
                activeTab === tab ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === Tab.RESUME && (
          <div className={`${styles.pane} ${styles.resumeGrid}`}>
            {/* Left Column */}
            <div className={styles.leftCol}>
              {renderEditableText(
                "about",
                "About",
                "Write something about yourself..."
              )}
              {renderEditableText(
                "jobLove",
                "What I love about my job",
                "Tell us what you love..."
              )}
              {renderEditableText(
                "hobbies",
                "My interests and hobbies",
                "What do you do for fun?"
              )}
            </div>

            {/* Right Column */}
            <div className={styles.rightCol}>
              {/* Skills */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Skills</div>
                <div className={styles.skillsGrid}>
                  {(user.skills || []).map((skill: string) => (
                    <span key={skill} className={styles.skillTag}>
                      {skill}
                      {canEdit && (
                        <span
                          className={styles.removeSkill}
                          onClick={() =>
                            updateArrayField("skills", "remove", skill)
                          }
                        >
                          x
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                {canEdit && (
                  <div className={styles.addSkillRow}>
                    <input
                      className={styles.addSkillInput}
                      placeholder="Add Skill"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        updateArrayField("skills", "add", newSkill)
                      }
                    />
                    <button
                      className={styles.addSkillBtn}
                      onClick={() =>
                        updateArrayField("skills", "add", newSkill)
                      }
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Certifications</div>
                <div className={styles.skillsGrid}>
                  {(user.certifications || []).map((cert: string) => (
                    <span key={cert} className={styles.skillTag}>
                      {cert}
                      {canEdit && (
                        <span
                          className={styles.removeSkill}
                          onClick={() =>
                            updateArrayField("certifications", "remove", cert)
                          }
                        >
                          x
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                {canEdit && (
                  <div className={styles.addSkillRow}>
                    <input
                      className={styles.addSkillInput}
                      placeholder="Add Certification"
                      value={newCert}
                      onChange={(e) => setNewCert(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        updateArrayField("certifications", "add", newCert)
                      }
                    />
                    <button
                      className={styles.addSkillBtn}
                      onClick={() =>
                        updateArrayField("certifications", "add", newCert)
                      }
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === Tab.PRIVATE && (
          <div className={styles.pane}>
            <div className={styles.infoGrid}>
              <div className={styles.field}>
                <label>Address</label>
                <span>{user.address || "-"}</span>
              </div>
              <div className={styles.field}>
                <label>Bank Account</label>
                <span>{user.bankDetails?.accountNumber || "-"}</span>
              </div>
              <div className={styles.field}>
                <label>Phone</label>
                <span>{user.phone || "-"}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === Tab.SALARY && (
          <SalaryInfo user={user} onUpdate={fetchUser} />
        )}

        {activeTab === Tab.SECURITY && (
          <div className={styles.pane}>
            <div className={styles.sectionTitle}>Change Password</div>
            <SecurityForm userId={id as string} />
          </div>
        )}
      </div>
    </div>
  );
}

function SecurityForm({ userId }: { userId: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setMsg("New passwords do not match");
      setIsError(true);
      return;
    }
    setLoading(true);
    setMsg("");
    setIsError(false);

    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg("Password changed successfully");
        setIsError(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMsg(data.message || "Failed to change password");
        setIsError(true);
      }
    } catch (e) {
      setMsg("Error connecting to server");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.securityForm}>
      <div className={styles.formGroup}>
        <label>Current Password</label>
        <input
          type="password"
          className={styles.input}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className={styles.formGroup}>
        <label>New Password</label>
        <input
          type="password"
          className={styles.input}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Confirm New Password</label>
        <input
          type="password"
          className={styles.input}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {msg && (
        <p className={isError ? styles.errorMsg : styles.successMsg}>{msg}</p>
      )}

      <button
        className={styles.saveBtn}
        onClick={handleSubmit}
        disabled={loading}
        style={{ marginTop: "1rem" }}
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}
