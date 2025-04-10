"use client";
import React, { useState } from "react";
import { useToast } from "@/app/hooks/use-toast";

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/ResetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password updated successfully. Please log in with your new password.");
        toast({
          title: "Success",
          description: "Password updated successfully.",
        });
      } else {
        setMessage(data.error || "Failed to update password.");
        toast({
          title: "Error",
          description: data.error || "Failed to update password.",
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setMessage("An error occurred. Please try again later.");
      toast({
        title: "Error",
        description: "An error occurred. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">
        Reset Password
      </h2>
      <form onSubmit={handleResetPassword} className="space-y-4">
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none"
        />
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>
      {message && <p className="mt-2 text-center text-white">{message}</p>}
    </div>
  );
};

export default ResetPassword;
