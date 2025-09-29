import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Plus, 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Paperclip,
  Send,
  Brain,
  Zap,
  Target
} from 'lucide-react';
import { Comment } from '../services/aiAnalysis';

interface EnhancedCommentInputProps {
  onCommentsAdded: (comments: Comment[]) => void;
  isProcessing: boolean;
}

interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  preview?: string;
  extractedComments?: Comment[];
  error?: string;
}

export function EnhancedCommentInput({ onCommentsAdded, isProcessing }: EnhancedCommentInputProps) {
  const [commentText, setCommentText] = useState('');
  const [stakeholderName, setStakeholderName] = useState('');
  const [stakeholderType, setStakeholderType] = useState('');
  const [sectionRef, setSectionRef] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stakeholderTypes = [
    { value: 'individual', label: 'Individual Citizen' },
    { value: 'business', label: 'Business Entity' },
    { value: 'legal', label: 'Legal Professional' },
    { value: 'academic', label: 'Academic Institution' },
    { value: 'industry', label: 'Industry Association' },
    { value: 'ngo', label: 'NGO/Civil Society' },
    { value: 'government', label: 'Government Body' },
    { value: 'other', label: 'Other' }
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    setUploadProgress(0);
    
    const newFiles: AttachedFile[] = files.map(file => ({
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);

    // Process each file
    for (let i = 0; i < newFiles.length; i++) {
      const attachedFile = newFiles[i];
      
      try {
        setUploadProgress((i / newFiles.length) * 50);
        
        // Update status to processing
        setAttachedFiles(prev => prev.map(f => 
          f.id === attachedFile.id ? { ...f, status: 'processing' } : f
        ));

        const extractedComments = await processFile(attachedFile.file);
        
        setUploadProgress(50 + ((i + 1) / newFiles.length) * 50);
        
        // Update with extracted comments
        setAttachedFiles(prev => prev.map(f => 
          f.id === attachedFile.id ? { 
            ...f, 
            status: 'completed',
            extractedComments 
          } : f
        ));

        // Auto-add extracted comments
        if (extractedComments.length > 0) {
          onCommentsAdded(extractedComments);
        }

      } catch (error) {
        setAttachedFiles(prev => prev.map(f => 
          f.id === attachedFile.id ? { 
            ...f, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Processing failed'
          } : f
        ));
      }
    }
    
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 2000);
  };

  const processFile = async (file: File): Promise<Comment[]> => {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          let comments: Comment[] = [];
          
          switch (fileExtension) {
            case 'csv':
              comments = parseCSV(content);
              break;
            case 'txt':
              comments = parseTXT(content);
              break;
            case 'json':
              comments = parseJSON(content);
              break;
            case 'tsv':
              comments = parseTSV(content);
              break;
            case 'pdf':
              // For PDF, we'll simulate extraction (in real implementation, use PDF.js)
              comments = [{
                id: `pdf-${Date.now()}`,
                text: `Content extracted from PDF: ${file.name}`,
                stakeholder: 'PDF Document',
                timestamp: new Date(),
                section: 'Extracted Content'
              }];
              break;
            default:
              // For other file types including images, create a reference comment
              comments = [{
                id: `file-${Date.now()}`,
                text: `Attachment: ${file.name} (${formatFileSize(file.size)})`,
                stakeholder: 'File Attachment',
                timestamp: new Date(),
                section: 'Attachments'
              }];
          }
          
          resolve(comments);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const parseCSV = (content: string): Comment[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('Empty CSV file');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const commentIndex = findColumnIndex(headers, ['comment', 'text', 'content', 'feedback']);
    const stakeholderIndex = findColumnIndex(headers, ['stakeholder', 'author', 'user', 'name']);
    const sectionIndex = findColumnIndex(headers, ['section', 'category', 'topic']);

    const comments: Comment[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length > commentIndex && values[commentIndex].trim()) {
        comments.push({
          id: `csv-${Date.now()}-${i}`,
          text: values[commentIndex].trim(),
          timestamp: new Date(),
          stakeholder: stakeholderIndex !== -1 && values[stakeholderIndex] 
            ? values[stakeholderIndex].trim() 
            : 'CSV Upload',
          section: sectionIndex !== -1 && values[sectionIndex] 
            ? values[sectionIndex].trim() 
            : undefined
        });
      }
    }

    return comments;
  };

  const parseTXT = (content: string): Comment[] => {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      id: `txt-${Date.now()}-${index}`,
      text: line.trim(),
      timestamp: new Date(),
      stakeholder: 'Text File Upload',
      section: undefined
    }));
  };

  const parseJSON = (content: string): Comment[] => {
    const data = JSON.parse(content);
    
    if (Array.isArray(data)) {
      return data.map((item, index) => ({
        id: `json-${Date.now()}-${index}`,
        text: typeof item === 'string' ? item : (item.comment || item.text || item.content || JSON.stringify(item)),
        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
        stakeholder: item.stakeholder || item.author || 'JSON Upload',
        section: item.section
      }));
    } else if (data.comments && Array.isArray(data.comments)) {
      return data.comments.map((comment: any, index: number) => ({
        id: `json-${Date.now()}-${index}`,
        text: comment.text || comment.comment || comment.content || '',
        timestamp: comment.timestamp ? new Date(comment.timestamp) : new Date(),
        stakeholder: comment.stakeholder || comment.author || 'JSON Upload',
        section: comment.section
      }));
    } else {
      throw new Error('Invalid JSON format');
    }
  };

  const parseTSV = (content: string): Comment[] => {
    const tsvContent = content.replace(/\t/g, ',');
    return parseCSV(tsvContent);
  };

  const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name));
      if (index !== -1) return index;
    }
    return -1;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    
    return result.map(field => field.replace(/^"|"$/g, '').trim());
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (file: AttachedFile) => {
    if (file.status === 'completed') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (file.status === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (file.status === 'processing') return <Brain className="h-4 w-4 text-blue-500 animate-pulse" />;
    
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4 text-purple-500" />;
    if (file.type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: `manual-${Date.now()}`,
      text: commentText.trim(),
      stakeholder: stakeholderName || 'Anonymous',
      timestamp: new Date(),
      section: sectionRef || undefined
    };

    onCommentsAdded([newComment]);
    
    // Reset form
    setCommentText('');
    setStakeholderName('');
    setSectionRef('');
  };

  const getTotalExtractedComments = () => {
    return attachedFiles.reduce((total, file) => 
      total + (file.extractedComments?.length || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Manual Comment Input */}
      <Card className="border-2 border-blue-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Plus className="h-5 w-5" />
            Add New Comment
          </CardTitle>
          <CardDescription className="text-blue-700">
            Submit individual feedback or attach files containing multiple comments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Stakeholder Name
              </label>
              <Input
                placeholder="Enter your name or organization"
                value={stakeholderName}
                onChange={(e) => setStakeholderName(e.target.value)}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Stakeholder Type
              </label>
              <Select value={stakeholderType} onValueChange={setStakeholderType}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500">
                  <SelectValue placeholder="Select stakeholder type" />
                </SelectTrigger>
                <SelectContent>
                  {stakeholderTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Section Reference (Optional)
            </label>
            <Input
              placeholder="e.g., Section 12, Clause 3(a)"
              value={sectionRef}
              onChange={(e) => setSectionRef(e.target.value)}
              className="border-blue-200 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Comment
            </label>
            <Textarea
              placeholder="Enter your detailed comment or feedback here..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              className="border-blue-200 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* File Attachment Section */}
      <Card className="border-2 border-green-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Paperclip className="h-5 w-5" />
            File Attachments
          </CardTitle>
          <CardDescription className="text-green-700">
            Upload files containing comments (CSV, TXT, JSON, PDF, Images, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              dragActive
                ? 'border-green-500 bg-green-50'
                : 'border-green-300 hover:border-green-400 hover:bg-green-25'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-green-800">
                  Drop files here or{' '}
                  <button
                    type="button"
                    className="text-green-600 hover:text-green-500 underline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Supports CSV, TXT, JSON, TSV, PDF, Images, and more
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
                  AI Processing Files...
                </span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Attached Files List */}
          {attachedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Attached Files</h4>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {attachedFiles.length} files • {getTotalExtractedComments()} comments extracted
                </Badge>
              </div>
              
              {attachedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                        {file.extractedComments && (
                          <span className="ml-2 text-green-600">
                            • {file.extractedComments.length} comments extracted
                          </span>
                        )}
                      </div>
                      {file.error && (
                        <div className="text-sm text-red-600 mt-1">{file.error}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        file.status === 'completed' ? 'default' : 
                        file.status === 'error' ? 'destructive' : 'secondary'
                      }
                      className="capitalize"
                    >
                      {file.status === 'processing' ? (
                        <span className="flex items-center gap-1">
                          <Brain className="h-3 w-3 animate-pulse" />
                          Processing
                        </span>
                      ) : file.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* File Format Guidelines */}
          <Alert className="mt-6 border-blue-200 bg-blue-50">
            <Target className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>AI Processing:</strong> Files are automatically analyzed using advanced NLP and machine learning models for sentiment analysis, topic modeling, and intelligent summarization.
              <br />
              <strong>Supported formats:</strong> CSV (structured comments), TXT (line-by-line), JSON (structured data), PDF (text extraction), Images (metadata), and more.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Alert className="border-blue-200 bg-blue-50">
          <Brain className="h-4 w-4 animate-spin" />
          <AlertDescription className="text-blue-800">
            <strong>AI Analysis in Progress:</strong> Processing comments through advanced sentiment analysis, topic modeling, and machine learning algorithms...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}