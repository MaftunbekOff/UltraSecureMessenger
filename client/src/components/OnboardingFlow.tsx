
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Users, Settings, Shield, CheckCircle } from "lucide-react";

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Xush kelibsiz!",
    description: "UltraSecure Messenger-ga xush kelibsiz! Keling, asosiy funksiyalar bilan tanishib chiqamiz.",
    icon: MessageCircle,
    action: "Boshlash"
  },
  {
    id: 2,
    title: "Profilingizni to'ldiring",
    description: "Profilingizni to'ldirish do'stlaringizga sizni topishga yordam beradi.",
    icon: Settings,
    action: "Profilni sozlash"
  },
  {
    id: 3,
    title: "Birinchi chatni yarating",
    description: "Do'stlaringiz bilan suhbat boshlash juda oson!",
    icon: Users,
    action: "Chat yaratish"
  },
  {
    id: 4,
    title: "Xavfsizlik sozlamalari",
    description: "Ma'lumotlaringiz xavfsizligini ta'minlash uchun sozlamalarni ko'rib chiqing.",
    icon: Shield,
    action: "Sozlamalar"
  }
];

export function OnboardingFlow({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
      setTimeout(() => onClose(), 1500);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (completed) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Tayyor!</h3>
            <p className="text-muted-foreground mb-4">
              Endi siz UltraSecure Messenger-dan to'liq foydalanishga tayyorsiz!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {ONBOARDING_STEPS.length}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              O'tkazib yuborish
            </Button>
          </div>
          <Progress value={progress} className="mb-4" />
          <div className="text-center">
            <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">{step.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center mb-6">
            {step.description}
          </p>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                Orqaga
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1">
              {currentStep === ONBOARDING_STEPS.length - 1 ? "Yakunlash" : step.action}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
