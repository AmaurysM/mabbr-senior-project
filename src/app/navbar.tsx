"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";
import NotificationBell from "./components/NotificationBell";

interface NavItem {
  name: string;
  href: string;
}

const navigationItems: NavItem[] = [
  { name: "Home", href: "/home" },
  { name: "Community", href: "/community" },
  { name: "Notes", href: "/note" },
  { name: "Loot Box", href: "/lootbox" },
  { name: "Portfolio", href: "/portfolio" },
];

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user || null;

  const [profileImage, setProfileImage] = useState<string>("/default-profile.png");
  const [imageError, setImageError] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  // Fetch the user's current profile image from the database
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/user?id=${user.id}`, {
            credentials: 'include'
          });

          if (response.ok) {
            const userData = await response.json();
            if (userData.image) {
              setProfileImage(userData.image);
              // Set image as loaded since we have a valid URL
              setImageError(false);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile image:', error);
        }
      }
    };

    fetchUserData();
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            setProfileDropdownOpen(false);
            router.push('/');
            router.refresh();
          }
        }
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (pathname === "/" || pathname === "/login-signup") {
    return null;
  }

  return (
    <div className="relative top-0 w-full z-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-lg relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center px-4 py-3">
            {/* Logo Section */}
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-2xl font-extrabold transform transition-transform duration-200 group-hover:scale-105">
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
              <NotificationBell />
              {user && (
                <div className="relative ml-2">

                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="relative w-10 h-10 transform hover:scale-105 transition-all duration-200 focus:outline-none"
                  >
                    {imageError || !profileImage ? (
                      <div className="w-10 h-10 bg-blue-600 rounded-full p-0.5">
                        <div className="w-full h-full bg-white rounded-full p-1">
                          <UserCircleIcon className="w-full h-full text-gray-600" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500">
                        <Image
                          key={profileImage}
                          src={profileImage}
                          alt="User Profile"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      </div>
                    )}
                  </button>


                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-[150] overflow-hidden">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/achievements"
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Achievements
                      </Link>
                      {user.role === 'admin' && (
                        <>
                          <Link
                            href="/admin/lootbox-manager"
                            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            Manage Lootboxes
                          </Link>

                          <Link
                            href="/admin/user-manager"
                            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            Manage Users
                          </Link>
                        </>
                      )}
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                {user && (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-gray-700 hover:text-blue-600 font-medium"
                      onClick={() => setMenuOpen(false)}
                    >
                      {!imageError && profileImage ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                          <Image
                            key={profileImage}
                            src={profileImage}
                            alt="User Profile"
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                          />
                        </div>
                      ) : (
                        <UserCircleIcon className="w-6 h-6 mr-2 text-gray-600" />
                      )}
                      Your Profile
                    </Link>
                    {user.role === 'admin' && (
                        <>
                          <Link
                            href="/admin/lootbox-manager"
                            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            Manage Lootboxes
                          </Link>

                          <Link
                            href="/admin/user-manager"
                            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            Manage Users
                          </Link>
                        </>
                      )}
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;