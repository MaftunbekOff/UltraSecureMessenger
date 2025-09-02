
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, Zap, Award, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserStats {
  messagesCount: number;
  friendsCount: number;
  groupsCreated: number;
  reactionsGiven: number;
  has2FA: boolean;
  profileComplete: boolean;
}

interface Level {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  color: string;
}

const LEVELS: Level[] = [
  { level: 1, title: "Yangi foydalanuvchi", minPoints: 0, maxPoints: 99, color: "gray" },
  { level: 2, title: "Faol foydalanuvchi", minPoints: 100, maxPoints: 299, color: "blue" },
  { level: 3, title: "Chat ustasi", minPoints: 300, maxPoints: 599, color: "green" },
  { level: 4, title: "Hamjamiyat rahbari", minPoints: 600, maxPoints: 999, color: "purple" },
  { level: 5, title: "Legenda", minPoints: 1000, maxPoints: Infinity, color: "gold" },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_message",
    title: "Birinchi xabar",
    description: "Birinchi xabaringizni yuboring",
    icon: <Star className="h-5 w-5" />,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    points: 10,
    rarity: 'common'
  },
  {
    id: "social_butterfly",
    title: "Ijtimoiy kapalak",
    description: "5 ta do'st qo'shing",
    icon: <Trophy className="h-5 w-5" />,
    progress: 0,
    maxProgress: 5,
    unlocked: false,
    points: 50,
    rarity: 'rare'
  },
  {
    id: "group_creator",
    title: "Guruh yaratuvchisi",
    description: "Birinchi guruhingizni yarating",
    icon: <Crown className="h-5 w-5" />,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    points: 75,
    rarity: 'epic'
  }
];

interface AchievementSystemProps {
  userStats: UserStats;
  onClose: () => void;
}

export function AchievementSystem({ userStats, onClose }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  
  // Calculate current level based on total points
  const totalPoints = useMemo(() => {
    return achievements.reduce((total, achievement) => {
      return total + (achievement.unlocked ? achievement.points : 0);
    }, 0);
  }, [achievements]);

  const currentLevel = useMemo(() => {
    return LEVELS.reduce((current, level) => 
      totalPoints >= level.minPoints ? level : current
    );
  }, [totalPoints]);

  const nextLevel = useMemo(() => {
    return LEVELS.find(l => l.level > currentLevel.level);
  }, [currentLevel]);

  const progressToNext = useMemo(() => {
    if (!nextLevel) return 100;
    const currentLevelPoints = totalPoints - currentLevel.minPoints;
    const pointsNeeded = nextLevel.minPoints - currentLevel.minPoints;
    return Math.min(100, (currentLevelPoints / pointsNeeded) * 100);
  }, [totalPoints, currentLevel, nextLevel]);

  // Update achievements based on user stats
  useEffect(() => {
    setAchievements(prevAchievements => {
      return prevAchievements.map(achievement => {
        let progress = achievement.progress;
        let unlocked = achievement.unlocked;

        switch (achievement.id) {
          case "first_message":
            progress = Math.min(userStats.messagesCount, 1);
            unlocked = userStats.messagesCount >= 1;
            break;
          case "social_butterfly":
            progress = Math.min(userStats.friendsCount, 5);
            unlocked = userStats.friendsCount >= 5;
            break;
          case "group_creator":
            progress = Math.min(userStats.groupsCreated, 1);
            unlocked = userStats.groupsCreated >= 1;
            break;
        }

        return { ...achievement, progress, unlocked };
      });
    });
  }, [userStats]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700';
      case 'rare': return 'bg-blue-100 text-blue-700';
      case 'epic': return 'bg-purple-100 text-purple-700';
      case 'legendary': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yutuqlar tizimi</h1>
          <p className="text-gray-600">O'zingizning yutuqlaringizni kuzatib boring</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Yopish
        </Button>
      </div>

      {/* Level Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Daraja: {currentLevel.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Joriy daraja: {currentLevel.level}</span>
              <span>{totalPoints} ochko</span>
            </div>
            {nextLevel && (
              <>
                <Progress value={progressToNext} className="h-2" />
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Keyingi daraja: {nextLevel.title}</span>
                  <span>{nextLevel.minPoints - totalPoints} ochko kerak</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <Card 
            key={achievement.id}
            className={`transition-all ${achievement.unlocked ? 'ring-2 ring-green-200 bg-green-50' : ''}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className={achievement.unlocked ? 'text-green-600' : 'text-gray-400'}>
                    {achievement.icon}
                  </div>
                </div>
                <Badge className={getRarityBadgeColor(achievement.rarity)}>
                  {achievement.rarity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm">{achievement.title}</h3>
                <p className="text-xs text-gray-600">{achievement.description}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Jarayon</span>
                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                </div>
                <Progress 
                  value={(achievement.progress / achievement.maxProgress) * 100} 
                  className="h-1.5"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {achievement.points} ochko
                </span>
                {achievement.unlocked && (
                  <Badge variant="secondary" className="text-xs">
                    ✓ Ochilgan
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
