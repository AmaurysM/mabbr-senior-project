import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const achievements = [
  { name: "Buy your first share.", description: "Purchase your first stock." },
  { name: "Sell your first share.", description: "Sell your first stock." },
  { name: "Become a verified investor.", description: "Verify your investor status." },
  { name: "Fill your portfolio with more than one stock.", description: "Own multiple stocks in your portfolio." },
  { name: "Sell your loss.", description: "Sell a stock at a loss." },
  { name: "Run out of money.", description: "Lose all your in-game money." },
  { name: "Invest $1 and become a millionaire.", description: "Turn a small investment into a massive fortune." },
  { name: "Market Maven", description: "Successfully sell your first stock for a profit." },
  { name: "Bull Market Champion", description: "Achieve a 50% return on investment within a single in-game year." },
  { name: "Bear Market Survivor", description: "Navigate a market downturn and sell stocks without incurring losses." },
  { name: "Diversification Expert", description: "Build a portfolio with at least five different sectors and sell stocks from each for a profit." },
  { name: "Day Trader", description: "Complete 10 successful day trades in a row without any losses." },
  { name: "Long-Term Investor", description: "Hold a stock for over a year and sell it for a significant profit." },
  { name: "Dividend Dynamo", description: "Earn a certain amount of in-game currency from dividend-paying stocks." },
  { name: "Market Timing Pro", description: "Sell a stock at its peak price, achieving the highest possible profit." },
  { name: "Risk Management Master", description: "Implement a stop-loss strategy that saves you from significant losses." },
  { name: "Insider Knowledge", description: "Gain access to exclusive in-game information that leads to a profitable stock sale." },
  { name: "Financial Freedom", description: "Accumulate enough in-game currency from stock sales to achieve financial independence." },
  { name: "Stock Whisperer", description: "Predict the next big stock trend and sell before it skyrockets." },
  { name: "Networking Ninja", description: "Form alliances with other players to share stock tips and achieve collective profits." },
  { name: "Tax Strategist", description: "Navigate in-game tax implications to maximize your net profit from stock sales." },
  { name: "Market Analyst", description: "Complete a series of challenges that involve analyzing market trends and making profitable trades." },
];

async function seedAchievements() {
  try {
    for (const achievement of achievements) {
      await prisma.achievement.create({
        data:{
            name: achievement.name,
            description: achievement.description
        }
      });
    }
    console.log("Achievements seeded successfully!");
  } catch (error) {
    console.error("Error seeding achievements:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAchievements();
