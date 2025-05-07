"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";
import NotificationBell from "./components/NotificationBell";
import DailyMarketPulseButton from './components/DailyMarketPulseButton';

interface NavItem {
  name: string;
  href: string;
}

const navigationItems: NavItem[] = [
  { name: "Home", href: "/home" },
  { name: "Community", href: "/community" },
  { name: "History", href: "/history" },
  { name: "Games", href: "/games" },
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

  const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);

  const refreshNotifications = () => {
    setNotificationRefreshKey((prev) => prev + 1);
  };
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
        <nav className="bg-white/80 backdrop-blur-md shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center flex-wrap">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-2xl font-extrabold group-hover:scale-105 transition-transform">
                MABBR
              </span>
            </Link>

            {/* Right: Desktop */}
            <div className="hidden md:flex items-center space-x-4 ml-auto">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-3 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition"
                >
                  {item.name}
                </Link>
              ))}


              <NotificationBell refreshKey={notificationRefreshKey} onBellClick={refreshNotifications} />

              {user && (
                <div className="relative">
                  {/* Profile Button */}
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500"
                  >
                    {imageError || !profileImage ? (
                      <UserCircleIcon className="w-full h-full text-gray-600 bg-white" />
                    ) : (
                      <Image
                        key={profileImage}
                        src={profileImage}
                        alt="User"
                        width={40}
                        height={40}
                        className="object-cover"
                        onError={() => setImageError(true)}
                      />
                    )}
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                      <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="block px-4 py-2 hover:bg-blue-50 text-gray-700 rounded-lg">Your Profile</Link>
                      <Link href="/achievements" onClick={() => setProfileDropdownOpen(false)} className="block px-4 py-2 hover:bg-blue-50 text-gray-700 rounded-lg">Achievements</Link>
                      {user.role === 'admin' && (
                        <>
                          <Link href="/admin/lootbox-manager" onClick={() => setProfileDropdownOpen(false)} className="block px-4 py-2 hover:bg-blue-50 text-gray-700 rounded-lg">Manage Lootboxes</Link>
                          <Link href="/admin/user-manager" onClick={() => setProfileDropdownOpen(false)} className="block px-4 py-2 hover:bg-blue-50 text-gray-700 rounded-lg">Manage Users</Link>
                        </>
                      )}
                      <hr className="my-1 border-gray-200" />
                      <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">Sign Out</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 ml-auto rounded-lg hover:bg-gray-100"
            >
              {menuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>

          {/* Daily Market Pulse Drawer Button - Desktop */}
          <div className="hidden md:block absolute inset-x-0 top-0 z-50">
            <DailyMarketPulseButton />
          </div>

          {/* Mobile Menu */}
          {menuOpen && (

            <div className="md:hidden border-t border-gray-200 px-4 py-2 space-y-2">


              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-gray-700 font-medium py-2 px-2 rounded hover:bg-blue-50"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {user && (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center py-2 px-2 text-gray-700 hover:bg-blue-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    {!imageError && profileImage ? (
                      <Image src={profileImage} alt="User" width={24} height={24} className="w-6 h-6 rounded-full mr-2" />
                    ) : (
                      <UserCircleIcon className="w-6 h-6 mr-2 text-gray-600" />
                    )}
                    Your Profile
                  </Link>
                  {user.role === 'admin' && (
                    <>
                      <Link href="/admin/lootbox-manager" onClick={() => setMenuOpen(false)} className="block px-2 py-2 text-gray-700 hover:bg-blue-50">Manage Lootboxes</Link>
                      <Link href="/admin/user-manager" onClick={() => setMenuOpen(false)} className="block px-2 py-2 text-gray-700 hover:bg-blue-50">Manage Users</Link>
                    </>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-2 py-2 text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>

          )}
        </nav>

      </nav>
      <div className=" md:hidden absolute left-1/2 top-full translate-x-[-50%] z-40">
        <DailyMarketPulseButton />
      </div>

    </div>
  );
};

export default Navbar;