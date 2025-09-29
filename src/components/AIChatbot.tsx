import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { MessageSquare, Send, Bot, User, Brain, FileText, BarChart3, Sparkles } from 'lucide-react';
import { Comment, SentimentResult, analyzeSentiment, generateSummary } from '../services/aiAnalysis';
import { NLPProcessor } from '../ml/nlpProcessor';
import { SentimentModel } from '../ml/sentimentModel';
import { AdvancedSummaryGenerator } from '../ml/summaryGenerator';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  metadata?: {
    sentiment?: SentimentResult;
    summary?: any;
    analytics?: any;
    commentId?: string;
  };
}

interface AIChatbotProps {
  comments: Comment[];
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatbot({ comments, isOpen, onClose }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [nlpProcessor] = useState(() => new NLPProcessor());
  const [sentimentModel] = useState(() => new SentimentModel());
  const [summaryGenerator] = useState(() => new AdvancedSummaryGenerator());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome-' + Date.now(),
        type: 'bot',
        content: `👋 Hello! I'm your AI assistant for eConsultation analysis. I can help you with:

🔍 **Individual Comment Analysis** - Get detailed sentiment and insights for specific comments
📊 **Custom Summaries** - Generate summaries for filtered comments or specific stakeholders  
📈 **Analytics & Insights** - Deep dive into patterns and trends
🎯 **Recommendations** - Get AI-powered suggestions based on the data

I currently have access to ${comments.length} comments from your dataset. What would you like to explore?

**Try asking:**
- "Analyze comment #5 in detail"
- "Summarize all negative comments"
- "What are the main concerns from industry stakeholders?"
- "Show me sentiment trends by stakeholder type"`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    }
  }, [isOpen, comments.length]);

  const predefinedQueries = [
    {
      label: "Analyze Random Comment",
      query: "analyze a random comment in detail",
      icon: <Brain className="h-4 w-4" />
    },
    {
      label: "Negative Comments Summary", 
      query: "summarize all negative comments",
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: "Stakeholder Insights",
      query: "show insights by stakeholder type",
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      label: "Key Recommendations",
      query: "what are the key recommendations based on the analysis?",
      icon: <Sparkles className="h-4 w-4" />
    }
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await processUserQuery(inputValue);
      
      const botMessage: ChatMessage = {
        id: 'bot-' + Date.now(),
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000 + Math.random() * 1000); // Simulate thinking time

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        type: 'bot',
        content: `Sorry, I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try rephrasing your question.`,
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const processUserQuery = async (query: string): Promise<{ content: string; metadata?: any }> => {
    const lowerQuery = query.toLowerCase();
    
    // Comment-specific analysis
    if (lowerQuery.includes('comment') && (lowerQuery.includes('#') || lowerQuery.includes('analyze'))) {
      return await analyzeSpecificComment(query);
    }
    
    // Sentiment-based filtering
    if (lowerQuery.includes('negative') || lowerQuery.includes('positive') || lowerQuery.includes('neutral')) {
      return await analyzeBySentiment(query);
    }
    
    // Stakeholder analysis
    if (lowerQuery.includes('stakeholder') || lowerQuery.includes('organization') || lowerQuery.includes('entity')) {
      return await analyzeByStakeholder(query);
    }
    
    // Summary requests
    if (lowerQuery.includes('summary') || lowerQuery.includes('summarize')) {
      return await generateCustomSummary(query);
    }
    
    // Recommendations
    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggestion') || lowerQuery.includes('advice')) {
      return await generateRecommendations(query);
    }
    
    // Insights and analytics
    if (lowerQuery.includes('insight') || lowerQuery.includes('trend') || lowerQuery.includes('pattern')) {
      return await generateInsights(query);
    }
    
    // General statistics
    if (lowerQuery.includes('statistic') || lowerQuery.includes('count') || lowerQuery.includes('how many')) {
      return generateStatistics(query);
    }
    
    // Default response for unrecognized queries
    return {
      content: `I understand you're asking about: "${query}"

Let me help you explore this dataset better. Here's what I can do:

**🔍 Comment Analysis:**
- "Analyze comment #3" - Deep dive into specific comments
- "Show me comment with highest confidence score"

**📊 Filtering & Summaries:**
- "Summarize positive/negative comments"
- "Comments from legal practitioners"
- "Section-specific feedback"

**📈 Analytics:**
- "Sentiment distribution by stakeholder"
- "Most common themes"
- "Processing quality metrics"

Try asking a more specific question, or use one of the suggested queries below!`
    };
  };

  const analyzeSpecificComment = async (query: string): Promise<{ content: string; metadata?: any }> => {
    // Extract comment number or use random if not specified
    const commentMatch = query.match(/#(\d+)/);
    let targetComment: Comment;
    let commentIndex: number;
    
    if (commentMatch) {
      commentIndex = parseInt(commentMatch[1]) - 1;
      if (commentIndex < 0 || commentIndex >= comments.length) {
        return {
          content: `Comment #${commentMatch[1]} doesn't exist. I have ${comments.length} comments available (1-${comments.length}).`
        };
      }
      targetComment = comments[commentIndex];
    } else {
      commentIndex = Math.floor(Math.random() * comments.length);
      targetComment = comments[commentIndex];
    }

    // Perform detailed analysis
    const sentimentAnalysis = analyzeSentiment(targetComment.text, targetComment.section);
    const nlpFeatures = nlpProcessor.extractDomainFeatures(targetComment.text);
    const tokenized = nlpProcessor.tokenize(targetComment.text);
    
    let analysisContent = `## 📝 Comment #${commentIndex + 1} - Deep Analysis

**Original Text:**
"${targetComment.text.substring(0, 200)}${targetComment.text.length > 200 ? '...' : ''}"

**📊 Stakeholder Information:**
- **Source:** ${targetComment.stakeholder}
- **Section:** ${targetComment.section || 'General'}
- **Date:** ${targetComment.timestamp.toLocaleDateString()}

**🧠 AI Sentiment Analysis:**
- **Classification:** ${sentimentAnalysis.label.toUpperCase()} (${Math.round(sentimentAnalysis.confidence * 100)}% confidence)
- **Reasoning:** ${sentimentAnalysis.reasoning}

**🔍 Linguistic Analysis:**
- **Word Count:** ${tokenized.tokens.length} words
- **Sentences:** ${tokenized.sentences.length}
- **Legal Terms:** ${nlpFeatures.legalTermsCount} identified
- **Business Terms:** ${nlpFeatures.businessTermsCount} identified
- **Complexity Score:** ${Math.round(nlpFeatures.complexityScore * 100)}%
- **Formality Score:** ${Math.round(nlpFeatures.formalityScore * 100)}%

**🎯 Key Features Detected:**`;

    if (sentimentAnalysis.subsentiments && sentimentAnalysis.subsentiments.length > 0) {
      analysisContent += `\n\n**📋 Aspect-Based Analysis:**`;
      sentimentAnalysis.subsentiments.forEach(sub => {
        analysisContent += `\n- **${sub.aspect}:** ${sub.sentiment} (${Math.round(sub.confidence * 100)}% confidence)`;
      });
    }

    if (tokenized.namedEntities.length > 0) {
      analysisContent += `\n\n**🏷️ Named Entities:**`;
      tokenized.namedEntities.slice(0, 5).forEach(entity => {
        analysisContent += `\n- **${entity.text}** (${entity.label})`;
      });
    }

    analysisContent += `\n\n**💡 AI Insights:**
- This comment shows ${nlpFeatures.technicalTermsRatio > 0.1 ? 'high' : 'moderate'} technical language usage
- Formality level is ${nlpFeatures.formalityScore > 0.5 ? 'high' : 'moderate'}, indicating ${nlpFeatures.formalityScore > 0.5 ? 'professional' : 'casual'} communication style
- The sentiment analysis is ${sentimentAnalysis.confidence > 0.8 ? 'highly confident' : 'moderately confident'} in its classification`;

    return {
      content: analysisContent,
      metadata: {
        sentiment: sentimentAnalysis,
        analytics: nlpFeatures,
        commentId: targetComment.id
      }
    };
  };

  const analyzeBySentiment = async (query: string): Promise<{ content: string; metadata?: any }> => {
    const lowerQuery = query.toLowerCase();
    let targetSentiment: string;
    
    if (lowerQuery.includes('positive')) targetSentiment = 'positive';
    else if (lowerQuery.includes('negative')) targetSentiment = 'negative';
    else if (lowerQuery.includes('neutral')) targetSentiment = 'neutral';
    else targetSentiment = 'all';

    const filteredComments = comments.filter(comment => {
      if (!comment.sentiment) return false;
      return targetSentiment === 'all' || comment.sentiment.label === targetSentiment;
    });

    if (filteredComments.length === 0) {
      return {
        content: `No comments found with ${targetSentiment} sentiment. The comments may not have been analyzed yet, or there might not be any ${targetSentiment} comments in the dataset.`
      };
    }

    // Generate summary for filtered comments
    const summaryResult = await generateSummary(filteredComments);
    
    let content = `## 📊 ${targetSentiment.toUpperCase()} Comments Analysis

**📈 Overview:**
- **Total ${targetSentiment} comments:** ${filteredComments.length} out of ${comments.length}
- **Percentage:** ${Math.round((filteredComments.length / comments.length) * 100)}%

**🎯 Key Insights:**
${summaryResult.keyPoints.map(point => `- ${point}`).join('\n')}

**📝 Executive Summary:**
${summaryResult.overallSummary}

**🏢 Stakeholder Breakdown:**`;

    // Analyze stakeholder distribution
    const stakeholderDistribution = filteredComments.reduce((acc, comment) => {
      acc[comment.stakeholder] = (acc[comment.stakeholder] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    Object.entries(stakeholderDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([stakeholder, count]) => {
        content += `\n- **${stakeholder}:** ${count} comments`;
      });

    if (summaryResult.recommendations.length > 0) {
      content += `\n\n**💡 Recommendations:**`;
      summaryResult.recommendations.forEach(rec => {
        content += `\n- ${rec}`;
      });
    }

    return {
      content,
      metadata: { summary: summaryResult }
    };
  };

  const analyzeByStakeholder = async (query: string): Promise<{ content: string; metadata?: any }> => {
    // Group comments by stakeholder
    const stakeholderGroups = comments.reduce((acc, comment) => {
      acc[comment.stakeholder] = acc[comment.stakeholder] || [];
      acc[comment.stakeholder].push(comment);
      return acc;
    }, {} as { [key: string]: Comment[] });

    let content = `## 🏢 Stakeholder Analysis

**📊 Overview:**
- **Total Stakeholders:** ${Object.keys(stakeholderGroups).length}
- **Total Comments:** ${comments.length}

**📈 Stakeholder Distribution:**`;

    const sortedStakeholders = Object.entries(stakeholderGroups)
      .sort(([,a], [,b]) => b.length - a.length);

    sortedStakeholders.forEach(([stakeholder, comments], index) => {
      const avgLength = comments.reduce((sum, c) => sum + c.text.length, 0) / comments.length;
      const sentimentDist = comments.reduce((acc, c) => {
        if (c.sentiment) {
          acc[c.sentiment.label] = (acc[c.sentiment.label] || 0) + 1;
        }
        return acc;
      }, {} as { [key: string]: number });

      const dominantSentiment = Object.entries(sentimentDist)
        .sort(([,a], [,b]) => b - a)[0];

      content += `\n\n**${index + 1}. ${stakeholder}**
- **Comments:** ${comments.length} (${Math.round((comments.length / comments.length) * 100)}%)
- **Avg Length:** ${Math.round(avgLength)} characters
- **Dominant Sentiment:** ${dominantSentiment ? dominantSentiment[0] : 'Unknown'}`;
    });

    content += `\n\n**🎯 Key Insights:**
- Most active stakeholder: **${sortedStakeholders[0][0]}** (${sortedStakeholders[0][1].length} comments)
- Average comments per stakeholder: ${Math.round(comments.length / Object.keys(stakeholderGroups).length)}
- Stakeholder diversity index: ${Object.keys(stakeholderGroups).length / comments.length > 0.3 ? 'High' : 'Moderate'}`;

    return { content };
  };

  const generateCustomSummary = async (query: string): Promise<{ content: string; metadata?: any }> => {
    const summaryResult = await generateSummary(comments);
    
    let content = `## 📄 Comprehensive Summary

**📊 Dataset Overview:**
- **Total Comments:** ${comments.length}
- **Analysis Date:** ${new Date().toLocaleDateString()}

**🎯 Executive Summary:**
${summaryResult.executiveSummary || summaryResult.overallSummary}

**📋 Key Points:**`;

    summaryResult.keyPoints.forEach(point => {
      content += `\n- ${point}`;
    });

    if (summaryResult.stakeholderSummaries && summaryResult.stakeholderSummaries.length > 0) {
      content += `\n\n**🏢 Stakeholder Insights:**`;
      summaryResult.stakeholderSummaries.slice(0, 3).forEach(stakeholder => {
        content += `\n\n**${stakeholder.stakeholder_type}** (${stakeholder.document_count} comments)
- Summary: ${stakeholder.summary.substring(0, 150)}...
- Sentiment: ${stakeholder.sentiment_overview}`;
      });
    }

    content += `\n\n**💡 Recommendations:**`;
    summaryResult.recommendations.forEach(rec => {
      content += `\n- ${rec}`;
    });

    if (summaryResult.qualityMetrics) {
      content += `\n\n**⚡ Analysis Quality:**
- **Relevance:** ${Math.round(summaryResult.qualityMetrics.relevance * 100)}%
- **Coherence:** ${Math.round(summaryResult.qualityMetrics.coherence * 100)}%
- **Coverage:** ${Math.round(summaryResult.qualityMetrics.coverage * 100)}%`;
    }

    return {
      content,
      metadata: { summary: summaryResult }
    };
  };

  const generateRecommendations = async (query: string): Promise<{ content: string; metadata?: any }> => {
    const summaryResult = await generateSummary(comments);
    
    let content = `## 💡 AI-Powered Recommendations

Based on my analysis of ${comments.length} comments, here are my key recommendations:

**🎯 Primary Recommendations:**`;

    summaryResult.recommendations.forEach((rec, index) => {
      content += `\n\n**${index + 1}.** ${rec}`;
    });

    // Add data-driven insights
    const sentimentCounts = comments.reduce((acc, comment) => {
      if (comment.sentiment) {
        acc[comment.sentiment.label] = (acc[comment.sentiment.label] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    const negativeRatio = (sentimentCounts.negative || 0) / comments.length;
    const positiveRatio = (sentimentCounts.positive || 0) / comments.length;

    content += `\n\n**📊 Data-Driven Insights:**`;

    if (negativeRatio > 0.3) {
      content += `\n- **High Concern Level:** ${Math.round(negativeRatio * 100)}% of comments express concerns - immediate attention required`;
    }

    if (positiveRatio > 0.5) {
      content += `\n- **Strong Support:** ${Math.round(positiveRatio * 100)}% positive sentiment indicates good stakeholder alignment`;
    }

    const stakeholderCount = new Set(comments.map(c => c.stakeholder)).size;
    content += `\n- **Stakeholder Engagement:** ${stakeholderCount} different stakeholders participated - ${stakeholderCount > 10 ? 'excellent' : 'good'} representation`;

    content += `\n\n**🚀 Next Steps:**
1. **Prioritize** addressing the most frequently raised concerns
2. **Engage** with stakeholders showing negative sentiment for clarification  
3. **Leverage** positive feedback to strengthen proposal acceptance
4. **Monitor** ongoing sentiment through additional consultation rounds
5. **Document** lessons learned for future consultation processes`;

    return { content };
  };

  const generateInsights = async (query: string): Promise<{ content: string; metadata?: any }> => {
    // Perform advanced analytics
    const sentimentDist = comments.reduce((acc, comment) => {
      if (comment.sentiment) {
        acc[comment.sentiment.label] = (acc[comment.sentiment.label] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    const avgConfidence = comments
      .filter(c => c.sentiment)
      .reduce((sum, c) => sum + c.sentiment!.confidence, 0) / 
      comments.filter(c => c.sentiment).length;

    const stakeholderEngagement = new Set(comments.map(c => c.stakeholder)).size;
    
    let content = `## 📈 Advanced Analytics & Insights

**🧠 AI Model Performance:**
- **Average Confidence:** ${Math.round(avgConfidence * 100)}% (${avgConfidence > 0.8 ? 'Excellent' : avgConfidence > 0.6 ? 'Good' : 'Fair'})
- **Processing Success:** ${Math.round((comments.filter(c => c.sentiment).length / comments.length) * 100)}%

**📊 Sentiment Distribution:**`;

    Object.entries(sentimentDist).forEach(([sentiment, count]) => {
      const percentage = Math.round((count / comments.length) * 100);
      content += `\n- **${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}:** ${count} comments (${percentage}%)`;
    });

    content += `\n\n**🎯 Engagement Metrics:**
- **Stakeholder Diversity:** ${stakeholderEngagement} unique participants
- **Average Comment Length:** ${Math.round(comments.reduce((sum, c) => sum + c.text.length, 0) / comments.length)} characters
- **Participation Rate:** ${stakeholderEngagement > 20 ? 'High' : stakeholderEngagement > 10 ? 'Medium' : 'Low'}

**🔍 Quality Indicators:**
- **Data Completeness:** ${Math.round((comments.filter(c => c.stakeholder !== 'Unknown').length / comments.length) * 100)}%
- **Temporal Spread:** ${Math.round((new Date().getTime() - Math.min(...comments.map(c => c.timestamp.getTime()))) / (1000 * 60 * 60 * 24))} days
- **Content Richness:** ${comments.filter(c => c.text.length > 100).length} detailed comments (${Math.round((comments.filter(c => c.text.length > 100).length / comments.length) * 100)}%)

**💎 Key Patterns:**`;

    // Identify patterns
    if (sentimentDist.negative && sentimentDist.negative > sentimentDist.positive) {
      content += `\n- **Concern Pattern:** Negative sentiment dominates - suggests need for policy refinement`;
    }

    if (avgConfidence > 0.8) {
      content += `\n- **High AI Confidence:** Model predictions are highly reliable for decision-making`;
    }

    if (stakeholderEngagement > comments.length * 0.5) {
      content += `\n- **High Diversity:** Strong representation across different stakeholder groups`;
    }

    return { content };
  };

  const generateStatistics = (query: string): { content: string; metadata?: any } => {
    const stats = {
      totalComments: comments.length,
      uniqueStakeholders: new Set(comments.map(c => c.stakeholder)).size,
      avgLength: Math.round(comments.reduce((sum, c) => sum + c.text.length, 0) / comments.length),
      analyzedComments: comments.filter(c => c.sentiment).length,
      dateRange: {
        start: new Date(Math.min(...comments.map(c => c.timestamp.getTime()))),
        end: new Date(Math.max(...comments.map(c => c.timestamp.getTime())))
      }
    };

    const content = `## 📊 Dataset Statistics

**📈 General Statistics:**
- **Total Comments:** ${stats.totalComments}
- **Unique Stakeholders:** ${stats.uniqueStakeholders}
- **Average Comment Length:** ${stats.avgLength} characters
- **AI Analyzed:** ${stats.analyzedComments} comments (${Math.round((stats.analyzedComments / stats.totalComments) * 100)}%)

**📅 Temporal Information:**
- **Date Range:** ${stats.dateRange.start.toLocaleDateString()} to ${stats.dateRange.end.toLocaleDateString()}
- **Duration:** ${Math.round((stats.dateRange.end.getTime() - stats.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))} days

**🎯 Engagement Metrics:**
- **Comments per Stakeholder:** ${Math.round(stats.totalComments / stats.uniqueStakeholders)}
- **Participation Rate:** ${stats.uniqueStakeholders > 20 ? 'High' : 'Moderate'}
- **Data Quality:** ${stats.analyzedComments === stats.totalComments ? 'Excellent' : 'Good'}`;

    return { content };
  };

  const handlePredefinedQuery = (query: string) => {
    setInputValue(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border-2 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-blue-900">AI Analysis Assistant</CardTitle>
              <CardDescription className="text-blue-700">
                Intelligent insights for {comments.length} comments • Neural-powered analysis
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="hover:bg-red-100 hover:text-red-600 text-lg font-bold"
          >
            ×
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className={message.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-600'}>
                          {message.type === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`mx-3 p-4 rounded-lg shadow-sm ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        
                        {message.metadata && (
                          <div className={`mt-3 pt-3 ${message.type === 'user' ? 'border-t border-blue-400' : 'border-t border-gray-200'}`}>
                            {message.metadata.sentiment && (
                              <Badge variant="outline" className="mr-2 text-xs">
                                {message.metadata.sentiment.label}: {Math.round(message.metadata.sentiment.confidence * 100)}%
                              </Badge>
                            )}
                            {message.metadata.commentId && (
                              <Badge variant="outline" className="text-xs">
                                Comment ID: {message.metadata.commentId}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-600">
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="mx-3 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                        <div className="flex space-x-2 items-center">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-600">AI is analyzing...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Predefined Queries */}
          {messages.length <= 1 && (
            <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="text-sm font-medium mb-3 text-blue-900">Quick Actions:</div>
              <div className="grid grid-cols-2 gap-2">
                {predefinedQueries.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePredefinedQuery(query.query)}
                    className="flex items-center gap-2 justify-start text-left h-auto p-3 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                  >
                    {query.icon}
                    <span className="text-xs">{query.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex space-x-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Ask me anything about the comments... (e.g., 'analyze comment #5' or 'summarize negative feedback')"
                disabled={isTyping}
                className="flex-1 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isTyping || !inputValue.trim()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}