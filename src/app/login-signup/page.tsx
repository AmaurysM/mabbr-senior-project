import React, { Suspense } from "react";
import Head from 'next/head';
import dynamic from "next/dynamic";
import Image from 'next/image';

const LoginForm = dynamic(() => import('./LoginForm/page'), {
    loading: () => <p>Loading form...</p>
});

const LoginPage = () => {
    return (
        <>
            <Head>
                {/* Preload the image */}
                <link rel="preload" href="/sunny-landscape-tini.jpg" as="image" />
            </Head>

            <div className="relative flex min-h-screen justify-center bg-gray-200 overflow-hidden">
                {/* Background Image */}
                <Image
                    src="/sunny-landscape-tini.jpg"
                    alt="Sunny Landscape"
                    width={1920}
                    height={1080}
                    className="absolute inset-0 z-0"
                />

                {/* Login Form (Client Component) */}
                <Suspense fallback={<p>Loading form...</p>}>
                    <LoginForm />
                </Suspense>
            </div>
        </>
    );
};

export default LoginPage;
