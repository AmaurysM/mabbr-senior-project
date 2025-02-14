import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const Navbar = () => {

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const user = {
    profilePicture: '/path/to/profile-picture.jpg', // Replace with actual path
  };

  return (
<nav className="bg-white shadow-md py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left Section - Logo & Navigation */}
        <div className="flex items-center space-x-10">
          <Link href="/" className="text-xl font-bold text-gray-800">
            MABBR APP
          </Link>
          <ul className="flex space-x-6">
            <li>
              <Link href="/home" className="text-gray-600 hover:text-blue-600 transition">
                Home
              </Link>
            </li>
            <li>
              <Link href="/note" className="text-gray-600 hover:text-blue-600 transition">
                Notes
              </Link>
            </li>
            <li>
              <Link href="/bond" className="text-gray-600 hover:text-blue-600 transition">
                Bonds
              </Link>
            </li>
            <li>
              <Link href="/community" className="text-gray-600 hover:text-blue-600 transition">
                Community
              </Link>
            </li>
            <li>
              <Link href="/Trade" className="text-gray-600 hover:text-blue-600 transition">
                Trade
              </Link>
            </li>
            <li>
              <Link href="/login-signup" className="text-gray-600 hover:text-blue-600 transition">
                Login
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Section - Profile Icon */}
        <div>
          <Link href="/profile">
            {!imageLoaded || imageError ? (
              <UserCircleIcon className="w-10 h-10 text-gray-400" />
            ) : (
              <Image
                src={user.profilePicture}
                alt="User Profile"
                width={40}
                height={40}
                className="rounded-full"
                onLoad={() => setImageLoaded(true)} // Show image when fully loaded
                onError={() => setImageError(true)} // Show icon if image fails
              />
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
