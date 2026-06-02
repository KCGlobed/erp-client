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

export function PermissionsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  const [editingPerm, setEditingPerm] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: '', description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiFetch('/permissions'),
  });

  const createPerm = useMutation({
    mutationFn: (data: any) => apiFetch('/permissions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      closeDrawer();
    }
  });

  const updatePerm = useMutation({
    mutationFn: (data: any) => apiFetch(`/permissions/${editingPerm.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      closeDrawer();
    }
  });

  const deletePerm = useMutation({
    mutationFn: (id: string) => apiFetch(`/permissions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setConfirmDelete(null);
    }
  });

  const openCreate = () => {
    setEditingPerm(null);
    setFormData({ name: '', description: '' });
    setIsDrawerOpen(true);
  };

  const openEdit = (perm: any) => {
    setEditingPerm(perm);
    setFormData({ name: perm.name, description: perm.description || '' });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingPerm(null);
      setFormData({ name: '', description: '' });
    }, 200);
  };

  const handleSave = () => {
    if (editingPerm) updatePerm.mutate(formData);
    else createPerm.mutate(formData);
  };

  if (!user?.roles.includes('SUPER_ADMIN')) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <Shield className="w-12 h-12 mb-4 text-[var(--destructive)]" />
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Access Denied</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>You do not have permission to view or manage permissions.</p>
      </div>
    );
  }

  const permissions = Array.isArray(data) ? data : (data?.data || []);
  const filteredPerms = permissions.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span>Home</span><span className="mx-1">›</span>
            <span>System</span><span className="mx-1">›</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Permissions</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Permissions
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            All available system permissions and their usage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <Input 
              placeholder="Search permissions..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Create Permission
          </Button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: 'oklch(0.97 0.01 330 / 0.4)' }}>
              <TableHead>Permission Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Direct Users</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Loading permissions…
                </TableCell>
              </TableRow>
            ) : filteredPerms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  No permissions found.
                </TableCell>
              </TableRow>
            ) : filteredPerms.map((perm: any) => (
              <TableRow key={perm.id} className="group cursor-pointer" onClick={() => openEdit(perm)}>
                <TableCell className="font-medium font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                  {perm.name}
                  {perm.isSystem && (
                    <span className="ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>System</span>
                  )}
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{perm.description}</TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                  >
                    {perm.rolesCount || 0} roles
                  </span>
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{perm.usersCount || 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(perm); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[oklch(0.95_0.02_20)]"
                      disabled={perm.isSystem}
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(perm.id); }}
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
        title={editingPerm ? `Edit Permission: ${editingPerm.name}` : 'Create New Permission'}
        description="Configure permission details."
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Name (Uppercase Snake Case)</label>
              <Input 
                placeholder="e.g. MANAGE_REPORTS" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                disabled={editingPerm?.isSystem}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Description</label>
              <Input 
                placeholder="Briefly describe what this permission allows" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={closeDrawer}>Cancel</Button>
            <Button onClick={handleSave} disabled={createPerm.isPending || updatePerm.isPending || !formData.name}>
              {createPerm.isPending || updatePerm.isPending ? 'Saving...' : 'Save Permission'}
            </Button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Permission"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            Are you sure you want to delete this permission? This action cannot be undone and will remove it from all roles and users.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDelete && deletePerm.mutate(confirmDelete)}
              disabled={deletePerm.isPending}
            >
              {deletePerm.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
