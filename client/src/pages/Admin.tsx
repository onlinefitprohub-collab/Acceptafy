import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourcesSection } from "@/components/admin/ResourcesSection";
import { UserDetailModal } from "@/components/admin/UserDetailModal";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Mail,
  Loader2,
  Crown,
  Calendar,
  Activity,
  Clock,
  DollarSign,
  AlertTriangle,
  UserCheck,
  FileText,
  AlertCircle,
  BarChart3,
  Link2,
  Zap,
  Search,
  Filter,
  MoreHorizontal,
  KeyRound,
  UserX,
  UserPlus,
  StickyNote,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Plus,
  Download,
  Heart,
  Target,
  ChevronDown,
  CalendarDays,
  Lightbulb,
  ChevronRight,
  PanelLeftClose,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar, AdminSection } from "@/components/admin-sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  role: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
  totalGrades: number;
  totalRewrites: number;
  totalFollowups: number;
  lastActiveDate: string | null;
}

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  tierBreakdown: { tier: string; count: number }[];
  totalGrades: number;
  recentSignups: number;
}

interface AdminCheckResponse {
  isAdmin: boolean;
}

interface BusinessMetrics {
  mrr: number;
  userGrowth: { date: string; count: number }[];
  churnRate: number;
  subscriptionBreakdown: { tier: string; count: number; revenue: number }[];
  activeUsers30d: number;
}

interface ContentAnalytics {
  topSubjectLines: { subject: string; score: number; grade: string }[];
  commonSpamTriggers: { word: string; count: number }[];
  gradeDistribution: { grade: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
}

interface FeatureAdoption {
  featureUsage: { feature: string; count: number; percentage: number }[];
  usageTrends: { date: string; grades: number; rewrites: number; followups: number; deliverability: number }[];
  totalUsage: number;
}

interface ESPMetrics {
  totalConnections: number;
  activeConnections: number;
  providerBreakdown: { provider: string; count: number }[];
  usersWithConnections: number;
}

const TIER_COLORS: Record<string, string> = {
  'scale': '#8b5cf6',
  'pro': '#06b6d4',
  'starter': '#64748b',
};

const GRADE_COLORS: Record<string, string> = {
  'A': '#22c55e',
  'B': '#84cc16',
  'C': '#eab308',
  'D': '#f97316',
  'F': '#ef4444',
};

interface AdminNote {
  id: string;
  userId: string;
  adminId: string;
  note: string;
  createdAt: string;
}

interface UserHealthScore {
  userId: string;
  email: string;
  healthScore: number;
  riskLevel: 'healthy' | 'at_risk' | 'critical';
  factors: {
    usageScore: number;
    paymentScore: number;
    engagementScore: number;
    tenureScore: number;
  };
  lastActivity: string | null;
  daysSinceActive: number;
}

interface CohortRetention {
  cohorts: Array<{
    cohort: string;
    totalUsers: number;
    week1: number;
    week2: number;
    week3: number;
    week4: number;
    week8: number;
    week12: number;
  }>;
  funnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

interface AtRiskUser {
  user: {
    id: string;
    email: string;
    subscriptionTier: string;
    subscriptionStatus: string;
  };
  healthScore: number;
  reason: string;
  suggestedAction: string;
}

interface RevenueAnalytics {
  lifetimeRevenue: number;
  arpu: number;
  mrrTrend: { date: string; mrr: number }[];
  revenueByTier: { tier: string; revenue: number; percentage: number }[];
  projectedRevenue: number;
  upgradeRevenue: number;
  downgradeImpact: number;
}

interface ConversionFunnel {
  freeToProRate: number;
  proToScaleRate: number;
  avgTimeToUpgrade: number;
  conversionsBySource: { source: string; count: number; rate: number }[];
  monthlyConversions: { date: string; upgrades: number; downgrades: number }[];
  featureCorrelation: { feature: string; upgradeLikelihood: number }[];
}

interface QualityMetrics {
  avgScoreOverTime: { date: string; avgScore: number; count: number }[];
  rewriteEffectiveness: { before: number; after: number; improvement: number };
  commonIssues: { issue: string; count: number; percentage: number }[];
  gradeImprovement: { grade: string; firstTimeCount: number; repeatCount: number }[];
}

interface SystemHealth {
  apiUsageTrend: { date: string; requests: number }[];
  peakUsageTimes: { hour: number; requests: number }[];
  errorRate: number;
  avgResponseTime: number;
  activeConnections: number;
  limitHitUsers: { userId: string; email: string; tier: string; feature: string; usage: number; limit: number }[];
}

interface Announcement {
  id: string;
  adminId: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface AdminEmail {
  id: string;
  adminId: string;
  recipientUserId: string | null;
  recipientEmail: string;
  subject: string;
  body: string;
  emailType: string;
  segment: string | null;
  status: string;
  sentAt: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface DateRangeAnalytics {
  userMetrics: {
    newUsers: number;
    activeUsers: number;
    churnedUsers: number;
    upgrades: number;
    downgrades: number;
  };
  emailMetrics: {
    totalAnalyses: number;
    avgScore: number;
    gradeDistribution: { grade: string; count: number }[];
  };
  revenueMetrics: {
    mrr: number;
    mrrChange: number;
    newRevenue: number;
  };
  dailyActivity: { date: string; users: number; analyses: number }[];
}

const DATE_RANGE_OPTIONS = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
  { label: 'Last 12 months', value: '12m', days: 365 },
  { label: 'Custom range', value: 'custom', days: 0 },
];

// Section header component for cleaner UI
interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
}

function SectionHeader({ title, icon, description }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
        {icon}
      </div>
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Single selected section state
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // User detail modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showResetLinkDialog, setShowResetLinkDialog] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [dateRange, setDateRange] = useState<string>("30d");
  
  // Email sending state
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSegment, setEmailSegment] = useState<string>("all");
  const [isBulkEmail, setIsBulkEmail] = useState(false);
  const [userSelectorOpen, setUserSelectorOpen] = useState(false);
  const [emailSelectedUserId, setEmailSelectedUserId] = useState<string | null>(null);
  
  // Announcement management state
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState<string>("info");
  const [announcementAudience, setAnnouncementAudience] = useState<string>("all");
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Custom date range state
  const getDefaultCustomDates = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };
  const [customStartDate, setCustomStartDate] = useState<string>(getDefaultCustomDates().start);
  const [customEndDate, setCustomEndDate] = useState<string>(getDefaultCustomDates().end);

  // Validate custom dates - ensure start <= end
  const isCustomDateValid = useMemo(() => {
    if (dateRange !== 'custom') return true;
    if (!customStartDate || !customEndDate) return false;
    return customStartDate <= customEndDate;
  }, [dateRange, customStartDate, customEndDate]);

