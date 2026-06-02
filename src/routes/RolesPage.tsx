import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Shield, Edit2, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';

export function RolesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  const [editingRole, setEditingRole] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiFetch('/roles'),
  });

  const { data: permsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiFetch('/permissions'),
  });

  const createRole = useMutation({
    mutationFn: (data: any) => apiFetch('/roles', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: async (newRole: any) => {
      if (selectedPerms.size > 0) {
        await apiFetch(`/roles/${newRole.id}/permissions`, {
          method: 'PUT',
          body: JSON.stringify({ permissionIds: Array.from(selectedPerms) })
        });
      }
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeDrawer();
    }
  });

  const updateRole = useMutation({
    mutationFn: (data: any) => apiFetch(`/roles/${editingRole.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: async () => {
      await apiFetch(`/roles/${editingRole.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissionIds: Array.from(selectedPerms) })
      });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeDrawer();
    }
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => apiFetch(`/roles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setConfirmDelete(null);
    }
  });

  const openCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '' });
    setSelectedPerms(new Set());
    setIsDrawerOpen(true);
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '' });
    setSelectedPerms(new Set(role.permissions?.map((p: any) => p.id) || []));
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingRole(null);
      setFormData({ name: '', description: '' });
      setSelectedPerms(new Set());
    }, 200);
  };

  const handleSave = () => {
    if (editingRole) {
      updateRole.mutate(formData);
    } else {
      createRole.mutate(formData);
    }
  };

  const togglePermission = (permId: string) => {
    const next = new Set(selectedPerms);
    if (next.has(permId)) next.delete(permId);
    else next.add(permId);
    setSelectedPerms(next);
  };

  if (!user?.roles.includes('SUPER_ADMIN')) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <Shield className="w-12 h-12 mb-4 text-[var(--destructive)]" />
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Access Denied</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>You do not have permission to view or manage roles.</p>
      </div>
    );
  }

  const roles = Array.isArray(rolesData) ? rolesData : (rolesData?.data || []);
  const permissions = Array.isArray(permsData) ? permsData : (permsData?.data || []);
  
  const filteredRoles = roles.filter((r: any) => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span>Home</span><span className="mx-1">›</span>
            <span>System</span><span className="mx-1">›</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Roles</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Roles Management
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Manage system roles and configure their permissions matrix.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <Input 
              placeholder="Search roles..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Create Role
          </Button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: 'oklch(0.97 0.01 330 / 0.4)' }}>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingRoles ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Loading roles…
                </TableCell>
              </TableRow>
            ) : filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  No roles found matching "{search}"
                </TableCell>
              </TableRow>
            ) : filteredRoles.map((role: any) => (
              <TableRow key={role.id} className="group cursor-pointer" onClick={() => openEdit(role)}>
                <TableCell className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {role.name}
                  {role.name === 'SUPER_ADMIN' && (
                    <span className="ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>System</span>
                  )}
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{role.description}</TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                  >
                    {role.permissions?.length || 0} permissions
                  </span>
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {role.usersCount}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(role); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[oklch(0.95_0.02_20)]"
                      disabled={role.name === 'SUPER_ADMIN'}
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(role.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}
        description={editingRole ? 'Update the role details and permissions.' : 'Configure a new role and assign its initial permissions.'}
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Role Details</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Name (Uppercase)</label>
              <Input 
                placeholder="e.g. MARKETING_MANAGER" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                disabled={editingRole?.name === 'SUPER_ADMIN'}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Description</label>
              <Input 
                placeholder="Briefly describe what this role can do" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Permissions Matrix</h3>
            <div className="grid grid-cols-1 gap-2 p-4 rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
              {permissions.map((perm: any) => (
                <label key={perm.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-[var(--accent)] cursor-pointer transition-colors">
                  <div className="flex items-center h-5">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--ring)]"
                      checked={selectedPerms.has(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium font-mono" style={{ color: 'var(--foreground)' }}>{perm.name}</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{perm.description || 'No description provided.'}</span>
                  </div>
                </label>
              ))}
              {permissions.length === 0 && (
                <div className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>No permissions available.</div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={closeDrawer}>Cancel</Button>
            <Button onClick={handleSave} disabled={createRole.isPending || updateRole.isPending || !formData.name}>
              {createRole.isPending || updateRole.isPending ? 'Saving...' : 'Save Role'}
            </Button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Role"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            Are you sure you want to delete this role? This action cannot be undone and will remove the role from all users currently assigned to it.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDelete && deleteRole.mutate(confirmDelete)}
              disabled={deleteRole.isPending}
            >
              {deleteRole.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
