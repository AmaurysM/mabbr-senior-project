import React from 'react';
import { Achievement } from '../achievements/AchievementInterface'

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  return (
    <div className="achievement-card">
      <h2>{achievement.name}</h2>
      {achievement.image && <img src={achievement.image} alt={achievement.name} className="achievement-image" />}
      <p>{achievement.description}</p>
      {/* Optionally display users who earned the achievement */}
      {achievement.users && achievement.users.length > 0 && (
        <div className="users-earned">
          <h3>Earned by:</h3>
          <ul>
            {achievement.users.map((user) => (
              <li key={user.userId}>{user.userId}</li> // Adjust this to display user names if available
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AchievementCard;
