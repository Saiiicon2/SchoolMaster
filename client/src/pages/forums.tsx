import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Plus, Send, Users } from "lucide-react";

export default function Forums() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedForum, setSelectedForum] = useState<number | null>(null);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

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
  }, [isAuthenticated, isLoading, toast]);

  const { data: forums, isLoading: forumsLoading } = useQuery({
    queryKey: ["/api/forums"],
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: forumPosts } = useQuery({
    queryKey: ["/api/forums", selectedForum, "posts"],
    enabled: !!selectedForum,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedForumData = forums?.find((f: any) => f.id === selectedForum);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <TopBar 
          title="Forums & Communication" 
          subtitle="Engage with the school community" 
        />
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Forum List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Forums</CardTitle>
                    {user?.role === 'admin' && (
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {forumsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : forums?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500 text-sm">No forums available.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {forums?.map((forum: any) => {
                        const subject = subjects?.find((s: any) => s.id === forum.subjectId);
                        return (
                          <div
                            key={forum.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedForum === forum.id 
                                ? 'bg-primary/10 border border-primary/20' 
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                            onClick={() => setSelectedForum(forum.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{forum.name}</h4>
                              <MessageCircle className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={forum.type === 'general' ? 'default' : 'secondary'}>
                                {forum.type === 'general' ? 'General' : subject?.name || 'Subject'}
                              </Badge>
                            </div>
                            {forum.description && (
                              <p className="text-xs text-slate-500 mt-2">{forum.description}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Forum Content */}
            <div className="lg:col-span-2">
              {selectedForum ? (
                <div className="space-y-6">
                  {/* Forum Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedForumData?.name}</CardTitle>
                          <p className="text-sm text-slate-600">{selectedForumData?.description}</p>
                        </div>
                        <Badge variant={selectedForumData?.type === 'general' ? 'default' : 'secondary'}>
                          {selectedForumData?.type === 'general' ? 'General Discussion' : 'Subject Forum'}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* New Post Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Create New Post</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Input
                          placeholder="Post title..."
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                        />
                        <Textarea
                          placeholder="Write your message..."
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          rows={4}
                        />
                        <div className="flex justify-end">
                          <Button className="bg-primary hover:bg-primary/90">
                            <Send className="h-4 w-4 mr-2" />
                            Post Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Forum Posts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Discussions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No posts yet. Be the first to start a discussion!</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Forum</h3>
                    <p className="text-slate-500">Choose a forum from the list to view discussions and participate.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
