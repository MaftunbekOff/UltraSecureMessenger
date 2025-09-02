
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/ThemeProvider";
import { Palette, Image, Smile, Sun, Moon } from "lucide-react";

const COLOR_THEMES = [
  { name: "Klassik", primary: "#3b82f6", secondary: "#64748b", accent: "#f59e0b" },
  { name: "Qora", primary: "#000000", secondary: "#404040", accent: "#ffffff" },
  { name: "Ko'k dengiz", primary: "#0891b2", secondary: "#0e7490", accent: "#22d3ee" },
  { name: "Yashil", primary: "#059669", secondary: "#047857", accent: "#34d399" },
  { name: "Binafsha", primary: "#7c3aed", secondary: "#5b21b6", accent: "#a78bfa" },
  { name: "Pushti", primary: "#ec4899", secondary: "#be185d", accent: "#f9a8d4" },
];

const CHAT_BACKGROUNDS = [
  { name: "Oddiy", type: "solid", value: "#ffffff" },
  { name: "Gradient", type: "gradient", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Yulduzlar", type: "pattern", value: "url('/patterns/stars.svg')" },
  { name: "Geometrik", type: "pattern", value: "url('/patterns/geometric.svg')" },
  { name: "Tabiat", type: "image", value: "url('/backgrounds/nature.jpg')" },
];

const EMOJI_PACKS = [
  { name: "Klassik", set: "native", preview: "😀😍🎉❤️" },
  { name: "Twitter", set: "twitter", preview: "😀😍🎉❤️" },
  { name: "Apple", set: "apple", preview: "😀😍🎉❤️" },
  { name: "Google", set: "google", preview: "😀😍🎉❤️" },
];

export function ThemeCustomizer({ onSave }: { onSave?: (theme: any) => void }) {
  const { theme, toggleTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(COLOR_THEMES[0]);
  const [selectedBackground, setSelectedBackground] = useState(CHAT_BACKGROUNDS[0]);
  const [selectedEmojiPack, setSelectedEmojiPack] = useState(EMOJI_PACKS[0]);

  const handleSave = () => {
    const customTheme = {
      colors: selectedTheme,
      background: selectedBackground,
      emojiPack: selectedEmojiPack,
      timestamp: Date.now()
    };
    
    localStorage.setItem('user-theme', JSON.stringify(customTheme));
    if (onSave) {
      onSave(customTheme);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Mavzu sozlamalari
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Theme Mode Toggle */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Rejim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="theme-mode">Dark rejim</Label>
                <p className="text-sm text-muted-foreground">
                  Interfeys rangini o'zgartirish
                </p>
              </div>
              <Switch
                id="theme-mode"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Ranglar</TabsTrigger>
            <TabsTrigger value="backgrounds">Fonlar</TabsTrigger>
            <TabsTrigger value="emojis">Emoji</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4">
            <Label>Rang sxemasini tanlang</Label>
            <div className="grid grid-cols-2 gap-3">
              {COLOR_THEMES.map((theme) => (
                <Card
                  key={theme.name}
                  className={`cursor-pointer transition-all ${
                    selectedTheme.name === theme.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTheme(theme)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: theme.secondary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>
                      <span className="text-sm font-medium">{theme.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="backgrounds" className="space-y-4">
            <Label>Chat fonini tanlang</Label>
            <div className="grid grid-cols-2 gap-3">
              {CHAT_BACKGROUNDS.map((bg) => (
                <Card
                  key={bg.name}
                  className={`cursor-pointer transition-all ${
                    selectedBackground.name === bg.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedBackground(bg)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ 
                          background: bg.type === 'solid' ? bg.value : 
                                    bg.type === 'gradient' ? bg.value : 
                                    `${bg.value} center/cover`
                        }}
                      />
                      <span className="text-sm font-medium">{bg.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="emojis" className="space-y-4">
            <Label>Emoji paketini tanlang</Label>
            <div className="grid grid-cols-1 gap-3">
              {EMOJI_PACKS.map((pack) => (
                <Card
                  key={pack.name}
                  className={`cursor-pointer transition-all ${
                    selectedEmojiPack.name === pack.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedEmojiPack(pack)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{pack.name}</span>
                        <div className="text-2xl mt-1">{pack.preview}</div>
                      </div>
                      <Smile className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} className="flex-1">
            Saqlash
          </Button>
          <Button variant="outline" onClick={() => {
            setSelectedTheme(COLOR_THEMES[0]);
            setSelectedBackground(CHAT_BACKGROUNDS[0]);
            setSelectedEmojiPack(EMOJI_PACKS[0]);
          }}>
            Qayta tiklash
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
