import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Layers, BookOpen, TrendingUp } from "lucide-react";

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: Users,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      change: "+12%",
      changeText: "from last semester",
      isPositive: true,
    },
    {
      title: "Active Levels",
      value: stats?.activeLevels || 0,
      icon: Layers,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      change: null,
      changeText: "Level 1 - Level 4",
      isPositive: null,
    },
    {
      title: "Subjects",
      value: stats?.totalSubjects || 0,
      icon: BookOpen,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
      change: null,
      changeText: "Across all levels",
      isPositive: null,
    },
    {
      title: "Avg. Grade",
      value: `${stats?.averageGrade || 0}%`,
      icon: TrendingUp,
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-500",
      change: "+2.1%",
      changeText: "improvement",
      isPositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${stat.iconColor} text-xl h-6 w-6`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stat.change && stat.isPositive && (
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </span>
                )}
                <span className={`text-slate-500 ${stat.change ? 'ml-2' : ''}`}>
                  {stat.changeText}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
