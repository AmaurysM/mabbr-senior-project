'use client';
import React, { useState } from 'react';

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

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px', border: '1px solid #ccc' }}>
      <h2>Profile</h2>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ margin: '10px 0', display: 'block', width: '100%' }}
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ margin: '10px 0', display: 'block', width: '100%' }}
          />
        </label>
        <label>
          Bio:
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={{ margin: '10px 0', display: 'block', width: '100%' }}
          />
        </label>
        <button onClick={handleSave} style={{ marginTop: '10px' }}>
          Save
        </button>
      </div>
    </div>
  );
};

export default Profile;