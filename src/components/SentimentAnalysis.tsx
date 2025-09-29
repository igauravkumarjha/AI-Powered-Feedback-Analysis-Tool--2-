import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AnalysisResults } from '../services/aiAnalysis';

interface SentimentAnalysisProps {
  results: AnalysisResults;
}

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#6b7280',
  caseBased: '#3b82f6',
  sectionSpecific: '#8b5cf6'
};

export function SentimentAnalysis({ results }: SentimentAnalysisProps) {
  const sentimentData = [
    { name: 'Positive', value: results.sentimentDistribution.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Negative', value: results.sentimentDistribution.negative, color: SENTIMENT_COLORS.negative },
    { name: 'Neutral', value: results.sentimentDistribution.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Case-Based', value: results.sentimentDistribution.caseBased, color: SENTIMENT_COLORS.caseBased },
    { name: 'Section-Specific', value: results.sentimentDistribution.sectionSpecific, color: SENTIMENT_COLORS.sectionSpecific }
  ];

  const trendData = results.trendAnalysis.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    positive: item.positive,
    negative: item.negative,
    neutral: item.neutral
  }));

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return '😊';
      case 'Negative': return '😞';
      case 'Neutral': return '😐';
      case 'Case-Based': return '⚖️';
      case 'Section-Specific': return '📋';
      default: return '📊';
    }
  };

  const getSentimentBadgeVariant = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return 'default' as const;
      case 'Negative': return 'destructive' as const;
      case 'Neutral': return 'secondary' as const;
      case 'Case-Based': return 'outline' as const;
      case 'Section-Specific': return 'outline' as const;
      default: return 'secondary' as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {sentimentData.map((item) => (
          <Card key={item.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {getSentimentIcon(item.name)} {item.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">
                {((item.value / results.totalComments) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>
              Overall sentiment breakdown of {results.totalComments} comments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Comparison</CardTitle>
            <CardDescription>
              Detailed breakdown by sentiment type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Trends</CardTitle>
          <CardDescription>
            Daily sentiment trends over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="positive" 
                stroke={SENTIMENT_COLORS.positive} 
                strokeWidth={2}
                name="Positive"
              />
              <Line 
                type="monotone" 
                dataKey="negative" 
                stroke={SENTIMENT_COLORS.negative} 
                strokeWidth={2}
                name="Negative"
              />
              <Line 
                type="monotone" 
                dataKey="neutral" 
                stroke={SENTIMENT_COLORS.neutral} 
                strokeWidth={2}
                name="Neutral"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>
            AI-generated insights from sentiment analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Sentiment Distribution Analysis</h4>
              <div className="flex flex-wrap gap-2">
                {sentimentData
                  .sort((a, b) => b.value - a.value)
                  .map((item) => (
                    <Badge key={item.name} variant={getSentimentBadgeVariant(item.name)}>
                      {getSentimentIcon(item.name)} {item.name}: {item.value} comments
                    </Badge>
                  ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Analysis Summary</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Most prevalent sentiment: {sentimentData.sort((a, b) => b.value - a.value)[0].name} ({((sentimentData.sort((a, b) => b.value - a.value)[0].value / results.totalComments) * 100).toFixed(1)}%)</li>
                <li>• Legal precedent references: {results.sentimentDistribution.caseBased} comments cite case law</li>
                <li>• Section-specific feedback: {results.sentimentDistribution.sectionSpecific} comments target specific provisions</li>
                <li>• Overall engagement: {results.totalComments} total stakeholder submissions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}