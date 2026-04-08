import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GraduationCap, LayoutDashboard, Users, Layers, BookOpen, ClipboardList, MessageCircle, LogOut, User } from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<'admin' | 'teacher' | 'student'>(user?.role as any || 'student');

  const adminNavItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/students", icon: Users, label: "Students" },
    { path: "/teachers", icon: Users, label: "Teachers" },
    { path: "/levels", icon: Layers, label: "Levels" },
    { path: "/subjects", icon: BookOpen, label: "Subjects" },
    { path: "/grades", icon: ClipboardList, label: "Grades & Assessments" },
    { path: "/forums", icon: MessageCircle, label: "Forums" },
  ];

  const teacherNavItems = [
    { path: "/", icon: LayoutDashboard, label: "My Dashboard" },
    { path: "/subjects", icon: BookOpen, label: "Subjects" },
    { path: "/grades", icon: ClipboardList, label: "Grades & Assessments" },
    { path: "/forums", icon: MessageCircle, label: "Forums" },
  ];

  const studentNavItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/subjects", icon: BookOpen, label: "My Subjects" },
    { path: "/grades", icon: ClipboardList, label: "My Grades" },
    { path: "/forums", icon: MessageCircle, label: "Forums" },
  ];

  const getNavItems = () => {
    if (currentRole === 'admin') return adminNavItems;
    if (currentRole === 'teacher') return teacherNavItems;
    return studentNavItems;
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-slate-200 fixed h-full z-10">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">EduAdmin</h1>
            <p className="text-xs text-slate-500">Institute Management</p>
          </div>
        </div>
      </div>

      {/* Role Switcher - Only show for admin and teacher users */}
      {(user?.role === 'admin' || user?.role === 'teacher') && (
        <div className="p-4 border-b border-slate-200">
          <div className="bg-slate-100 rounded-lg p-1 flex flex-col space-y-1">
            {user?.role === 'admin' && (
              <button
                className={`py-2 px-3 text-sm font-medium rounded-md transition-all ${
                  currentRole === 'admin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setCurrentRole('admin')}
              >
                Admin View
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                className={`py-2 px-3 text-sm font-medium rounded-md transition-all ${
                  currentRole === 'teacher'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setCurrentRole('teacher')}
              >
                Teacher View
              </button>
            )}
            <button
              className={`py-2 px-3 text-sm font-medium rounded-md transition-all ${
                currentRole === 'student'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setCurrentRole('student')}
            >
              Student View
            </button>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.firstName || user?.email || 'User'}
            </p>
            <p className="text-xs text-slate-500">
              {currentRole === 'admin' ? 'Administrator' : currentRole === 'teacher' ? 'Teacher' : 'Student'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
              } catch (err) {
                console.error('Logout request failed', err);
              }
              window.location.href = '/';
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
