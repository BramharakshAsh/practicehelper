import React, { useState } from 'react';
import { Plus, Search, User, Phone, Mail, Shield, UserCheck, UserX, CreditCard as Edit, Eye, Calendar, Trash2 } from 'lucide-react';
import { Staff, Task } from '../../types';
import StaffModal from './StaffModal';

interface StaffListProps {
  staff: Staff[];
  tasks: Task[];
  onStaffUpdate: (staffId: string, updates: Partial<Staff>) => void;
  onStaffCreate: (staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'> & { password?: string }) => void;
  onStaffDelete: (staffId: string) => void;
}

const StaffList: React.FC<StaffListProps> = ({ staff, tasks, onStaffUpdate, onStaffCreate, onStaffDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [viewMode, setViewMode] = useState<'create' | 'edit' | 'view'>('create');

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: Staff['role']) => {
    switch (role) {
      case 'partner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'paid_staff':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'articles':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: Staff['role']) => {
    switch (role) {
      case 'partner':
        return 'Partner';
      case 'paid_staff':
        return 'Paid Staff';
      case 'articles':
        return 'Articles';
      default:
        return role;
    }
  };

  const toggleStaffStatus = (staffId: string, currentStatus: boolean) => {
    onStaffUpdate(staffId, {
      is_active: !currentStatus,
      updated_at: new Date().toISOString()
    });
  };

  const openModal = (mode: 'create' | 'edit' | 'view', staffMember?: Staff) => {
    setViewMode(mode);
    setSelectedStaff(staffMember || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStaff(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-600 mt-1">Manage your team members and their roles</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 w-full sm:max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 flex-1 sm:flex-none">
            <Shield className="h-5 w-5 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="all">All Roles</option>
              <option value="partner">Partners</option>
              <option value="paid_staff">Paid Staff</option>
              <option value="articles">Articles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredStaff.map((member) => (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow relative group flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center space-x-1.5">
                    <span className="line-clamp-1">{member.name}</span>
                    {member.is_active ? (
                      <UserCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <UserX className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                  </h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border mt-1 ${getRoleColor(member.role)}`}>
                    {getRoleLabel(member.role)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => openModal('view', member)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-6 flex-1">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>

              {member.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span>{member.phone}</span>
                </div>
              )}

              {member.date_of_joining && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="text-xs">Joined {new Date(member.date_of_joining).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t border-gray-100 flex-col sm:flex-row">
              <button
                onClick={() => openModal('edit', member)}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${member.name}?`)) {
                    onStaffDelete(member.id);
                  }
                }}
                className="px-3 py-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 border border-red-100 flex items-center justify-center"
                title="Delete Staff"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sm:hidden ml-2">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Status: {member.is_active ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={() => toggleStaffStatus(member.id, member.is_active)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${member.is_active
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
          >
            {member.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  ))
}
      </div >

{
  filteredStaff.length === 0 && (
    <div className="text-center py-12">
      <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
      <p className="text-gray-600 mb-4">
        {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first team member'}
      </p>
      {!searchTerm && (
        <button
          onClick={() => openModal('create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add First Staff Member
        </button>
      )}
    </div>
  )
}

{/* Staff Modal */ }
{
  showModal && (
    <StaffModal
      staff={selectedStaff || undefined}
      mode={viewMode}
      onClose={closeModal}
      onSubmit={(staffData) => {
        if (viewMode === 'create') {
          onStaffCreate(staffData);
        } else if (viewMode === 'edit' && selectedStaff) {
          onStaffUpdate(selectedStaff.id, staffData);
        }
        closeModal();
      }}
    />
  )
}

{/* Workload Summary */ }
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
    <Shield className="h-5 w-5" />
    <span>Staff Workload Summary</span>
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {filteredStaff.filter(member => member.is_active).map((member) => {
      const memberTasks = tasks.filter(t => t.staff_id === member.user_id);
      const activeTasks = memberTasks.filter(t => t.status !== 'filed_completed').length;
      const overdueTasks = memberTasks.filter(t =>
        t.status !== 'filed_completed' &&
        new Date(t.due_date) < new Date()
      ).length;

      return (
        <div key={member.id} className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900">{member.name}</h4>
          <p className="text-sm text-gray-600 mb-2">{getRoleLabel(member.role)}</p>
          <div className="flex items-center justify-between text-sm">
            <span>Active Tasks:</span>
            <span className={`font-medium ${activeTasks > 5 ? 'text-orange-600' : 'text-gray-900'}`}>{activeTasks}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Overdue:</span>
            <span className={`font-medium ${overdueTasks > 0 ? 'text-red-600' : 'text-green-600'}`}>{overdueTasks}</span>
          </div>
        </div>
      );
    })}
  </div>
</div>
    </div >
  );
};

export default StaffList;