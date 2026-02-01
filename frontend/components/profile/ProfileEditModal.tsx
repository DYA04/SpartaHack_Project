'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { profileService, UpdateProfilePayload } from '@/lib/services/profile.service';
import { SKILL_TAG_OPTIONS } from '@/types/job';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  currentSkills: string[];
  currentLimitations: string[];
}

const LIMITATION_OPTIONS = [
  // Physical/Mobility
  'heavy_lifting',
  'standing_long',
  'walking_long',
  'climbing_stairs',
  'bending_kneeling',
  // Transportation
  'driving_required',
  'no_transportation',
  // Environment
  'outdoor_work',
  'extreme_temps',
  'loud_environments',
  // Sensory
  'vision_impaired',
  'hearing_impaired',
  // Schedule/Time
  'evening_hours',
  'weekend_only',
  'limited_hours',
  // Other
  'animal_allergies',
  'chemical_sensitivity',
  'crowded_spaces',
];

const LIMITATION_LABELS: Record<string, string> = {
  // Physical/Mobility
  heavy_lifting: 'Cannot do heavy lifting (over 25 lbs)',
  standing_long: 'Cannot stand for long periods',
  walking_long: 'Cannot walk long distances',
  climbing_stairs: 'Cannot climb stairs',
  bending_kneeling: 'Cannot bend or kneel',
  // Transportation
  driving_required: 'Cannot drive',
  no_transportation: 'No reliable transportation',
  // Environment
  outdoor_work: 'Cannot work outdoors',
  extreme_temps: 'Cannot work in extreme heat/cold',
  loud_environments: 'Cannot work in loud environments',
  // Sensory
  vision_impaired: 'Vision impaired',
  hearing_impaired: 'Hearing impaired',
  // Schedule/Time
  evening_hours: 'Cannot work evenings',
  weekend_only: 'Weekends only',
  limited_hours: 'Limited to short shifts (2-3 hours)',
  // Other
  animal_allergies: 'Animal allergies',
  chemical_sensitivity: 'Sensitive to chemicals/fragrances',
  crowded_spaces: 'Cannot work in crowded spaces',
};

export default function ProfileEditModal({
  isOpen,
  onClose,
  onSave,
  currentSkills,
  currentLimitations,
}: ProfileEditModalProps) {
  const [skills, setSkills] = useState<string[]>(currentSkills);
  const [limitations, setLimitations] = useState<string[]>(currentLimitations);
  const [isSaving, setIsSaving] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleLimitation = (lim: string) => {
    setLimitations((prev) =>
      prev.includes(lim) ? prev.filter((l) => l !== lim) : [...prev, lim]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: UpdateProfilePayload = {
        skill_tags: skills,
        limitations,
      };
      await profileService.updateProfile(payload);
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>

        {/* Skills */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Skills</label>
          <div className="flex flex-wrap gap-2">
            {SKILL_TAG_OPTIONS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  skills.includes(skill)
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Limitations */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Limitations & Accommodations</label>
          <p className="text-xs text-gray-500 mb-3">Select any that apply to help us match you with suitable opportunities.</p>

          {/* Physical/Mobility */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Physical / Mobility</p>
            <div className="grid grid-cols-1 gap-1.5">
              {['heavy_lifting', 'standing_long', 'walking_long', 'climbing_stairs', 'bending_kneeling'].map((lim) => (
                <label
                  key={lim}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    limitations.includes(lim)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={limitations.includes(lim)}
                    onChange={() => toggleLimitation(lim)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{LIMITATION_LABELS[lim]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Transportation */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Transportation</p>
            <div className="grid grid-cols-1 gap-1.5">
              {['driving_required', 'no_transportation'].map((lim) => (
                <label
                  key={lim}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    limitations.includes(lim)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={limitations.includes(lim)}
                    onChange={() => toggleLimitation(lim)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{LIMITATION_LABELS[lim]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Environment */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Environment</p>
            <div className="grid grid-cols-1 gap-1.5">
              {['outdoor_work', 'extreme_temps', 'loud_environments', 'crowded_spaces'].map((lim) => (
                <label
                  key={lim}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    limitations.includes(lim)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={limitations.includes(lim)}
                    onChange={() => toggleLimitation(lim)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{LIMITATION_LABELS[lim]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sensory */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Sensory</p>
            <div className="grid grid-cols-1 gap-1.5">
              {['vision_impaired', 'hearing_impaired'].map((lim) => (
                <label
                  key={lim}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    limitations.includes(lim)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={limitations.includes(lim)}
                    onChange={() => toggleLimitation(lim)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{LIMITATION_LABELS[lim]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Schedule</p>
            <div className="grid grid-cols-1 gap-1.5">
              {['evening_hours', 'weekend_only', 'limited_hours'].map((lim) => (
                <label
                  key={lim}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    limitations.includes(lim)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={limitations.includes(lim)}
                    onChange={() => toggleLimitation(lim)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{LIMITATION_LABELS[lim]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Other */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Other</p>
            <div className="grid grid-cols-1 gap-1.5">
              {['animal_allergies', 'chemical_sensitivity'].map((lim) => (
                <label
                  key={lim}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    limitations.includes(lim)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={limitations.includes(lim)}
                    onChange={() => toggleLimitation(lim)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{LIMITATION_LABELS[lim]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
