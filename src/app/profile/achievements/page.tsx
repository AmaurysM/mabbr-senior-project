'use client'
import React from 'react';
import AchievementCard from '../../components/AchievementCardProps';
import { Achievement } from './AchievementInterface';
import './Achievements.css';

const achievementsData: Achievement[] = [
  { id: 1, name: 'First Steps', details: 'Complete your first task.', unlocked: true },
  { id: 2, name: 'Explorer', details: 'Visit all sections of the app.', unlocked: false },
  { id: 3, name: 'Master', details: 'Achieve mastery in all tasks.', unlocked: false },
  // Add more achievements as needed
];

const Achievements: React.FC = () => {
  return (
    <div className="achievements-page">
      <h1>Achievements</h1>
      <div className="achievements-list">
        {achievementsData.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
};

export default Achievements;
