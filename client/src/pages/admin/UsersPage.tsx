import React, { useState, useEffect } from 'react';
import { usersApi } from '../../services/api';
import { User, Role } from '../../types';
import { CreateUserModal } from '../../components/admin/CreateUserModal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { Plus, Search, Trash2, Users } from 'lucide-react';
import { roleConfig, formatDate } from '../../utils';
import { TABLE_THEMES } from '../../theme/theme';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await usersApi.getUsers({
        role: roleFilter !== 'ALL' ? (roleFilter as Role) : undefined,
        search: searchQuery.trim() || undefined,
      });
      setUsers(res.data.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user account "${name}"?`)) return;
    try {
      await usersApi.deleteUser(userId);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institutional User Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision, manage roles, and review faculty and student memberships.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setCreateModalOpen(true)}
        >
          Add User Account
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <Input
            placeholder="Search users by name or institutional email..."
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="w-full sm:w-48">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Roles' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'FACULTY', label: 'Faculty' },
              { value: 'STUDENT', label: 'Student' },
            ]}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <Spinner label="Loading directory..." size="lg" className="my-16" />
      ) : (
        <div className={TABLE_THEMES.wrapper}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={TABLE_THEMES.thead}>
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#475569]">
                      No user accounts found matching your filters.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const roleConf = roleConfig[u.role];
                    return (
                      <tr key={u.id} className={TABLE_THEMES.row}>
                        <td className="py-3.5 px-4 font-semibold text-[#0F172A] flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-[#4F46E5] font-bold flex items-center justify-center text-xs">
                            {u.fullName[0].toUpperCase()}
                          </div>
                          {u.fullName}
                        </td>
                        <td className="py-3.5 px-4 text-[#475569]">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full border font-semibold ${roleConf.badge}`}>
                            {roleConf.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#475569]">{u.department || '—'}</td>
                        <td className="py-3.5 px-4 text-[#475569]">{formatDate(u.createdAt)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                            className="rounded-md p-1.5 text-[#475569] hover:text-[#DC2626] hover:bg-red-50 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onUserCreated={fetchUsers}
      />
    </div>
  );
};

