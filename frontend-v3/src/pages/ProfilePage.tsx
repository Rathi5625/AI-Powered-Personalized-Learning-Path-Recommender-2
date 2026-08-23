import React, { useState } from 'react';
import {
  Briefcase,
  Edit3,
  Check,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useProfile, useUpdateProfile } from '@/hooks/api/useProfile';
import type {
  ExperienceLevel,
  LearningStyle,
  EmploymentStatus,
  ProfileUpdateRequest,
} from '@/types';
import {
  Card,
  Button,
  Eyebrow,
  LoadingSpinner,
  ErrorState,
  Badge,
  Input,
  TextArea,
  Select,
  TagInput,
} from '@/components/common';

const EMPLOYMENT_OPTIONS = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'EMPLOYED', label: 'Employed' },
  { value: 'FREELANCER', label: 'Freelancer' },
  { value: 'UNEMPLOYED', label: 'Looking for roles' },
  { value: 'OTHER', label: 'Other' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

const LEARNING_STYLE_OPTIONS = [
  { value: 'PRACTICAL', label: 'Practical / Hands-on' },
  { value: 'VIDEO', label: 'Video Lectures' },
  { value: 'TEXT', label: 'Text / Documentation' },
  { value: 'PROJECT_BASED', label: 'Project-Based' },
  { value: 'MIXED', label: 'Mixed' },
];

export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const updateMutation = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateRequest>({});

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner label="Compiling Learner Dossier..." />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <ErrorState
          title="Profile Inaccessible"
          message="Could not load your learner profile dossier."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const handleStartEdit = () => {
    setFormData({
      fullName: profile.fullName || '',
      roleTitle: profile.roleTitle || '',
      organizationName: profile.organizationName || '',
      institutionName: profile.institutionName || '',
      employmentStatus: profile.employmentStatus,
      experienceLevel: profile.experienceLevel,
      preferredLearningStyle: profile.preferredLearningStyle,
      careerGoal: profile.careerGoal || '',
      bio: profile.bio || '',
      interests: profile.interests || [],
    });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(formData);
      setIsEditing(false);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <Card className="border-line bg-surface/90 p-6 sm:p-8 shadow-panel">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border border-ion/40 bg-ion/10 text-2xl sm:text-3xl font-bold font-mono text-ion shadow-glow-ion">
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl text-text">
                  {profile.fullName || 'Learner'}
                </h1>
                {profile.experienceLevel && (
                  <Badge tone="ion">
                    {profile.experienceLevel}
                  </Badge>
                )}
              </div>
              <p className="text-xs font-mono text-muted">{profile.email}</p>
              {profile.roleTitle && (
                <p className="text-xs text-text/80 flex items-center gap-1.5 pt-1">
                  <Briefcase className="h-3.5 w-3.5 text-ember" />
                  {profile.roleTitle}
                  {profile.organizationName && ` at ${profile.organizationName}`}
                </p>
              )}
            </div>
          </div>

          <div>
            {!isEditing ? (
              <Button variant="secondary" size="sm" onClick={handleStartEdit}>
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={updateMutation.isPending}
                  onClick={handleSave}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {isEditing ? (
        /* Edit Form */
        <Card className="border-line bg-surface/90 p-6 sm:p-8 shadow-panel">
          <form onSubmit={handleSave} className="space-y-6">
            <h2 className="font-display text-xl text-text border-b border-line pb-3">
              Edit Dossier Details
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />

              <Input
                label="Current Role Title"
                placeholder="e.g. Software Engineer, CS Student"
                value={formData.roleTitle || ''}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
              />

              <Input
                label="Organization / Company"
                placeholder="e.g. Acme Corp"
                value={formData.organizationName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, organizationName: e.target.value })
                }
              />

              <Input
                label="Institution / University"
                placeholder="e.g. Stanford University"
                value={formData.institutionName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, institutionName: e.target.value })
                }
              />

              <Select
                label="Employment Status"
                placeholder="Select status..."
                options={EMPLOYMENT_OPTIONS}
                value={formData.employmentStatus || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employmentStatus: e.target.value as EmploymentStatus,
                  })
                }
              />

              <Select
                label="Experience Level"
                placeholder="Select level..."
                options={EXPERIENCE_OPTIONS}
                value={formData.experienceLevel || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experienceLevel: e.target.value as ExperienceLevel,
                  })
                }
              >
              </Select>

              <Select
                label="Preferred Learning Style"
                placeholder="Select style..."
                options={LEARNING_STYLE_OPTIONS}
                value={formData.preferredLearningStyle || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preferredLearningStyle: e.target.value as LearningStyle,
                  })
                }
              >
              </Select>

              <Input
                label="Career Goal"
                placeholder="e.g. Senior Distributed Systems Architect"
                value={formData.careerGoal || ''}
                onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
              />
            </div>

            <TextArea
              label="Bio & Engineering Interests"
              rows={3}
              placeholder="Brief summary of your background and goals..."
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />

            <div>
              <TagInput
                label="Technical Focus Areas & Skills"
                value={formData.interests || []}
                onChange={(tags) => setFormData({ ...formData, interests: tags })}
                placeholder="Add skill tag and press enter..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-line">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* Résumé Grid View */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Personal Dossier & Career Ambition */}
          <div className="space-y-6 lg:col-span-2">
            {/* Career Goal & Bio */}
            <Card className="p-6 border-line bg-surface/90 shadow-panel space-y-4">
              <div>
                <Eyebrow tone="ember">CAREER AMBITION</Eyebrow>
                <h3 className="text-xl font-display text-text mt-1">
                  {profile.careerGoal || 'Not specified yet'}
                </h3>
              </div>

              {profile.bio && (
                <div className="border-t border-line/60 pt-3">
                  <p className="text-xs font-mono uppercase text-muted mb-1">Bio</p>
                  <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </div>
              )}
            </Card>

            {/* Completed Courses / Verified Competencies */}
            <Card className="p-6 border-line bg-surface/90 shadow-panel">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Eyebrow tone="ion">VERIFIED ACHIEVEMENTS</Eyebrow>
                  <h3 className="text-lg font-display text-text mt-1">
                    Completed Learning Modules
                  </h3>
                </div>
                <span className="font-mono text-xs text-muted">
                  {profile.completedCourses?.length || 0} Modules
                </span>
              </div>

              {profile.completedCourses && profile.completedCourses.length > 0 ? (
                <div className="space-y-3">
                  {profile.completedCourses.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-line bg-surface-2 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-text">{c.title}</p>
                          <p className="text-xs text-muted">{c.platform || 'Online Course'}</p>
                        </div>
                      </div>
                      <Badge tone="neutral">
                        {c.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-6">
                  No courses marked completed yet. Complete milestones on your learning path to log achievements here.
                </p>
              )}
            </Card>
          </div>

          {/* Right Column: Profile Specs & Tag Cloud */}
          <div className="space-y-6">
            {/* Learning Profile Matrix */}
            <Card className="p-6 border-line bg-surface/90 shadow-panel space-y-4">
              <Eyebrow tone="ion">LEARNER SPECIFICATIONS</Eyebrow>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-muted">Experience Level:</span>
                  <span className="font-mono text-text font-medium">
                    {profile.experienceLevel || 'Unset'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-muted">Learning Style:</span>
                  <span className="font-mono text-text font-medium">
                    {profile.preferredLearningStyle || 'Unset'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-muted">Employment:</span>
                  <span className="font-mono text-text font-medium">
                    {profile.employmentStatus || 'Unset'}
                  </span>
                </div>

                {profile.institutionName && (
                  <div className="flex justify-between border-b border-line/60 pb-2">
                    <span className="text-muted">Institution:</span>
                    <span className="text-text font-medium">{profile.institutionName}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Focus Skills */}
            <Card className="p-6 border-line bg-surface/90 shadow-panel space-y-3">
              <Eyebrow tone="ember">TARGET SKILLS & INTERESTS</Eyebrow>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.interests && profile.interests.length > 0 ? (
                  profile.interests.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-surface-2 border border-line px-2.5 py-1 text-xs font-mono text-text"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-muted">No focus skills added yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
