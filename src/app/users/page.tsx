'use-client';
import React from 'react';
import './UserProfile.css'; // Import the CSS file for styling

// Define the UserProfile type with a profilePicture property
interface UserProfile {
  id: number;
  name: string;
  email: string;
  bio: string;
  profilePicture: string; // URL to the profile picture
}

// Sample data (you can replace this with data fetched from an API)
const userProfiles: UserProfile[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'No bio.',
    profilePicture: 'https://via.placeholder.com/100', // Placeholder image
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    bio: 'No bio.',
    profilePicture: 'https://via.placeholder.com/100', // Placeholder image
  },
  {
    id: 3,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    bio: 'No bio.',
    profilePicture: 'https://via.placeholder.com/100', // Placeholder image
  },
];

// UserProfileList component
const UserProfileList: React.FC = () => {
  return (
    <div>
      <h1>User Profiles</h1>
      <ul className="user-profile-list">
        {userProfiles.map((user) => (
          <li key={user.id} className="user-profile">
            <img
              src={user.profilePicture}
              alt={`${user.name}'s profile`}
              className="profile-picture"
            />
            <div className="user-info">
              <h2>{user.name}</h2>
              <p>Email: {user.email}</p>
              <p>{user.bio}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserProfileList;