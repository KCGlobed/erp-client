import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';

export function LogsPage() {
  const [page] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['logs', page],
    queryFn: () => apiFetch(`/logs?page=${page}&limit=50`),
  });

  const getLevelStyle = (level: string): React.CSSProperties => {
    switch (level) {
      case 'ERROR':
        return { backgroundColor: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'oklch(0.577 0.245 27.325)', border: '1px solid oklch(0.577 0.245 27.325 / 0.3)' };
      case 'WARN':
        return { backgroundColor: 'oklch(0.828 0.189 84.429 / 0.1)', color: 'oklch(0.6 0.15 84)', border: '1px solid oklch(0.828 0.189 84.429 / 0.3)' };
      default:
        return { backgroundColor: 'oklch(0.36 0.18 330 / 0.05)', color: 'var(--primary)', border: '1px solid oklch(0.36 0.18 330 / 0.3)' };
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span>Home</span>
            <span className="mx-1">›</span>
            <span>System</span>
            <span className="mx-1">›</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>System Logs</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
            System Logs
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Audit trail and system events.
          </p>
        </div>
      </div>

      {/* Card */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
      >
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: 'oklch(0.97 0.01 330 / 0.4)' }}>
              <TableHead>Time</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Context</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>User Agent</TableHead>
              <TableHead>ipAddress</TableHead>
              <TableHead>duration</TableHead>
              <TableHead>method</TableHead>
              <TableHead>statusCode</TableHead>
              <TableHead>url</TableHead>
              <TableHead>stack</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Loading logs…
                </TableCell>
              </TableRow>
            ) : data?.data?.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs whitespace-nowrap" style={{ color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                    style={getLevelStyle(log.level)}
                  >
                    {log.level}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                  {log.context}
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {log.message}
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {log.userAgent}
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {log.ipAddress}
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {log.duration}
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {log.method}
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {log.statusCode}
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {log.url}
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {log.stack}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
