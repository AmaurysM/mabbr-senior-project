import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ChatMessage = {
  content: string;
  userEmail: string;
  timeStamp: Date;
};

const seedChatMessages: ChatMessage[] = [
  {
    content: "Hey everyone, how are the markets today?",
    userEmail: "sophie@gmail.com",
    timeStamp: new Date("2025-03-10T08:15:00"),
  },
  {
    content: "I'm seeing a big dip in TSLA stocks. Should I buy more?",
    userEmail: "daniel@gmail.com",
    timeStamp: new Date("2025-03-10T08:17:00"),
  },
  {
    content: "I think it might be a good time to hold off for a while.",
    userEmail: "emma@gmail.com",
    timeStamp: new Date("2025-03-10T08:18:00"),
  },
  {
    content: "I bought more TSLA this morning! Let's see what happens.",
    userEmail: "lucas@gmail.com",
    timeStamp: new Date("2025-03-10T08:20:00"),
  },
  {
    content: "Anyone know about the latest news on Apple stock?",
    userEmail: "olivia@gmail.com",
    timeStamp: new Date("2025-03-10T08:22:00"),
  },
  {
    content:
      "I read something about a new product launch. It could affect the price.",
    userEmail: "nathan@gmail.com",
    timeStamp: new Date("2025-03-10T08:23:00"),
  },
  {
    content: "I’m watching AMZN stocks closely. Any opinions?",
    userEmail: "james@gmail.com",
    timeStamp: new Date("2025-03-10T08:25:00"),
  },
  {
    content:
      "I think it’s a good long-term investment. Hold if you’re in it for the future.",
    userEmail: "hannah@gmail.com",
    timeStamp: new Date("2025-03-10T08:28:00"),
  },
  {
    content:
      "I just sold some AMZN to buy more AAPL. I’m feeling bullish on Apple!",
    userEmail: "ethan@gmail.com",
    timeStamp: new Date("2025-03-10T08:30:00"),
  },
  {
    content: "Great choice! Apple’s going to keep climbing.",
    userEmail: "isabella@gmail.com",
    timeStamp: new Date("2025-03-10T08:33:00"),
  },
  {
    content: "I’m new here, but I’m watching GOOGL and NVDA. Any tips?",
    userEmail: "alexander@gmail.com",
    timeStamp: new Date("2025-03-10T08:35:00"),
  },
  {
    content:
      "GOOGL looks solid for the next couple of months, but NVDA is volatile.",
    userEmail: "mia@gmail.com",
    timeStamp: new Date("2025-03-10T08:40:00"),
  },
  {
    content: "I think I’ll focus more on long-term stocks like AAPL and MSFT.",
    userEmail: "david@gmail.com",
    timeStamp: new Date("2025-03-10T08:42:00"),
  },
  {
    content:
      "I agree. But don’t forget about the short-term opportunities. Look at TSLA!",
    userEmail: "charlotte@gmail.com",
    timeStamp: new Date("2025-03-10T08:45:00"),
  },
  {
    content:
      "Just bought a few shares of Tesla after that dip. Hoping for a recovery.",
    userEmail: "benjamin@gmail.com",
    timeStamp: new Date("2025-03-10T08:48:00"),
  },
  {
    content:
      "Nice move! I might do the same. Always wanted to invest in Tesla.",
    userEmail: "ava@gmail.com",
    timeStamp: new Date("2025-03-10T08:50:00"),
  },
  {
    content:
      "Am I the only one here who’s not into TSLA? 😂 I’m all about GOOGL.",
    userEmail: "henry@gmail.com",
    timeStamp: new Date("2025-03-10T08:52:00"),
  },
  {
    content: "I feel that. GOOGL is a safer bet in my opinion.",
    userEmail: "amelia@gmail.com",
    timeStamp: new Date("2025-03-10T08:55:00"),
  },
  {
    content: "I just bought some NVDA. It’s been doing well recently.",
    userEmail: "sebastian@gmail.com",
    timeStamp: new Date("2025-03-10T09:00:00"),
  },
  {
    content:
      "I’m thinking of holding my stocks. The market is too volatile right now.",
    userEmail: "madison@gmail.com",
    timeStamp: new Date("2025-03-10T09:05:00"),
  },
  {
    content:
      "I’m just watching and waiting. Let’s see how the market reacts this week.",
    userEmail: "elijah@gmail.com",
    timeStamp: new Date("2025-03-10T09:07:00"),
  },
  {
    content:
      "Looking at the stocks today, I’m thinking about diversifying more.",
    userEmail: "scarlett@gmail.com",
    timeStamp: new Date("2025-03-10T09:10:00"),
  },
  {
    content:
      "I’ve been thinking about diversifying too. Maybe add some energy stocks.",
    userEmail: "matthew@gmail.com",
    timeStamp: new Date("2025-03-10T09:12:00"),
  },
  {
    content:
      "Yeah, that’s not a bad idea. Energy might be a good hedge against the volatility.",
    userEmail: "chloe@gmail.com",
    timeStamp: new Date("2025-03-10T09:15:00"),
  },
  {
    content: "Just got my first lootbox. Let's see what’s inside! 😄",
    userEmail: "daniela@gmail.com",
    timeStamp: new Date("2025-03-10T09:18:00"),
  },
];

async function seedGlobalChat() {
    try {

      for (const message of seedChatMessages) {
        const foundUser = await prisma.user.findUnique({
          where: { email: message.userEmail },
        });
  
        if (foundUser) {
          await prisma.comment.create({
            data: {
              commentableType: "GLOBALCHAT",
              content: message.content,
              userId: foundUser.id,  
            },
          });
        } else {
          console.log(`User with email ${message.userEmail} not found. Skipping message.`);
        }
      }
  
      console.log(`Successfully seeded ${seedChatMessages.length} chat messages!`);
    } catch (error) {
      console.error("Error seeding chat messages:", error);
    } finally {
      await prisma.$disconnect();
    }
  }
  
  seedGlobalChat();
  
