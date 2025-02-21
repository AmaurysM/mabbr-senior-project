import React from 'react';

const ProfilePage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-r from-gray-900 to-gray-800 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-5xl font-extrabold text-white mb-4">
                        Your Profile
                    </h1>
                    <p className="text-lg text-gray-300">
                        Manage your account settings and view your trading history
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Profile Information */}
                    <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Profile Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Email</label>
                                <p className="text-white">user@example.com</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Member Since</label>
                                <p className="text-white">January 1, 2024</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Trading Level</label>
                                <p className="text-white">Advanced Trader</p>
                            </div>
                        </div>
                    </section>

                    {/* Statistics */}
                    <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Trading Statistics</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">Total Trades</p>
                                <p className="text-2xl font-bold text-white">156</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Win Rate</p>
                                <p className="text-2xl font-bold text-green-400">68%</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Portfolio Value</p>
                                <p className="text-2xl font-bold text-white">$24,156</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Profit</p>
                                <p className="text-2xl font-bold text-green-400">$5,234</p>
                            </div>
                        </div>
                    </section>

                    {/* Recent Activity */}
                    <section className="md:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, index) => (
                                <div key={index} className="bg-gray-700/30 rounded-lg p-4 border border-white/5">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-white font-medium">Bought AAPL</p>
                                            <p className="text-sm text-gray-400">10 shares at $175.23</p>
                                        </div>
                                        <p className="text-sm text-gray-400">2 hours ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;