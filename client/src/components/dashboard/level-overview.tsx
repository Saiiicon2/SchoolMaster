import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LevelOverview() {
  const { data: levels, isLoading: levelsLoading } = useQuery({
    queryKey: ["/api/levels"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  if (levelsLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Level Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                <div className="h-20 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Level Overview</CardTitle>
          <Button 
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => window.location.href = '/levels'}
          >
            Manage Levels
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!levels || levels.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No levels found. Add levels to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {levels.map((level: any) => {
              const levelStudents = students?.filter((s: any) => s.currentLevelId === level.id) || [];
              const levelSubjects = subjects?.filter((s: any) => s.levelId === level.id) || [];
              // Simulate progress percentage (68% as shown in design)
              const progressPercent = Math.floor(Math.random() * 40) + 50; // 50-90%
              
              return (
                <div key={level.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">{level.name}</h4>
                    <Badge className={level.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {level.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Students:</span>
                      <span className="font-medium">{levelStudents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subjects:</span>
                      <span className="font-medium">{levelSubjects.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{level.durationMonths} months</span>
                    </div>
                  </div>
                  {level.isActive && levelStudents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
