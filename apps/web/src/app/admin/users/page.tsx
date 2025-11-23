'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  phone?: string
  role: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  ordersCount?: number
}

interface UserStats {
  total: number
  admins: number
  managers: number
  users: number
  verified: number
  unverified: number
}

const USER_ROLES = [
  { value: 'user', label: 'User', color: 'gray' },
  { value: 'manager', label: 'Manager', color: 'blue' },
  { value: 'admin', label: 'Admin', color: 'purple' },
]

export default function AdminUsers() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'
  const isFullAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, isLoading, router, isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
      fetchStats()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (searchTerm) params.search = searchTerm
      if (roleFilter !== 'ALL') params.role = roleFilter

      const response = await api.get('/users', { params })
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/users/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSearch = () => {
    fetchUsers()
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole })
      fetchUsers()
      fetchStats()
    } catch (error) {
      console.error('Failed to update user role:', error)
      alert('Failed to update user role')
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      await api.delete(`/users/${userId}`)
      setConfirmDelete(null)
      fetchUsers()
      fetchStats()
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user')
    }
  }

  const getRoleColor = (role: string) => {
    const roleConfig = USER_ROLES.find((r) => r.value === role.toLowerCase())
    return roleConfig?.color || 'gray'
  }

  const getRoleLabel = (role: string) => {
    const roleConfig = USER_ROLES.find((r) => r.value === role.toLowerCase())
    return roleConfig?.label || role
  }

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button
          onClick={() => {
            fetchUsers()
            fetchStats()
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* User Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Users</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow">
            <div className="text-sm text-purple-700">Admins</div>
            <div className="text-2xl font-bold text-purple-700">{stats.admins}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-sm text-blue-700">Managers</div>
            <div className="text-2xl font-bold text-blue-700">{stats.managers}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-700">Regular Users</div>
            <div className="text-2xl font-bold text-gray-700">{stats.users}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-700">Verified</div>
            <div className="text-2xl font-bold text-green-700">{stats.verified}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <div className="text-sm text-yellow-700">Unverified</div>
            <div className="text-2xl font-bold text-yellow-700">{stats.unverified}</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Filter
            </label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Roles</option>
              {USER_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                {isFullAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={isFullAdmin ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{u.email}</div>
                      {u.phone && (
                        <div className="text-sm text-gray-500">{u.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isFullAdmin && u.id !== user?.id ? (
                        <select
                          value={u.role.toLowerCase()}
                          onChange={(e) => updateUserRole(u.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-semibold bg-${getRoleColor(
                            u.role
                          )}-100 text-${getRoleColor(u.role)}-800 border-0`}
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold bg-${getRoleColor(
                            u.role
                          )}-100 text-${getRoleColor(u.role)}-800`}
                        >
                          {getRoleLabel(u.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.emailVerified ? (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(u as any).ordersCount ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    {isFullAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {u.id !== user?.id && (
                          <>
                            {confirmDelete === u.id ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => deleteUser(u.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(u.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 text-center">
        Showing {users.length} users
      </div>
    </div>
  )
}
