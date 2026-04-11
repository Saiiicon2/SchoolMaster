import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, BookOpen, Clock, GripVertical, Pencil, Trash2 } from "lucide-react";
import AddLevelModal from "@/components/modals/add-level-modal";
import EditLevelModal from "@/components/modals/edit-level-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const LEVELS_ORDER_STORAGE_KEY = "schoolmaster.levels.tile-order";

export default function Levels() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any | null>(null);
  const [orderedLevels, setOrderedLevels] = useState<any[]>([]);
  const [draggedLevelId, setDraggedLevelId] = useState<number | null>(null);
  const [dragOverLevelId, setDragOverLevelId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    // Redirect students to dashboard - they shouldn't be able to manage levels
    if (!isLoading && user && user.role === 'student') {
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: levels, isLoading: levelsLoading } = useQuery({
    queryKey: ["/api/levels"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  useEffect(() => {
    const levelList = Array.isArray(levels) ? levels : [];
    if (levelList.length === 0) {
      setOrderedLevels([]);
      return;
    }

    if (typeof window === "undefined") {
      setOrderedLevels(levelList);
      return;
    }

    const savedRaw = window.localStorage.getItem(LEVELS_ORDER_STORAGE_KEY);
    if (!savedRaw) {
      setOrderedLevels(levelList);
      return;
    }

    try {
      const savedIds: number[] = JSON.parse(savedRaw);
      const levelById = new Map(levelList.map((level: any) => [level.id, level]));
      const ordered = savedIds
        .map((id) => levelById.get(id))
        .filter((level): level is any => Boolean(level));
      const unordered = levelList.filter(
        (level: any) => !savedIds.includes(level.id),
      );
      setOrderedLevels([...ordered, ...unordered]);
    } catch {
      setOrderedLevels(levelList);
    }
  }, [levels]);

  function persistLevelOrder(levelList: any[]) {
    if (typeof window === "undefined") return;
    const ids = levelList.map((level: any) => level.id);
    window.localStorage.setItem(LEVELS_ORDER_STORAGE_KEY, JSON.stringify(ids));
  }

  function moveLevel(draggedId: number, targetId: number) {
    if (draggedId === targetId) return;

    setOrderedLevels((prev) => {
      const next = [...prev];
      const from = next.findIndex((level: any) => level.id === draggedId);
      const to = next.findIndex((level: any) => level.id === targetId);
      if (from < 0 || to < 0) return prev;

      const [dragged] = next.splice(from, 1);
      next.splice(to, 0, dragged);
      persistLevelOrder(next);
      return next;
    });
  }

  const displayedLevels = orderedLevels.length > 0
    ? orderedLevels
    : (Array.isArray(levels) ? levels : []);

  function getErrorMessage(error: unknown, fallback: string) {
    if (!(error instanceof Error)) return fallback;
    const responseText = error.message.split(": ").slice(1).join(": ");
    if (!responseText) return fallback;

    try {
      const parsed = JSON.parse(responseText);
      return parsed?.message || fallback;
    } catch {
      return responseText;
    }
  }

  const deleteLevelMutation = useMutation({
    mutationFn: async (levelId: number) => {
      const response = await apiRequest("DELETE", `/api/levels/${levelId}`);
      return response.json() as Promise<{ message?: string; action?: "deleted" | "archived" }>;
    },
    onSuccess: (result) => {
      toast({
        title: result?.action === "archived" ? "Archived" : "Deleted",
        description: result?.message || "Level deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/levels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      toast({
        title: "Delete failed",
        description: getErrorMessage(error, "Failed to delete level."),
        variant: "destructive",
      });
    },
  });

  function handleDeleteLevel(level: any) {
    const levelStudents = students?.filter((s: any) => s.currentLevelId === level.id) || [];
    const levelSubjects = subjects?.filter((s: any) => s.levelId === level.id) || [];
    const willArchive = levelStudents.length > 0 || levelSubjects.length > 0;
    const confirmed = window.confirm(
      willArchive
        ? `Delete ${level.name}? It still has ${levelStudents.length} student(s) and ${levelSubjects.length} subject(s), so it will be archived instead of permanently deleted.`
        : `Delete ${level.name}? This cannot be undone.`,
    );
    if (!confirmed) return;
    deleteLevelMutation.mutate(level.id);
  }

  if (isLoading || !isAuthenticated || user?.role === 'student') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <TopBar 
          title="Level Management" 
          subtitle="Manage academic levels and progression" 
        />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Academic Levels</h2>
              <p className="text-slate-600">Configure levels and track student progression</p>
            </div>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Level
              </Button>
            )}
          </div>

          {levelsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading levels...</p>
            </div>
          ) : levels?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-slate-500">No levels found. Add your first level to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedLevels.map((level: any) => {
                const levelStudents = students?.filter((s: any) => s.currentLevelId === level.id) || [];
                const levelSubjects = subjects?.filter((s: any) => s.levelId === level.id) || [];
                
                return (
                  <Card
                    key={level.id}
                    draggable
                    onDragStart={() => setDraggedLevelId(level.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedLevelId !== level.id) {
                        setDragOverLevelId(level.id);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedLevelId !== null) {
                        moveLevel(draggedLevelId, level.id);
                      }
                      setDragOverLevelId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedLevelId(null);
                      setDragOverLevelId(null);
                    }}
                    className={`border border-slate-200 cursor-move transition-shadow ${
                      dragOverLevelId === level.id ? "ring-2 ring-primary/40" : ""
                    } ${draggedLevelId === level.id ? "opacity-60" : ""}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-slate-400" />
                          <CardTitle className="font-semibold text-slate-900">{level.name}</CardTitle>
                        </div>
                        <Badge className={level.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {level.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {level.description && (
                        <p className="text-sm text-slate-600">{level.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-600">
                            <Users className="h-4 w-4 mr-2" />
                            <span>Students:</span>
                          </div>
                          <span className="font-medium">{levelStudents.length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-600">
                            <BookOpen className="h-4 w-4 mr-2" />
                            <span>Subjects:</span>
                          </div>
                          <span className="font-medium">{levelSubjects.length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Duration:</span>
                          </div>
                          <span className="font-medium">{level.durationMonths} months</span>
                        </div>
                      </div>

                      {/* Progress simulation for active levels */}
                      {level.isActive && levelStudents.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Progress</span>
                            <span>68%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: '68%' }}></div>
                          </div>
                        </div>
                      )}

                      {(user?.role === "admin" || user?.role === "superadmin" || user?.role === "teacher") && (
                        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingLevel(level)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {(user?.role === "admin" || user?.role === "superadmin") && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteLevel(level)}
                              disabled={deleteLevelMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AddLevelModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />

      <EditLevelModal
        open={Boolean(editingLevel)}
        onOpenChange={(open) => {
          if (!open) setEditingLevel(null);
        }}
        level={editingLevel}
      />
    </div>
  );
}
