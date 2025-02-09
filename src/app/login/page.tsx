'use client';

import Link from 'next/link';
import React, { use, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {auth} from '@/app/firebase/config';
import { useRouter } from 'next/navigation';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('Login successful');
            setEmail('');
            setPassword('');
            router.push('/home');
        } catch (err) {
            setError('Invalid email or password');
            console.error('Login error:', err);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-200">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-semibold text-center mb-4 text-blue-600">Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                    >
                        Login
                    </button>
                </form>
                <h4 className="text-xs font-thin text-center mt-4 text-black">
                    Don't have an account?
                    <Link href="/sign-up" className="text-xs font-semibold text-black hover:text-blue-600"> Sign Up</Link>
                </h4>
            </div>
        </div>
    );
};

export default LoginPage;