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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";

type Source = {
  id: string;
  title: string;
  file_type: string;
  status: string;
  knowledge_type_name?: string;
  knowledge_type_color?: string;
  created_at: string;
};

type Props = {
  sources: Source[];
  loading: boolean;
  onRefresh: () => void;
};

const fileIcons: Record<string, string> = {
  pdf: "picture_as_pdf",
  docx: "description",
  xlsx: "table_chart",
  csv: "table_chart",
  txt: "article",
  md: "article",
  pptx: "slideshow",
};

export function KnowledgeTable({ sources, loading, onRefresh }: Props) {
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    try {
      await api(`/api/sources/${id}`, { method: "DELETE" });
      onRefresh();
    } catch {
      alert("Failed to delete");
    }
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

  if (sources.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sahara">
        <EmptyState
          icon="cloud_upload"
          title="No documents found"
          description="Upload documents to start building your knowledge base"
        />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sahara overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs uppercase tracking-wider">Name</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">Type</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">Created</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source) => (
            <TableRow key={source.id} className="hover:bg-secondary/30">
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-muted-foreground text-base">
                    {fileIcons[source.file_type] || "description"}
                  </span>
                  <span className="text-sm font-medium">{source.title}</span>
                </div>
              </TableCell>
              <TableCell>
                {source.knowledge_type_name && (
                  <Badge
                    variant="outline"
                    className="text-xs font-medium"
                    style={{
                      borderColor: source.knowledge_type_color,
                      color: source.knowledge_type_color,
                    }}
                  >
                    {source.knowledge_type_name}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <StatusDot status={source.status} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(source.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground">
                      <span className="material-symbols-outlined text-base">
                        more_vert
                      </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDelete(source.id)}
                      className="text-destructive"
                    >
                      <span className="material-symbols-outlined text-base mr-2">
                        delete
                      </span>
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

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ready: "bg-green-500",
    processing: "bg-yellow-500",
    error: "bg-destructive",
    pending: "bg-muted-foreground",
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${colors[status] || colors.pending}`} />
      <span className="text-xs capitalize text-muted-foreground">{status}</span>
    </div>
  );
}
