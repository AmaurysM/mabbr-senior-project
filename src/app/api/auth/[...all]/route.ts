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
        block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
      },
      bots: {
        mode: "LIVE",
        allow: [],
      },
      rateLimit: {
        mode: "LIVE",
        interval:"1m", 
        max: 60, 
      },
    }),
  ],
});

const betterAuthHandlers = toNextJsHandler(auth.handler);

const ajProtectedPost = async (req: NextRequest) => {
    const { email } = await req.clone().json()
    const decision = await aj.protect(req, { email })

    if (decision.isDenied()) {
        if (decision.reason.isEmail()){
            let message = '';
            if (decision.reason.emailTypes.includes("INVALID")){
                message = "email address format is invalid. Is there a typo?";
            } else if (decision.reason.emailTypes.includes("DISPOSABLE")){
                message = "we do not allow disposable email addresses.";
            } else if (decision.reason.emailTypes.includes("NO_MX_RECORDS")){
                message = "your email domain does not have an MX record. Is there a typo?";
            } else {
                message = "invalid email.";
            } 

            return NextResponse.json({
                message, 
                reason: decision.reason
            },{ status: 400 })
        } else {
            return NextResponse.json({ message: "Forbidden"}, { status: 403 });
        }
    }

    return betterAuthHandlers.POST(req)
}


export { ajProtectedPost as POST }
export const { GET } = betterAuthHandlers;
