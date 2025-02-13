'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState<string>('');
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const router = useRouter();

    const wipeInputInfo = () =>{
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
    }


    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('Login successful');
            wipeInputInfo();
            router.push('/home');
        } catch (err) {
            setError('Invalid email or password');
            //console.error('Login error:', err);
        }
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8){
            setError("The password must be 8+ characters long");
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log('Sign up successful');
            wipeInputInfo();
            router.push('/home');
        } catch (err) {
            setError('Error signing up');
            console.error('Sign up error:', err);
        }
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
                <div className={`absolute z-10 min-h-screen w-full max-w-md bg-white bg-opacity-70 p-6 shadow-xl backdrop-filter backdrop-blur-lg transition-transform duration-500 ${isLogin ? 'translate-x-0 right-0' : 'translate-x-[100vw] right-0'}`}>                    
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
                        <button
                            onClick={() => {setIsLogin(false); wipeInputInfo();}}
                            className="text-xs font-semibold text-black hover:text-blue-600 ml-1"
                        >
                            Sign Up
                        </button>
                    </h4>
                </div>

                {/* Sign Up Form */}
                <div className={`absolute z-10 min-h-screen w-full max-w-md bg-white bg-opacity-70 p-6 shadow-xl backdrop-filter backdrop-blur-lg transition-transform duration-500 ${isLogin ? '-translate-x-[100vw] left-0' : 'translate-x-0 left-0'}`}>                    
                    <h2 className="text-2xl font-semibold text-center mb-4 text-blue-600">Sign Up</h2>
                    <form onSubmit={handleSignUp}>
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
                        <div className="mb-4">
                        <label className="block text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                            placeholder="Confirm your password"
                            required
                        />
                        </div>
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                        >
                            Sign Up
                        </button>
                    </form>
                    <h4 className="text-xs font-thin text-center mt-4 text-black">
                        Already have an account?
                        <button
                            onClick={() => {setIsLogin(true); wipeInputInfo()} }
                            className="text-xs font-semibold text-black hover:text-blue-600 ml-1"
                        >
                            Login
                        </button>
                    </h4>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
