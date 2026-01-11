import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, Trophy } from "lucide-react";

export default function Landing() {

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">EduAdmin</h1>
                <p className="text-xs text-slate-500">School Management System</p>
              </div>
            </div>
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl lg:text-6xl">
            Modern School
            <span className="text-primary block">Management System</span>
          </h1>
          <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto">
            Streamline your educational institution with our comprehensive platform for student enrollment, 
            academic tracking, and communication tools designed for small to mid-sized schools.
          </p>
          <div className="mt-10">
            <Link href="/login">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Student Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Easy enrollment, unique student IDs, and comprehensive profile management
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Level Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Structured 6-month levels with automatic progression tracking and graduation
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Grade Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Comprehensive grading system with subject-level scoring and progress reports
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Communication Hub</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Forums and subject-specific chat spaces for enhanced collaboration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-24 bg-primary rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join educators who are already using EduAdmin to streamline their academic operations
            and improve student outcomes.
          </p>
          <Link href="/login">
            <Button 
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-3"
            >
              Sign In to Your School
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500">
            <p>&copy; 2024 EduAdmin School Management System. Built for educational excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
