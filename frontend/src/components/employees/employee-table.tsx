"use client";

import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  department_id: string;
  department_name: string;
  is_active: boolean;
  has_token: boolean;
};

type Props = {
  employees: Employee[];
  loading: boolean;
  onEdit: (emp: Employee) => void;
  onRefresh: () => void;
};

export function EmployeeTable({ employees, loading, onEdit, onRefresh }: Props) {
  const handleToggle = async (id: string) => {
    await api(`/api/employees/${id}/toggle`, { method: "PATCH" });
    onRefresh();
  };

  const handleGenerateToken = async (id: string) => {
    try {
      const data = await api<{ token: string; instructions: string }>(
        `/api/employees/${id}/token`,
        { method: "POST" }
      );
      alert(`MCP Token generated:\n\n${data.token}\n\n${data.instructions}`);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleRevokeToken = async (id: string) => {
    if (!confirm("Revoke this employee's MCP token?")) return;
    await api(`/api/employees/${id}/token`, { method: "DELETE" });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this employee? This cannot be undone.")) return;
    await api(`/api/employees/${id}`, { method: "DELETE" });
    onRefresh();
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sahara flex items-center justify-center py-16">
        <span className="material-symbols-outlined text-3xl text-muted-foreground animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sahara">
        <EmptyState
          icon="group"
          title="No employees"
          description="Add employees to give them access to the knowledge base"
        />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sahara overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs uppercase tracking-wider">Employee</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">Role</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">Department</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">MCP Token</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => (
            <TableRow key={emp.id} className="hover:bg-secondary/30">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={emp.role === "admin" ? "default" : "secondary"}
                  className="text-xs capitalize"
                >
                  {emp.role}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{emp.department_name}</TableCell>
              <TableCell>
                <Badge
                  variant={emp.is_active ? "outline" : "secondary"}
                  className={`text-xs ${
                    emp.is_active
                      ? "border-green-500 text-green-700"
                      : "text-muted-foreground"
                  }`}
                >
                  {emp.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                {emp.has_token ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm filled">
                      vpn_key
                    </span>
                    Connected
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No token</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground">
                      <span className="material-symbols-outlined text-base">
                        more_vert
                      </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(emp)}>
                      <span className="material-symbols-outlined text-base mr-2">edit</span>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggle(emp.id)}>
                      <span className="material-symbols-outlined text-base mr-2">
                        {emp.is_active ? "person_off" : "person"}
                      </span>
                      {emp.is_active ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {emp.has_token ? (
                      <DropdownMenuItem onClick={() => handleRevokeToken(emp.id)}>
                        <span className="material-symbols-outlined text-base mr-2">
                          vpn_key_off
                        </span>
                        Revoke Token
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleGenerateToken(emp.id)}>
                        <span className="material-symbols-outlined text-base mr-2">
                          vpn_key
                        </span>
                        Generate Token
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(emp.id)}
                      className="text-destructive"
                    >
                      <span className="material-symbols-outlined text-base mr-2">delete</span>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
