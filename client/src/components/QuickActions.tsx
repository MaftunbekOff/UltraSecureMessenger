
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MessageCircle, Users, Paperclip, Smile, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickActions({ onNewChat, onNewGroup, onFileUpload }: {
  onNewChat: () => void;
  onNewGroup: () => void;
  onFileUpload: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: MessageCircle, label: "Yangi chat", action: onNewChat, color: "bg-blue-500" },
    { icon: Users, label: "Yangi guruh", action: onNewGroup, color: "bg-green-500" },
    { icon: Paperclip, label: "Fayl yuborish", action: onFileUpload, color: "bg-purple-500" },
    { icon: Phone, label: "Audio qo'ng'iroq", action: () => {}, color: "bg-orange-500" },
    { icon: Video, label: "Video qo'ng'iroq", action: () => {}, color: "bg-red-500" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <Card className="mb-4 w-64">
          <CardContent className="p-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start mb-1 last:mb-0"
                  onClick={() => {
                    action.action();
                    setIsOpen(false);
                  }}
                >
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mr-3", action.color)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  {action.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>
      )}
      
      <Button
        size="lg"
        className="rounded-full w-14 h-14 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className={cn("h-6 w-6 transition-transform", isOpen && "rotate-45")} />
      </Button>
    </div>
  );
}
