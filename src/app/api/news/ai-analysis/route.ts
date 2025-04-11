import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DAILY_LIMIT = 10; // Daily limit per user
const CACHE_DURATION_DAYS = 1; // Cache analysis for 1 day

export async function POST(req: Request) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { title, summary, url } = await req.json();

    if (!title || !summary || !url) {
      return NextResponse.json(
        { error: 'Title, summary, and URL are required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedAnalysis = await prisma.stockAICache.findUnique({
      where: {
        articleUrl: url,
      },
    });

    if (cachedAnalysis && cachedAnalysis.expiresAt > new Date()) {
      return NextResponse.json({
        analysis: cachedAnalysis.analysis,
        cached: true
      });
    }

    // If not in cache, check usage limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get or create today's usage record
    let usage = await prisma.stockAIUsage.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (!usage) {
      usage = await prisma.stockAIUsage.create({
        data: {
          userId: session.user.id,
          date: today,
          usageCount: 0
        }
      });
    }

    // Check if user has reached daily limit
    if (usage.usageCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily AI analysis limit reached' },
        { status: 429 }
      );
    }

    const prompt = `
You are a financial analyst AI that specializes in analyzing news articles and their potential impact on stocks.

ARTICLE TITLE: ${title}
ARTICLE SUMMARY: ${summary}
ARTICLE URL: ${url}

Based on the above article, your task is to:

1. Identify the specific stocks (ticker symbols) that are directly or indirectly affected by this news.
2. For each stock, determine whether the impact is positive, negative, or neutral.
3. Provide a brief explanation of why each stock is affected and how.
4. Summarize the article's key points in relation to the stock market.
5. Provide 3-5 bullet points highlighting the most important takeaways for investors.
6. Offer a general recommendation based on this news (if applicable).

Please format your response as JSON with the following structure:
{
  "affectedStocks": [
    {
      "ticker": "TICKER_SYMBOL",
      "impact": "positive|negative|neutral",
      "reason": "Brief explanation of impact"
    },
    ...
  ],
  "summary": "Concise analysis of article's market relevance",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    ...
  ],
  "recommendation": "General investment recommendation based on this news"
}

Ensure your analysis is objective, well-reasoned, and presented in a clear, professional manner. If the article doesn't provide enough information for a complete analysis, acknowledge this limitation in your response.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst AI that specializes in analyzing news articles and their potential impact on stocks. Always respond with properly formatted JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Extract content from response
    const content = response.choices[0].message.content;
    
    // Parse the JSON response
    let analysisData;
    try {
      if (content) {
        analysisData = JSON.parse(content);
      } else {
        throw new Error("Empty response from OpenAI");
      }
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      return NextResponse.json(
        { error: "Failed to parse AI analysis" },
        { status: 500 }
      );
    }

    // Increment usage count
    await prisma.stockAIUsage.update({
      where: { id: usage.id },
      data: { usageCount: usage.usageCount + 1 }
    });

    // Cache the analysis
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_DURATION_DAYS);

    await prisma.stockAICache.upsert({
      where: { articleUrl: url },
      update: {
        analysis: analysisData,
        expiresAt
      },
      create: {
        articleUrl: url,
        title,
        summary,
        analysis: analysisData,
        expiresAt
      }
    });

    // Return the analysis
    return NextResponse.json({
      analysis: analysisData,
      cached: false
    });
  } catch (error) {
    console.error("AI Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI analysis" },
      { status: 500 }
    );
  }
} 