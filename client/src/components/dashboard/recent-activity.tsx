import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ClipboardCheck, MessageCircle, TrendingUp } from "lucide-react";

interface RecentActivityProps {
  searchTerm?: string;
}

export default function RecentActivity({ searchTerm = "" }: RecentActivityProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/dashboard/activity"],
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredActivities = (activities || []).filter((activity: any) => {
    if (!normalizedSearch) return true;
    return (
      activity.studentName?.toLowerCase().includes(normalizedSearch) ||
      activity.subjectName?.toLowerCase().includes(normalizedSearch) ||
      activity.levelName?.toLowerCase().includes(normalizedSearch)
    );
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return { Icon: UserPlus, color: 'text-primary', bg: 'bg-primary/10' };
      case 'grade':
        return { Icon: ClipboardCheck, color: 'text-green-600', bg: 'bg-green-500/10' };
      case 'forum':
        return { Icon: MessageCircle, color: 'text-yellow-600', bg: 'bg-yellow-500/10' };
      case 'progression':
        return { Icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/10' };
      default:
        return { Icon: UserPlus, color: 'text-primary', bg: 'bg-primary/10' };
    }
  };

  const formatActivity = (activity: any) => {
    switch (activity.type) {
      case 'enrollment':
        return {
          text: (
            <>
              <span className="font-medium">{activity.studentName}</span> enrolled in{' '}
              <span className="font-medium text-primary">{activity.levelName}</span>
            </>
          ),
          time: new Date(activity.timestamp).toLocaleString(),
        };
      case 'grade':
        return {
          text: (
            <>
              Grades entered for <span className="font-medium">{activity.studentName}</span> in{' '}
              <span className="font-medium text-green-600">{activity.subjectName}</span>
            </>
          ),
          time: new Date(activity.timestamp).toLocaleString(),
        };
      default:
        return {
          text: activity.studentName || 'Unknown activity',
          time: new Date(activity.timestamp).toLocaleString(),
        };
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
          <Button variant="ghost" className="text-primary text-sm font-medium hover:text-primary/80">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">
              {normalizedSearch ? "No activity matches your student search." : "No recent activity found."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.slice(0, 5).map((activity: any, index: number) => {
              const { Icon, color, bg } = getActivityIcon(activity.type);
              const formattedActivity = formatActivity(activity);
              
              return (
                <div key={activity.id || index} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center mt-0.5`}>
                    <Icon className={`${color} h-4 w-4`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{formattedActivity.text}</p>
                    <p className="text-xs text-slate-500">{formattedActivity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
