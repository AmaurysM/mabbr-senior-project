'use client'
import React, { useEffect, useState } from 'react';
import { Achievement } from './AchievementInterface';
import './Achievements.css';

const Achievements: React.FC = () => {
  const [achievementsData, setAchievementsData] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const response = await fetch('/api/achievements');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setAchievementsData(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="achievements-page">
      <h1>Achievements</h1>
      <table className="achievements-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Image</th>
            <th>Users Earned</th>
          </tr>
        </thead>
        <tbody>
          {achievementsData.map((achievement) => (
            <tr key={achievement.id}>
              <td>{achievement.name}</td>
              <td>{achievement.description}</td>
              <td>
                {achievement.image ? (
                  <img src={achievement.image} alt={achievement.name} className="achievement-image" />
                ) : (
                  'No Image'
                )}
              </td>
              <td>
                {achievement.users && achievement.users.length > 0 ? (
                  achievement.users.map((user) => (
                    <div key={user.userId}>{user.userId}</div>
                  ))
                ) : (
                  'No Users'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Achievements;
