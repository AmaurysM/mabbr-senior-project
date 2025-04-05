"use client";

import React, { useRef, useState } from 'react';
import { Loader2, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface TopicsFormProps {
  setShowCreateForm: (show: boolean) => void;
  onTopicCreated?: () => void;
}

const TopicsForm: React.FC<TopicsFormProps> = ({ setShowCreateForm, onTopicCreated }) => {
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) {
      setError('Topic name is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', topicName);
      formData.append('commentDescription', topicDescription);
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch('/api/topics/new', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create topic');

      onTopicCreated?.();
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Only images allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image too large (max 5MB)'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={() => !loading && setShowCreateForm(false)}
      />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-6 z-10"
      >
        <h2 className="text-2xl font-semibold text-gray-800">Create New Topic</h2>
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded">{error}</div>
        )}

        <div className="space-y-2">
          <label htmlFor="topicName" className="block text-sm font-medium text-gray-700">
            Topic Name<span className="text-red-500">*</span>
          </label>
          <input
            id="topicName"
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100"
            placeholder="Enter topic name..."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="topicDescription" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="topicDescription"
            value={topicDescription}
            onChange={(e) => setTopicDescription(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100"
            rows={4}
            placeholder="Describe your topic..."
          />
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-gray-700">Icon (optional)</span>
          <div className="flex items-center space-x-4">
            <div
              className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 disabled:cursor-not-allowed"
              onClick={() => !loading && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" fill className="rounded-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col space-y-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="text-indigo-600 hover:underline disabled:text-gray-400 text-sm"
              >
                {imageFile ? 'Change' : 'Upload'} Image
              </button>
              {imageFile && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  disabled={loading}
                  className="text-red-500 hover:underline disabled:text-gray-400 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            disabled={loading}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !topicName.trim()}
            className={`px-5 py-2 rounded-lg text-white ${
              loading || !topicName.trim()
                ? 'bg-gray-300'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } flex items-center justify-center space-x-2`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            <span>{loading ? 'Creating...' : 'Create Topic'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TopicsForm;
