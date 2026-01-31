import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import arcjet, { protectSignup } from "@arcjet/next";
import { NextRequest, NextResponse } from "next/server";

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    protectSignup({
      email: {
        mode: "LIVE",
        // ✅ REQUIRED: use deny instead of block
        deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
      },
      bots: {
        mode: "LIVE",
        allow: [
          "GOOGLE_CRAWLER",
          "GOOGLE_CRAWLER_NEWS",
          "BING_CRAWLER",
          "CATEGORY:SEARCH_ENGINE",
          "CURL",
        ],
      },
      rateLimit: {
        mode: "LIVE",
        interval: "1m",
        max: 60,
      },
    }),
  ],
});

const betterAuthHandlers = toNextJsHandler(auth.handler);

export async function POST(req: NextRequest) {
  const requestBody = await req.json();
  const { email } = requestBody;

  try {
    if (email) {
      const arcjetReq = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(requestBody),
      });

      const decision = await aj.protect(arcjetReq, { email });

      if (decision.isDenied()) {
        if (decision.reason.isEmail()) {
          let message = "Invalid email.";

          if (decision.reason.emailTypes.includes("INVALID")) {
            message = "Email address format is invalid. Is there a typo?";
          } else if (decision.reason.emailTypes.includes("DISPOSABLE")) {
            message = "We do not allow disposable email addresses.";
          } else if (decision.reason.emailTypes.includes("NO_MX_RECORDS")) {
            message =
              "Your email domain does not have an MX record. Is there a typo?";
          }

          return NextResponse.json(
            { message, reason: decision.reason },
            { status: 400 },
          );
        }

        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    const authReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(requestBody),
    });

    return betterAuthHandlers.POST(authReq);
  } catch (error) {
    console.error("Auth route error:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 },
    );
  }
}

export const { GET } = betterAuthHandlers;
