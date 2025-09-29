import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Brain, BarChart3, Cloud, FileText, MessageSquare, RefreshCw, Download, Activity, Target, Upload, Bot, CheckCircle, AlertCircle, Plus, Zap } from 'lucide-react';
import { SentimentAnalysis } from './SentimentAnalysis';
import { WordCloudVisualization } from './WordCloudVisualization';
import { SummaryGeneration } from './SummaryGeneration';
import { CommentInput } from './CommentInput';
import { EnhancedCommentInput } from './EnhancedCommentInput';
import { ModelMetrics } from './ModelMetrics';
import { FileUpload } from './FileUpload';
import { AIChatbot } from './AIChatbot';
import { Comment, performComprehensiveAnalysis, AnalysisResults } from '../services/aiAnalysis';
import { sampleComments } from '../data/sampleComments';
import { Alert, AlertDescription } from './ui/alert';

export function Dashboard() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Load sample data on mount
  useEffect(() => {
    setComments(sampleComments);
    performAnalysis(sampleComments);
  }, []);

  const performAnalysis = async (commentsToAnalyze: Comment[]) => {
    setIsAnalyzing(true);
    
    try {
      // Use actual AI/ML analysis
      const results = await performComprehensiveAnalysis(commentsToAnalyze);
      setAnalysisResults(results);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback to basic analysis if advanced fails
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCommentsAdded = (newComments: Comment[]) => {
    const updatedComments = [...comments, ...newComments];
    setComments(updatedComments);
    performAnalysis(updatedComments);
  };

  const handleFileUpload = (uploadedComments: Comment[]) => {
    const newComments = [...comments, ...uploadedComments];
    setComments(newComments);
    // Automatically analyze uploaded comments
    performAnalysis(newComments);
  };

  const handleRefreshAnalysis = () => {
    performAnalysis(comments);
  };

  const exportResults = () => {
    if (!analysisResults) return;
    
    const exportData = {
      analysisDate: new Date().toISOString(),
      totalComments: analysisResults.totalComments,
      sentimentDistribution: analysisResults.sentimentDistribution,
      summary: analysisResults.summary,
      topKeywords: analysisResults.wordCloud.slice(0, 20),
      metadata: {
        generatedBy: 'MCA21 eConsultation AI Analysis Platform',
        version: '1.0.0'
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `econsultation-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      case 'case-based': return 'bg-blue-100 text-blue-800';
      case 'section-specific': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">MCA21 eConsultation AI Platform</h1>
                  <p className="text-blue-100">Advanced AI-Powered Stakeholder Feedback Analysis System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastAnalyzed && (
                <div className="text-sm text-blue-100 bg-white bg-opacity-10 px-3 py-1 rounded-full">
                  Last analyzed: {lastAnalyzed.toLocaleTimeString()}
                </div>
              )}
              <Button
                onClick={handleRefreshAnalysis}
                disabled={isAnalyzing || comments.length === 0}
                size="sm"
                variant="outline"
                className="bg-white bg-opacity-10 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
              </Button>
              <Button
                onClick={exportResults}
                disabled={!analysisResults}
                size="sm"
                variant="outline"
                className="bg-white bg-opacity-10 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
              <Button 
                onClick={() => setIsChatbotOpen(true)}
                disabled={!analysisResults}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg"
              >
                <Bot className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAnalyzing && (
          <Alert className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <Brain className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Advanced AI Analysis in progress...</strong> Processing {comments.length} comments through neural networks for comprehensive sentiment analysis, topic modeling, and intelligent summarization.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="input" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <TabsTrigger value="input" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Plus className="h-4 w-4" />
              Add Comments
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Brain className="h-4 w-4" />
              Sentiment Analysis
            </TabsTrigger>
            <TabsTrigger value="wordcloud" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Cloud className="h-4 w-4" />
              Word Cloud
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Target className="h-4 w-4" />
              AI Metrics
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4" />
              View Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input">
            <EnhancedCommentInput 
              onCommentsAdded={handleCommentsAdded}
              isProcessing={isAnalyzing}
            />
          </TabsContent>

          <TabsContent value="overview">
            {analysisResults ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <MessageSquare className="h-6 w-6 text-blue-600 mr-2" />
                          <div className="text-3xl font-bold text-blue-700">{analysisResults.totalComments}</div>
                        </div>
                        <p className="text-sm font-medium text-blue-800">Total Comments</p>
                        <p className="text-xs text-blue-600 mt-1">Processed by AI</p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                          <div className="text-3xl font-bold text-green-700">{analysisResults.sentimentDistribution.positive}</div>
                        </div>
                        <p className="text-sm font-medium text-green-800">Positive Sentiment</p>
                        <p className="text-xs text-green-600 mt-1">{Math.round((analysisResults.sentimentDistribution.positive / analysisResults.totalComments) * 100)}% of total</p>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                          <div className="text-3xl font-bold text-red-700">{analysisResults.sentimentDistribution.negative}</div>
                        </div>
                        <p className="text-sm font-medium text-red-800">Negative Sentiment</p>
                        <p className="text-xs text-red-600 mt-1">{Math.round((analysisResults.sentimentDistribution.negative / analysisResults.totalComments) * 100)}% of total</p>
                      </CardContent>
                    </Card>
                    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Target className="h-6 w-6 text-purple-600 mr-2" />
                          <div className="text-3xl font-bold text-purple-700">{analysisResults.topicModeling.topics.length}</div>
                        </div>
                        <p className="text-sm font-medium text-purple-800">Topics Discovered</p>
                        <p className="text-xs text-purple-600 mt-1">AI-identified themes</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* AI Insights Dashboard */}
                  <Card className="border-2 border-indigo-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                      <CardTitle className="flex items-center gap-2 text-indigo-900">
                        <Brain className="h-5 w-5" />
                        Advanced AI Analysis Insights
                      </CardTitle>
                      <CardDescription className="text-indigo-700">
                        Neural network-powered findings from comprehensive data analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="h-5 w-5 text-orange-600" />
                            <strong className="text-orange-900">Sentiment Analysis</strong>
                          </div>
                          <p className="text-sm text-orange-800">
                            <strong>{
                              Object.entries(analysisResults.sentimentDistribution)
                                .sort(([,a], [,b]) => b - a)[0][0]
                            }</strong> sentiment dominates with {
                              Object.entries(analysisResults.sentimentDistribution)
                                .sort(([,a], [,b]) => b - a)[0][1]
                            } comments ({Math.round((Object.entries(analysisResults.sentimentDistribution)
                                .sort(([,a], [,b]) => b - a)[0][1] / analysisResults.totalComments) * 100)}%)
                          </p>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Cloud className="h-5 w-5 text-green-600" />
                            <strong className="text-green-900">Keyword Analysis</strong>
                          </div>
                          <p className="text-sm text-green-800">
                            "<strong>{analysisResults.wordCloud[0]?.text}</strong>" is the most mentioned term, appearing {analysisResults.wordCloud[0]?.value} times across all comments
                          </p>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-5 w-5 text-purple-600" />
                            <strong className="text-purple-900">ML Model Performance</strong>
                          </div>
                          <p className="text-sm text-purple-800">
                            Neural network analysis achieved <strong>{Math.round(analysisResults.advancedMetrics.modelConfidence * 100)}%</strong> confidence with enhanced feature extraction
                          </p>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-5 w-5 text-blue-600" />
                            <strong className="text-blue-900">Topic Modeling</strong>
                          </div>
                          <p className="text-sm text-blue-800">
                            Discovered <strong>{analysisResults.topicModeling.topics.length}</strong> distinct themes with <strong>{Math.round(analysisResults.topicModeling.topic_coherence * 100)}%</strong> coherence score
                          </p>
                        </div>
                      </div>
                      
                      {/* Processing Statistics */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-gray-700">{analysisResults.advancedMetrics.processingTime}ms</div>
                            <div className="text-xs text-gray-600">Processing Time</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-700">{Math.round(analysisResults.advancedMetrics.analysisQuality * 100)}%</div>
                            <div className="text-xs text-gray-600">Analysis Quality</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-700">{Math.round(analysisResults.advancedMetrics.dataQuality * 100)}%</div>
                            <div className="text-xs text-gray-600">Data Quality</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced ML Pipeline Status */}
                      {analysisResults.advancedMetrics.pipelinePerformance && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                          <h4 className="font-medium text-indigo-900 mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Enhanced ML Pipeline Status
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-indigo-700">{Math.round(analysisResults.advancedMetrics.pipelinePerformance.classification.accuracy * 100)}%</div>
                              <div className="text-xs text-indigo-600">Classification Accuracy</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-indigo-700">{Math.round(analysisResults.advancedMetrics.pipelinePerformance.classification.f1Score * 100)}%</div>
                              <div className="text-xs text-indigo-600">F1 Score</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-indigo-700">{analysisResults.advancedMetrics.pipelinePerformance.embedding.dimension}</div>
                              <div className="text-xs text-indigo-600">Embedding Dimensions</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-indigo-700">{analysisResults.advancedMetrics.pipelinePerformance.preprocessing.tokensPerSecond}</div>
                              <div className="text-xs text-indigo-600">Tokens/Second</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Discovered Topics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Discovered Topics</CardTitle>
                    <CardDescription>AI-identified consultation themes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisResults.topicModeling.topics.slice(0, 8).map((topic, index) => (
                        <div key={topic.id} className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate flex-1">{topic.label}</span>
                          <Badge variant="outline" className="ml-2">
                            {Math.round(topic.coherence_score * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No analysis results available. Add comments to begin analysis.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sentiment">
            {analysisResults ? (
              <SentimentAnalysis results={analysisResults} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Add comments to view sentiment analysis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="wordcloud">
            {analysisResults ? (
              <WordCloudVisualization 
                wordCloudData={analysisResults.wordCloud} 
                totalComments={analysisResults.totalComments}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Upload comments file to generate advanced word cloud</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="summary">
            {analysisResults ? (
              <SummaryGeneration 
                summary={analysisResults.summary} 
                totalComments={analysisResults.totalComments}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Add comments to generate summary</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="metrics">
            {analysisResults ? (
              <ModelMetrics results={analysisResults} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Add comments to view AI model metrics</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>All Comments ({comments.length})</CardTitle>
                <CardDescription>
                  Complete list of stakeholder submissions with AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{comment.stakeholder}</Badge>
                            <Badge variant="secondary">{comment.section}</Badge>
                            {comment.sentiment && (
                              <Badge className={getSentimentColor(comment.sentiment.label)}>
                                {comment.sentiment.label} ({Math.round(comment.sentiment.confidence * 100)}%)
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {comment.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{comment.text}</p>
                        {comment.sentiment && (
                          <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                            <div>
                              <strong>AI Analysis:</strong> {comment.sentiment.reasoning}
                            </div>
                            {comment.sentiment.subsentiments && comment.sentiment.subsentiments.length > 0 && (
                              <div>
                                <strong>Aspect Analysis:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {comment.sentiment.subsentiments.slice(0, 3).map((sub, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {sub.aspect}: {sub.sentiment}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <Separator />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>

      {/* AI Chatbot */}
      <AIChatbot 
        comments={comments}
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </div>
  );
}