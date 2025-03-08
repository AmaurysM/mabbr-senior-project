export interface Achievement {
  id: string;
  name: string;
  description: string;
  image?: string; // Optional field
  users?: UserAchievement[]; // If you want to include users who earned the achievement
}

export interface UserAchievement {
  userId: string;
  earnedAt: Date;
}
