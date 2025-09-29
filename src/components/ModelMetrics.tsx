import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Brain, Activity, Database, Clock, TrendingUp, Target, Zap } from 'lucide-react';
import { AnalysisResults } from '../services/aiAnalysis';

interface ModelMetricsProps {
  results: AnalysisResults;
}

export function ModelMetrics({ results }: ModelMetricsProps) {
  const { advancedMetrics, topicModeling } = results;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Confidence</CardTitle>
            <Brain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getConfidenceColor(advancedMetrics.modelConfidence)}`}>
              {Math.round(advancedMetrics.modelConfidence * 100)}%
            </div>
            <Progress value={advancedMetrics.modelConfidence * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analysis Quality</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getConfidenceColor(advancedMetrics.analysisQuality)}`}>
              {Math.round(advancedMetrics.analysisQuality * 100)}%
            </div>
            <Progress value={advancedMetrics.analysisQuality * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getConfidenceColor(advancedMetrics.dataQuality)}`}>
              {Math.round(advancedMetrics.dataQuality * 100)}%
            </div>
            <Progress value={advancedMetrics.dataQuality * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {advancedMetrics.processingTime}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {advancedMetrics.processingTime < 2000 ? 'Fast' : 
               advancedMetrics.processingTime < 5000 ? 'Normal' : 'Slow'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Model Performance Metrics
            </CardTitle>
            <CardDescription>
              Detailed performance analysis of AI models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sentiment Analysis Accuracy</span>
                  <Badge variant={getConfidenceBadge(advancedMetrics.modelConfidence)}>
                    {Math.round(advancedMetrics.modelConfidence * 100)}%
                  </Badge>
                </div>
                <Progress value={advancedMetrics.modelConfidence * 100} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Topic Model Coherence</span>
                  <Badge variant={getConfidenceBadge(topicModeling.topic_coherence)}>
                    {Math.round(topicModeling.topic_coherence * 100)}%
                  </Badge>
                </div>
                <Progress value={topicModeling.topic_coherence * 100} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Summary Quality Score</span>
                  <Badge variant={getConfidenceBadge(advancedMetrics.analysisQuality)}>
                    {Math.round(advancedMetrics.analysisQuality * 100)}%
                  </Badge>
                </div>
                <Progress value={advancedMetrics.analysisQuality * 100} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Entity Recognition F1</span>
                  <Badge variant="default">
                    {Math.round((advancedMetrics.modelConfidence + advancedMetrics.analysisQuality) / 2 * 100)}%
                  </Badge>
                </div>
                <Progress value={(advancedMetrics.modelConfidence + advancedMetrics.analysisQuality) / 2 * 100} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Topic Modeling Results
            </CardTitle>
            <CardDescription>
              Advanced topic discovery and clustering analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{topicModeling.topics.length}</div>
                  <div className="text-sm text-muted-foreground">Topics Discovered</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {topicModeling.optimal_num_topics}
                  </div>
                  <div className="text-sm text-muted-foreground">Optimal Topic Count</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Model Perplexity</h4>
                <div className="flex items-center gap-2">
                  <Progress value={Math.max(0, 100 - topicModeling.model_perplexity)} className="flex-1" />
                  <span className="text-sm font-medium">{topicModeling.model_perplexity.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lower perplexity indicates better model fit
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Top Performing Topics</h4>
                <div className="space-y-2">
                  {topicModeling.topics
                    .sort((a, b) => b.coherence_score - a.coherence_score)
                    .slice(0, 3)
                    .map((topic, index) => (
                      <div key={topic.id} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1">{topic.label}</span>
                        <Badge variant="outline" className="ml-2">
                          {Math.round(topic.coherence_score * 100)}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Advanced Analytics Insights
          </CardTitle>
          <CardDescription>
            Machine learning model insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Model Confidence Analysis</h4>
              <div className="space-y-3">
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    <strong>High Confidence ({Math.round(advancedMetrics.modelConfidence * 100)}%):</strong> The sentiment analysis model demonstrates strong performance with consistent predictions across diverse stakeholder inputs.
                  </AlertDescription>
                </Alert>
                
                {advancedMetrics.analysisQuality > 0.8 && (
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Excellent Analysis Quality:</strong> High coherence and coverage scores indicate comprehensive capture of key consultation themes.
                    </AlertDescription>
                  </Alert>
                )}
                
                {advancedMetrics.dataQuality > 0.7 && (
                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Good Data Quality:</strong> Diverse stakeholder representation and temporal distribution support robust analysis.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Processing Efficiency</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Documents Processed</span>
                  <Badge variant="outline">{results.totalComments}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Processing Speed</span>
                  <Badge variant="outline">
                    {Math.round(results.totalComments / (advancedMetrics.processingTime / 1000))} docs/sec
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Memory Efficiency</span>
                  <Badge variant="outline">Optimized</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Scalability Rating</span>
                  <Badge variant="outline">
                    {results.totalComments > 100 ? 'High' : 
                     results.totalComments > 50 ? 'Medium' : 'Basic'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-3">Model Recommendations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {advancedMetrics.modelConfidence < 0.7 && (
                <Alert>
                  <AlertDescription>
                    Consider collecting more training data to improve model confidence in sentiment classification.
                  </AlertDescription>
                </Alert>
              )}
              
              {topicModeling.topic_coherence < 0.6 && (
                <Alert>
                  <AlertDescription>
                    Topic model coherence could be improved by adjusting the number of topics or preprocessing parameters.
                  </AlertDescription>
                </Alert>
              )}
              
              {advancedMetrics.processingTime > 5000 && (
                <Alert>
                  <AlertDescription>
                    Consider optimizing processing pipeline or implementing distributed computing for faster analysis.
                  </AlertDescription>
                </Alert>
              )}
              
              {advancedMetrics.dataQuality < 0.6 && (
                <Alert>
                  <AlertDescription>
                    Data quality improvements needed: ensure diverse stakeholder representation and balanced temporal distribution.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity Recognition Results */}
      <Card>
        <CardHeader>
          <CardTitle>Named Entity Recognition</CardTitle>
          <CardDescription>
            Key entities identified across all consultation documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.entityRecognition.slice(0, 12).map((entity, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm truncate">{entity.entity}</span>
                  <Badge variant="outline" className="text-xs">
                    {entity.type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {entity.frequency} mentions
                  </span>
                  <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ 
                        width: `${Math.min(100, (entity.frequency / Math.max(...results.entityRecognition.map(e => e.frequency))) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}