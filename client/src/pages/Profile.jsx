import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  User,
  Mail,
  GraduationCap,
  Briefcase,
  Target,
  Code2,
  Sun,
  Moon,
  Save,
  CheckCircle2,
  Flame,
  FileCheck2,
  Shield,
  Calendar,
  Edit3,
  X,
  AlertCircle,
  Camera,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import SkillTagsInput from '../components/SkillTagsInput';
import GoalsListEditor from '../components/GoalsListEditor';
import ErrorMessage from '../components/ErrorMessage';
import Avatar from '../components/Avatar';
import CropModal from '../components/CropModal';
import Modal from '../components/Modal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * DevPrep - Student Profile & Settings Page (`Profile.jsx`)
 * Conforms to Design.md Section 7.10 & Phase 10 View/Edit Mode Specifications:
 * 1. View Mode (Default): Plain text display, read-only tags, and a single "Edit Profile" button.
 * 2. Edit Mode: Replaces view with form fields, "Save changes" & "Cancel" buttons, inline validation.
 * 3. Cancel with unsaved changes confirmation and Esc-key support.
 * 4. Focus management: first input on edit enter, Edit button on save/cancel exit.
 * 5. Theme toggle: independent of edit flow; applies instantly in both modes.
 */
export default function Profile() {
  const { user, avatar, setAvatar } = useAuth();
  useDocumentTitle('Profile & Settings');
  const { skin, setSkin, theme, setTheme } = useTheme();

  // Mode State: View Mode (false) by default
  const [isEditing, setIsEditing] = useState(false);

  // Loading & Network States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Form Fields State
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [targetRole, setTargetRole] = useState('Software Development Engineer');
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [skills, setSkills] = useState([]);
  const [goals, setGoals] = useState([]);

  // Baseline Data State for tracking unsaved modifications
  const [initialData, setInitialData] = useState(null);

  // Preparation Statistics (Live data summary)
  const [stats, setStats] = useState({
    totalSolved: 0,
    totalQuestions: 0,
    solvePercent: 0,
    streak: { current: 0 },
    mockTestsCount: 0,
    applicationsCount: 0
  });

  // Focus Refs
  const editButtonRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Avatar / Profile Photo State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [photoToCrop, setPhotoToCrop] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [photoUpdating, setPhotoUpdating] = useState(false);
  const photoInputRef = useRef(null);

  // Calculate initials for plain circular avatar
  const initials = useMemo(() => {
    if (!user?.name) return 'DP';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user]);

  // Load profile data from backend
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await api.getProgress();

      const profile = data.profile || {};
      const loadedCollege = profile.college || '';
      const loadedBranch = profile.branch || '';
      const loadedGradYear = profile.graduationYear || '2026';
      const loadedRole = profile.targetRole || 'Software Development Engineer';
      const loadedWeeklyGoal = profile.weeklyGoal || 5;
      const loadedSkills = Array.isArray(profile.skills) ? profile.skills : [];
      const loadedGoals = Array.isArray(profile.goals) ? profile.goals : [];

      setCollege(loadedCollege);
      setBranch(loadedBranch);
      setGraduationYear(loadedGradYear);
      setTargetRole(loadedRole);
      setWeeklyGoal(loadedWeeklyGoal);
      setSkills(loadedSkills);
      setGoals(loadedGoals);

      // Keep baseline for change detection
      setInitialData({
        college: loadedCollege,
        branch: loadedBranch,
        graduationYear: loadedGradYear,
        targetRole: loadedRole,
        weeklyGoal: loadedWeeklyGoal,
        skills: [...loadedSkills],
        goals: [...loadedGoals]
      });

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!initialData) return false;
    if (college.trim() !== initialData.college) return true;
    if (branch.trim() !== initialData.branch) return true;
    if (graduationYear !== initialData.graduationYear) return true;
    if (targetRole.trim() !== initialData.targetRole) return true;
    if (Number(weeklyGoal) !== Number(initialData.weeklyGoal)) return true;

    // Compare skills arrays
    if (skills.length !== initialData.skills.length) return true;
    if (skills.some((s, idx) => s !== initialData.skills[idx])) return true;

    // Compare goals arrays
    if (goals.length !== initialData.goals.length) return true;
    if (goals.some((g, idx) => g !== initialData.goals[idx])) return true;

    return false;
  }, [college, branch, graduationYear, targetRole, weeklyGoal, skills, goals, initialData]);

  // Switch to Edit Mode
  const handleEnterEditMode = () => {
    setValidationError(null);
    setErrorMessage(null);
    setIsEditing(true);
    // Focus first input sensibly after render
    setTimeout(() => {
      firstFieldRef.current?.focus();
    }, 50);
  };

  // Revert changes and exit Edit Mode
  const handleCancelEdit = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved profile changes. Are you sure you want to discard them?'
      );
      if (!confirmed) return;
    }

    // Revert state to initial baseline
    if (initialData) {
      setCollege(initialData.college);
      setBranch(initialData.branch);
      setGraduationYear(initialData.graduationYear);
      setTargetRole(initialData.targetRole);
      setWeeklyGoal(initialData.weeklyGoal);
      setSkills([...initialData.skills]);
      setGoals([...initialData.goals]);
    }

    setValidationError(null);
    setErrorMessage(null);
    setIsEditing(false);

    // Return focus to Edit button sensibly
    setTimeout(() => {
      editButtonRef.current?.focus();
    }, 50);
  }, [hasUnsavedChanges, initialData]);

  // Close edit mode on Escape key
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, handleCancelEdit]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    if (!isEditing || !hasUnsavedChanges) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, hasUnsavedChanges]);

  // Profile Photo Handlers (Updates immediately, independent of profile form save)
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Reset input to allow selecting the same file again
    if (file) {
      setPhotoToCrop(file);
      setIsCropModalOpen(true);
    }
  };

  const handleSaveCroppedPhoto = async (dataUrl) => {
    try {
      setPhotoUpdating(true);
      setErrorMessage(null);
      await api.uploadAvatar(dataUrl);
      setAvatar(dataUrl);
      setSuccessMessage('Profile photo updated successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile photo.');
    } finally {
      setPhotoUpdating(false);
    }
  };

  const handleConfirmDeletePhoto = async () => {
    try {
      setPhotoUpdating(true);
      setErrorMessage(null);
      await api.deleteAvatar();
      setAvatar(null);
      setIsDeleteModalOpen(false);
      setSuccessMessage('Profile photo removed successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to remove profile photo.');
    } finally {
      setPhotoUpdating(false);
    }
  };

  // Handle Save
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setValidationError(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validate Goals: no empty rows, max 10 goals of 150 chars each
    if (goals.length > 10) {
      setValidationError('Cannot exceed maximum of 10 placement goals.');
      return;
    }

    for (let i = 0; i < goals.length; i++) {
      const g = (goals[i] || '').trim();
      if (!g) {
        setValidationError(`Goal row ${i + 1} is empty. Please enter a goal description or remove the empty row.`);
        return;
      }
      if (g.length > 150) {
        setValidationError(`Goal row ${i + 1} exceeds 150 characters.`);
        return;
      }
    }

    // 2. Validate Skills: max 15 tags of 30 characters each
    if (skills.length > 15) {
      setValidationError('Cannot exceed maximum of 15 technical skills.');
      return;
    }

    for (const s of skills) {
      if (s.length > 30) {
        setValidationError(`Skill "${s}" exceeds 30 characters.`);
        return;
      }
    }

    // 3. Validate Weekly Goal
    const numWeeklyGoal = Number(weeklyGoal);
    if (!Number.isInteger(numWeeklyGoal) || numWeeklyGoal < 1 || numWeeklyGoal > 50) {
      setValidationError('Weekly problem target must be a whole number between 1 and 50.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        action: 'updateProfile',
        college: college.trim(),
        branch: branch.trim(),
        graduationYear,
        targetRole: targetRole.trim(),
        weeklyGoal: numWeeklyGoal,
        skills,
        goals: goals.map((g) => g.trim())
      };

      await api.updateProgress(payload);

      // Update baseline state
      setInitialData({
        college: college.trim(),
        branch: branch.trim(),
        graduationYear,
        targetRole: targetRole.trim(),
        weeklyGoal: numWeeklyGoal,
        skills: [...skills],
        goals: goals.map((g) => g.trim())
      });

      // Exit Edit Mode and return to View Mode
      setIsEditing(false);
      setSuccessMessage('Profile and settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);

      // Return focus to Edit Profile button
      setTimeout(() => {
        editButtonRef.current?.focus();
      }, 50);
    } catch (err) {
      // Stay in edit mode, keep user's input, show error
      setErrorMessage(err.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  // Instant Theme Switch (Independent of Edit/Save flow)
  const handleThemeChange = async (newTheme) => {
    if (newTheme === theme) return;
    setTheme(newTheme);

    try {
      await api.updateProgress({
        action: 'updateProfile',
        theme: newTheme
      });
    } catch (_) {
      // Theme persists locally in ThemeContext even if offline
    }
  };

  // Instant Visual Skin Switch (Independent of Edit/Save flow)
  const handleSkinChange = (newSkin) => {
    if (newSkin === skin) return;
    setSkin(newSkin);
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="profile-page-container">
        <div className="card profile-header-card">
          <div className="profile-header-skeleton">
            <div className="skeleton-avatar" />
            <div style={{ flex: 1 }}>
              <div className="skeleton-line" style={{ width: '180px', height: '24px', marginBottom: '8px' }} />
              <div className="skeleton-line" style={{ width: '240px', height: '14px', marginBottom: '12px' }} />
              <div className="skeleton-line" style={{ width: '100px', height: '20px' }} />
            </div>
          </div>
        </div>

        <div className="card profile-section-card" style={{ minHeight: '300px' }}>
          <div className="skeleton-line" style={{ width: '200px', height: '20px', marginBottom: '20px' }} />
          <div className="skeleton-line" style={{ width: '100%', height: '40px', marginBottom: '16px' }} />
          <div className="skeleton-line" style={{ width: '100%', height: '40px', marginBottom: '16px' }} />
          <div className="skeleton-line" style={{ width: '100%', height: '80px' }} />
        </div>
      </div>
    );
  }

  // Error State (if initial fetch failed)
  if (errorMessage && !initialData) {
    return (
      <div className="profile-page-container">
        <ErrorMessage message={errorMessage} onRetry={loadProfile} />
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      {/* Top Header & Actions Bar */}
      <div className="profile-top-bar">
        <div>
          <h1 className="page-heading font-fraunces">Profile & Settings</h1>
          <p className="page-subheading">
            {isEditing
              ? 'Update your academic information, skills stack, and target placement goals.'
              : 'Review your preparation roadmap, technical skills, and platform preferences.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="profile-save-actions">
          {!isEditing ? (
            /* View Mode: Single Secondary "Edit Profile" Button */
            <button
              ref={editButtonRef}
              type="button"
              onClick={handleEnterEditMode}
              className="btn btn-secondary profile-edit-btn"
              aria-label="Edit Profile"
            >
              <Edit3 size={16} aria-hidden="true" />
              <span>Edit Profile</span>
            </button>
          ) : (
            /* Edit Mode: "Cancel" and "Save changes" Buttons */
            <>
              {hasUnsavedChanges && (
                <span className="unsaved-badge" aria-live="polite">
                  ● Unsaved changes
                </span>
              )}
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="btn btn-secondary profile-cancel-btn"
                title="Discard changes and return to view mode (Esc)"
              >
                <X size={15} aria-hidden="true" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving || !hasUnsavedChanges}
                className="btn btn-primary profile-save-btn"
              >
                <Save size={16} aria-hidden="true" />
                <span>{saving ? 'Saving...' : 'Save changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline Feedback Alerts */}
      {successMessage && (
        <div className="alert-banner alert-success" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {(validationError || errorMessage) && (
        <div className="alert-banner alert-danger" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{validationError || errorMessage}</span>
        </div>
      )}

      {/* 1. Header Card: Initials Avatar & Basic Identity */}
      <div className="card profile-header-card">
        <div className="profile-identity-group">
          {/* Avatar & Photo Actions (72px circle, actions in Edit mode) */}
          <div className="profile-avatar-container">
            <Avatar user={user} size={72} />

            {isEditing && (
              <div className="profile-avatar-actions">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelect}
                />
                <div className="profile-avatar-btn-row">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoUpdating}
                    className="btn btn-secondary btn-sm"
                    title="Change profile photo"
                  >
                    <Camera size={13} aria-hidden="true" />
                    <span>Change photo</span>
                  </button>

                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      disabled={photoUpdating}
                      className="btn btn-secondary btn-sm"
                      title="Remove profile photo"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="profile-avatar-note">Photo updates immediately</p>
              </div>
            )}
          </div>

          <div className="profile-identity-details">
            <div className="profile-name-row">
              <h2 className="profile-name font-fraunces">{user?.name || 'Developer'}</h2>
              <span className={`role-badge role-badge-${user?.role || 'user'}`}>
                {user?.role === 'admin' ? (
                  <>
                    <Shield size={12} aria-hidden="true" />
                    <span>Administrator</span>
                  </>
                ) : (
                  <span>Student Developer</span>
                )}
              </span>
            </div>

            <div className="profile-meta-row">
              <span className="profile-meta-item">
                <Mail size={14} className="meta-icon" aria-hidden="true" />
                <span>{user?.email || 'student@devprep.com'}</span>
                <span className="readonly-indicator-pill">Read-only</span>
              </span>
              <span className="profile-meta-divider">•</span>
              <span className="profile-meta-item">
                <Calendar size={14} className="meta-icon" aria-hidden="true" />
                <span>Class of {graduationYear || '2026'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Stats Summary Overview Strip */}
        <div className="profile-stats-strip">
          <div className="profile-stat-box">
            <span className="stat-box-label">Problems Solved</span>
            <span className="stat-box-value font-fraunces">
              {stats.totalSolved} <span className="stat-box-sub">/ {stats.totalQuestions}</span>
            </span>
            <span className="stat-box-note mono-text">{stats.solvePercent}% completed</span>
          </div>

          <div className="profile-stat-box">
            <span className="stat-box-label">Practice Streak</span>
            <div className="stat-box-value-with-icon">
              <Flame size={18} className="stat-flame-icon" aria-hidden="true" />
              <span className="stat-box-value font-fraunces">
                {stats.streak?.current || 0}
              </span>
            </div>
            <span className="stat-box-note">Active day streak</span>
          </div>

          <div className="profile-stat-box">
            <span className="stat-box-label">Mock Tests</span>
            <span className="stat-box-value font-fraunces">
              {stats.mockTestsCount || 0}
            </span>
            <span className="stat-box-note">Completed tests</span>
          </div>

          <div className="profile-stat-box">
            <span className="stat-box-label">Applications</span>
            <span className="stat-box-value font-fraunces">
              {stats.applicationsCount || 0}
            </span>
            <span className="stat-box-note">Active opportunities</span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="profile-sections-grid">
        {/* Left Column: Academic Details & Placement Goals */}
        <div className="profile-column">
          {/* Card: Academic Information */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="header-with-icon">
                <GraduationCap size={18} className="section-title-icon" aria-hidden="true" />
                <h2 className="section-card-title font-fraunces">Academic Details</h2>
              </div>
            </div>

            {!isEditing ? (
              /* VIEW MODE: Plain text display */
              <div className="profile-view-fields">
                <div className="view-field-row">
                  <span className="view-field-label">College / University</span>
                  <span className="view-field-value">
                    {college.trim() ? college : <span className="view-mode-empty">Not specified</span>}
                  </span>
                </div>

                <div className="view-field-row">
                  <span className="view-field-label">Branch / Specialization</span>
                  <span className="view-field-value">
                    {branch.trim() ? branch : <span className="view-mode-empty">Not specified</span>}
                  </span>
                </div>

                <div className="view-field-row">
                  <span className="view-field-label">Graduation Year</span>
                  <span className="view-field-value mono-text">Class of {graduationYear}</span>
                </div>
              </div>
            ) : (
              /* EDIT MODE: Form controls */
              <div className="form-fields-stack">
                <div className="form-group">
                  <label htmlFor="collegeInput" className="form-label">
                    College / University
                  </label>
                  <input
                    ref={firstFieldRef}
                    id="collegeInput"
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Indian Institute of Information Technology"
                    maxLength={100}
                    className="form-input"
                  />
                </div>

                <div className="form-row-two-col">
                  <div className="form-group">
                    <label htmlFor="branchInput" className="form-label">
                      Branch / Specialization
                    </label>
                    <input
                      id="branchInput"
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. Computer Science (CSE)"
                      maxLength={100}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="gradYearSelect" className="form-label">
                      Graduation Year
                    </label>
                    <select
                      id="gradYearSelect"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="form-select"
                    >
                      {[2024, 2025, 2026, 2027, 2028, 2029].map((year) => (
                        <option key={year} value={String(year)}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card: Career & Practice Targets */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="header-with-icon">
                <Briefcase size={18} className="section-title-icon" aria-hidden="true" />
                <h2 className="section-card-title font-fraunces">Career & Practice Targets</h2>
              </div>
            </div>

            {!isEditing ? (
              /* VIEW MODE: Plain text display */
              <div className="profile-view-fields">
                <div className="view-field-row">
                  <span className="view-field-label">Target Role</span>
                  <span className="view-field-value">
                    {targetRole.trim() ? targetRole : <span className="view-mode-empty">Not specified</span>}
                  </span>
                </div>

                <div className="view-field-row">
                  <span className="view-field-label">Weekly Problem Target</span>
                  <span className="view-field-value mono-text font-bold">
                    {weeklyGoal} problems / week
                  </span>
                </div>
              </div>
            ) : (
              /* EDIT MODE: Form controls */
              <div className="form-fields-stack">
                <div className="form-group">
                  <label htmlFor="targetRoleInput" className="form-label">
                    Target Job / Internship Role
                  </label>
                  <input
                    id="targetRoleInput"
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Software Development Engineer (SDE 1)"
                    maxLength={100}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="weeklyGoalInput" className="form-label">
                    Weekly Problem Target
                  </label>
                  <div className="weekly-goal-input-box">
                    <input
                      id="weeklyGoalInput"
                      type="number"
                      min={1}
                      max={50}
                      value={weeklyGoal}
                      onChange={(e) => setWeeklyGoal(e.target.value)}
                      className="form-input weekly-goal-field mono-text"
                    />
                    <span className="input-helper-unit">problems / week</span>
                  </div>
                  <span className="form-field-hint">
                    Aim for consistent daily practice to build problem-solving intuition.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card: Placement Milestones & Goals */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="header-with-icon">
                <Target size={18} className="section-title-icon" aria-hidden="true" />
                <h2 className="section-card-title font-fraunces">Placement Goals</h2>
              </div>
            </div>

            <GoalsListEditor
              goals={goals}
              onChange={setGoals}
              maxGoals={10}
              readOnly={!isEditing}
            />
          </div>
        </div>

        {/* Right Column: Technical Skills & Platform Preferences */}
        <div className="profile-column">
          {/* Card: Technical Skills Tags */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="header-with-icon">
                <Code2 size={18} className="section-title-icon" aria-hidden="true" />
                <h2 className="section-card-title font-fraunces">Technical Skills</h2>
              </div>
            </div>

            <SkillTagsInput
              skills={skills}
              onChange={setSkills}
              maxSkills={15}
              readOnly={!isEditing}
            />
          </div>

          {/* Card: Appearance & Theme Preferences (OUTSIDE EDIT FLOW) */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="header-with-icon">
                <Sun size={18} className="section-title-icon" aria-hidden="true" />
                <h2 className="section-card-title font-heading">Appearance & Theme</h2>
              </div>
              <span className="section-header-tag">Live Switch</span>
            </div>

            <p className="section-card-intro">
              Personalize your visual experience. Changes apply immediately and persist across your sessions.
            </p>

            {/* Visual Skin Picker */}
            <h3 className="appearance-section-subtitle">Visual Skin (Design Aesthetic)</h3>
            <div className="skin-selection-grid">
              <button
                type="button"
                onClick={() => handleSkinChange('paper')}
                className={`skin-option-card ${skin === 'paper' ? 'skin-option-active' : ''}`}
                aria-pressed={skin === 'paper'}
              >
                <div className="skin-swatch-box skin-swatch-paper">
                  <div className="swatch-bar-accent" />
                  <div className="swatch-bar-text" />
                  <div className="swatch-bar-muted" />
                </div>
                <div className="skin-option-info">
                  <span className="skin-option-title">Paper</span>
                  <span className="skin-option-desc">Warm paper & ink, editorial serif headings, terracotta accents</span>
                </div>
                {skin === 'paper' && (
                  <CheckCircle2 size={16} className="skin-selected-check" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSkinChange('studio')}
                className={`skin-option-card ${skin === 'studio' ? 'skin-option-active' : ''}`}
                aria-pressed={skin === 'studio'}
              >
                <div className="skin-swatch-box skin-swatch-studio">
                  <div className="swatch-bar-accent" />
                  <div className="swatch-bar-text" />
                  <div className="swatch-bar-muted" />
                </div>
                <div className="skin-option-info">
                  <span className="skin-option-title">Studio</span>
                  <span className="skin-option-desc">Modern precision, Bricolage Grotesque, cobalt blue accents</span>
                </div>
                {skin === 'studio' && (
                  <CheckCircle2 size={16} className="skin-selected-check" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Light / Dark Mode Toggle */}
            <h3 className="appearance-section-subtitle">Color Mode</h3>
            <div className="theme-selection-grid">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`theme-option-card ${theme === 'light' ? 'theme-option-active' : ''}`}
                aria-pressed={theme === 'light'}
              >
                <div className="theme-option-icon-box">
                  <Sun size={20} className="theme-sun-icon" aria-hidden="true" />
                </div>
                <div className="theme-option-info">
                  <span className="theme-option-title">Light Mode</span>
                  <span className="theme-option-desc">Natural daylight contrast for high-clarity study</span>
                </div>
                {theme === 'light' && (
                  <CheckCircle2 size={16} className="theme-selected-check" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`theme-option-card ${theme === 'dark' ? 'theme-option-active' : ''}`}
                aria-pressed={theme === 'dark'}
              >
                <div className="theme-option-icon-box">
                  <Moon size={20} className="theme-moon-icon" aria-hidden="true" />
                </div>
                <div className="theme-option-info">
                  <span className="theme-option-title">Dark Mode</span>
                  <span className="theme-option-desc">Low-glare dark surfaces for comfortable night practice</span>
                </div>
                {theme === 'dark' && (
                  <CheckCircle2 size={16} className="theme-selected-check" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Card: Account Security Information */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="header-with-icon">
                <Shield size={18} className="section-title-icon" aria-hidden="true" />
                <h2 className="section-card-title font-fraunces">Account Information</h2>
              </div>
            </div>

            <div className="account-info-box">
              <div className="account-info-row">
                <span className="info-row-label">Registered Name:</span>
                <span className="info-row-value">{user?.name || 'Demo Student'}</span>
              </div>
              <div className="account-info-row">
                <span className="info-row-label">Registered Email:</span>
                <span className="info-row-value mono-text">{user?.email || 'demo@devprep.com'}</span>
              </div>
              <div className="account-info-row">
                <span className="info-row-label">Account Role:</span>
                <span className="info-row-value">{user?.role === 'admin' ? 'Administrator' : 'Standard Student'}</span>
              </div>
              <div className="account-info-row">
                <span className="info-row-label">Password:</span>
                <span className="info-row-value mono-text">••••••••••••</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Avatar Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remove Profile Photo"
        confirmText="Remove Photo"
        confirmVariant="danger"
        isLoading={photoUpdating}
        onConfirm={handleConfirmDeletePhoto}
        maxWidth="460px"
      >
        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Are you sure you want to remove your profile photo? Your avatar will revert to your name initials.
        </p>
      </Modal>

      {/* Profile Photo Crop & Resize Modal */}
      <CropModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setPhotoToCrop(null);
        }}
        onPhotoCropped={handleSaveCroppedPhoto}
        initialFile={photoToCrop}
      />
    </div>
  );
}
