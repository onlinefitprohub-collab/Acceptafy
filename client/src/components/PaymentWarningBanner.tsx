import { AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function PaymentWarningBanner() {
  const { user } = useAuth();
  
  // Only show for users with payment issues
  const problemStatuses = ['past_due', 'unpaid', 'incomplete_expired', 'canceled'];
  const hasProblem = user?.subscriptionStatus && problemStatuses.includes(user.subscriptionStatus);
  
  if (!hasProblem) {
    return null;
  }

  const statusMessages: Record<string, string> = {
    past_due: "Your payment is past due. Please update your payment method to continue using premium features.",
    unpaid: "Your subscription payment failed. Update your payment method to restore access.",
    incomplete_expired: "Your subscription setup expired. Please restart your subscription.",
    canceled: "Your subscription has been canceled. Resubscribe to restore access to premium features.",
  };

  const message = statusMessages[user.subscriptionStatus || ''] || "There's an issue with your subscription.";

  return (
    <div 
      className="bg-gradient-to-r from-amber-500/20 to-red-500/20 border-b border-amber-500/30 px-4 py-3"
      data-testid="banner-payment-warning"
    >
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold text-amber-200">Payment Issue</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">-</span>
            <span className="text-sm text-muted-foreground">{message}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0 border-amber-500/50 text-amber-200 hover:bg-amber-500/20"
          onClick={() => window.location.href = '/account'}
          data-testid="button-update-payment"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Update Payment
        </Button>
      </div>
    </div>
  );
}
