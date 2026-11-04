import React, { useState } from 'react';
import { Role } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { usersApi } from '../../services/api';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Academic@123');
  const [role, setRole] = useState<Role>('STUDENT');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please provide full name, email, and password.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await usersApi.createUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        department: department.trim() || undefined,
      });

      setFullName('');
      setEmail('');
      setDepartment('');
      onUserCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create User Account" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          required
          placeholder="e.g. Dr. Arthur Pendelton"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <Input
          label="Institutional Email"
          type="email"
          required
          placeholder="user@taskflow.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Initial Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            options={[
              { value: 'STUDENT', label: 'Student' },
              { value: 'FACULTY', label: 'Faculty' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />

          <Input
            label="Department"
            placeholder="e.g. Computer Science"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
            Provision User
          </Button>
        </div>
      </form>
    </Modal>
  );
};
