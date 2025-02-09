import Link from 'next/link';
import React from 'react';

const SingUpPage = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-200">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-semibold text-center mb-4 text-blue-600">Sing Up</h2>
            <form>
                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input
                    type="email"
                    className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                    placeholder="Enter your email"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Password</label>
                    <input
                    type="password"
                    className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                    placeholder="Enter your password"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Confirm Password</label>
                    <input
                    type="password"
                    className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                    placeholder="Confirm your password"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                >
                Sign Up
            </button>
            </form>
            <h4 className="tex-xs font-thin text-center mt-4 text-black">Already have an account?
            <Link href="/login" className="tex-xs font-semibold text-center mt-4 text-black hover:text-blue-600"> Login</Link>
            </h4>
        </div>
        </div>
    );
};

export default SingUpPage;