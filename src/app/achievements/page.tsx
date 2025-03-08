'use client'
import React, { useEffect, useState } from 'react';
import AchievementCard from '../components/AchievementCardProps';
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

  const addUserToAchievement = async (userId: string, achievementId: string) => {
    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, achievementId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add user to achievement');
      }

      const newUserAchievement = await response.json();
      console.log('User added to achievement:', newUserAchievement);
      // Optionally, update the local state to reflect the new user achievement
      setAchievementsData((prev) =>
        prev.map((achievement) =>
          achievement.id === achievementId
            ? { ...achievement, users: [...(achievement.users || []), newUserAchievement] } // Ensure users is treated as an array
            : achievement
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="achievements-page">
      <h1>Achievements</h1>
      <div className="achievements-list">
        {achievementsData.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
      {/* Example button to add a user to an achievement */}
      <button onClick={() => addUserToAchievement('user-id-example', 'achievement-id-example')}>
        Add User to Achievement
      </button>
    </div>
  );
};

export default Achievements;