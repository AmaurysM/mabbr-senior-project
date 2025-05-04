export async function GET() {
  const quotes = [
    {
      text: "Be fearful when others are greedy and greedy when others are fearful.",
      author: "Warren Buffett",
    },
    {
      text: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney",
    },
    {
      text: "Your time is limited, so don't waste it living someone else's life.",
      author: "Steve Jobs",
    },
    {
      text: "Success is not final; failure is not fatal: It is the courage to continue that counts.",
      author: "Winston Churchill",
    },
    {
      text: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.",
      author: "Roy T. Bennett",
    },
    {
      text: "The best way to predict the future is to create it.",
      author: "Peter Drucker",
    },
    {
      text: "The real test is not whether you avoid failure, because you won't. It's whether you let it harden or shame you into inaction, or whether you learn from it.",
      author: "Barack Obama",
    },
    {
      text: "I will love the light for it shows me the way, yet I will endure the darkness because it shows me the stars.",
      author: "Og Mandino",
    },
    {
      text: "It does not matter how slowly you go as long as you do not stop.",
      author: "Confucius",
    },
    {
      text: "Success usually comes to those who are too busy to be looking for it.",
      author: "Henry David Thoreau",
    },
    {
      text: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt",
    },
    {
      text: "The secret of getting ahead is getting started.",
      author: "Mark Twain",
    },
    {
      text: "Don't watch the clock; do what it does. Keep going.",
      author: "Sam Levenson",
    },
    {
      text: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt",
    },
    {
      text: "The only place where success comes before work is in the dictionary.",
      author: "Vidal Sassoon",
    },
    {
      text: "If you are not willing to risk the usual, you will have to settle for the ordinary.",
      author: "Jim Rohn",
    },
    {
      text: "The harder the conflict, the greater the triumph.",
      author: "George Washington",
    },
    {
      text: "Do not wait to strike till the iron is hot; but make it hot by striking.",
      author: "William Butler Yeats",
    },
    {
      text: "What you lack in talent can be made up with desire, hustle and giving 110% all the time.",
      author: "Don Zimmer",
    },
    {
      text: "The only limit to our realization of tomorrow will be our doubts of today.",
      author: "Franklin D. Roosevelt",
    },
    {
      text: "The only limit to our realization of tomorrow will be our doubts of today.",
      author: "Franklin D. Roosevelt",
    },
    {
      text: "It's not whether you're right or wrong that's important, but how much money you make when you're right and how much you lose when you're wrong.",
      author: "George Soros",
    },
    {
      text: "Given a 10% chance of a 100 times payoff, you should take that bet every time.",
      author: "Jeff Bezos",
    },
    {
      text: "Don't look for the needle in the haystack. Just buy the haystack!",
      author: "John Bogle",
    },
    {
      text: "To the extent we have been successful, it is because we concentrated on identifying one-foot hurdles that we could step over rather than because we acquired any ability to clear seven-footers.",
      author: "Warren Buffett",
    },
    {
      text: "The stock market is a device to transfer money from the impatient to the patient.",
      author: "Warren Buffett",
    },
    {
      text: "Know what you own, and know why you own it.",
      author: "Peter Lynch",
    },
    {
      text: "The individual investor should act consistently as an investor and not as a speculator.",
      author: "Benjamin Graham",
    },
    {
      text: "Don't try to buy at the bottom and sell at the top. It can't be done except by liars.",
      author: "Bernard Baruch",
    },
    {
      text: "If you aren't willing to own a stock for 10 years, don't even think about owning it for 10 minutes.",
      author: "Warren Buffett",
    },
    {
      text: "Take measured risk.",
      author: "Doris P. Meister",
    },
    {
      text: "Regardless of what happens in the markets, stick to your investment program. Changing your strategy at the wrong time can be the single most devastating mistake you can make as an investor.",
      author: "John Bogle",
    },
    {
      text: "Investing should be more like watching paint dry or watching grass grow. If you want excitement, take $800 and go to Las Vegas.",
      author: "Paul Samuelson",
    },
    {
      text: "Compound interest is the eighth wonder of the world. He who understands it, earns it ... he who doesn't ... pays it.",
      author: "Albert Einstein",
    },
    {
      text: "If you knew what was going to happen in the economy, you still wouldn't necessarily know what was going to happen in the stock market.",
      author: "Warren Buffett",
    },
    {
      text: "Investors should remember that excitement and expenses are their enemies. And if they insist on trying to time their participation in equities, they should try to be fearful when others are greedy and greedy when others are fearful.",
      author: "Warren Buffett",
    },
    {
      text: "Inactivity strikes us as intelligent behavior.",
      author: "Warren Buffett",
    },
    {
      text: "Our favorite holding period is forever.",
      author: "Warren Buffett",
    },
    {
      text: "The only value of stock forecasters is to make fortune-tellers look good.",
      author: "Warren Buffett",
    },
    {
      text: "We continue to make more money when snoring than when active.",
      author: "Warren Buffett",
    },
    {
      text: "The beauty of the stock market is that if you are wrong, if you put $1,000 up, all you lose is $1,000. I have proven that many times.",
      author: "Peter Lynch",
    },
    {
      text: "All you have to do, really, is find the best hundred stocks in the S&P 500 and find another few hundred outside the S&P 500, to beat the market.",
      author: "Peter Lynch",
    },
    {
      text: "People spend all this time trying to figure out 'What time of the year should I make an investment? When should I invest?' And it's such a waste of time. It's so futile.",
      author: "Peter Lynch",
    },
    {
      text: "If you're in the market, you have to know there's going to be declines.",
      author: "Peter Lynch",
    },
    {
      text: "In this business, if you're good, you're right six times out of ten. You're never going to be right nine times out of ten.",
      author: "Peter Lynch",
    },
    {
      text: "Some stocks go up 20-30 percent and they get rid of it and hold onto the dogs. And it's sort of like watering the weeds and cutting out the flowers. You want to let the winners run.",
      author: "Peter Lynch",
    },
    {
      text: "I think the secret is if you have a lot of stocks, some will do mediocre, some will do okay, and if one or two of 'em go up big time, you produce a fabulous result.",
      author: "Peter Lynch",
    },
    {
      text: "For some reason, you lose money rapidly in the stock market but don't make it rapidly.",
      author: "Peter Lynch",
    },
    {
      text: "You can lose money very fast, in two months, but you very rarely make money very fast in the stock market. When I look back, my great stocks took a long time to work out.",
      author: "Peter Lynch",
    },
    {
      text: "I deal in facts, not forecasting the future.",
      author: "Peter Lynch",
    },
    {
      text: "A lot of mutual fund managers don't know what they own. The odds are the best they have ever been for the individual.",
      author: "Peter Lynch",
    },
    {
      text: "The market at this point is institutional and we all act like a herd.",
      author: "Peter Lynch",
    },
    {
      text: "All investing is not speculation, but all speculation is investing.",
      author: "Benjamin Graham",
    },
    {
      text: "The investor's chief problem-and even his worst enemy-is likely to be himself.",
      author: "Benjamin Graham",
    },
    {
      text: "In the short run, the market is a voting machine but in the long run, it is a weighing machine.",
      author: "Benjamin Graham",
    },
    {
      text: "Most of the time common stocks are subject to irrational and excessive price fluctuations in both directions as the consequence of the ingrained tendency of most people to speculate or gamble.",
      author: "Benjamin Graham",
    },
    {
      text: "The function of economic forecasting is to make astrology look respectable.",
      author: "John Kenneth Galbraith",
    },
    {
      text: "An investment in knowledge pays the best interest.",
      author: "Benjamin Franklin",
    },
    {
      text: "The four most dangerous words in investing are: 'This time it's different.'",
      author: "Sir John Templeton",
    },
    {
      text: "Risk comes from not knowing what you're doing.",
      author: "Warren Buffett",
    },
    {
      text: "If you have trouble imagining a 20% loss in the stock market, you shouldn't be in stocks.",
      author: "John Bogle",
    },
    {
      text: "The stock market is filled with individuals who know the price of everything, but the value of nothing.",
      author: "Philip Fisher",
    },
    {
      text: "The most important quality for an investor is temperament, not intellect.",
      author: "Warren Buffett",
    },
    {
      text: "Time is your friend; impulse is your enemy.",
      author: "John Bogle",
    },
    {
      text: "The best investment you can make is in yourself.",
      author: "Warren Buffett",
    },
    {
      text: "The market can stay irrational longer than you can stay solvent.",
      author: "John Maynard Keynes",
    },
    {
      text: "Diversification is protection against ignorance. It makes little sense for those who know what they're doing.",
      author: "Warren Buffett",
    },
    {
      text: "Invest for the long haul. Don't get too greedy and don't get too scared.",
      author: "Shelby M.C. Davis",
    },
    {
      text: "The biggest risk is not taking any risk. In a world that's changing really quickly, the only strategy that is guaranteed to fail is not taking risks.",
      author: "Mark Zuckerberg",
    },
    {
      text: "You get recessions, you have stock market declines. If you don't understand that's going to happen, then you're not ready, you won't do well in the markets.",
      author: "Peter Lynch",
    },
    {
      text: "The intelligent investor is a realist who sells to optimists and buys from pessimists.",
      author: "Benjamin Graham",
    },
    {
      text: "The stock market is a giant distraction from the business of investing.",
      author: "John C. Bogle",
    },
    {
      text: "Investing is simple, but not easy.",
      author: "Warren Buffett",
    },
    {
      text: "Opportunities come infrequently. When it rains gold, put out the bucket, not the thimble.",
      author: "Warren Buffett",
    },
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return Response.json(randomQuote, { status: 200 });
}
