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

            <div className="relative flex min-h-screen justify-center items-center bg-gray-200">
                {/* Background Image */}
                <Image
                    src="/sunny-landscape-tini.jpg"
                    alt="Sunny Landscape"
                    layout="fill"
                    objectFit="cover"
                    className="fixed top-0 left-0 w-full h-full "
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
