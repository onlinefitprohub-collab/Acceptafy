import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import DOMPurify from "dompurify";
import {
  User, Mail, Calendar, Trophy, Target, FileText,
  Star, Zap, TrendingUp, Clock, CheckCircle, XCircle,
  Loader2, Eye, X
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface UserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UserDetail {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    role: string;
    emailVerified: boolean;
    createdAt: string;
    lastLoginAt?: string;
    companyName?: string;
  };
  emailAnalyses: Array<{
    id: string;
    subject?: string;
    body?: string;
    score?: number;
    grade?: string;
    result?: any;
    createdAt: string;
  }>;
  gamification: {
    xp: number;
    level: number;
    streak: number;
    totalGrades: number;
    totalRewrites: number;
    bestScore: number;
    perfectScoreCount: number;
    aPlusCount: number;
  } | null;
  usage: {
    gradeCount: number;
    rewriteCount: number;
    followupCount: number;
    deliverabilityChecks: number;
    periodStart: string;
    periodEnd: string;
  } | null;
  notes: Array<{
    id: string;
    note: string;
    createdAt: string;
    createdBy: string;
  }>;
}

export function UserDetailModal({ userId, isOpen, onClose }: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [previewEmail, setPreviewEmail] = useState<{
    subject?: string;
    body?: string;
    score?: number;
    grade?: string;
    createdAt: string;
  } | null>(null);

  const { data: userDetail, isLoading } = useQuery<UserDetail>({
    queryKey: [`/api/admin/users/${userId}/detail`],
    enabled: isOpen && !!userId,
  });

  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGradeColor = (grade?: string) => {
    if (!grade) return "bg-muted";
    if (grade.startsWith("A")) return "bg-green-500";
    if (grade.startsWith("B")) return "bg-lime-500";
    if (grade.startsWith("C")) return "bg-yellow-500";
    if (grade.startsWith("D")) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "scale":
        return <Badge className="bg-purple-600">Scale</Badge>;
      case "pro":
        return <Badge className="bg-blue-600">Pro</Badge>;
      default:
        return <Badge variant="secondary">Starter</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" data-testid="user-detail-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : userDetail ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="emails" data-testid="tab-emails">
                Graded Emails ({userDetail.emailAnalyses.length})
              </TabsTrigger>
              <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
              <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] mt-4">
              <TabsContent value="overview" className="space-y-4 pr-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{userDetail.user.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium">
                          {userDetail.user.firstName || userDetail.user.lastName
                            ? `${userDetail.user.firstName || ""} ${userDetail.user.lastName || ""}`.trim()
                            : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Plan:</span>
                        <p className="mt-1">{getTierBadge(userDetail.user.subscriptionTier)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p className="mt-1">
                          {userDetail.user.subscriptionStatus === "active" ? (
                            <Badge variant="outline" className="border-green-500 text-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" /> Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500 text-red-500">
                              <XCircle className="h-3 w-3 mr-1" /> {userDetail.user.subscriptionStatus}
                            </Badge>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email Verified:</span>
                        <p className="mt-1">
                          {userDetail.user.emailVerified ? (
                            <Badge variant="outline" className="border-green-500 text-green-500">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Company:</span>
                        <p className="font-medium">{userDetail.user.companyName || "Not provided"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Joined:</span>
                        <p className="font-medium">{formatDate(userDetail.user.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Login:</span>
                        <p className="font-medium">
                          {userDetail.user.lastLoginAt
                            ? formatDistanceToNow(new Date(userDetail.user.lastLoginAt), { addSuffix: true })
                            : 'Never'}
                        </p>
                        {userDetail.user.lastLoginAt && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(userDetail.user.lastLoginAt), 'MMM d, yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {userDetail.gamification && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Gamification Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                          <Zap className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                          <p className="text-2xl font-bold">{userDetail.gamification.level}</p>
                          <p className="text-xs text-muted-foreground">Level</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10">
                          <Star className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                          <p className="text-2xl font-bold">{userDetail.gamification.xp.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">XP</p>
                        </div>
                        <div className="p-3 rounded-lg bg-orange-500/10">
                          <TrendingUp className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                          <p className="text-2xl font-bold">{userDetail.gamification.streak}</p>
                          <p className="text-xs text-muted-foreground">Day Streak</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10">
                          <Target className="h-5 w-5 mx-auto text-green-500 mb-1" />
                          <p className="text-2xl font-bold">{userDetail.gamification.bestScore}</p>
                          <p className="text-xs text-muted-foreground">Best Score</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                        <div className="text-center">
                          <p className="text-lg font-bold">{userDetail.gamification.totalGrades}</p>
                          <p className="text-muted-foreground">Total Grades</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{userDetail.gamification.perfectScoreCount}</p>
                          <p className="text-muted-foreground">Perfect Scores</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{userDetail.gamification.aPlusCount}</p>
                          <p className="text-muted-foreground">A+ Grades</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {userDetail.usage && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Current Period Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">{userDetail.usage.gradeCount}</p>
                          <p className="text-xs text-muted-foreground">Grades</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{userDetail.usage.rewriteCount}</p>
                          <p className="text-xs text-muted-foreground">Rewrites</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{userDetail.usage.followupCount}</p>
                          <p className="text-xs text-muted-foreground">Follow-ups</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{userDetail.usage.deliverabilityChecks}</p>
                          <p className="text-xs text-muted-foreground">DNS Checks</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="emails" className="space-y-3 pr-4">
                {userDetail.emailAnalyses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No graded emails yet</p>
                  </div>
                ) : (
                  userDetail.emailAnalyses.map((analysis) => (
                    <Card key={analysis.id} className="hover-elevate" data-testid={`email-analysis-${analysis.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getGradeColor(analysis.grade)}`}>
                                {analysis.grade || "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {analysis.subject || "No subject"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Score: {analysis.score ?? "N/A"} | {formatDate(analysis.createdAt)}
                                </p>
                              </div>
                            </div>
                            {analysis.body && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                {analysis.body.substring(0, 200).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}...
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewEmail(analysis)}
                            data-testid={`preview-email-${analysis.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="activity" className="pr-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Activity Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Created</span>
                          <span>{formatDate(userDetail.user.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Login</span>
                          <span>
                            {userDetail.user.lastLoginAt
                              ? formatDistanceToNow(new Date(userDetail.user.lastLoginAt), { addSuffix: true })
                              : 'Never'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Emails Graded</span>
                          <span>{userDetail.emailAnalyses.length}</span>
                        </div>
                        {userDetail.gamification && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Rewrites</span>
                              <span>{userDetail.gamification.totalRewrites}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Current Streak</span>
                              <span>{userDetail.gamification.streak} days</span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="pr-4">
                {userDetail.notes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No admin notes for this user</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userDetail.notes.map((note) => (
                      <Card key={note.id}>
                        <CardContent className="p-4">
                          <p className="text-sm">{note.note}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(note.createdAt)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>User not found</p>
          </div>
        )}
      </DialogContent>

      {/* Email Preview Sheet (separate from Dialog to avoid nesting issues) */}
      <Sheet open={!!previewEmail} onOpenChange={() => setPreviewEmail(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" data-testid="email-preview-sheet">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getGradeColor(previewEmail?.grade)}`}>
                {previewEmail?.grade || "?"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{previewEmail?.subject || "No subject"}</p>
                <p className="text-sm text-muted-foreground font-normal">
                  Score: {previewEmail?.score ?? "N/A"} | {previewEmail ? formatDate(previewEmail.createdAt) : ""}
                </p>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border">
              <div 
                className="prose prose-sm max-w-none dark:prose-invert [&_a]:text-purple-500 [&_a]:underline [&_p]:mb-3 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(previewEmail?.body || '<p>No email content</p>', {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'span', 'div', 'table', 'tr', 'td', 'th', 'thead', 'tbody'],
                    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style']
                  })
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Dialog>
  );
}
