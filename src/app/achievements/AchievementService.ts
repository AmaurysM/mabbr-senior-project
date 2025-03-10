export const addUserToAchievement = async (userId: string, achievementId: string) => {
    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, achievementId }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add user to achievement');
      }
  
      const newUserAchievement = await response.json();
      console.log('User added to achievement:', newUserAchievement);
      return newUserAchievement;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
  