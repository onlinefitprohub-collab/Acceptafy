import { useState } from 'react';
import { 
  Mail, 
  History, 
  GraduationCap, 
  Wand2, 
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
  Calendar,
  BadgeCheck,
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

type ActiveView = 'dashboard' | 'grader' | 'history' | 'academy' | 'tools' | 'deliverability' | 'integrations' | 'account';
type ToolsSubView = 'rewrite' | 'followup' | 'variations' | 'tone' | 'preview' | 'spam' | 'sentiment' | 'templates' | 'import' | 'competitor' | 'sendtime' | 'builder' | null;
type DeliverabilitySubView = 'dns' | 'domain-health' | 'list-quality' | 'bimi' | 'warmup' | 'sender-score' | null;
type IntegrationsSubView = 'esp' | 'stats' | null;

interface AppSidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenAcademy: () => void;
  toolsSubView: ToolsSubView;
  setToolsSubView: (view: ToolsSubView) => void;
  deliverabilitySubView: DeliverabilitySubView;
  setDeliverabilitySubView: (view: DeliverabilitySubView) => void;
  integrationsSubView: IntegrationsSubView;
  setIntegrationsSubView: (view: IntegrationsSubView) => void;
}

export function AppSidebar({ 
  activeView, 
  setActiveView, 
  onOpenAcademy,
  toolsSubView,
  setToolsSubView,
  deliverabilitySubView,
  setDeliverabilitySubView,
  integrationsSubView,
  setIntegrationsSubView
}: AppSidebarProps) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [deliverabilityOpen, setDeliverabilityOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const { xp, level, streak, nextLevelXp, achievements } = useGamification();
  
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <SidebarMenuButton 
                        className="group transition-all duration-200 cursor-not-allowed opacity-60 w-full"
                        data-testid="nav-dashboard"
                      >
                        <div className="p-1.5 rounded-lg transition-all duration-200 bg-sidebar-accent/80">
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Dashboard</span>
                      </SidebarMenuButton>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Coming Soon</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeView === 'grader'}
                  onClick={() => {
                    setActiveView('grader');
                    setToolsSubView(null);
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
              </SidebarMenuItem>

              <Collapsible open={toolsOpen} onOpenChange={setToolsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`group transition-all duration-200 ${activeView === 'tools' ? 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-500/20' : ''}`} data-testid="nav-tools">
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeView === 'tools' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                        <Wand2 className="w-4 h-4" />
                      </div>
                      <span className="font-medium">AI Tools</span>
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${toolsOpen ? 'rotate-180' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'rewrite'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('rewrite');
                          }}
                          data-testid="nav-tools-rewrite"
                        >
                          <Zap className="w-3 h-3" />
                          <span>AI Rewrite</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'followup'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('followup');
                          }}
                          data-testid="nav-tools-followup"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Follow-ups</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'variations'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('variations');
                          }}
                          data-testid="nav-tools-variations"
                        >
                          <Target className="w-3 h-3" />
                          <span>A/B Subject Lab</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'tone'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('tone');
                          }}
                          data-testid="nav-tools-tone"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Tone Profiles</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'preview'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('preview');
                          }}
                          data-testid="nav-tools-preview"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Email Preview</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'spam'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('spam');
                          }}
                          data-testid="nav-tools-spam"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Spam Checker</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'sentiment'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('sentiment');
                          }}
                          data-testid="nav-tools-sentiment"
                        >
                          <Heart className="w-3 h-3" />
                          <span>Sentiment</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'templates'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('templates');
                          }}
                          data-testid="nav-tools-templates"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Templates</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'import'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('import');
                          }}
                          data-testid="nav-tools-import"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Import Email</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'competitor'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('competitor');
                          }}
                          data-testid="nav-tools-competitor"
                        >
                          <UsersIcon className="w-3 h-3" />
                          <span>Competitor Analysis</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'sendtime'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('sendtime');
                          }}
                          data-testid="nav-tools-sendtime"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Send Time Optimizer</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={toolsSubView === 'builder'}
                          onClick={() => {
                            setActiveView('tools');
                            setToolsSubView('builder');
                          }}
                          data-testid="nav-tools-builder"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email Builder</span>
                        </SidebarMenuSubButton>
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
                        <SidebarMenuSubButton 
                          isActive={deliverabilitySubView === 'warmup'}
                          onClick={() => {
                            setActiveView('deliverability');
                            setDeliverabilitySubView('warmup');
                            setToolsSubView(null);
                          }}
                          data-testid="nav-deliverability-warmup"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Warm-up Planner</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={deliverabilitySubView === 'dns'}
                          onClick={() => {
                            setActiveView('deliverability');
                            setDeliverabilitySubView('dns');
                            setToolsSubView(null);
                          }}
                          data-testid="nav-deliverability-dns"
                        >
                          <Globe className="w-3 h-3" />
                          <span>DNS Records</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={deliverabilitySubView === 'domain-health'}
                          onClick={() => {
                            setActiveView('deliverability');
                            setDeliverabilitySubView('domain-health');
                            setToolsSubView(null);
                          }}
                          data-testid="nav-deliverability-domain"
                        >
                          <Shield className="w-3 h-3" />
                          <span>Domain Health</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={deliverabilitySubView === 'list-quality'}
                          onClick={() => {
                            setActiveView('deliverability');
                            setDeliverabilitySubView('list-quality');
                            setToolsSubView(null);
                          }}
                          data-testid="nav-deliverability-list"
                        >
                          <Users className="w-3 h-3" />
                          <span>List Quality</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={deliverabilitySubView === 'bimi'}
                          onClick={() => {
                            setActiveView('deliverability');
                            setDeliverabilitySubView('bimi');
                            setToolsSubView(null);
                          }}
                          data-testid="nav-deliverability-bimi"
                        >
                          <BadgeCheck className="w-3 h-3" />
                          <span>BIMI Builder</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={deliverabilitySubView === 'sender-score'}
                          onClick={() => {
                            setActiveView('deliverability');
                            setDeliverabilitySubView('sender-score');
                            setToolsSubView(null);
                          }}
                          data-testid="nav-deliverability-sender-score"
                        >
                          <Gauge className="w-3 h-3" />
                          <span>Sender Score</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible open={integrationsOpen} onOpenChange={setIntegrationsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`group transition-all duration-200 ${activeView === 'integrations' ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/20' : ''}`} data-testid="nav-integrations">
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeView === 'integrations' ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/30' : 'bg-sidebar-accent/80 group-hover:bg-sidebar-accent'}`}>
                        <Link2 className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Integrations</span>
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${integrationsOpen ? 'rotate-180' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={integrationsSubView === 'esp'}
                          onClick={() => {
                            setActiveView('integrations');
                            setIntegrationsSubView('esp');
                            setToolsSubView(null);
                            setDeliverabilitySubView(null);
                          }}
                          data-testid="nav-integrations-esp"
                        >
                          <Mail className="w-3 h-3" />
                          <span>ESP Settings</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          isActive={integrationsSubView === 'stats'}
                          onClick={() => {
                            setActiveView('integrations');
                            setIntegrationsSubView('stats');
                            setToolsSubView(null);
                            setDeliverabilitySubView(null);
                          }}
                          data-testid="nav-integrations-stats"
                        >
                          <BarChart3 className="w-3 h-3" />
                          <span>Campaign Stats</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeView === 'history'}
                  onClick={() => {
                    setActiveView('history');
                    setToolsSubView(null);
                    setDeliverabilitySubView(null);
                    setIntegrationsSubView(null);
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
              </SidebarMenuItem>

              <SidebarMenuItem>
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
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Tooltip>
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

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            Achievements
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
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
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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
                  setToolsSubView(null);
                  setDeliverabilitySubView(null);
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
