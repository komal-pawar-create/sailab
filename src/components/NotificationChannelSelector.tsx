import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { NotificationChannel } from "@/hooks/useNotifications";

interface NotificationChannelSelectorProps {
  selectedChannels: NotificationChannel[];
  onChannelChange: (channels: NotificationChannel[]) => void;
}

export function NotificationChannelSelector({
  selectedChannels,
  onChannelChange,
}: NotificationChannelSelectorProps) {
  const toggleChannel = (channel: NotificationChannel) => {
    if (selectedChannels.includes(channel)) {
      onChannelChange(selectedChannels.filter(c => c !== channel));
    } else {
      onChannelChange([...selectedChannels, channel]);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Send notifications via:</Label>
      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="email"
            checked={selectedChannels.includes('email')}
            onCheckedChange={() => toggleChannel('email')}
          />
          <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
            <Mail className="w-4 h-4" />
            Email
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sms"
            checked={selectedChannels.includes('sms')}
            onCheckedChange={() => toggleChannel('sms')}
          />
          <Label htmlFor="sms" className="flex items-center gap-2 cursor-pointer">
            <Phone className="w-4 h-4" />
            SMS
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="whatsapp"
            checked={selectedChannels.includes('whatsapp')}
            onCheckedChange={() => toggleChannel('whatsapp')}
          />
          <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
            <WhatsApp className="w-4 h-4" />
            WhatsApp
          </Label>
        </div>
      </div>
    </div>
  );
}

const WhatsApp = ({ className }: { className?: string }) => (
  <MessageSquare className={className} />
);
