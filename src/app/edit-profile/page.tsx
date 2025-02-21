'use client';
import React, { useState } from 'react';
import './EditProfile.css';

interface ProfileProps {
  initialName: string;
  initialEmail: string;
  initialBio: string;
}

const Profile: React.FC<ProfileProps> = ({ initialName, initialEmail, initialBio }) => {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [bio, setBio] = useState(initialBio);

  const handleSave = () => {
    // Here you can handle saving the data, e.g., send it to an API
    console.log('Profile saved:', { name, email, bio });
  };

  // Profile Picture Code
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    }
  }
    
  // Profile Picture Upload Code
  const handleUpload = async () => {
    if (!selectedFile) return;
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);
        try {
          const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
          });
  
          if (response.ok) {
              console.log('Upload successful');
          } else {
              console.error('Upload failed');
          }
      } catch (error) {
          console.error('Error uploading file:', error);
      }
    }

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px', border: '1px solid #ccc' }}>
      <h2>Edit Profile</h2>
      <div class="styled-div">
        <h4> Upload Profile Picture:</h4>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <h4> Add your user info:</h4>
        <label> Name:
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ margin: '10px 0', display: 'block', width: '100%' }}/>
        </label>
        <label> Email:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ margin: '10px 0', display: 'block', width: '100%' }} />
        </label>
        <label> Bio:
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} style={{ margin: '10px 0', display: 'block', width: '100%' }}/>
        </label>
        <button onClick={handleSave} style={{ marginTop: '10px' }}> Save </button>
      </div>
    </div>
  );
};

export default Profile;