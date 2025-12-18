import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Mail,
  Edit,
  Trash2,
  GripVertical,
  CalendarDays,
  CalendarRange,
  Send,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import type { CalendarEvent } from '@shared/schema';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500',
  scheduled: 'bg-purple-500',
  sent: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  sent: 'Sent',
  cancelled: 'Cancelled',
};

const CATEGORY_COLORS: Record<string, string> = {
  welcome: '#ec4899',
  newsletter: '#8b5cf6',
  promotional: '#f97316',
  're-engagement': '#06b6d4',
  transactional: '#22c55e',
  announcement: '#eab308',
};

interface CampaignFormData {
  title: string;
  description: string;
  subject: string;
  previewText: string;
  body: string;
  scheduledDate: string;
  scheduledTime: string;
  category: string;
  color: string;
  listName: string;
}

const initialFormData: CampaignFormData = {
  title: '',
  description: '',
  subject: '',
  previewText: '',
  body: '',
  scheduledDate: '',
  scheduledTime: '09:00',
  category: '',
  color: '#9333ea',
  listName: '',
};

export function ContentCalendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  const getDateRange = () => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return { start: calendarStart, end: calendarEnd };
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return { start: weekStart, end: weekEnd };
    }
  };

  const { start, end } = getDateRange();

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar/campaigns', start.toISOString(), end.toISOString()],
  });

  const createMutation = useMutation({
    mutationFn: (data: CampaignFormData) => 
      apiRequest('POST', '/api/calendar/campaigns', {
        ...data,
        scheduledDate: data.scheduledDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/campaigns'] });
      setShowCreateDialog(false);
      setFormData(initialFormData);
      toast({ title: 'Campaign created', description: 'Your campaign has been scheduled.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create campaign.', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CampaignFormData & { status: string }> }) =>
      apiRequest('PUT', `/api/calendar/campaigns/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/campaigns'] });
      setShowEditDialog(false);
      setSelectedEvent(null);
      toast({ title: 'Campaign updated', description: 'Your changes have been saved.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update campaign.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/calendar/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/campaigns'] });
      setShowEditDialog(false);
      setSelectedEvent(null);
      toast({ title: 'Campaign deleted', description: 'The campaign has been removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete campaign.', variant: 'destructive' });
    },
  });

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setFormData({
      ...initialFormData,
      scheduledDate: format(date, 'yyyy-MM-dd'),
    });
    setShowCreateDialog(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: '',
      subject: event.subject || '',
      previewText: '',
      body: '',
      scheduledDate: format(new Date(event.date), 'yyyy-MM-dd'),
      scheduledTime: event.time || '09:00',
      category: event.category || '',
      color: event.color || '#9333ea',
      listName: event.listName || '',
    });
    setShowEditDialog(true);
  };

  const handleDragStart = useCallback((e: React.DragEvent, event: CalendarEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    setDraggedEvent(event);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const newDate = format(date, 'yyyy-MM-dd');
    updateMutation.mutate({
      id: draggedEvent.id,
      data: { scheduledDate: newDate },
    });
    setDraggedEvent(null);
  }, [draggedEvent, updateMutation]);

  const handleCreateSubmit = () => {
    if (!formData.title || !formData.scheduledDate) {
      toast({ title: 'Error', description: 'Title and date are required.', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = () => {
    if (!selectedEvent) return;
    updateMutation.mutate({
      id: selectedEvent.id,
      data: formData,
    });
  };

  const handleStatusChange = (status: string) => {
    if (!selectedEvent) return;
    updateMutation.mutate({
      id: selectedEvent.id,
      data: { status },
    });
  };

  const days = eachDayOfInterval({ start, end });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), date));
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-purple-400" />
            Content Calendar
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none ${viewMode === 'month' ? 'bg-purple-500/20 text-purple-400' : ''}`}
                onClick={() => setViewMode('month')}
                data-testid="button-view-month"
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none ${viewMode === 'week' ? 'bg-purple-500/20 text-purple-400' : ''}`}
                onClick={() => setViewMode('week')}
                data-testid="button-view-week"
              >
                <CalendarRange className="h-4 w-4 mr-1" />
                Week
              </Button>
            </div>
            
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setFormData({ ...initialFormData, scheduledDate: format(new Date(), 'yyyy-MM-dd') });
                setShowCreateDialog(true);
              }}
              data-testid="button-create-campaign"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Campaign
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" size="icon" onClick={handlePrev} data-testid="button-prev">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {viewMode === 'month' 
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(start, 'MMM d, yyyy')}`
            }
          </h2>
          <Button variant="ghost" size="icon" onClick={handleNext} data-testid="button-next">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-slate-700/30 rounded-lg overflow-hidden">
            {weekDays.map((day) => (
              <div key={day} className="bg-slate-800/50 p-2 text-center text-sm font-medium text-slate-400">
                {day}
              </div>
            ))}
            
            {days.map((day) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] p-1 bg-slate-800/30 transition-colors ${
                    isCurrentMonth ? '' : 'opacity-40'
                  } ${isToday ? 'ring-2 ring-purple-500/50' : ''}`}
                  onClick={() => handleDayClick(day)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                  data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                >
                  <div className={`text-sm mb-1 ${isToday ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <ScrollArea className="h-[70px]">
                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, event)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className="group flex items-center gap-1 p-1 rounded text-xs cursor-pointer hover-elevate"
                          style={{ backgroundColor: `${event.color || '#9333ea'}20` }}
                          data-testid={`event-${event.id}`}
                        >
                          <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50 cursor-grab" />
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: event.color || '#9333ea' }}
                          />
                          <span className="truncate text-slate-200">{event.title}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Status:</span>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[key]}`} />
                <span className="text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-400" />
              Schedule New Campaign
            </DialogTitle>
            <DialogDescription>
              Create a new email campaign for your content calendar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title</Label>
              <Input
                id="title"
                placeholder="e.g., Weekly Newsletter"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  data-testid="input-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  data-testid="input-time"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                placeholder="Email subject line"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                data-testid="input-subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v, color: CATEGORY_COLORS[v] || '#9333ea' })}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="re-engagement">Re-engagement</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="listName">List / Audience</Label>
              <Input
                id="listName"
                placeholder="e.g., All Subscribers"
                value={formData.listName}
                onChange={(e) => setFormData({ ...formData, listName: e.target.value })}
                data-testid="input-list"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                placeholder="Any additional notes about this campaign..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="resize-none"
                rows={3}
                data-testid="input-description"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending}
              data-testid="button-save-campaign"
            >
              {createMutation.isPending ? 'Saving...' : 'Schedule Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-purple-400" />
              Edit Campaign
            </DialogTitle>
            <DialogDescription>
              Update or reschedule this email campaign.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <>
              <div className="flex items-center gap-2 pb-2">
                <Badge className={`${STATUS_COLORS[selectedEvent.status]} text-white`}>
                  {STATUS_LABELS[selectedEvent.status]}
                </Badge>
                {selectedEvent.sentCount && (
                  <Badge variant="outline" className="text-slate-400">
                    <Send className="h-3 w-3 mr-1" />
                    {selectedEvent.sentCount} sent
                  </Badge>
                )}
                {selectedEvent.openRate !== undefined && (
                  <Badge variant="outline" className="text-green-400">
                    <Mail className="h-3 w-3 mr-1" />
                    {selectedEvent.openRate.toFixed(1)}% opened
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Campaign Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    data-testid="input-edit-title"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-date">Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      data-testid="input-edit-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-time">Time</Label>
                    <Input
                      id="edit-time"
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                      data-testid="input-edit-time"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-subject">Subject Line</Label>
                  <Input
                    id="edit-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    data-testid="input-edit-subject"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedEvent.status === 'draft' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange('draft')}
                      disabled={selectedEvent.status === 'sent'}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Draft
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedEvent.status === 'scheduled' ? 'default' : 'outline'}
                      className={selectedEvent.status === 'scheduled' ? 'bg-purple-600' : ''}
                      onClick={() => handleStatusChange('scheduled')}
                      disabled={selectedEvent.status === 'sent'}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedEvent.status === 'cancelled' ? 'default' : 'outline'}
                      className={selectedEvent.status === 'cancelled' ? 'bg-red-600' : ''}
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={selectedEvent.status === 'sent'}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(selectedEvent.id)}
                  disabled={deleteMutation.isPending || selectedEvent.status === 'sent'}
                  data-testid="button-delete-campaign"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleUpdateSubmit}
                    disabled={updateMutation.isPending}
                    data-testid="button-update-campaign"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
