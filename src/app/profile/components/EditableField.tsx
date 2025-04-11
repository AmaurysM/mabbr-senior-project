"use client";
import { useEffect, useState } from "react";
import { toast } from '@/app/hooks/use-toast';
import { CheckIcon, PencilIcon } from "lucide-react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import SkeletonLoader from "@/app/components/SkeletonLoader";

interface EditableFieldProps {
  value: string;
  label: string;
  onSave: (value: string) => Promise<void>;
  requireConfirmation?: boolean;
  loading?: boolean;
}

const EditableField = ({ 
  value, 
  label, 
  onSave, 
  requireConfirmation = false, 
  loading = false 
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(value);
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNewValue(value);
  }, [value]);

  const handleSave = async () => {
    if (requireConfirmation && newValue !== confirmValue) {
      setError('Values do not match');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(newValue);
      setIsEditing(false);
      setError('');
      toast({
        title: "Success",
        description: `${label} updated successfully`,
      });
    } catch (error) {
      console.error(`Error updating ${label}:`, error);
      setError(`Failed to update ${label}`);
      toast({
        title: "Error",
        description: `Failed to update ${label}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewValue(value);
    setConfirmValue('');
    setError('');
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <SkeletonLoader className="h-4 w-24 rounded-md" />
        <SkeletonLoader className="h-6 w-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="group relative space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-400">{label}</label>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Edit ${label}`}
          >
            <PencilIcon className="h-4 w-4 text-blue-400 hover:text-blue-500" />
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="text-white truncate">{value}</div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700/30 rounded-lg border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
              aria-label={`Edit ${label}`}
              disabled={isSaving}
            />
            {requireConfirmation && (
              <input
                type="text"
                value={confirmValue}
                onChange={(e) => setConfirmValue(e.target.value)}
                placeholder={`Confirm ${label.toLowerCase()}`}
                className="w-full px-3 py-2 bg-gray-700/30 rounded-lg border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
                aria-label={`Confirm ${label}`}
                disabled={isSaving}
              />
            )}
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center gap-2"
              aria-label="Save changes"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  <span>Save</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors flex items-center gap-2"
              aria-label="Cancel editing"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableField;