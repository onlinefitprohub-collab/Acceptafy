import { useState, useEffect } from 'react';
import { 
  Mail, 
  History, 
  GraduationCap, 
  PenTool,
  Target, 
  Zap,
  Trophy,
  Flame,
  Star,
  ChevronDown,
  Sparkles,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Users,
  BadgeCheck,
  Calendar,
  Heart,
  LayoutDashboard,
  Gauge,
  Settings,
  ChevronRight,
  FileText,
  Upload,
  Users as UsersIcon,
  Link2,
  BarChart3,
  Gift,
  Clock,
  Activity,
  FlaskConical,
  type LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  target: Target,
  star: Star,
  trophy: Trophy,
  shield: Shield,
  sparkles: Sparkles,
  flame: Flame,
  zap: Zap,
  mail: Mail,
};
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/use-gamification';

type ActiveView = 'dashboard' | 'grader' | 'history' | 'academy' | 'create' | 'optimize' | 'analytics' | 'deliverability' | 'connections' | 'account';
type CreateSubView = 'builder' | 'rewrite' | 'followup' | 'templates' | 'tone' | 'import' | null;
type OptimizeSubView = 'variations' | 'preview' | 'spam' | 'sentiment' | 'sendtime' | 'competitor' | null;
type AnalyticsSubView = 'stats' | 'funnel' | 'intelligence' | null;
type DeliverabilitySubView = 'dns' | 'domain-health' | 'list-quality' | 'bimi' | 'warmup' | 'sender-score' | 'blacklist' | 'campaign-risk' | null;
type ConnectionsSubView = 'esp' | 'contact-export' | null;

interface AppSidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenAcademy: () => void;
  createSubView: CreateSubView;
  setCreateSubView: (view: CreateSubView) => void;
  optimizeSubView: OptimizeSubView;
  setOptimizeSubView: (view: OptimizeSubView) => void;
  analyticsSubView: AnalyticsSubView;
  setAnalyticsSubView: (view: AnalyticsSubView) => void;
  deliverabilitySubView: DeliverabilitySubView;
  setDeliverabilitySubView: (view: DeliverabilitySubView) => void;
  connectionsSubView: ConnectionsSubView;
  setConnectionsSubView: (view: ConnectionsSubView) => void;
  clearAllSubViews: () => void;
}

