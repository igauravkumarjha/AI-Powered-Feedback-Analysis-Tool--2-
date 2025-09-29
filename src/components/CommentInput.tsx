import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Upload, Plus, X, FileText, Brain } from 'lucide-react';
import { Comment, analyzeSentiment } from '../services/aiAnalysis';
import { Alert, AlertDescription } from './ui/alert';

interface CommentInputProps {
  onCommentsAdded: (comments: Comment[]) => void;
  existingComments: Comment[];
}

export function CommentInput({ onCommentsAdded, existingComments }: CommentInputProps) {
  const [newComment, setNewComment] = useState({
    text: '',
    stakeholder: '',
    section: ''
  });
  const [bulkComments, setBulkComments] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  const handleSingleCommentSubmit = () => {
    if (!newComment.text.trim() || !newComment.stakeholder.trim()) return;

    setIsAnalyzing(true);
    
    setTimeout(() => {
      const comment: Comment = {
        id: Date.now().toString(),
        text: newComment.text,
        stakeholder: newComment.stakeholder,
        section: newComment.section || 'General',
        timestamp: new Date(),
        sentiment: analyzeSentiment(newComment.text, newComment.section)
      };

      onCommentsAdded([comment]);
      
      setNewComment({
        text: '',
        stakeholder: '',
        section: ''
      });
      
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleBulkCommentsSubmit = () => {
    if (!bulkComments.trim()) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      const commentLines = bulkComments.split('\n').filter(line => line.trim());
      const comments: Comment[] = commentLines.map((line, index) => {
        const comment: Comment = {
          id: (Date.now() + index).toString(),
          text: line.trim(),
          stakeholder: `Stakeholder ${existingComments.length + index + 1}`,
          section: 'General',
          timestamp: new Date(),
          sentiment: analyzeSentiment(line.trim())
        };
        return comment;
      });

      onCommentsAdded(comments);
      setBulkComments('');
      setIsAnalyzing(false);
    }, 2000);
  };

  const sampleComments = [
    "I strongly support the proposed amendments to Section 12 as they will reduce compliance burden significantly.",
    "The proposed changes in Section 45 are problematic and may create regulatory uncertainty for smaller companies.",
    "Based on the Supreme Court judgment in XYZ vs. Union of India, these provisions need constitutional review.",
    "We appreciate the digital-first approach but suggest a longer implementation timeline.",
    "Section 78 amendments align well with international best practices and should be implemented."
  ];

  const addSampleComments = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const comments: Comment[] = sampleComments.map((text, index) => ({
        id: (Date.now() + index).toString(),
        text,
        stakeholder: `Sample Stakeholder ${index + 1}`,
        section: `Section ${12 + (index * 15)}`,
        timestamp: new Date(),
        sentiment: analyzeSentiment(text, `Section ${12 + (index * 15)}`)
      }));

      onCommentsAdded(comments);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Input Method Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Comments for Analysis
          </CardTitle>
          <CardDescription>
            Input stakeholder comments individually or in bulk for AI-powered analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'single' ? 'default' : 'outline'}
              onClick={() => setActiveTab('single')}
              size="sm"
            >
              Single Comment
            </Button>
            <Button
              variant={activeTab === 'bulk' ? 'default' : 'outline'}
              onClick={() => setActiveTab('bulk')}
              size="sm"
            >
              Bulk Input
            </Button>
          </div>

          {activeTab === 'single' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stakeholder">Stakeholder Name</Label>
                  <Input
                    id="stakeholder"
                    placeholder="e.g., Industry Association of India"
                    value={newComment.stakeholder}
                    onChange={(e) => setNewComment(prev => ({ ...prev, stakeholder: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="section">Section (Optional)</Label>
                  <Select
                    value={newComment.section}
                    onValueChange={(value) => setNewComment(prev => ({ ...prev, section: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Section 12">Section 12</SelectItem>
                      <SelectItem value="Section 45">Section 45</SelectItem>
                      <SelectItem value="Section 78">Section 78</SelectItem>
                      <SelectItem value="Section 101">Section 101</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="comment">Comment Text</Label>
                <Textarea
                  id="comment"
                  placeholder="Enter stakeholder comment or feedback..."
                  className="min-h-[120px]"
                  value={newComment.text}
                  onChange={(e) => setNewComment(prev => ({ ...prev, text: e.target.value }))}
                />
              </div>

              <Button
                onClick={handleSingleCommentSubmit}
                disabled={!newComment.text.trim() || !newComment.stakeholder.trim() || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Comment...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Comment for Analysis
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulkComments">Bulk Comments</Label>
                <Textarea
                  id="bulkComments"
                  placeholder="Enter multiple comments, one per line..."
                  className="min-h-[200px]"
                  value={bulkComments}
                  onChange={(e) => setBulkComments(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Enter one comment per line. Each will be analyzed separately.
                </p>
              </div>

              <Button
                onClick={handleBulkCommentsSubmit}
                disabled={!bulkComments.trim() || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Comments...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Process Bulk Comments
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sample Comments
          </CardTitle>
          <CardDescription>
            Add sample MCA21 consultation comments for demonstration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            {sampleComments.slice(0, 3).map((comment, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                "{comment}"
              </div>
            ))}
            <p className="text-sm text-muted-foreground">...and 2 more sample comments</p>
          </div>
          
          <Button
            onClick={addSampleComments}
            disabled={isAnalyzing}
            variant="outline"
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-spin" />
                Processing Sample Data...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Sample Comments
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Status</CardTitle>
          <CardDescription>
            Current state of the comment analysis system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{existingComments.length}</div>
              <div className="text-sm text-muted-foreground">Comments Loaded</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {existingComments.filter(c => c.sentiment).length}
              </div>
              <div className="text-sm text-muted-foreground">Comments Analyzed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">Ready</div>
              <div className="text-sm text-muted-foreground">System Status</div>
            </div>
          </div>

          {isAnalyzing && (
            <Alert className="mt-4">
              <Brain className="h-4 w-4" />
              <AlertDescription>
                AI analysis in progress... Processing comments for sentiment analysis, keyword extraction, and summary generation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}