import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Info, AlertTriangle, CheckCircle, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  isActive: boolean;
  createdAt: string;
}

export function AnnouncementBanner() {
  const { user } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/announcements/${id}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
  });

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(Array.from(prev).concat([id])));
    markReadMutation.mutate(id);
  };

  useEffect(() => {
    const stored = localStorage.getItem('dismissedAnnouncements');
    if (stored) {
      try {
        setDismissedIds(new Set(JSON.parse(stored)));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (dismissedIds.size > 0) {
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(Array.from(dismissedIds)));
    }
  }, [dismissedIds]);

  if (!user || !announcements || announcements.length === 0) {
    return null;
  }

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'from-green-500/20 to-emerald-500/20',
          border: 'border-green-500/30',
          icon: <CheckCircle className="h-5 w-5 text-green-400" />,
          textColor: 'text-green-200'
        };
      case 'warning':
        return {
          bg: 'from-amber-500/20 to-orange-500/20',
          border: 'border-amber-500/30',
          icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
          textColor: 'text-amber-200'
        };
      case 'promo':
        return {
          bg: 'from-purple-500/20 to-pink-500/20',
          border: 'border-purple-500/30',
          icon: <Sparkles className="h-5 w-5 text-purple-400" />,
          textColor: 'text-purple-200'
        };
      case 'update':
        return {
          bg: 'from-blue-500/20 to-cyan-500/20',
          border: 'border-blue-500/30',
          icon: <Bell className="h-5 w-5 text-blue-400" />,
          textColor: 'text-blue-200'
        };
      case 'info':
      default:
        return {
          bg: 'from-sky-500/20 to-blue-500/20',
          border: 'border-sky-500/30',
          icon: <Info className="h-5 w-5 text-sky-400" />,
          textColor: 'text-sky-200'
        };
    }
  };

  return (
    <div className="space-y-0">
      {visibleAnnouncements.slice(0, 2).map((announcement) => {
        const styles = getTypeStyles(announcement.type);
        return (
          <div
            key={announcement.id}
            className={`bg-gradient-to-r ${styles.bg} border-b ${styles.border} px-4 py-3`}
            data-testid={`announcement-banner-${announcement.id}`}
          >
            <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 p-2 rounded-full bg-background/20">
                  {styles.icon}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                  <span className={`font-semibold ${styles.textColor} truncate`}>
                    {announcement.title}
                  </span>
                  <span className="text-sm text-muted-foreground hidden sm:inline">-</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {announcement.message}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex">
                  {announcement.type}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-background/20"
                  onClick={() => handleDismiss(announcement.id)}
                  data-testid={`button-dismiss-announcement-${announcement.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
