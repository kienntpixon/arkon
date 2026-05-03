"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeTable } from "@/components/knowledge/knowledge-table";
import { KnowledgeFilters } from "@/components/knowledge/knowledge-filters";
import { UploadDialog } from "@/components/knowledge/upload-dialog";
import { KnowledgeTypeCards } from "@/components/types/knowledge-type-cards";
import { KnowledgeTypeDialog } from "@/components/types/knowledge-type-dialog";

export type KnowledgeType = {
  id: string;
  slug: string;
  name: string;
  color: string;
  description?: string;
  sort_order: number;
  source_count?: number;
};

export type Department = {
  id: string;
  name: string;
};

export type Source = {
  id: string;
  title: string;
  file_name?: string;
  source_type?: string;
  status: string;
  progress?: number;
  progress_message?: string;
  knowledge_type_id?: string;
  knowledge_type_name?: string;
  knowledge_type_color?: string;
  department_id?: string;
  department_name?: string;
  created_at: string;
};

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState("documents");
  
  const [sources, setSources] = useState<Source[]>([]);
  const [types, setTypes] = useState<KnowledgeType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editType, setEditType] = useState<KnowledgeType | null>(null);

  const loadSources = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType) {
        const matchedType = types.find((t) => t.slug === selectedType);
        if (matchedType) params.set("knowledge_type_id", matchedType.id);
      }
      if (selectedDepartment) params.set("department_id", selectedDepartment);

      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await api<Source[]>(`/api/sources${query}`);
      setSources(Array.isArray(data) ? data : []);
    } catch {
      if (!silent) setSources([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedType, selectedDepartment, types]);

  // Polling cho trạng thái tài liệu
  useEffect(() => {
    const hasPending = sources.some((s) => s.status === "pending" || s.status === "processing");
    if (!hasPending) return;

    const interval = setInterval(() => {
      loadSources(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [sources, loadSources]);

  const loadMeta = useCallback(async () => {
    try {
      const [typesData, deptsData] = await Promise.all([
        api<KnowledgeType[]>("/api/knowledge-types"),
        api<Department[]>("/api/departments"),
      ]);
      setTypes(typesData);
      setDepartments(deptsData);
    } catch {
      setTypes([]);
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        description="Manage and organize your organization's documents and categories."
        action={
          activeTab === "documents" ? (
            <Button
              onClick={() => setUploadOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-base mr-1">add</span>
              Upload Document
            </Button>
          ) : (
            <Button
              onClick={() => { setEditType(null); setTypeDialogOpen(true); }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-base mr-1">add</span>
              Add Category
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="documents" className="gap-2">
            <span className="material-symbols-outlined text-[18px]">files</span>
            Documents
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-2">
            <span className="material-symbols-outlined text-[18px]">category</span>
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <KnowledgeFilters
                types={types}
                selectedType={selectedType}
                onSelectType={setSelectedType}
                departments={departments}
                selectedDepartment={selectedDepartment}
                onSelectDepartment={setSelectedDepartment}
              />
            </div>
            <div className="lg:col-span-3">
              <KnowledgeTable
                sources={sources}
                types={types}
                departments={departments}
                loading={loading}
                onRefresh={loadSources}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="types" className="mt-0 outline-none">
          <KnowledgeTypeCards
            types={types}
            loading={types.length === 0 && loading}
            onEdit={(t) => { setEditType(t); setTypeDialogOpen(true); }}
            onRefresh={loadMeta}
          />
        </TabsContent>
      </Tabs>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        types={types}
        departments={departments}
        onUploaded={loadSources}
      />

      <KnowledgeTypeDialog
        open={typeDialogOpen}
        onOpenChange={setTypeDialogOpen}
        knowledgeType={editType}
        onSaved={loadMeta}
      />
    </>
  );
}
