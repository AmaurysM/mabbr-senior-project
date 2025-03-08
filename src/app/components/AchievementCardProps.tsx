import React from 'react';
import { Achievement } from "../profile/achievements/AchievementInterface";

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  return (
    <div className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
      <h3>{achievement.name}</h3>
      <p>{achievement.details}</p>
      <span>{achievement.unlocked ? 'Unlocked' : 'Locked'}</span>
    </div>
  );
};

export default AchievementCard;
