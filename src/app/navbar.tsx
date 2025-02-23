"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

interface NavItem {
  name: string;
  href: string;
}

interface User {
  profilePicture: string;
}

const navigationItems: NavItem[] = [
  { name: "Home", href: "/home" },
  { name: "Notes", href: "/note" },
  { name: "Bonds", href: "/bond" },
  { name: "Community", href: "/community" },
  { name: "Trade", href: "/Trade" },
  { name: "Loot Box", href: "/lootbox" },
  { name: "Leaderboards", href: "/leaderboards" },
  { name: "Portfolio", href: "/portfolio"},
  { name: "Profile", href: "/profile" },
];

const Navbar = () => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const user: User = {
    profilePicture: "/path/to/profile-picture.jpg",
  };

  return (
      <div className=" top-0 w-full z-0">
        <nav className="bg-white/80 backdrop-blur-md shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center px-4 py-3">
              {/* Logo Section */}
              <Link
                  href="/"
                  className="flex items-center space-x-2 group"
              >
              <span className="text-2xl font-extrabold  transform transition-transform duration-200 group-hover:scale-105">
                MABBR APP
              </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {navigationItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="relative px-3 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-200 group"
                    >
                      {item.name}
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                    </Link>
                ))}

                <Link
                    href="/login-signup"
                    className="ml-4 px-6 py-2 text-white font-semibold bg-blue-600 rounded-lg transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Login
                </Link>

                <Link href="/profile" className="ml-2">
                  <div className="relative w-10 h-10 transform hover:scale-105 transition-all duration-200">
                    {!imageLoaded || imageError ? (
                        <div className="w-10 h-10 bg-blue-600 rounded-full p-0.5">
                          <div className="w-full h-full bg-white rounded-full p-1">
                            <UserCircleIcon className="w-full h-full text-gray-600" />
                          </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full p-0.5">
                          <Image
                              src={user.profilePicture}
                              alt="User Profile"
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                              onLoad={() => setImageLoaded(true)}
                              onError={() => setImageError(true)}
                          />
                        </div>
                    )}
                  </div>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                {menuOpen ? (
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                ) : (
                    <Bars3Icon className="w-6 h-6 text-gray-600" />
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-gray-100">
                  <div className="px-4 py-2 space-y-1">
                    {navigationItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="block px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-200"
                            onClick={() => setMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                    ))}
                    <Link
                        href="/login-signup"
                        className="block px-4 py-2 mt-4 text-center text-white font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200"
                        onClick={() => setMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </div>
                </div>
            )}
          </div>
        </nav>
      </div>
  );
};

export default Navbar;