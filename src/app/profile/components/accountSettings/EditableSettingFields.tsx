"use client";

import React, { useState } from 'react';
import { PencilIcon, Check, X } from 'lucide-react';

const EditableField = ({ label, value, onSave, requireConfirmation = false }:{
    label: string;
    value: string;
    onSave: (newValue: string) => Promise<void>;
    requireConfirmation?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fieldValue, setFieldValue] = useState(value);
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState('');

  const handleEdit = () => {
    setIsEditing(true);
    setFieldValue(value);
    setConfirmValue('');
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
  };

  const handleSave = async () => {
    if (!fieldValue.trim()) {
      setError(`${label} cannot be empty`);
      return;
    }

    if (requireConfirmation && fieldValue !== confirmValue) {
      setError(`${label} confirmation doesn't match`);
      return;
    }

    try {
      await onSave(fieldValue);
      setIsEditing(false);
      setError('');
    } catch (error) {
      setError((error instanceof Error ? error.message : `Failed to update ${label.toLowerCase()}`));
    }
  };

  return (
    <div className="group relative">
      <label className="block text-sm font-medium text-gray-400 mb-1">
        {label}
      </label>
      
      {!isEditing ? (
        <div className="bg-gradient-to-r from-gray-700/80 to-gray-800/80 rounded-lg border border-gray-600/30 shadow-md hover:shadow-blue-500/20 transition-all duration-300">
          <div className="w-full flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-full">
                {label === "Email" ? (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </div>
              <div>
                <div className="text-white font-medium">{value}</div>
                <div className="text-gray-400 text-sm">Click to edit your {label.toLowerCase()}</div>
              </div>
            </div>
            <button
              onClick={handleEdit}
              className="bg-blue-600/80 hover:bg-blue-500 p-2 rounded-md transition-colors"
            >
              <PencilIcon className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-5 bg-gray-700/80 rounded-lg border border-gray-600/50 shadow-lg">
          <div>
            <label className="block text-sm text-gray-300 mb-1">New {label}</label>
            <input
              type={label.toLowerCase() === 'email' ? 'email' : 'text'}
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/90 text-white rounded-md border border-gray-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder={`Enter new ${label.toLowerCase()}`}
            />
          </div>

          {requireConfirmation && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Confirm {label}</label>
              <input
                type={label.toLowerCase() === 'email' ? 'email' : 'text'}
                value={confirmValue}
                onChange={(e) => setConfirmValue(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/90 text-white rounded-md border border-gray-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder={`Confirm ${label.toLowerCase()}`}
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md shadow-md hover:shadow-blue-500/30 transition-all flex-1 flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableField;