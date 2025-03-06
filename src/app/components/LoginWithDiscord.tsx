"use client";

import { createAuthClient, ErrorContext } from "better-auth/client";
import { FaDiscord } from "react-icons/fa";
import { useState } from "react";
import { useToast } from "@/app/hooks/use-toast";
import { useRouter } from "next/navigation";
import LoadingButton from "./LoadingButton";

export default function DiscordLoginButton({
  children
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const authClient = createAuthClient();
  const { toast } = useToast();
  const router = useRouter();


  const signIn = async () => {
    setIsLoading(true);
    await authClient.signIn.social(
      { provider: "discord" },
      {
        onRequest: () => setIsLoading(true),
        onSuccess: async () => {
          router.push("/home");
          router.refresh();
        },
        onError: (ctx: ErrorContext) => {
          toast({
            title: "Something went wrong",
            description: ctx.error.message ?? "Something went wrong.",
          });
          setIsLoading(false); 
        },
      }
    );
    setIsLoading(false);
  };

  return (
    <LoadingButton pending={isLoading} onClick={signIn}><FaDiscord className="text-xl" /> {children}</LoadingButton>
  );
}