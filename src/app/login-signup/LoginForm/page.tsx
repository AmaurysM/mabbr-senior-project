"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { signInSchema, signUpSchema } from "@/lib/zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ErrorContext } from "@better-fetch/fetch";
import { authClient } from "@/lib/auth-client";
import LoadingButton from "@/app/components/LoadingButton";
import { useToast } from "@/app/hooks/use-toast";
import GitHubLoginButton from "@/app/components/LoginWithGithub";
import GoogleLoginButton from "@/app/components/LoginWithGoogle";
import DiscordLoginButton from "@/app/components/LoginWithDiscord";
import { Toaster } from "@/app/components/ui/sonner";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import ResetPassword from "@/app/components/ResetPassword";

const LoginForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  // State to control whether ResetPassword view is shown
  const [showReset, setShowReset] = useState<boolean>(false);
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState(false);
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  // Toggle password visibility for login
  const [showPassword, setShowPassword] = useState(false);
  // Toggle password visibility for sign up
  const [showPasswordSignUp, setShowPasswordSignUp] = useState({
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    const mobileCheck = /Mobi|Android/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
  }, []);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleLogin = async (values: z.infer<typeof signInSchema>) => {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
      },
      {
        onRequest: () => setPendingCredentials(true),
        onSuccess: async () => {
          router.push("/profile");
          router.refresh();
          signUpForm.reset();
        },
        onError: (ctx: ErrorContext) => {
          toast({
            title: "Something went wrong",
            description: ctx.error.message ?? "Network Connection Issue.",
          });
        },
      }
    );
    setPendingCredentials(false);
  };

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.name,
      },
      {
        onRequest: () => setPending(true),
        onSuccess: () => {
          setIsLogin(true);
          signInForm.reset();
          toast({
            title: "Account created",
            description:
              "Your account has been created. Check your email for a verification link.",
          });
        },
        onError: (ctx) => {
          toast({
            title: "Something went wrong",
            description: ctx.error.message ?? "Network Connection Issue.",
          });
        },
      }
    );
    setPending(false);
  };

  return (
    <div className="relative w-full min-h-screen flex overflow-hidden">
      <Toaster />
      {showReset ? (
        // Reset Password view
        <div className="absolute z-10 min-h-screen w-full sm:w-1/2 bg-white bg-opacity-70 p-6 shadow-xl backdrop-filter backdrop-blur-lg transition-all translate-x-0 opacity-100 duration-700 right-0">
          <ResetPassword />
          <div className="mt-4 text-center text-sm">
            <button
              onClick={() => setShowReset(false)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      ) : (
        // Sign In view
        <div
          className={`absolute z-10 min-h-screen w-full sm:w-1/2 bg-white bg-opacity-70 p-6 shadow-xl backdrop-filter backdrop-blur-lg transition-all ${
            isLogin
              ? "translate-x-0 opacity-100 duration-700 right-0"
              : "translate-x-full opacity-0 duration-200 right-0"
          }`}
        >
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-gray-800">
                Sign In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(handleLogin)} className="space-y-6">
                  {/* Email Field */}
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field: fieldProps }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            {...fieldProps}
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Password Field with toggle */}
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field: fieldProps }) => (
                      <FormItem className="relative">
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...fieldProps}
                            autoComplete="current-password"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          className="absolute right-3 top-8 text-gray-500"
                        >
                          {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <LoadingButton pending={pendingCredentials}>Sign in</LoadingButton>
                </form>
              </Form>
              <div className="mt-4 text-center text-sm">
                <button
                  onClick={() => setShowReset(true)}
                  className="text-xs font-semibold text-blue-600 hover:underline ml-1"
                >
                  Forgot Password?
                </button>
                <br />
                <button
                  onClick={() => {
                    console.log("Switching to Sign Up view");
                    setIsLogin(false);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline ml-1 mt-2"
                >
                  Don&apos;t have an account? Sign up
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {!isLogin && !showReset && (
        // Sign Up view
        <div
          className={`absolute z-10 min-h-screen w-full sm:w-1/2 bg-white bg-opacity-70 p-6 shadow-xl backdrop-filter backdrop-blur-lg transition-all duration-700 right-0 ${
            isLogin ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
          }`}
        >
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-gray-800">
                Create Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-6">
                  {/* Name Field */}
                  <FormField
                    control={signUpForm.control}
                    name="name"
                    render={({ field: fieldProps }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter your name"
                            {...fieldProps}
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Email Field */}
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field: fieldProps }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            {...fieldProps}
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Password Field with toggle */}
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field: fieldProps }) => (
                      <FormItem className="relative">
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type={showPasswordSignUp.password ? "text" : "password"}
                            placeholder="Enter your password"
                            {...fieldProps}
                            autoComplete="off"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordSignUp(prev => ({
                              ...prev,
                              password: !prev.password,
                            }))
                          }
                          className="absolute right-3 top-8 text-gray-500"
                        >
                          {showPasswordSignUp.password ? (
                            <MdVisibilityOff size={20} />
                          ) : (
                            <MdVisibility size={20} />
                          )}
                        </button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Confirm Password Field with toggle */}
                  <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field: fieldProps }) => (
                      <FormItem className="relative">
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type={showPasswordSignUp.confirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            {...fieldProps}
                            autoComplete="off"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordSignUp(prev => ({
                              ...prev,
                              confirmPassword: !prev.confirmPassword,
                            }))
                          }
                          className="absolute right-3 top-8 text-gray-500"
                        >
                          {showPasswordSignUp.confirmPassword ? (
                            <MdVisibilityOff size={20} />
                          ) : (
                            <MdVisibility size={20} />
                          )}
                        </button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <LoadingButton pending={pending}>Sign up</LoadingButton>
                </form>
              </Form>
              {!isMobile && (
                <>
                  <div className="relative flex items-center w-full my-4">
                    <hr className="w-full border-gray-300" />
                    <span className="absolute left-1/2 -translate-x-1/2 bg-white px-2 text-gray-500 text-sm">
                      or continue with
                    </span>
                  </div>
                  <div className="py-4 flex justify-center items-center gap-4">
                    <GitHubLoginButton>Github</GitHubLoginButton>
                    <GoogleLoginButton>Google</GoogleLoginButton>
                    <DiscordLoginButton>Discord</DiscordLoginButton>
                  </div>
                </>
              )}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
