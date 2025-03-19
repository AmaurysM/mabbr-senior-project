'use client';
import React, { useState } from 'react';
import './EditProfile.css';
import Image from 'next/image';

const Profile = ({ initialName, initialEmail, initialBio }:{
  initialName: string,
  initialEmail: string,
  initialBio: string,
}) => {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [bio, setBio] = useState(initialBio);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = () => {
    if (!name || !email || !bio) {
      setMessage('Please fill out all fields.');
      return;
    }
    console.log('Profile saved:', { name, email, bio });
    setMessage('Profile saved successfully!');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('profilePicture', selectedFile);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage('Upload successful!');
      } else {
        setMessage('Upload failed. Please try again.');
      }
    } catch (error) {
      setMessage('Error uploading file: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
      <h2>Edit Profile</h2>
      <div className="styled-div">
        <h4>Upload Profile Picture:</h4>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {previewUrl && (
          <Image
            src={previewUrl}
            alt="Profile Preview"
            style={{ width: '100%', borderRadius: '8px', margin: '10px 0' }}
          />
        )}
        <button onClick={handleUpload} style={{ marginTop: '10px', marginLeft: '10px' }} disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Picture'}
        </button>
        <h4>Add your user info:</h4>
        <label>Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ margin: '10px 0', display: 'block', width: '100%' }}
          />
        </label>
        <label>Contact Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ margin: '10px 0', display: 'block', width: '100%' }}
          />
        </label>
        <label>Bio:
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={{ margin: '10px 0', display: 'block', width: '100%' }}
          />
        </label>
        <button onClick={handleSave} style={{ marginTop: '10px' }}>Save</button>
        {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
      </div>
    </div>
  );
};

export default Profile;
