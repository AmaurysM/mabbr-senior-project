"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { authClient } from "../../auth-client";

import { ErrorContext } from "@better-fetch/fetch";
import { GithubIcon } from "lucide-react";
import { useToast } from '../hooks/use-toast';
import LoadingButton from '../components/LoadingButton';

const LoginPage: React.FC = () => {

    const [isLogin, setIsLogin] = useState<boolean>(true);
    const router = useRouter();

    const [pending, setPending] = useState(false);
    const { toast } = useToast();
    const [pendingCredentials, setPendingCredentials] = useState(false);
    const [pendingGithub, setPendingGithub] = useState(false);

    const singInForm = useForm<z.infer<typeof signInSchema>>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const singUpForm = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const handleLogin = async (
        values: z.infer<typeof signInSchema>
    ) => {
        await authClient.signIn.email(
            {
                email: values.email,
                password: values.password,
            },
            {
                onRequest: () => {
                    setPendingCredentials(true);
                },
                onSuccess: async () => {
                    router.push("/portfolio");
                    router.refresh();
                    singUpForm.reset();
                },
                onError: (ctx: ErrorContext) => {
                    console.log(ctx);
                    toast({
                        title: "Something went wrong",
                        description: ctx.error.message ?? "Something went wrong."
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
                onRequest: () => {
                    setPending(true);
                },
                onSuccess: () => {
                    setIsLogin(true);
                    singInForm.reset();
                    toast({
                        title: "Account created",
                        description:
                            "Your account has been created. Check your email for a verification link.",
                    });
                },
                onError: (ctx) => {
                    console.log("error", ctx);
                    toast({
                        title: "Something went wrong",
                        description: ctx.error.message ?? "Something went wrong.",
                    });
                },
            }
        );
        setPending(false);
    };

    const handleSignInWithGithub = async () => {
        await authClient.signIn.social(
            {
                provider: "github",
            },
            {
                onRequest: () => {
                    setPendingGithub(true);
                },
                onSuccess: async () => {
                    router.push("/");
                    router.refresh();
                },
                onError: (ctx: ErrorContext) => {
                    toast({
                        title: "Something went wrong",
                        description: ctx.error.message ?? "Something went wrong."
                    });
                },
            }
        );
        setPendingGithub(false);
    };

    return (
        <div className="relative flex min-h-screen justify-center bg-gray-200 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/sunny-landscape-tini.jpg')" }} />
            </div>

            {/* Login/Sign Up Form */}
            <div className="relative w-full min-h-screen flex overflow-hidden">
                {/* Login Form */}
                <div className={`absolute z-10 min-h-screen w-full max-w-md bg-white bg-opacity-70 p-6 shadow-xl backdrop-filter backdrop-blur-lg transition-all ${isLogin ? 'translate-x-0 opacity-100 duration-700 right-0 ' : 'translate-x-[100vw] opacity-0 duration-200 right-0'}`}>
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center text-gray-800">
                                Sign In
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...singInForm}>
                                <form
                                    onSubmit={singInForm.handleSubmit(handleLogin)}
                                    className="space-y-6"
                                >
                                    {["email", "password"].map((field) => (
                                        <FormField
                                            control={singInForm.control}
                                            key={field}
                                            name={field as keyof z.infer<typeof signInSchema>}
                                            render={({ field: fieldProps }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {field.charAt(0).toUpperCase() + field.slice(1)}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type={field === "password" ? "password" : "email"}
                                                            placeholder={`Enter your ${field}`}
                                                            {...fieldProps}
                                                            name={fieldProps.name as string}
                                                            autoComplete={
                                                                field === "password" ? "current-password" : "email"
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                    <LoadingButton pending={pendingCredentials}>
                                        Sign in
                                    </LoadingButton>
                                </form>
                            </Form>
                            <div className="mt-4">
                                <LoadingButton
                                    pending={pendingGithub}
                                    onClick={handleSignInWithGithub}
                                >
                                    <GithubIcon className="w-4 h-4 mr-2" />
                                    Continue with GitHub
                                </LoadingButton>
                            </div>
                            <div className="mt-4 text-center text-sm">
                                <button
                                    onClick={() => { setIsLogin(false); }}
                                    className="text-xs font-semibold text-black hover:text-blue-600 ml-1"
                                >
                                    Dont have an account? Sing up
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Sign Up Form */}
                <div className={`absolute z-10 min-h-screen w-full max-w-md bg-white bg-opacity-70 p-6 shadow-xl backdrop-filter backdrop-blur-lg transition-all ${isLogin ? '-translate-x-[100vw] opacity-0 duration-200 left-0' : 'translate-x-0 opacity-100 duration-700 left-0'}`}>
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center text-gray-800">
                                Create Account
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...singUpForm}>
                                <form onSubmit={singUpForm.handleSubmit(handleSignUp)} className="space-y-6">
                                    {["name", "email", "password", "confirmPassword"].map((field) => (
                                        <FormField
                                            control={singUpForm.control}
                                            key={field}
                                            name={field as keyof z.infer<typeof signUpSchema>}
                                            render={({ field: fieldProps }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {field.charAt(0).toUpperCase() + field.slice(1)}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type={
                                                                field.includes("password")
                                                                    ? "password"
                                                                    : field === "email"
                                                                        ? "email"
                                                                        : "text"
                                                            }
                                                            placeholder={`Enter your ${field}`}
                                                            {...fieldProps}
                                                            name={fieldProps.name as string}
                                                            autoComplete="off"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                    <LoadingButton pending={pending}>Sign up</LoadingButton>
                                </form>
                            </Form>
                            <div className="mt-4 text-center text-sm">
                                <button
                                    onClick={() => { setIsLogin(true); }}
                                    className="text-xs font-semibold text-black hover:text-blue-600 ml-1"
                                >
                                    Already have an account? Sign in
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                </div>

            </div>
        </div>
    );
};

export default LoginPage;
