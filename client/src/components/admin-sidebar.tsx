import { 
  Users, 
  LayoutDashboard,
  BarChart3,
  DollarSign,
  FileText,
  Settings,
  Mail,
  AlertTriangle,
  TrendingUp,
  Target,
  Activity,
  Link2,
  Heart,
  Megaphone,
  ChevronDown,
  Shield,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Logo } from './icons/Logo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

export type AdminSection = 
  | 'overview'
  | 'at-risk'
  | 'users'
  | 'business-metrics'
  | 'charts'
  | 'feature-adoption'
  | 'revenue-analytics'
  | 'conversion-funnel'
  | 'content-intelligence'
  | 'quality-metrics'
  | 'esp-metrics'
  | 'system-health'
  | 'website-analytics'
  | 'communications';

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  atRiskCount?: number;
}

export function AdminSidebar({ 
  activeSection, 
  onSectionChange,
  atRiskCount = 0,
}: AdminSidebarProps) {
  const handleSectionClick = (section: AdminSection) => {
    onSectionChange(section);
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar/80 backdrop-blur-sm">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-[2px] shadow-lg shadow-purple-500/20">
            <div className="w-full h-full rounded-[10px] bg-sidebar flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Admin</h1>
            <p className="text-xs text-muted-foreground">Control Center</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        {/* Overview Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'overview'}
                  onClick={() => handleSectionClick('overview')}
                  className={`group transition-all duration-200 ${activeSection === 'overview' ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/20' : ''}`}
                  data-testid="admin-nav-overview"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'overview' ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'at-risk'}
                  onClick={() => handleSectionClick('at-risk')}
                  className={`group transition-all duration-200 ${activeSection === 'at-risk' ? 'bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/20' : ''}`}
                  data-testid="admin-nav-at-risk"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'at-risk' ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-md shadow-orange-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="font-medium">At-Risk Users</span>
                  {atRiskCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                      {atRiskCount}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Users Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            Users
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'users'}
                  onClick={() => handleSectionClick('users')}
                  className={`group transition-all duration-200 ${activeSection === 'users' ? 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-500/20' : ''}`}
                  data-testid="admin-nav-users"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'users' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-medium">User Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            Analytics
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'business-metrics'}
                  onClick={() => handleSectionClick('business-metrics')}
                  className={`group transition-all duration-200 ${activeSection === 'business-metrics' ? 'bg-gradient-to-r from-green-500/15 to-emerald-500/15 border border-green-500/20' : ''}`}
                  data-testid="admin-nav-business-metrics"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'business-metrics' ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-md shadow-green-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Business Metrics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'charts'}
                  onClick={() => handleSectionClick('charts')}
                  className={`group transition-all duration-200 ${activeSection === 'charts' ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/15 border border-indigo-500/20' : ''}`}
                  data-testid="admin-nav-charts"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'charts' ? 'bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Growth Charts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'feature-adoption'}
                  onClick={() => handleSectionClick('feature-adoption')}
                  className={`group transition-all duration-200 ${activeSection === 'feature-adoption' ? 'bg-gradient-to-r from-cyan-500/15 to-sky-500/15 border border-cyan-500/20' : ''}`}
                  data-testid="admin-nav-feature-adoption"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'feature-adoption' ? 'bg-gradient-to-br from-cyan-500 to-sky-500 shadow-md shadow-cyan-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Feature Adoption</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Revenue Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            Revenue
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'revenue-analytics'}
                  onClick={() => handleSectionClick('revenue-analytics')}
                  className={`group transition-all duration-200 ${activeSection === 'revenue-analytics' ? 'bg-gradient-to-r from-yellow-500/15 to-amber-500/15 border border-yellow-500/20' : ''}`}
                  data-testid="admin-nav-revenue"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'revenue-analytics' ? 'bg-gradient-to-br from-yellow-500 to-amber-500 shadow-md shadow-yellow-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Revenue Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'conversion-funnel'}
                  onClick={() => handleSectionClick('conversion-funnel')}
                  className={`group transition-all duration-200 ${activeSection === 'conversion-funnel' ? 'bg-gradient-to-r from-rose-500/15 to-pink-500/15 border border-rose-500/20' : ''}`}
                  data-testid="admin-nav-conversion"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'conversion-funnel' ? 'bg-gradient-to-br from-rose-500 to-pink-500 shadow-md shadow-rose-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Conversion Funnel</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Content Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            Content
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'content-intelligence'}
                  onClick={() => handleSectionClick('content-intelligence')}
                  className={`group transition-all duration-200 ${activeSection === 'content-intelligence' ? 'bg-gradient-to-r from-fuchsia-500/15 to-purple-500/15 border border-fuchsia-500/20' : ''}`}
                  data-testid="admin-nav-content"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'content-intelligence' ? 'bg-gradient-to-br from-fuchsia-500 to-purple-500 shadow-md shadow-fuchsia-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Content Intelligence</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'quality-metrics'}
                  onClick={() => handleSectionClick('quality-metrics')}
                  className={`group transition-all duration-200 ${activeSection === 'quality-metrics' ? 'bg-gradient-to-r from-teal-500/15 to-emerald-500/15 border border-teal-500/20' : ''}`}
                  data-testid="admin-nav-quality"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'quality-metrics' ? 'bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <Heart className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Quality Metrics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'esp-metrics'}
                  onClick={() => handleSectionClick('esp-metrics')}
                  className={`group transition-all duration-200 ${activeSection === 'esp-metrics' ? 'bg-gradient-to-r from-lime-500/15 to-green-500/15 border border-lime-500/20' : ''}`}
                  data-testid="admin-nav-esp"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'esp-metrics' ? 'bg-gradient-to-br from-lime-500 to-green-500 shadow-md shadow-lime-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <Link2 className="w-4 h-4" />
                  </div>
                  <span className="font-medium">ESP Metrics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'system-health'}
                  onClick={() => handleSectionClick('system-health')}
                  className={`group transition-all duration-200 ${activeSection === 'system-health' ? 'bg-gradient-to-r from-slate-500/15 to-gray-500/15 border border-slate-500/20' : ''}`}
                  data-testid="admin-nav-health"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'system-health' ? 'bg-gradient-to-br from-slate-500 to-gray-500 shadow-md shadow-slate-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="font-medium">System Health</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'website-analytics'}
                  onClick={() => handleSectionClick('website-analytics')}
                  className={`group transition-all duration-200 ${activeSection === 'website-analytics' ? 'bg-gradient-to-r from-orange-500/15 to-yellow-500/15 border border-orange-500/20' : ''}`}
                  data-testid="admin-nav-website"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'website-analytics' ? 'bg-gradient-to-br from-orange-500 to-yellow-500 shadow-md shadow-orange-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Website Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Communications Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            Communications
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeSection === 'communications'}
                  onClick={() => handleSectionClick('communications')}
                  className={`group transition-all duration-200 ${activeSection === 'communications' ? 'bg-gradient-to-r from-violet-500/15 to-indigo-500/15 border border-violet-500/20' : ''}`}
                  data-testid="admin-nav-communications"
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeSection === 'communications' ? 'bg-gradient-to-br from-violet-500 to-indigo-500 shadow-md shadow-violet-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Emails & Announcements</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <div className="text-xs text-muted-foreground text-center">
          Admin Control Center
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
