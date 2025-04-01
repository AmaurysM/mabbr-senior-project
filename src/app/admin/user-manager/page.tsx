"use client";

import { authClient } from '@/lib/auth-client';
import { UserWithRole } from 'better-auth/plugins';
import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  User as UserIcon,
  Lock,
  Unlock,
  Trash2
} from 'lucide-react';

const UserManagementPage = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('email');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [resultsCount, setResultsCount] = useState(0);


  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  const fetchUsers = async () => {
    try {
      const usersRes = await authClient.admin.listUsers({
        query: {
          searchOperator: 'contains',
          searchValue: searchQuery,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          sortBy,
          sortDirection
        }
      });

      setUsers(usersRes.data?.users || []);
      setTotalUsers(usersRes.data?.total || 0);
      setResultsCount(usersRes.data?.users?.length || 0);

    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  const handleCreateUser = async (userData: { name: string, email: string, password: string, role: string }) => {
    try {
      await authClient.admin.createUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role
      });
      fetchUsers();
      // Reset the form and close modal
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setShowCreateUserModal(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleSetUserRole = async (userId: string, newRole: string) => {
    try {
      await authClient.admin.setRole({
        userId,
        role: newRole
      });
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Failed to set user role:', error);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await authClient.admin.banUser({
        userId,
        banReason: "Admin action"
      });
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await authClient.admin.unbanUser({ userId });
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Failed to unban user:', error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await authClient.admin.removeUser({ userId });
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, searchQuery, searchField, sortBy, sortDirection]);

  return (
    <div className="w-full h-full">
      <div className="w-full h-full bg-white ">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <UserIcon className="mr-3 w-10 h-10" />
            User Management
          </h1>
        </div>

        {/* Search, Filter and Sort Section */}
        <div className="p-6 bg-gray-50 border-b border-gray-200 space-y-4">
          <div className="flex space-x-4 items-center">
            {/* Search */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="absolute left-0 top-0 bottom-0 pl-10 pr-2 bg-transparent z-10 text-gray-500 cursor-pointer"
              >
                <option value="email">Email</option>
                <option value="name">Name</option>
              </select>
              <input
                type="text"
                placeholder={`Search by ${searchField}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-36 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* Create User Button */}
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create User
            </button>
          </div>
          {/* Sorting Options */}
          <div className="flex space-x-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-gray-600 text-sm">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="createdAt">Created At</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-gray-600 text-sm">Direction:</label>
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        <div className='w-full overflow-y-auto'>
          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {['Name', 'Email', 'Role', 'Created At', 'Actions'].map((header) => (
                    <th key={header} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-8 w-8 rounded-full mr-3 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                      ${user.role === 'admin'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'}
                      ${user.role === 'verified'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-800'} `}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <select
                          onChange={(e) => handleSetUserRole(user.id, e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                          defaultValue={user.role}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="verified">Verified</option>

                        </select>
                        {user.banned ? (
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            className="text-green-600 hover:text-green-900 flex items-center"
                            title="Unban User"
                          >
                            <Unlock className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(user.id)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            title="Ban User"
                          >
                            <Lock className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="text-gray-600 hover:text-gray-900 flex items-center"
                          title="Remove User"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value);
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Total Users: <span className="font-semibold">{totalUsers}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md flex items-center ${currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages || resultsCount < pageSize}
                className={`px-4 py-2 rounded-md flex items-center ${currentPage === totalPages || resultsCount < pageSize
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create New User</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateUser({
                  name: newUserName,
                  email: newUserEmail,
                  password: newUserPassword,
                  role: newUserRole
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="mt-1 block w-full border rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="mt-1 block w-full border rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="mt-1 block w-full border rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="mt-1 block w-full border rounded-md p-2"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-md border text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
