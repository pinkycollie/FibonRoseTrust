import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Chart,
  Bar,
  Line,
  getPayloadColor
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FibonacciSpiralViz } from '@/components/visualization/FibonacciSpiralViz';
import { generateFibonacciSequence, getTrustLevelDescription } from '@/lib/utils/fibonacci';

interface TrustScoreHistory {
  date: string;
  score: number;
  level: number;
  events: string[];
}

interface FactorBreakdown {
  name: string;
  value: number;
  percentage: number;
  change: number; // percentage change from previous
}

interface TrustScoreAnalyticsProps {
  userId: number;
  currentScore: number;
  maxScore: number;
}

export function TrustScoreAnalytics({ userId, currentScore, maxScore }: TrustScoreAnalyticsProps) {
  const [history, setHistory] = useState<TrustScoreHistory[]>([]);
  const [factors, setFactors] = useState<FactorBreakdown[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  
  // Fibonacci sequence for reference
  const fibonacciSequence = generateFibonacciSequence(maxScore);
  
  // Generate simulated data on component mount
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, this would be an API call
        // For demo, we'll generate simulated data
        const simulatedHistory = generateHistoricalData(currentScore, timeRange);
        const simulatedFactors = generateFactorBreakdown(currentScore);
        
        setHistory(simulatedHistory);
        setFactors(simulatedFactors);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnalyticsData();
  }, [currentScore, timeRange, userId]);
  
  // Generate simulated historical data
  const generateHistoricalData = (currentScore: number, range: string): TrustScoreHistory[] => {
    const data: TrustScoreHistory[] = [];
    let days = 30;
    
    switch (range) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
      case 'all': days = 730; break; // 2 years
    }
    
    // Start from a lower score and progress toward current
    let baseScore = Math.max(0, currentScore - (currentScore * 0.4));
    const today = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Progress toward current score with some randomness
      const progress = 1 - (i / days);
      const randomFactor = Math.random() * 0.2 - 0.1; // -0.1 to 0.1
      const dayScore = baseScore + (currentScore - baseScore) * (progress + randomFactor);
      
      // Ensure score doesn't exceed current score in history
      const score = Math.min(Math.max(0, dayScore), currentScore);
      
      // Calculate level based on score
      let level = 1;
      for (let j = 0; j < fibonacciSequence.length; j++) {
        if (score >= fibonacciSequence[j]) {
          level = j + 1;
        } else {
          break;
        }
      }
      
      // Generate events (more significant ones on big score jumps)
      const events: string[] = [];
      const prevScore = i < days ? data[data.length - 1].score : 0;
      const scoreJump = score - prevScore;
      
      if (scoreJump > 1) {
        events.push('Verification completed');
      }
      if (scoreJump > 2) {
        events.push('Government ID verified');
      }
      if (scoreJump > 3) {
        events.push('Address verification added');
      }
      if (i % 30 === 0) {
        events.push('Monthly trust review');
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(score * 10) / 10,
        level,
        events
      });
    }
    
    return data;
  };
  
  // Generate simulated factor breakdown
  const generateFactorBreakdown = (score: number): FactorBreakdown[] => {
    // Base factors that contribute to trust score
    return [
      {
        name: 'Verified Identifiers',
        value: score * 0.35,
        percentage: 35,
        change: 5
      },
      {
        name: 'Transaction History',
        value: score * 0.25,
        percentage: 25,
        change: 2
      },
      {
        name: 'Account Age',
        value: score * 0.15,
        percentage: 15,
        change: 0
      },
      {
        name: 'Document Verification',
        value: score * 0.15,
        percentage: 15,
        change: 8
      },
      {
        name: 'Network Trust',
        value: score * 0.10,
        percentage: 10,
        change: -3
      }
    ];
  };
  
  // Find next Fibonacci threshold
  const getNextThreshold = () => {
    for (let i = 0; i < fibonacciSequence.length; i++) {
      if (fibonacciSequence[i] > currentScore) {
        return {
          value: fibonacciSequence[i],
          level: i + 1,
          name: getTrustLevelDescription(i + 1),
          gap: fibonacciSequence[i] - currentScore
        };
      }
    }
    
    return null;
  };
  
  // Format dates for chart display
  const formatChartDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Format date for detailed view
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Calculate growth rate
  const calculateGrowthRate = () => {
    if (history.length < 2) return 0;
    
    const oldestScore = history[0].score;
    const newestScore = history[history.length - 1].score;
    
    if (oldestScore === 0) return 100;
    
    return Math.round(((newestScore - oldestScore) / oldestScore) * 100);
  };
  
  const nextThreshold = getNextThreshold();
  
  return (
    <div className="space-y-6">
      <Card className="shadow-md border-0">
        <CardHeader className="pb-2">
          <CardTitle>Trust Score Analytics</CardTitle>
          <CardDescription>
            Detailed analysis of your FibonroseTrust progression
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="overview">
            <div className="px-6 pt-2 pb-0 border-b">
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="overview" className="text-sm">
                    <span className="material-icons text-sm mr-2">dashboard</span>
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-sm">
                    <span className="material-icons text-sm mr-2">history</span>
                    History
                  </TabsTrigger>
                  <TabsTrigger value="factors" className="text-sm">
                    <span className="material-icons text-sm mr-2">pie_chart</span>
                    Factors
                  </TabsTrigger>
                </TabsList>
                
                <Select 
                  value={timeRange} 
                  onValueChange={(value) => setTimeRange(value as any)}
                >
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <TabsContent value="overview" className="m-0">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col justify-center">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium">Fibonacci Trust Progression</h3>
                    <p className="text-sm text-muted-foreground">
                      Your trust score grows along a Fibonacci sequence, creating exponential trust levels
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/20 p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground">Current Level</div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold mr-1">
                          {history.length > 0 ? history[history.length - 1].level : '?'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {getTrustLevelDescription(history.length > 0 ? history[history.length - 1].level : 0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-muted/20 p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground">Growth Rate</div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold mr-1">
                          {calculateGrowthRate()}%
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {timeRange === '7d' ? 'this week' : 
                           timeRange === '30d' ? 'this month' : 
                           timeRange === '90d' ? 'this quarter' : 
                           'this period'}
                        </span>
                      </div>
                    </div>
                    
                    {nextThreshold && (
                      <div className="col-span-2 bg-primary-50 dark:bg-primary-950/20 p-3 rounded-md border border-primary-100 dark:border-primary-900/30">
                        <div className="text-xs text-primary-700 dark:text-primary-300">Next Level Threshold</div>
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="text-xl font-bold mr-1">
                              {nextThreshold.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              (Level {nextThreshold.level})
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">
                              +{nextThreshold.gap.toFixed(1)}
                            </span>
                            <span className="text-muted-foreground ml-1">points needed</span>
                          </div>
                        </div>
                        <div className="mt-2 w-full bg-muted h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ 
                              width: `${(currentScore / nextThreshold.value) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Key Fibonacci Thresholds</h4>
                    <div className="space-y-2">
                      {fibonacciSequence.slice(2, 7).map((threshold, index) => (
                        <div 
                          key={index}
                          className="flex justify-between items-center px-3 py-1.5 rounded-sm text-sm"
                        >
                          <div className="flex items-center">
                            <div 
                              className={`w-2 h-2 rounded-full mr-2 ${
                                currentScore >= threshold ? 'bg-primary' : 'bg-muted'
                              }`}
                            ></div>
                            <span className="font-medium">Level {index + 3}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {getTrustLevelDescription(index + 3)}
                            </span>
                          </div>
                          <div>
                            <span className={`${currentScore >= threshold ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                              {threshold} points
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <FibonacciSpiralViz
                    score={currentScore}
                    maxScore={maxScore}
                    width={350}
                    height={350}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="m-0">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium">Score History</h3>
                  <p className="text-sm text-muted-foreground">
                    Track how your trust score has evolved over time
                  </p>
                </div>
                
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="h-80">
                      <Line
                        config={{ 
                          score: { 
                            label: 'Trust Score',
                            color: '#6366f1' // Primary color
                          },
                          level: {
                            label: 'Trust Level',
                            color: '#a5b4fc' // Secondary color
                          }
                        }}
                        data={history.map(item => ({
                          name: formatChartDate(item.date),
                          score: item.score,
                          level: item.level
                        }))}
                      />
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Key Events</h4>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {history
                          .filter(item => item.events.length > 0)
                          .map((item, index) => (
                          <div 
                            key={index}
                            className="flex items-start p-3 bg-muted/20 rounded-md border border-muted"
                          >
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3">
                              <span className="material-icons text-primary">event</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {formatFullDate(item.date)}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                Score: {item.score} (Level {item.level})
                              </div>
                              <div className="mt-1.5">
                                <ul className="space-y-1">
                                  {item.events.map((event, eventIndex) => (
                                    <li key={eventIndex} className="text-xs flex items-center">
                                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary mr-1.5"></span>
                                      {event}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="factors" className="m-0">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium">Trust Score Factors</h3>
                  <p className="text-sm text-muted-foreground">
                    Breakdown of what contributes to your current trust score
                  </p>
                </div>
                
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="h-80">
                      <Bar
                        config={{ 
                          value: { 
                            label: 'Contribution',
                            color: '#6366f1' // Primary color
                          }
                        }}
                        data={factors.map(factor => ({
                          name: factor.name,
                          value: factor.value
                        }))}
                      />
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Factor Details</h4>
                      <div className="space-y-3">
                        {factors.map((factor, index) => (
                          <div 
                            key={index}
                            className="p-3 bg-muted/20 rounded-md border border-muted"
                          >
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-medium">
                                {factor.name}
                              </div>
                              <div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  factor.change > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                  factor.change < 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
                                }`}>
                                  {factor.change > 0 ? '+' : ''}{factor.change}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>{factor.value.toFixed(1)} points</span>
                                <span className="text-muted-foreground">{factor.percentage}% of total</span>
                              </div>
                              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary" 
                                  style={{ width: `${factor.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="bg-muted/30 border-t pt-3 pb-3 flex justify-between">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <span className="material-icons text-xs">download</span>
            Export Data
          </Button>
          
          <Button size="sm" className="text-xs gap-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600">
            <span className="material-icons text-xs">insights</span>
            Detailed Analysis
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}