export function AppSidebar({ 
  activeView, 
  setActiveView, 
  onOpenAcademy,
  createSubView,
  setCreateSubView,
  optimizeSubView,
  setOptimizeSubView,
  analyticsSubView,
  setAnalyticsSubView,
  deliverabilitySubView,
  setDeliverabilitySubView,
  connectionsSubView,
  setConnectionsSubView,
  clearAllSubViews
}: AppSidebarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [deliverabilityOpen, setDeliverabilityOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const { xp, level, streak, nextLevelXp, achievements } = useGamification();

  useEffect(() => {
    if (activeView === 'create' || createSubView) setCreateOpen(true);
    if (activeView === 'optimize' || optimizeSubView) setOptimizeOpen(true);
    if (activeView === 'analytics' || analyticsSubView) setAnalyticsOpen(true);
    if (activeView === 'deliverability' || deliverabilitySubView) setDeliverabilityOpen(true);
    if (activeView === 'connections' || connectionsSubView) setConnectionsOpen(true);
  }, [activeView, createSubView, optimizeSubView, analyticsSubView, deliverabilitySubView, connectionsSubView]);
  
  const xpProgress = (xp / nextLevelXp) * 100;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar/80 backdrop-blur-sm">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-[2px] shadow-lg shadow-purple-500/20">
            <div className="w-full h-full rounded-[10px] bg-sidebar flex items-center justify-center">
              <Logo />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Acceptafy</h1>
            <p className="text-xs text-muted-foreground">Email Mastery Suite</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton 
                      isActive={activeView === 'dashboard'}
                      onClick={() => {
                        setActiveView('dashboard');
                        clearAllSubViews();
                      }}
                      className={`group transition-all duration-200 ${activeView === 'dashboard' ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/20' : ''}`}
                      data-testid="nav-dashboard"
                    >
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeView === 'dashboard' ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Dashboard</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>View your email performance overview</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton 
                      isActive={activeView === 'grader'}
                      onClick={() => {
                        setActiveView('grader');
                        clearAllSubViews();
                      }}
                      className={`group transition-all duration-200 ${activeView === 'grader' ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/20' : ''}`}
                      data-testid="nav-grader"
                    >
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeView === 'grader' ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-pink-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Email Grader</span>
                      <ChevronRight className={`w-4 h-4 ml-auto transition-all duration-200 ${activeView === 'grader' ? 'opacity-100 text-pink-400' : 'opacity-0 -translate-x-2'}`} />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Grade your emails for deliverability</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>

              <Collapsible open={createOpen} onOpenChange={setCreateOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`group transition-all duration-200 ${activeView === 'create' ? 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-500/20' : ''}`} data-testid="nav-create">
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeView === 'create' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                        <PenTool className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Create</span>
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${createOpen ? 'rotate-180' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={createSubView === 'builder'}
                              onClick={() => {
                                setActiveView('create');
                                clearAllSubViews();
                                setCreateSubView('builder');
                              }}
                              data-testid="nav-create-builder"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Email Builder</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Create emails with a rich text editor</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={createSubView === 'rewrite'}
                              onClick={() => {
                                setActiveView('create');
                                clearAllSubViews();
                                setCreateSubView('rewrite');
                              }}
                              data-testid="nav-create-rewrite"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Rewrite</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Improve your email with smart suggestions</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={createSubView === 'followup'}
                              onClick={() => {
                                setActiveView('create');
                                clearAllSubViews();
                                setCreateSubView('followup');
                              }}
                              data-testid="nav-create-followup"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Follow-ups</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Generate follow-up email sequences</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={createSubView === 'templates'}
                              onClick={() => {
                                setActiveView('create');
                                clearAllSubViews();
                                setCreateSubView('templates');
                              }}
                              data-testid="nav-create-templates"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Templates</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Save and reuse your best email templates</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={createSubView === 'tone'}
                              onClick={() => {
                                setActiveView('create');
                                clearAllSubViews();
                                setCreateSubView('tone');
                              }}
                              data-testid="nav-create-tone"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Tone Profiles</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Define your brand voice for consistent messaging</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={createSubView === 'import'}
                              onClick={() => {
                                setActiveView('create');
                                clearAllSubViews();
                                setCreateSubView('import');
                              }}
                              data-testid="nav-create-import"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Import Email</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Import HTML emails for analysis</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible open={optimizeOpen} onOpenChange={setOptimizeOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`group transition-all duration-200 ${activeView === 'optimize' ? 'bg-gradient-to-r from-violet-500/15 to-purple-500/15 border border-violet-500/20' : ''}`} data-testid="nav-optimize">
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeView === 'optimize' ? 'bg-gradient-to-br from-violet-500 to-purple-500 shadow-md shadow-violet-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Optimize</span>
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${optimizeOpen ? 'rotate-180' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={optimizeSubView === 'variations'}
                              onClick={() => {
                                setActiveView('optimize');
                                clearAllSubViews();
                                setOptimizeSubView('variations');
                              }}
                              data-testid="nav-optimize-variations"
                            >
                              <Target className="w-3 h-3" />
                              <span>A/B Subject Lab</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Test and compare subject line variations</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={optimizeSubView === 'preview'}
                              onClick={() => {
                                setActiveView('optimize');
                                clearAllSubViews();
                                setOptimizeSubView('preview');
                              }}
                              data-testid="nav-optimize-preview"
                            >
                              <Globe className="w-3 h-3" />
                              <span>Email Preview</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>See how your email looks in different clients</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={optimizeSubView === 'spam'}
                              onClick={() => {
                                setActiveView('optimize');
                                clearAllSubViews();
                                setOptimizeSubView('spam');
                              }}
                              data-testid="nav-optimize-spam"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>Spam Checker</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Identify spam triggers before sending</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={optimizeSubView === 'sentiment'}
                              onClick={() => {
                                setActiveView('optimize');
                                clearAllSubViews();
                                setOptimizeSubView('sentiment');
                              }}
                              data-testid="nav-optimize-sentiment"
                            >
                              <Heart className="w-3 h-3" />
                              <span>Sentiment</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Analyze the emotional tone of your email</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={optimizeSubView === 'sendtime'}
                              onClick={() => {
                                setActiveView('optimize');
                                clearAllSubViews();
                                setOptimizeSubView('sendtime');
                              }}
                              data-testid="nav-optimize-sendtime"
                            >
                              <Clock className="w-3 h-3" />
                              <span>Send Time</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Find the optimal time to send your emails</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={optimizeSubView === 'competitor'}
                              onClick={() => {
                                setActiveView('optimize');
                                clearAllSubViews();
                                setOptimizeSubView('competitor');
                              }}
                              data-testid="nav-optimize-competitor"
                            >
                              <UsersIcon className="w-3 h-3" />
                              <span>Competitor Analysis</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Compare your emails to industry competitors</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`group transition-all duration-200 ${activeView === 'analytics' ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/20' : ''}`} data-testid="nav-analytics">
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeView === 'analytics' ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Analytics</span>
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${analyticsOpen ? 'rotate-180' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={analyticsSubView === 'stats'}
                              onClick={() => {
                                setActiveView('analytics');
                                clearAllSubViews();
                                setAnalyticsSubView('stats');
                              }}
                              data-testid="nav-analytics-stats"
                            >
                              <BarChart3 className="w-3 h-3" />
                              <span>Campaign Stats</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>View detailed campaign performance metrics</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={analyticsSubView === 'funnel'}
                              onClick={() => {
                                setActiveView('analytics');
                                clearAllSubViews();
                                setAnalyticsSubView('funnel');
                              }}
                              data-testid="nav-analytics-funnel"
                            >
                              <Activity className="w-3 h-3" />
                              <span>Campaign Funnel</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Visualize your email conversion funnel</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={analyticsSubView === 'intelligence'}
                              onClick={() => {
                                setActiveView('analytics');
                                clearAllSubViews();
                                setAnalyticsSubView('intelligence');
                              }}
                              data-testid="nav-analytics-intelligence"
                            >
                              <Activity className="w-3 h-3" />
                              <span>Trend Intelligence</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Track deliverability trends over time</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible open={deliverabilityOpen} onOpenChange={setDeliverabilityOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`group transition-all duration-200 ${activeView === 'deliverability' ? 'bg-gradient-to-r from-green-500/15 to-teal-500/15 border border-green-500/20' : ''}`} data-testid="nav-deliverability">
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeView === 'deliverability' ? 'bg-gradient-to-br from-green-500 to-teal-500 shadow-md shadow-green-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Deliverability</span>
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${deliverabilityOpen ? 'rotate-180' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={deliverabilitySubView === 'dns'}
                              onClick={() => {
                                setActiveView('deliverability');
                                clearAllSubViews();
                                setDeliverabilitySubView('dns');
                              }}
                              data-testid="nav-deliverability-dns"
                            >
                              <Globe className="w-3 h-3" />
                              <span>DNS Records</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Generate SPF, DKIM, and DMARC records</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={deliverabilitySubView === 'domain-health'}
                              onClick={() => {
                                setActiveView('deliverability');
                                clearAllSubViews();
                                setDeliverabilitySubView('domain-health');
                              }}
                              data-testid="nav-deliverability-domain"
                            >
                              <Shield className="w-3 h-3" />
                              <span>Domain Health</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Check your domain reputation and setup</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={deliverabilitySubView === 'bimi'}
                              onClick={() => {
                                setActiveView('deliverability');
                                clearAllSubViews();
                                setDeliverabilitySubView('bimi');
                              }}
                              data-testid="nav-deliverability-bimi"
                            >
                              <BadgeCheck className="w-3 h-3" />
                              <span>BIMI Builder</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Create brand logo indicators for email</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={deliverabilitySubView === 'warmup'}
                              onClick={() => {
                                setActiveView('deliverability');
                                clearAllSubViews();
                                setDeliverabilitySubView('warmup');
                              }}
                              data-testid="nav-deliverability-warmup"
                            >
                              <Calendar className="w-3 h-3" />
                              <span>Warm-up Planner</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Plan gradual sending volume increases</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={deliverabilitySubView === 'sender-score'}
                              onClick={() => {
                                setActiveView('deliverability');
                                clearAllSubViews();
                                setDeliverabilitySubView('sender-score');
                              }}
                              data-testid="nav-deliverability-sender-score"
                            >
                              <Gauge className="w-3 h-3" />
                              <span>Sender Score</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Monitor your sender reputation score</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={deliverabilitySubView === 'list-quality'}
                              onClick={() => {
                                setActiveView('deliverability');
                                clearAllSubViews();
                                setDeliverabilitySubView('list-quality');
                              }}
                              data-testid="nav-deliverability-list"
                            >
                              <Users className="w-3 h-3" />
                              <span>List Quality</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Analyze and clean your email lists</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={deliverabilitySubView === 'blacklist'}
                              onClick={() => {
                                setActiveView('deliverability');
                                clearAllSubViews();
                                setDeliverabilitySubView('blacklist');
                              }}
                              data-testid="nav-deliverability-blacklist"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>Blacklist Monitor</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Check if your domain is on blocklists</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={deliverabilitySubView === 'campaign-risk'}
                              onClick={() => {
                                setActiveView('deliverability');
                                clearAllSubViews();
                                setDeliverabilitySubView('campaign-risk');
                              }}
                              data-testid="nav-deliverability-campaign-risk"
                            >
                              <Target className="w-3 h-3" />
                              <span>Campaign Risk</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Assess risks before sending campaigns</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible open={connectionsOpen} onOpenChange={setConnectionsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`group transition-all duration-200 ${activeView === 'connections' ? 'bg-gradient-to-r from-rose-500/15 to-pink-500/15 border border-rose-500/20' : ''}`} data-testid="nav-connections">
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeView === 'connections' ? 'bg-gradient-to-br from-rose-500 to-pink-500 shadow-md shadow-rose-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                        <Link2 className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Connections</span>
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${connectionsOpen ? 'rotate-180' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={connectionsSubView === 'esp'}
                              onClick={() => {
                                setActiveView('connections');
                                clearAllSubViews();
                                setConnectionsSubView('esp');
                              }}
                              data-testid="nav-connections-esp"
                            >
                              <Mail className="w-3 h-3" />
                              <span>ESP Settings</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Connect SendGrid, Mailchimp, and more</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton 
                              isActive={connectionsSubView === 'contact-export'}
                              onClick={() => {
                                setActiveView('connections');
                                clearAllSubViews();
                                setConnectionsSubView('contact-export');
                              }}
                              data-testid="nav-connections-contact-export"
                            >
                              <Users className="w-3 h-3" />
                              <span>Contact Export</span>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Export and clean contact lists from ESPs</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton 
                      isActive={activeView === 'history'}
                      onClick={() => {
                        setActiveView('history');
                        clearAllSubViews();
                      }}
                      className={`group transition-all duration-200 ${activeView === 'history' ? 'bg-gradient-to-r from-emerald-500/15 to-green-500/15 border border-emerald-500/20' : ''}`}
                      data-testid="nav-history"
                    >
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeView === 'history' ? 'bg-gradient-to-br from-emerald-500 to-green-500 shadow-md shadow-emerald-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                        <History className="w-4 h-4" />
                      </div>
                      <span className="font-medium">History</span>
                      <ChevronRight className={`w-4 h-4 ml-auto transition-all duration-200 ${activeView === 'history' ? 'opacity-100 text-emerald-400' : 'opacity-0 -translate-x-2'}`} />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>View your past email analyses</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton 
                      onClick={onOpenAcademy}
                      className="group transition-all duration-200"
                      data-testid="nav-academy"
                    >
                      <div className="p-1.5 rounded-lg transition-all duration-200 bg-sidebar-accent/80 group-hover:bg-sidebar-accent">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Academy</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Learn email marketing best practices</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <SidebarMenuButton 
                        className="group transition-all duration-200 cursor-not-allowed opacity-60 w-full"
                        data-testid="nav-affiliate"
                      >
                        <div className="p-1.5 rounded-lg transition-all duration-200 bg-sidebar-accent/80">
                          <Gift className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Affiliate Program</span>
                      </SidebarMenuButton>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Coming Soon</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <div className="px-3 pb-2">
        <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
          Achievements
        </SidebarGroupLabel>
        <div className="px-3 py-3 rounded-xl bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-pink-500/10 border border-yellow-500/20 shadow-inner">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 shadow-md shadow-yellow-500/30">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">{unlockedAchievements}/{achievements.length} Badges</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {achievements.slice(0, 4).map((achievement, i) => {
              const IconComponent = iconMap[achievement.icon] || Target;
              return (
                <div 
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-md shadow-orange-500/30 scale-100' 
                      : 'bg-sidebar-accent/60 text-muted-foreground/50 scale-95'
                  }`}
                  title={achievement.title}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-500/30">
                {level}
              </div>
              <div>
                <p className="text-xs font-semibold text-sidebar-foreground">Level {level}</p>
                <p className="text-[10px] text-muted-foreground">{xp}/{nextLevelXp} XP</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-300 ${streak > 0 ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 shadow-sm shadow-orange-500/20' : 'bg-sidebar-accent/50 border border-sidebar-border/50'}`}>
              <Flame className={`w-3.5 h-3.5 transition-all duration-300 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground/50'}`} />
              <span className={`text-xs font-bold transition-all duration-300 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground/50'}`}>
                {streak}
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Progress value={xpProgress} className="h-2 bg-sidebar-accent/50" />
            <p className="text-[10px] text-muted-foreground/70 text-center">
              {nextLevelXp - xp} XP to next level
            </p>
          </div>
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === 'account'}
                onClick={() => {
                  setActiveView('account');
                  clearAllSubViews();
                }}
                className={`group transition-all duration-200 ${activeView === 'account' ? 'bg-gradient-to-r from-slate-500/15 to-slate-600/15 border border-slate-500/20' : ''}`}
                data-testid="nav-account"
              >
                <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeView === 'account' ? 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-md shadow-slate-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                  <Settings className="w-4 h-4" />
                </div>
                <span className="font-medium">Account Settings</span>
                <ChevronRight className={`w-4 h-4 ml-auto transition-all duration-200 ${activeView === 'account' ? 'opacity-100 text-slate-400' : 'opacity-0 -translate-x-2'}`} />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
