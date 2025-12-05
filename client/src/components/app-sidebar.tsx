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
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/use-gamification';

type ActiveView = 'grader' | 'history' | 'academy' | 'tools';
type ToolsSubView = 'rewrite' | 'followup' | 'variations' | 'tone' | null;

interface AppSidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenAcademy: () => void;
  toolsSubView: ToolsSubView;
  setToolsSubView: (view: ToolsSubView) => void;
}

export function AppSidebar({ 
  activeView, 
  setActiveView, 
  onOpenAcademy,
  toolsSubView,
  setToolsSubView
}: AppSidebarProps) {
  const [toolsOpen, setToolsOpen] = useState(true);
  const { xp, level, streak, nextLevelXp, achievements } = useGamification();
  
  const xpProgress = (xp / nextLevelXp) * 100;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
            <div className="w-full h-full rounded-[10px] bg-sidebar flex items-center justify-center">
              <Logo />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Acceptafy</h1>
            <p className="text-xs text-muted-foreground">Email Mastery</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 px-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeView === 'grader'}
                  onClick={() => {
                    setActiveView('grader');
                    setToolsSubView(null);
                  }}
                  className="group"
                  data-testid="nav-grader"
                >
                  <div className={`p-1.5 rounded-lg transition-all ${activeView === 'grader' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-sidebar-accent group-hover:bg-sidebar-accent/80'}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>Email Grader</span>
                  <Sparkles className={`w-3 h-3 ml-auto transition-opacity ${activeView === 'grader' ? 'opacity-100 text-yellow-400' : 'opacity-0'}`} />
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible open={toolsOpen} onOpenChange={setToolsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="group" data-testid="nav-tools">
                      <div className={`p-1.5 rounded-lg transition-all ${activeView === 'tools' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-sidebar-accent group-hover:bg-sidebar-accent/80'}`}>
                        <Wand2 className="w-4 h-4" />
                      </div>
                      <span>AI Tools</span>
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
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
                  }}
                  className="group"
                  data-testid="nav-history"
                >
                  <div className={`p-1.5 rounded-lg transition-all ${activeView === 'history' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-sidebar-accent group-hover:bg-sidebar-accent/80'}`}>
                    <History className="w-4 h-4" />
                  </div>
                  <span>History</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={onOpenAcademy}
                  className="group"
                  data-testid="nav-academy"
                >
                  <div className="p-1.5 rounded-lg transition-all bg-sidebar-accent group-hover:bg-sidebar-accent/80">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span>Academy</span>
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full">
                    NEW
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 px-2">
            Achievements
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="px-2 py-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-sidebar-foreground">{unlockedAchievements}/{achievements.length} Badges</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {achievements.slice(0, 4).map((achievement, i) => {
                      const IconComponent = iconMap[achievement.icon] || Target;
                      return (
                        <div 
                          key={i}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            achievement.unlocked 
                              ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white' 
                              : 'bg-sidebar-accent text-muted-foreground'
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

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {level}
              </div>
              <div>
                <p className="text-xs font-medium text-sidebar-foreground">Level {level}</p>
                <p className="text-[10px] text-muted-foreground">{xp}/{nextLevelXp} XP</p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
              <Flame className={`w-3 h-3 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-bold ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                {streak}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={xpProgress} className="h-1.5 bg-sidebar-accent" />
            <p className="text-[10px] text-muted-foreground text-center">
              {nextLevelXp - xp} XP to next level
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
