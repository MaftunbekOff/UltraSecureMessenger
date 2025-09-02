
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, MessageCircle, Users, Heart, Zap, Crown, Shield } from "lucide-react";

const ACHIEVEMENTS = [
  {
    id: 'first_message',
    title: 'Birinchi xabar',
    description: 'Birinchi xabaringizni yuboring',
    icon: MessageCircle,
    category: 'messaging',
    points: 10,
    unlocked: false
  },
  {
    id: 'social_butterfly',
    title: 'Ijtimoiy kapalak',
    description: '10 ta do\'st qo\'shing',
    icon: Users,
    category: 'social',
    points: 50,
    unlocked: false,
    progress: 0,
    target: 10
  },
  {
    id: 'chat_master',
    title: 'Chat ustasi',
    description: '100 ta xabar yuboring',
    icon: Zap,
    category: 'messaging',
    points: 100,
    unlocked: false,
    progress: 0,
    target: 100
  },
  {
    id: 'group_creator',
    title: 'Guruh yaratuvchisi',
    description: '5 ta guruh yarating',
    icon: Crown,
    category: 'social',
    points: 75,
    unlocked: false,
    progress: 0,
    target: 5
  },
  {
    id: 'reaction_lover',
    title: 'Reaksiya sevuvchi',
    description: '50 ta reaksiya qo\'shing',
    icon: Heart,
    category: 'engagement',
    points: 30,
    unlocked: false,
    progress: 0,
    target: 50
  },
  {
    id: 'security_champion',
    title: 'Xavfsizlik chempioni',
    description: '2FA va barcha xavfsizlik sozlamalarini yoqing',
    icon: Shield,
    category: 'security',
    points: 200,
    unlocked: false
  }
];

const LEVELS = [
  { level: 1, minPoints: 0, title: 'Yangi foydalanuvchi', color: 'bg-gray-500' },
  { level: 2, minPoints: 100, title: 'Faol foydalanuvchi', color: 'bg-blue-500' },
  { level: 3, minPoints: 300, title: 'Chat ustasi', color: 'bg-green-500' },
  { level: 4, minPoints: 600, title: 'Ijtimoiy lider', color: 'bg-purple-500' },
  { level: 5, minPoints: 1000, title: 'Messenger ustasi', color: 'bg-yellow-500' },
];

export function AchievementSystem({ userStats }: { userStats: any }) {
  const [achievements, setAchievements] = useState(ACHIEVEMENTS);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(LEVELS[0]);
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);

  useEffect(() => {
    // Check for new achievements based on user stats
    const updatedAchievements = achievements.map(achievement => {
      let unlocked = achievement.unlocked;
      let progress = achievement.progress || 0;

      switch (achievement.id) {
        case 'first_message':
          unlocked = userStats.messagesCount > 0;
          break;
        case 'social_butterfly':
          progress = userStats.friendsCount;
          unlocked = userStats.friendsCount >= 10;
          break;
        case 'chat_master':
          progress = userStats.messagesCount;
          unlocked = userStats.messagesCount >= 100;
          break;
        case 'group_creator':
          progress = userStats.groupsCreated;
          unlocked = userStats.groupsCreated >= 5;
          break;
        case 'reaction_lover':
          progress = userStats.reactionsGiven;
          unlocked = userStats.reactionsGiven >= 50;
          break;
        case 'security_champion':
          unlocked = userStats.has2FA && userStats.profileComplete;
          break;
      }

      // Check if this is a new unlock
      if (unlocked && !achievement.unlocked) {
        setNewUnlocks(prev => [...prev, achievement.id]);
      }

      return { ...achievement, unlocked, progress };
    });

    setAchievements(updatedAchievements);

    // Calculate total points
    const points = updatedAchievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);
    setTotalPoints(points);

    // Determine current level
    const level = LEVELS.reduce((current, level) => 
      points >= level.minPoints ? level : current
    );
    setCurrentLevel(level);
  }, [userStats]);

  const nextLevel = LEVELS.find(l => l.level > currentLevel.level);
  const progressToNext = nextLevel 
    ? ((totalPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Level Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Sizning darajangiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentLevel.color}`}>
              <span className="text-white font-bold">{currentLevel.level}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{currentLevel.title}</h3>
              <p className="text-sm text-muted-foreground">{totalPoints} ball</p>
            </div>
            <Badge variant="secondary">{currentLevel.level}-daraja</Badge>
          </div>
          
          {nextLevel && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Keyingi darajagacha</span>
                <span>{nextLevel.minPoints - totalPoints} ball qoldi</span>
              </div>
              <Progress value={progressToNext} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Yutuqlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <Card key={achievement.id} className={`relative ${achievement.unlocked ? 'border-green-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.unlocked ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          achievement.unlocked ? 'text-white' : 'text-gray-500'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        
                        {achievement.target && (
                          <div className="mb-2">
                            <Progress 
                              value={(achievement.progress! / achievement.target) * 100} 
                              className="h-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {achievement.progress} / {achievement.target}
                            </p>
                          </div>
                        )}
                        
                        <Badge variant={achievement.unlocked ? "default" : "secondary"} className="text-xs">
                          {achievement.points} ball
                        </Badge>
                      </div>
                      
                      {achievement.unlocked && (
                        <Star className="h-5 w-5 text-yellow-500 absolute top-2 right-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* New Achievement Notification */}
      {newUnlocks.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          {newUnlocks.map(achievementId => {
            const achievement = achievements.find(a => a.id === achievementId);
            if (!achievement) return null;
            
            const Icon = achievement.icon;
            return (
              <Card key={achievementId} className="mb-2 border-green-500 shadow-lg animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">Yangi yutuq!</h4>
                      <p className="text-sm">{achievement.title}</p>
                    </div>
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