  const dateRangeDates = useMemo(() => {
    if (dateRange === 'custom') {
      // If invalid custom range, fall back to last 30 days
      if (!customStartDate || !customEndDate || customStartDate > customEndDate) {
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { 
          start: start.toISOString().split('T')[0], 
          end: end.toISOString().split('T')[0]
        };
      }
      return { 
        start: customStartDate, 
        end: customEndDate 
      };
    }
    const option = DATE_RANGE_OPTIONS.find(o => o.value === dateRange) || DATE_RANGE_OPTIONS[1];
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const start = new Date(end.getTime() - option.days * 24 * 60 * 60 * 1000);
    return { 
      start: start.toISOString().split('T')[0], 
      end: end.toISOString().split('T')[0]
    };
  }, [dateRange, customStartDate, customEndDate]);

  const { data: adminCheck, isLoading: adminCheckLoading, isSuccess: adminCheckSuccess } = useQuery<AdminCheckResponse>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  const isAdmin = adminCheckSuccess && adminCheck?.isAdmin === true;

  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<BusinessMetrics>({
    queryKey: ["/api/admin/metrics", dateRangeDates.start, dateRangeDates.end],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRangeDates.start,
        endDate: dateRangeDates.end,
      });
      const res = await fetch(`/api/admin/metrics?${params}`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    enabled: isAdmin && isCustomDateValid,
  });

  const { data: contentAnalytics, isLoading: contentAnalyticsLoading } = useQuery<ContentAnalytics>({
    queryKey: ["/api/admin/content-analytics"],
    enabled: isAdmin,
  });

  const { data: featureAdoption, isLoading: featureAdoptionLoading } = useQuery<FeatureAdoption>({
    queryKey: ["/api/admin/feature-adoption"],
    enabled: isAdmin,
  });

  const { data: espMetrics, isLoading: espMetricsLoading } = useQuery<ESPMetrics>({
    queryKey: ["/api/admin/esp-metrics"],
    enabled: isAdmin,
  });

  const { data: userNotes, isLoading: notesLoading } = useQuery<AdminNote[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "notes"],
    enabled: !!selectedUser && showNotesDialog,
  });

  const { data: dateRangeAnalytics, isLoading: analyticsLoading } = useQuery<DateRangeAnalytics>({
    queryKey: ["/api/admin/analytics", dateRangeDates.start, dateRangeDates.end],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRangeDates.start,
        endDate: dateRangeDates.end,
      });
      const res = await fetch(`/api/admin/analytics?${params}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: healthScores, isLoading: healthScoresLoading } = useQuery<UserHealthScore[]>({
    queryKey: ["/api/admin/health-scores"],
    enabled: isAdmin,
  });

  const { data: cohortRetention, isLoading: cohortLoading } = useQuery<CohortRetention>({
    queryKey: ["/api/admin/cohort-retention"],
    enabled: isAdmin,
  });

  const { data: atRiskUsers, isLoading: atRiskLoading } = useQuery<AtRiskUser[]>({
    queryKey: ["/api/admin/at-risk-users"],
    enabled: isAdmin,
  });

  const { data: revenueAnalytics, isLoading: revenueLoading } = useQuery<RevenueAnalytics>({
    queryKey: ["/api/admin/revenue-analytics"],
    enabled: isAdmin,
  });

  const { data: conversionFunnel, isLoading: funnelLoading } = useQuery<ConversionFunnel>({
    queryKey: ["/api/admin/conversion-funnel"],
    enabled: isAdmin,
  });

  const { data: qualityMetrics, isLoading: qualityLoading } = useQuery<QualityMetrics>({
    queryKey: ["/api/admin/quality-metrics"],
    enabled: isAdmin,
  });

  const { data: systemHealth, isLoading: healthLoading } = useQuery<SystemHealth>({
    queryKey: ["/api/admin/system-health"],
    enabled: isAdmin,
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    enabled: isAdmin,
  });

  const { data: adminEmails, isLoading: emailsLoading } = useQuery<AdminEmail[]>({
    queryKey: ["/api/admin/emails"],
    enabled: isAdmin,
  });

  const { data: contactMessages, isLoading: messagesLoading } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/contact-messages"],
    enabled: isAdmin,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`);
      return res.json();
    },
    onSuccess: (data) => {
      setResetLink(data.resetUrl);
      setShowResetLinkDialog(true);
      toast({ title: "Password reset link generated", description: "Share this link with the user" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to generate reset link", variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/deactivate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
      toast({ title: "Account deactivated", description: "User account has been deactivated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to deactivate account", variant: "destructive" });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/reactivate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
      toast({ title: "Account reactivated", description: "User account has been reactivated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to reactivate account", variant: "destructive" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ userId, note }: { userId: string; note: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/notes`, { note });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUser?.id, "notes"] });
      setNewNote("");
      setShowAddNoteDialog(false);
      toast({ title: "Note added", description: "Admin note has been saved" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add note", variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { recipientEmail?: string; recipientUserId?: string; subject: string; body: string; segment?: string; isBulk: boolean }) => {
      if (data.isBulk) {
        const res = await apiRequest("POST", "/api/admin/send-bulk-email", {
          segment: data.segment,
          subject: data.subject,
          body: data.body,
        });
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/send-email", {
          recipientEmail: data.recipientEmail,
          recipientUserId: data.recipientUserId,
          subject: data.subject,
          body: data.body,
        });
        return res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/emails"] });
      setShowSendEmailDialog(false);
      setEmailRecipient("");
      setEmailSubject("");
      setEmailBody("");
      setEmailSegment("all");
      if (data.sentCount !== undefined) {
        toast({ 
          title: "Bulk email sent", 
          description: `Sent to ${data.sentCount} users${data.failedCount > 0 ? `, ${data.failedCount} failed` : ''}` 
        });
      } else {
        toast({ title: "Email sent", description: "Your message has been delivered" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send email", variant: "destructive" });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; message: string; type: string; targetAudience: string }) => {
      const res = await apiRequest("POST", "/api/admin/announcements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setAnnouncementType("info");
      setAnnouncementAudience("all");
      toast({ title: "Announcement created", description: "Your announcement is now live" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create announcement", variant: "destructive" });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async (data: { id: string; title?: string; message?: string; type?: string; targetAudience?: string; isActive?: boolean }) => {
      const { id, ...updates } = data;
      const res = await apiRequest("PATCH", `/api/admin/announcements/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setEditingAnnouncement(null);
      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setAnnouncementType("info");
      setAnnouncementAudience("all");
      toast({ title: "Announcement updated", description: "Changes have been saved" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update announcement", variant: "destructive" });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/announcements/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setShowDeleteConfirm(null);
      toast({ title: "Announcement deleted", description: "The announcement has been removed" });
    },
    onError: (error: any) => {
      setShowDeleteConfirm(null);
      toast({ title: "Error", description: error.message || "Failed to delete announcement", variant: "destructive" });
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter((u) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        (u.email && u.email.toLowerCase().includes(searchLower)) ||
        (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
        (u.lastName && u.lastName.toLowerCase().includes(searchLower));
      
      const matchesTier = tierFilter === "all" || 
        (u.subscriptionTier || 'starter') === tierFilter;
      
      const matchesStatus = statusFilter === "all" || 
        (u.subscriptionStatus || 'active') === statusFilter;
      
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [users, searchQuery, tierFilter, statusFilter]);

  if (authLoading || adminCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="admin-loading">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="admin-forbidden">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getTierBadgeVariant = (tier: string | null) => {
    switch (tier) {
      case 'scale': return 'default';
      case 'pro': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'default';
      case 'canceled': return 'destructive';
      case 'past_due': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    try {
      return format(new Date(dateStr), 'MMM d');
    } catch {
      return 'Never';
    }
  };

  const getUserInitials = (u: AdminUser) => {
    if (u.firstName && u.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    if (u.email) {
      return u.email[0].toUpperCase();
    }
    return '?';
  };

  return (
    <>
    <SidebarProvider>
      <AdminSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        atRiskCount={atRiskUsers?.length || 0}
      />
      <SidebarInset className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 space-y-6" data-testid="admin-dashboard">
          <header className="flex flex-wrap items-start justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-4 -mt-6 pt-6 -mx-6 px-6 lg:-mx-8 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-trigger" />
              <div className="space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Manage users and monitor platform activity</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]" data-testid="select-date-range">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {dateRange === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    max={customEndDate}
                    className={`w-[140px] ${!isCustomDateValid ? 'border-destructive' : ''}`}
                    data-testid="input-custom-start-date"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                    className={`w-[140px] ${!isCustomDateValid ? 'border-destructive' : ''}`}
                    data-testid="input-custom-end-date"
                  />
                  {!isCustomDateValid && (
                    <span className="text-destructive text-sm">Invalid range</span>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* At-Risk Users Section */}
          {activeSection === 'at-risk' && (
            <>
              <SectionHeader 
                title="At-Risk Users" 
                icon={<AlertTriangle className="w-5 h-5 text-orange-400" />}
                description="Users needing attention based on usage patterns"
              />
      {atRiskUsers && atRiskUsers.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5" data-testid="at-risk-users-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <AlertTriangle className="h-5 w-5" />
              Users Needing Attention
            </CardTitle>
            <CardDescription>
              Users at risk of churning based on usage and payment patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {atRiskUsers.slice(0, 6).map((item, index) => (
                <div 
                  key={item.user.id} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  data-testid={`at-risk-user-${index}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    item.healthScore < 40 ? 'bg-red-500' : 'bg-orange-500'
                  }`}>
                    {item.healthScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.user.email}</p>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {item.suggestedAction}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedUserId(item.user.id);
                          setIsUserDetailOpen(true);
                        }}
                        data-testid={`review-account-${index}`}
                      >
                        Review account
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
            </>
          )}

          {/* Overview Section */}
          {activeSection === 'overview' && (
            <>
              <SectionHeader 
                title="Overview Stats" 
                icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
                description="Quick platform metrics"
              />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card data-testid="stat-total-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-active-subs">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-total-grades">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalGrades || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-recent-signups">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups (7d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.recentSignups || 0}</div>
            )}
          </CardContent>
              </Card>
            </div>
            </>
          )}

          {/* Business Metrics Section */}
          {activeSection === 'business-metrics' && (
            <>
              <SectionHeader 
                title="Business Metrics" 
                icon={<DollarSign className="w-5 h-5 text-green-400" />}
                description="Revenue and subscription analytics"
              />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card data-testid="stat-mrr">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold text-green-500">
                ${metrics?.mrr?.toLocaleString() || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-churn">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className={`text-2xl font-bold ${(metrics?.churnRate || 0) > 5 ? 'text-red-500' : 'text-green-500'}`}>
                {metrics?.churnRate || 0}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-active-30d">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{metrics?.activeUsers30d || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-paid-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics?.subscriptionBreakdown?.filter(s => s.tier !== 'starter').reduce((acc, s) => acc + s.count, 0) || 0}
              </div>
            )}
          </CardContent>
              </Card>
            </div>
            </>
          )}

          {/* Charts Section */}
          {activeSection === 'charts' && (
            <>
              <SectionHeader 
                title="Growth Charts" 
                icon={<TrendingUp className="w-5 h-5 text-indigo-400" />}
                description="User growth and subscription breakdown"
              />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="user-growth-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              User Growth
            </CardTitle>
            <CardDescription>
              New user signups per week {dateRange !== 'custom' ? `(${DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label || 'Last 30 days'})` : '(Custom range)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading || !metrics ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : metrics.userGrowth && metrics.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={metrics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => {
                      const weekStart = new Date(value);
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekEnd.getDate() + 6);
                      return `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getDate()}`;
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelFormatter={(value) => {
                      const weekStart = new Date(value);
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekEnd.getDate() + 6);
                      return `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    fill="url(#colorGradient)" 
                    strokeWidth={2}
                    name="New Users"
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No user growth data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="subscription-breakdown-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Subscription Breakdown
            </CardTitle>
            <CardDescription>
              Revenue and users by tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading || !metrics ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : metrics.subscriptionBreakdown && metrics.subscriptionBreakdown.length > 0 && metrics.subscriptionBreakdown.some(s => s.count > 0) ? (
              <div className="flex gap-6 items-center">
                <div className="w-[160px] h-[160px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.subscriptionBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="count"
                        nameKey="tier"
                      >
                        {metrics.subscriptionBreakdown.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={TIER_COLORS[entry.tier] || '#64748b'}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                        formatter={(value: number, name: string) => [`${value} users`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-3">
                  {metrics.subscriptionBreakdown.map((item) => (
                    <div key={item.tier} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: TIER_COLORS[item.tier] || '#64748b' }}
                        />
                        <span className="text-sm font-medium capitalize">{item.tier}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{item.count} users</div>
                        <div className="text-xs text-muted-foreground">${item.revenue}/mo</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No subscription data available
              </div>
            )}
          </CardContent>
              </Card>
            </div>
            </>
          )}

          {/* ESP Metrics Section */}
          {activeSection === 'esp-metrics' && (
            <>
              <SectionHeader 
                title="ESP Metrics" 
                icon={<Link2 className="w-5 h-5 text-cyan-400" />}
                description="Email service provider connections and usage"
              />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card data-testid="stat-esp-connections">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ESP Connections</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {espMetricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{espMetrics?.totalConnections || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-esp-active">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {espMetricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold text-green-500">{espMetrics?.activeConnections || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-esp-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users with ESP</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {espMetricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{espMetrics?.usersWithConnections || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-esp-providers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ESP Providers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {espMetricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="space-y-2">
                {espMetrics?.providerBreakdown && espMetrics.providerBreakdown.length > 0 ? (
                  espMetrics.providerBreakdown.slice(0, 3).map((item) => (
                    <div key={item.provider} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{item.provider}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm">No providers connected</div>
                )}
              </div>
            )}
          </CardContent>
              </Card>
            </div>
            </>
          )}

          {/* Users Section */}
          {activeSection === 'users' && (
            <>
              <SectionHeader 
                title="User Management" 
                icon={<Users className="w-5 h-5 text-blue-400" />}
                description="Search, filter, and manage all registered users"
              />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-3" data-testid="users-table-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Search, filter, and manage all registered users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-user-search"
                />
              </div>
              <div className="flex gap-2">
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[130px]" data-testid="select-tier-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="default"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/users/export/csv', {
                        credentials: 'include'
                      });
                      if (!response.ok) {
                        throw new Error('Export failed');
                      }
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      toast({ title: "Export Complete", description: "CSV file downloaded successfully" });
                    } catch (error) {
                      console.error('CSV export error:', error);
                      toast({ title: "Export Failed", description: "Failed to export users to CSV", variant: "destructive" });
                    }
                  }}
                  data-testid="button-export-csv"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users?.length || 0} users
            </div>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {getUserInitials(u)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {u.firstName && u.lastName 
                                  ? `${u.firstName} ${u.lastName}` 
                                  : u.email || 'Unknown'}
                                {u.role === 'admin' && (
                                  <Badge variant="default" className="bg-purple-600 text-xs">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              {u.email && (
                                <div className="text-xs text-muted-foreground">
                                  {u.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={getTierBadgeVariant(u.subscriptionTier)}>
                              {u.subscriptionTier === 'scale' && <Crown className="h-3 w-3 mr-1" />}
                              {u.subscriptionTier || 'starter'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {u.subscriptionStatus || 'free'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{u.totalGrades || 0} grades</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {u.totalRewrites || 0} rewrites, {u.totalFollowups || 0} followups
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatLastActive(u.lastActiveDate)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(u.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${u.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUserId(u.id);
                                  setIsUserDetailOpen(true);
                                }}
                                data-testid={`action-review-account-${u.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Review Account
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(u);
                                  resetPasswordMutation.mutate(u.id);
                                }}
                                disabled={resetPasswordMutation.isPending}
                                data-testid={`action-reset-password-${u.id}`}
                              >
                                <KeyRound className="h-4 w-4 mr-2" />
                                Send Password Reset
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {u.subscriptionStatus === 'inactive' ? (
                                <DropdownMenuItem
                                  onClick={() => reactivateMutation.mutate(u.id)}
                                  disabled={reactivateMutation.isPending}
                                  data-testid={`action-reactivate-${u.id}`}
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Reactivate Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => deactivateMutation.mutate(u.id)}
                                  disabled={deactivateMutation.isPending || u.role === 'admin'}
                                  data-testid={`action-deactivate-${u.id}`}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate Account
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowAddNoteDialog(true);
                                }}
                                data-testid={`action-add-note-${u.id}`}
                              >
                                <StickyNote className="h-4 w-4 mr-2" />
                                Add Note
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowNotesDialog(true);
                                }}
                                data-testid={`action-view-notes-${u.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Notes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {searchQuery || tierFilter !== "all" || statusFilter !== "all" 
                            ? "No users match your filters" 
                            : "No users found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card data-testid="tier-breakdown-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Tier Breakdown
            </CardTitle>
            <CardDescription>
              Users by subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.tierBreakdown?.map((item) => {
                  const percentage = stats.totalUsers > 0 
                    ? Math.round((item.count / stats.totalUsers) * 100) 
                    : 0;
                  return (
                    <div key={item.tier} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{item.tier}</span>
                        <span className="text-muted-foreground">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!stats?.tierBreakdown || stats.tierBreakdown.length === 0) && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No tier data available
                  </p>
                )}
              </div>
            )}
          </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold">User Health & Retention</h3>
              <p className="text-muted-foreground">
                Monitor user engagement and identify at-risk accounts
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="health-score-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              User Health Scores
            </CardTitle>
            <CardDescription>
              Distribution of users by health score (higher is better)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthScoresLoading || !healthScores ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : healthScores.length > 0 ? (
              <div className="space-y-4">
                {/* Health score summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-500/10">
                    <div className="text-2xl font-bold text-green-500">
                      {healthScores.filter(h => h.riskLevel === 'healthy').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Healthy</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-orange-500/10">
                    <div className="text-2xl font-bold text-orange-500">
                      {healthScores.filter(h => h.riskLevel === 'at_risk').length}
                    </div>
                    <div className="text-xs text-muted-foreground">At Risk</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-500/10">
                    <div className="text-2xl font-bold text-red-500">
                      {healthScores.filter(h => h.riskLevel === 'critical').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Critical</div>
                  </div>
                </div>
                {/* Health score bars */}
                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {healthScores.slice(0, 10).map((hs) => (
                    <div key={hs.userId} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{
                          backgroundColor: hs.riskLevel === 'healthy' ? '#22c55e' : 
                            hs.riskLevel === 'at_risk' ? '#f97316' : '#ef4444'
                        }}
                      >
                        {hs.healthScore}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{hs.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {hs.daysSinceActive === 0 ? 'Active today' : `${hs.daysSinceActive}d ago`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px]">
                <p className="text-muted-foreground text-sm">No health score data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cohort Retention */}
        <Card data-testid="cohort-retention-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Cohort Retention
            </CardTitle>
            <CardDescription>
              User retention by signup cohort over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cohortLoading || !cohortRetention ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : cohortRetention.cohorts && cohortRetention.cohorts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Cohort</TableHead>
                      <TableHead className="text-center">Users</TableHead>
                      <TableHead className="text-center">W1</TableHead>
                      <TableHead className="text-center">W2</TableHead>
                      <TableHead className="text-center">W4</TableHead>
                      <TableHead className="text-center">W8</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cohortRetention.cohorts.slice(0, 6).map((cohort) => (
                      <TableRow key={cohort.cohort}>
                        <TableCell className="font-medium text-xs">
                          {cohort.cohort}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {cohort.totalUsers}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={cohort.week1 >= 50 ? 'default' : 'secondary'} className="text-xs">
                            {cohort.week1}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={cohort.week2 >= 40 ? 'default' : 'secondary'} className="text-xs">
                            {cohort.week2}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={cohort.week4 >= 30 ? 'default' : 'secondary'} className="text-xs">
                            {cohort.week4}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={cohort.week8 >= 20 ? 'default' : 'secondary'} className="text-xs">
                            {cohort.week8}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px]">
                <p className="text-muted-foreground text-sm">No cohort data yet</p>
              </div>
            )}
          </CardContent>
              </Card>
            </div>
            </>
          )}

          {/* Content Intelligence Analytics Section */}
          {activeSection === 'content-intelligence' && (
            <>
              <SectionHeader 
                title="Content Intelligence" 
                icon={<FileText className="w-5 h-5 text-pink-400" />}
                description="Insights from analyzed emails across the platform"
              />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="grade-distribution-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Grade Distribution
            </CardTitle>
            <CardDescription>
              Distribution of email grades across all analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentAnalyticsLoading || !contentAnalytics ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : contentAnalytics.gradeDistribution && contentAnalytics.gradeDistribution.some(g => g.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={contentAnalytics.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="grade" 
                    tick={{ fontSize: 14, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: number) => [`${value} emails`, 'Count']}
                  />
                  <Bar dataKey="count" name="Emails">
                    {contentAnalytics.gradeDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={GRADE_COLORS[entry.grade] || '#64748b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No grade data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="score-distribution-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Score Distribution
            </CardTitle>
            <CardDescription>
              Email scores grouped by range
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentAnalyticsLoading || !contentAnalytics ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : contentAnalytics.scoreDistribution && contentAnalytics.scoreDistribution.some(s => s.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={contentAnalytics.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: number) => [`${value} emails`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" name="Emails" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No score data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="top-subject-lines-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Top Performing Subject Lines
            </CardTitle>
            <CardDescription>
              Highest scoring subject lines analyzed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentAnalyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contentAnalytics?.topSubjectLines && contentAnalytics.topSubjectLines.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {contentAnalytics.topSubjectLines.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50"
                      data-testid={`subject-line-${index}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.subject}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: GRADE_COLORS[item.grade.charAt(0)] || '#64748b',
                            color: GRADE_COLORS[item.grade.charAt(0)] || '#64748b'
                          }}
                        >
                          {item.grade}
                        </Badge>
                        <span className="text-sm font-medium">{item.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No subject line data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="common-spam-triggers-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Common Spam Triggers
            </CardTitle>
            <CardDescription>
              Most frequently detected spam trigger words
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentAnalyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contentAnalytics?.commonSpamTriggers && contentAnalytics.commonSpamTriggers.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {contentAnalytics.commonSpamTriggers.map((item, index) => {
                    const maxCount = contentAnalytics.commonSpamTriggers[0]?.count || 1;
                    const percentage = Math.round((item.count / maxCount) * 100);
                    return (
                      <div 
                        key={index} 
                        className="space-y-1"
                        data-testid={`spam-trigger-${index}`}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.word}</span>
                          <span className="text-muted-foreground">{item.count} occurrences</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No spam trigger data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

            </>
          )}

          {/* Feature Adoption Section */}
          {activeSection === 'feature-adoption' && (
            <>
              <SectionHeader 
                title="Feature Adoption" 
                icon={<Zap className="w-5 h-5 text-yellow-400" />}
                description="Track which features are used most and usage trends"
              />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="feature-usage-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Feature Usage
            </CardTitle>
            <CardDescription>
              Total usage by feature ({featureAdoption?.totalUsage?.toLocaleString() || 0} total actions)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {featureAdoptionLoading || !featureAdoption ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : featureAdoption.featureUsage && featureAdoption.featureUsage.some(f => f.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={featureAdoption.featureUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="feature"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toLocaleString()} (${props.payload.percentage}%)`,
                      'Usage'
                    ]}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" name="Usage" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No feature usage data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="usage-trends-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Trends (12 Weeks)
            </CardTitle>
            <CardDescription>
              Feature usage over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {featureAdoptionLoading || !featureAdoption ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : featureAdoption.usageTrends && featureAdoption.usageTrends.some(t => t.grades > 0 || t.rewrites > 0 || t.followups > 0 || t.deliverability > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={featureAdoption.usageTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="grades" 
                    stackId="1"
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6}
                    name="Grades"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rewrites" 
                    stackId="1"
                    stroke="#06b6d4" 
                    fill="#06b6d4" 
                    fillOpacity={0.6}
                    name="Rewrites"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="followups" 
                    stackId="1"
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.6}
                    name="Follow-ups"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="deliverability" 
                    stackId="1"
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.6}
                    name="Deliverability"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No usage trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Adoption Summary */}
      <Card data-testid="feature-summary-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Feature Breakdown
          </CardTitle>
          <CardDescription>
            Usage distribution across all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featureAdoptionLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : featureAdoption?.featureUsage && featureAdoption.featureUsage.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featureAdoption.featureUsage.map((feature, index) => {
                const colors = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'];
                return (
                  <div 
                    key={feature.feature} 
                    className="p-4 rounded-lg bg-muted/50 space-y-2"
                    data-testid={`feature-stat-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{feature.feature}</span>
                      <Badge variant="outline" style={{ borderColor: colors[index] || '#64748b', color: colors[index] || '#64748b' }}>
                        {feature.percentage}%
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{feature.count.toLocaleString()}</div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all"
                        style={{ 
                          width: `${feature.percentage}%`,
                          backgroundColor: colors[index] || '#64748b'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No feature data available
            </div>
          )}
        </CardContent>
      </Card>

            </>
          )}

          {/* Revenue & Business Analytics Section */}
          {activeSection === 'revenue-analytics' && (
            <>
              <SectionHeader 
                title="Revenue & Business Analytics" 
                icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                description="Detailed revenue metrics and business insights"
              />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="mrr-trend-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              MRR Trend
            </CardTitle>
            <CardDescription>
              Monthly recurring revenue over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : revenueAnalytics?.mrrTrend && revenueAnalytics.mrrTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueAnalytics.mrrTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis 
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-lg">
                            <p className="text-sm font-medium">{new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            <p className="text-sm text-primary">${(payload[0].value as number).toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="mrr" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No MRR data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Tier */}
        <Card data-testid="revenue-by-tier-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue by Tier
            </CardTitle>
            <CardDescription>
              Monthly revenue breakdown by subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-primary">
                      ${revenueAnalytics?.arpu?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-muted-foreground">ARPU (Monthly)</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-green-500">
                      ${revenueAnalytics?.projectedRevenue || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Projected Next Month</div>
                  </div>
                </div>
                {revenueAnalytics?.revenueByTier?.map((tier) => (
                  <div key={tier.tier} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{tier.tier}</span>
                      <span className="text-muted-foreground">${tier.revenue}/mo ({tier.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all"
                        style={{ 
                          width: `${tier.percentage}%`,
                          backgroundColor: TIER_COLORS[tier.tier] || '#64748b'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

            </>
          )}

          {/* Conversion Funnel Section */}
          {activeSection === 'conversion-funnel' && (
            <>
              <SectionHeader 
                title="Conversion Analytics" 
                icon={<Target className="w-5 h-5 text-rose-400" />}
                description="User upgrade patterns and feature correlation"
              />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card data-testid="conversion-rates-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Conversion Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funnelLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
                  <div className="text-3xl font-bold">{conversionFunnel?.freeToProRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Free → Paid Conversion</div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                  <div className="text-3xl font-bold">{conversionFunnel?.proToScaleRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Pro → Scale Upgrade</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-xl font-bold">{conversionFunnel?.avgTimeToUpgrade || 0} days</div>
                  <div className="text-sm text-muted-foreground">Avg. Time to Upgrade</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Conversions Chart */}
        <Card data-testid="monthly-conversions-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Upgrades & Downgrades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funnelLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : conversionFunnel?.monthlyConversions && conversionFunnel.monthlyConversions.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={conversionFunnel.monthlyConversions}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'currentColor' }} />
                  <Tooltip />
                  <Bar dataKey="upgrades" fill="#22c55e" name="Upgrades" />
                  <Bar dataKey="downgrades" fill="#ef4444" name="Downgrades" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No conversion data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Correlation */}
        <Card data-testid="feature-correlation-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Feature → Upgrade Correlation
            </CardTitle>
            <CardDescription>
              Features that drive paid upgrades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {funnelLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversionFunnel?.featureCorrelation && conversionFunnel.featureCorrelation.length > 0 ? (
              <div className="space-y-3">
                {conversionFunnel.featureCorrelation.map((item) => (
                  <div key={item.feature} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.feature}</span>
                      <Badge variant={item.upgradeLikelihood >= 50 ? 'default' : 'secondary'}>
                        {item.upgradeLikelihood}%
                      </Badge>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${item.upgradeLikelihood}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No correlation data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

            </>
          )}

          {/* Quality Metrics Section */}
          {activeSection === 'quality-metrics' && (
            <>
              <SectionHeader 
                title="Quality Metrics" 
                icon={<Activity className="w-5 h-5 text-teal-400" />}
                description="Email analysis performance and improvement tracking"
              />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="score-trend-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Average Score Trend
            </CardTitle>
            <CardDescription>
              Weekly average email scores across all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qualityLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : qualityMetrics?.avgScoreOverTime && qualityMetrics.avgScoreOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={qualityMetrics.avgScoreOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fill: 'currentColor' }} domain={[0, 100]} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-lg">
                            <p className="text-sm font-medium">{new Date(label).toLocaleDateString()}</p>
                            <p className="text-sm">Score: {payload[0].value}</p>
                            <p className="text-xs text-muted-foreground">{(payload[0].payload as any)?.count || 0} analyses</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="avgScore" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No score data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rewrite Effectiveness */}
        <Card data-testid="rewrite-effectiveness-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Rewrite Effectiveness
            </CardTitle>
            <CardDescription>
              Impact of AI rewrites on email scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qualityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-muted-foreground">{qualityMetrics?.rewriteEffectiveness?.before || 0}</div>
                    <div className="text-xs text-muted-foreground">Before Rewrite</div>
                  </div>
                  <div className="text-2xl text-muted-foreground">→</div>
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-green-500">{qualityMetrics?.rewriteEffectiveness?.after || 0}</div>
                    <div className="text-xs text-muted-foreground">After Rewrite</div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <div className="text-2xl font-bold text-green-500">+{qualityMetrics?.rewriteEffectiveness?.improvement || 0}%</div>
                  <div className="text-sm text-muted-foreground">Average Improvement</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Common Issues */}
        <Card data-testid="common-issues-card" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Common Issues Found
            </CardTitle>
            <CardDescription>
              Most frequently detected problems in analyzed emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qualityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : qualityMetrics?.commonIssues && qualityMetrics.commonIssues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {qualityMetrics.commonIssues.slice(0, 8).map((issue, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm truncate flex-1 mr-2">{issue.issue}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{issue.count}</Badge>
                      <span className="text-xs text-muted-foreground">{issue.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No issues data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

            </>
          )}

          {/* System Health Section */}
          {activeSection === 'system-health' && (
            <>
              <SectionHeader 
                title="System Health & Usage Limits" 
                icon={<Activity className="w-5 h-5 text-orange-400" />}
                description="Monitor system performance and identify users approaching limits"
              />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="api-usage-trend-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              API Usage Trend
            </CardTitle>
            <CardDescription>
              Daily API requests over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : systemHealth?.apiUsageTrend && systemHealth.apiUsageTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={systemHealth.apiUsageTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fill: 'currentColor' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="requests" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Requests" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No API usage data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peak Usage Times */}
        <Card data-testid="peak-usage-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Peak Usage Hours
            </CardTitle>
            <CardDescription>
              Requests by hour of day (UTC)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : systemHealth?.peakUsageTimes && systemHealth.peakUsageTimes.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={systemHealth.peakUsageTimes}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    tickFormatter={(h) => `${h}:00`}
                  />
                  <YAxis tick={{ fill: 'currentColor' }} />
                  <Tooltip formatter={(v, n) => [v, 'Requests']} labelFormatter={(h) => `${h}:00 UTC`} />
                  <Bar dataKey="requests" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No peak usage data
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card data-testid="system-status-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-500">
                    {(100 - (systemHealth?.errorRate || 0)).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-500">
                    {systemHealth?.avgResponseTime || 0}ms
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Response</div>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-500">
                    {systemHealth?.activeConnections || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">ESP Connections</div>
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="text-2xl font-bold text-orange-500">
                    {(systemHealth?.errorRate || 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Error Rate</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Near Limit */}
        <Card data-testid="users-near-limit-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Users Near Limit (Upgrade Candidates)
            </CardTitle>
            <CardDescription>
              Users at 80%+ of their usage limits - potential upgrade targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : systemHealth?.limitHitUsers && systemHealth.limitHitUsers.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {systemHealth.limitHitUsers.slice(0, 10).map((item, idx) => (
                    <div key={`${item.userId}-${item.feature}-${idx}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.feature}: {item.usage}/{item.limit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.tier === 'starter' ? 'destructive' : 'secondary'} className="capitalize">
                          {item.tier}
                        </Badge>
                        <span className={`text-sm font-bold ${item.usage >= item.limit ? 'text-red-500' : 'text-orange-500'}`}>
                          {Math.round((item.usage / item.limit) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No users near their limits
              </div>
            )}
          </CardContent>
        </Card>
      </div>

            </>
          )}

          {/* Website Analytics Section */}
          {activeSection === 'website-analytics' && (
            <>
              <SectionHeader 
                title="Website Analytics" 
                icon={<BarChart3 className="w-5 h-5 text-violet-400" />}
                description="Live visitor data from Google Analytics"
              />
            <Card data-testid="website-analytics-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Google Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Real-time website traffic, user behavior, and engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden rounded-lg border">
            <iframe 
              data-testid="iframe-website-analytics"
              width="100%" 
              height="2125" 
              src="https://lookerstudio.google.com/embed/reporting/815ad940-f416-4428-aa06-0e34e1a7d3ae/page/kIV1C" 
              frameBorder="0" 
              style={{ border: 0 }} 
              allowFullScreen 
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </CardContent>
      </Card>

            </>
          )}

          {/* Communications Section */}
          {activeSection === 'communications' && (
            <>
              <SectionHeader 
                title="Communications & Messages" 
                icon={<Mail className="w-5 h-5 text-sky-400" />}
                description="Manage announcements and view contact messages"
              />
            {/* Create/Edit Announcement Card */}
            <Card data-testid="create-announcement-card" className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
                </CardTitle>
                <CardDescription>
                  {editingAnnouncement ? 'Update the announcement details' : 'Create a new announcement for users'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="announcement-title">Title</Label>
                      <Input
                        id="announcement-title"
                        placeholder="Announcement title"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        data-testid="input-announcement-title"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="announcement-type">Type</Label>
                        <Select value={announcementType} onValueChange={setAnnouncementType}>
                          <SelectTrigger id="announcement-type" data-testid="select-announcement-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="update">Update</SelectItem>
                            <SelectItem value="promo">Promo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="announcement-audience">Audience</Label>
                        <Select value={announcementAudience} onValueChange={setAnnouncementAudience}>
                          <SelectTrigger id="announcement-audience" data-testid="select-announcement-audience">
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="starter">Starter Only</SelectItem>
                            <SelectItem value="pro">Pro Only</SelectItem>
                            <SelectItem value="scale">Scale Only</SelectItem>
                            <SelectItem value="paid">All Paid Users</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="announcement-message">Message</Label>
                    <Textarea
                      id="announcement-message"
                      placeholder="Write your announcement message..."
                      value={announcementMessage}
                      onChange={(e) => setAnnouncementMessage(e.target.value)}
                      rows={3}
                      data-testid="input-announcement-message"
                    />
                  </div>
                  <div className="flex gap-2">
                    {editingAnnouncement ? (
                      <>
                        <Button
                          onClick={() => {
                            updateAnnouncementMutation.mutate({
                              id: editingAnnouncement.id,
                              title: announcementTitle,
                              message: announcementMessage,
                              type: announcementType,
                              targetAudience: announcementAudience,
                            });
                          }}
                          disabled={updateAnnouncementMutation.isPending || !announcementTitle || !announcementMessage}
                          data-testid="button-update-announcement"
                        >
                          {updateAnnouncementMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          Update Announcement
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingAnnouncement(null);
                            setAnnouncementTitle("");
                            setAnnouncementMessage("");
                            setAnnouncementType("info");
                            setAnnouncementAudience("all");
                          }}
                          data-testid="button-cancel-edit"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => {
                          createAnnouncementMutation.mutate({
                            title: announcementTitle,
                            message: announcementMessage,
                            type: announcementType,
                            targetAudience: announcementAudience,
                          });
                        }}
                        disabled={createAnnouncementMutation.isPending || !announcementTitle || !announcementMessage}
                        data-testid="button-create-announcement"
                      >
                        {createAnnouncementMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        <Plus className="h-4 w-4 mr-2" />
                        Create Announcement
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manage Announcements Card */}
            <Card data-testid="manage-announcements-card" className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Manage Announcements
                </CardTitle>
                <CardDescription>
                  View, edit, toggle, and delete announcements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {announcementsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : announcements && announcements.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {announcements.map((announcement) => (
                        <div 
                          key={announcement.id} 
                          className={`p-4 rounded-lg border ${announcement.isActive ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/50 border-muted'}`}
                          data-testid={`announcement-item-${announcement.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{announcement.title}</span>
                                <Badge variant={announcement.isActive ? 'default' : 'secondary'} className="text-xs">
                                  {announcement.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{announcement.message}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs capitalize">{announcement.type}</Badge>
                                <Badge variant="outline" className="text-xs capitalize">{announcement.targetAudience}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  Created {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  updateAnnouncementMutation.mutate({
                                    id: announcement.id,
                                    isActive: !announcement.isActive,
                                  });
                                }}
                                disabled={updateAnnouncementMutation.isPending}
                                data-testid={`button-toggle-${announcement.id}`}
                                title={announcement.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {announcement.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingAnnouncement(announcement);
                                  setAnnouncementTitle(announcement.title);
                                  setAnnouncementMessage(announcement.message);
                                  setAnnouncementType(announcement.type);
                                  setAnnouncementAudience(announcement.targetAudience);
                                }}
                                data-testid={`button-edit-${announcement.id}`}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {showDeleteConfirm === announcement.id ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                                    disabled={deleteAnnouncementMutation.isPending}
                                    data-testid={`button-confirm-delete-${announcement.id}`}
                                  >
                                    {deleteAnnouncementMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      'Delete'
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowDeleteConfirm(null)}
                                    data-testid={`button-cancel-delete-${announcement.id}`}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setShowDeleteConfirm(announcement.id)}
                                  data-testid={`button-delete-${announcement.id}`}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Lightbulb className="h-8 w-8 mb-2 opacity-50" />
                    <p>No announcements created yet</p>
                    <p className="text-xs">Create your first announcement above</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Contact Messages */}
        <Card data-testid="contact-messages-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Messages
            </CardTitle>
            <CardDescription>
              Recent messages from the contact form
            </CardDescription>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contactMessages && contactMessages.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {contactMessages.slice(0, 5).map((msg) => (
                    <div key={msg.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{msg.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.createdAt), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{msg.email}</p>
                      <p className="text-sm font-medium mt-1">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No contact messages
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Email Sender */}
        <Card data-testid="send-email-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Admin Email
            </CardTitle>
            <CardDescription>
              Send individual or bulk emails to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={!isBulkEmail ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsBulkEmail(false)}
                  data-testid="button-individual-email"
                >
                  Individual
                </Button>
                <Button
                  variant={isBulkEmail ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsBulkEmail(true)}
                  data-testid="button-bulk-email"
                >
                  Bulk Send
                </Button>
              </div>
              
              {isBulkEmail ? (
                <Select value={emailSegment} onValueChange={setEmailSegment}>
                  <SelectTrigger data-testid="select-email-segment">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="starter">Starter Users</SelectItem>
                    <SelectItem value="pro">Pro Users</SelectItem>
                    <SelectItem value="scale">Scale Users</SelectItem>
                    <SelectItem value="paid">All Paid Users</SelectItem>
                    <SelectItem value="approaching-limits">Approaching Usage Limits (80%+)</SelectItem>
                    <SelectItem value="inactive">Inactive Users (14+ days)</SelectItem>
                    <SelectItem value="power-users">Power Users (50+ grades/month)</SelectItem>
                    <SelectItem value="at-risk">At-Risk (Churn Signals)</SelectItem>
                    <SelectItem value="high-graders">Active Graders (10+ this week)</SelectItem>
                    <SelectItem value="high-rewriters">Active Rewriters (10+ this week)</SelectItem>
                    <SelectItem value="esp-connected">ESP Connected Users</SelectItem>
                    <SelectItem value="new-signups">New Signups (7 days)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Popover open={userSelectorOpen} onOpenChange={setUserSelectorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userSelectorOpen}
                        className="flex-1 justify-between"
                        data-testid="button-user-selector"
                      >
                        {emailSelectedUserId && users ? (
                          (() => {
                            const user = users.find(u => u.id === emailSelectedUserId);
                            return user ? (
                              <span className="truncate">
                                {user.firstName || user.lastName 
                                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                  : user.email}
                              </span>
                            ) : 'Select user...';
                          })()
                        ) : (
                          <span className="text-muted-foreground">Select user...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search users by name or email..." data-testid="input-user-search" />
                        <CommandList>
                          <CommandEmpty>No users found.</CommandEmpty>
                          <CommandGroup>
                            {users?.filter(u => u.email && u.role !== 'admin').map((user) => (
                              <CommandItem
                                key={user.id}
                                value={`${user.firstName || ''} ${user.lastName || ''} ${user.email}`.toLowerCase()}
                                onSelect={() => {
                                  setEmailSelectedUserId(user.id);
                                  setEmailRecipient(user.email || '');
                                  setUserSelectorOpen(false);
                                }}
                                data-testid={`user-option-${user.id}`}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${emailSelectedUserId === user.id ? 'opacity-100' : 'opacity-0'}`}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {user.firstName || user.lastName 
                                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                      : user.email}
                                  </span>
                                  {(user.firstName || user.lastName) && (
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                  )}
                                </div>
                                <Badge variant="outline" className="ml-auto text-xs">
                                  {user.subscriptionTier || 'starter'}
                                </Badge>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    placeholder="Or type email manually"
                    value={emailRecipient}
                    onChange={(e) => {
                      setEmailRecipient(e.target.value);
                      setEmailSelectedUserId(null);
                    }}
                    className="flex-1"
                    data-testid="input-recipient-email"
                  />
                </div>
              )}
              
              <Input
                placeholder="Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                data-testid="input-email-subject"
              />
              
              <Textarea
                placeholder="Email body (HTML supported)"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={4}
                data-testid="input-email-body"
              />
              
              <Button
                className="w-full"
                onClick={() => {
                  sendEmailMutation.mutate({
                    recipientEmail: isBulkEmail ? undefined : emailRecipient,
                    subject: emailSubject,
                    body: emailBody,
                    segment: isBulkEmail ? emailSegment : undefined,
                    isBulk: isBulkEmail,
                  });
                }}
                disabled={sendEmailMutation.isPending || !emailSubject || !emailBody || (!isBulkEmail && !emailRecipient)}
                data-testid="button-send-email"
              >
                {sendEmailMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                {isBulkEmail ? 'Send Bulk Email' : 'Send Email'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email History */}
        <Card data-testid="email-history-card" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Email History
            </CardTitle>
            <CardDescription>
              Recently sent admin emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : adminEmails && adminEmails.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminEmails.slice(0, 10).map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium text-sm">
                          {email.emailType === 'bulk' ? (
                            <Badge variant="secondary" className="capitalize">{email.segment || 'All'}</Badge>
                          ) : (
                            <span className="truncate max-w-[150px] block">{email.recipientEmail}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]">{email.subject}</TableCell>
                        <TableCell>
                          <Badge variant={email.emailType === 'bulk' ? 'default' : 'outline'} className="text-xs">
                            {email.emailType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(email.sentAt), 'MMM d, h:mm a')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No emails sent yet
              </div>
            )}
          </CardContent>
              </Card>
            </div>
            </>
          )}

          {/* Resources Section */}
          {activeSection === 'resources' && (
            <ResourcesSection />
          )}

        </div>
      </SidebarInset>
    </SidebarProvider>

    {/* View Notes Dialog */}
    <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
            <DialogDescription>
              Notes for {selectedUser?.email || 'user'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            {notesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : userNotes && userNotes.length > 0 ? (
              <div className="space-y-3">
                {userNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm">{note.note}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No notes yet</p>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowNotesDialog(false);
              setShowAddNoteDialog(true);
            }}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
            <DialogDescription>
              Add a note for {selectedUser?.email || 'user'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter your note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
            data-testid="input-admin-note"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddNoteDialog(false);
              setNewNote("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedUser && newNote.trim()) {
                  addNoteMutation.mutate({ userId: selectedUser.id, note: newNote });
                }
              }}
              disabled={!newNote.trim() || addNoteMutation.isPending}
              data-testid="button-save-note"
            >
              {addNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Link Dialog */}
      <Dialog open={showResetLinkDialog} onOpenChange={setShowResetLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Password Reset Link Generated</DialogTitle>
            <DialogDescription>
              Share this link with the user to reset their password
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-muted/50 break-all text-sm">
            {resetLink}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetLinkDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              navigator.clipboard.writeText(resetLink);
              toast({ title: "Copied", description: "Link copied to clipboard" });
            }}>
              Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUserId}
        isOpen={isUserDetailOpen}
        onClose={() => {
          setIsUserDetailOpen(false);
          setSelectedUserId(null);
        }}
      />
    </>
  );
}
