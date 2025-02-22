"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" }); // Call the logout API
    router.refresh(); // Refresh the page to reflect logout
  };

  return (
    <button
      onClick={handleLogout}
      className="ml-4 px-6 py-2 text-white font-semibold bg-red-600 rounded-lg transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
    >
      Logout
    </button>
  );
}
