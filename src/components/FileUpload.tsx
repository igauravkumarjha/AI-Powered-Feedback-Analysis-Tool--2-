import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Upload, File, CheckCircle, AlertCircle, X, FileText, Database } from 'lucide-react';
import { Comment } from '../services/aiAnalysis';

interface FileUploadProps {
  onCommentsUploaded: (comments: Comment[]) => void;
  isProcessing: boolean;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  commentsCount?: number;
  error?: string;
}

export function FileUpload({ onCommentsUploaded, isProcessing }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = [
    { ext: '.csv', desc: 'CSV files with comment columns' },
    { ext: '.txt', desc: 'Text files (one comment per line)' },
    { ext: '.json', desc: 'JSON files with comment arrays' },
    { ext: '.tsv', desc: 'Tab-separated values' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      content: '',
      status: 'uploading' as const
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndex = uploadedFiles.length + i;
      
      try {
        setUploadProgress((i / files.length) * 50); // First 50% for upload
        
        const content = await readFileContent(file);
        
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { ...f, content, status: 'processing' } : f
        ));

        setUploadProgress(50 + (i / files.length) * 30); // Next 30% for processing
        
        const comments = await parseFileContent(content, file.name);
        
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { 
            ...f, 
            status: 'completed', 
            commentsCount: comments.length 
          } : f
        ));

        setUploadProgress(80 + (i / files.length) * 20); // Final 20% for completion
        
        // Pass comments to parent component
        onCommentsUploaded(comments);
        
      } catch (error) {
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } : f
        ));
      }
    }
    
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 2000);
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const parseFileContent = async (content: string, filename: string): Promise<Comment[]> => {
    const fileExtension = filename.toLowerCase().split('.').pop();
    const comments: Comment[] = [];

    try {
      switch (fileExtension) {
        case 'csv':
          return parseCSV(content);
        case 'tsv':
          return parseTSV(content);
        case 'txt':
          return parseTXT(content);
        case 'json':
          return parseJSON(content);
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${fileExtension} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const parseCSV = (content: string): Comment[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('Empty file');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const commentIndex = findCommentColumn(headers);
    const stakeholderIndex = findStakeholderColumn(headers);
    const sectionIndex = findSectionColumn(headers);
    const timestampIndex = findTimestampColumn(headers);

    const comments: Comment[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length > commentIndex && values[commentIndex].trim()) {
        const comment: Comment = {
          id: `file-comment-${Date.now()}-${i}`,
          text: values[commentIndex].trim(),
          timestamp: timestampIndex !== -1 && values[timestampIndex] 
            ? new Date(values[timestampIndex]) 
            : new Date(),
          stakeholder: stakeholderIndex !== -1 && values[stakeholderIndex] 
            ? values[stakeholderIndex].trim() 
            : 'Unknown Stakeholder',
          section: sectionIndex !== -1 && values[sectionIndex] 
            ? values[sectionIndex].trim() 
            : undefined
        };
        comments.push(comment);
      }
    }

    if (comments.length === 0) throw new Error('No valid comments found in file');
    return comments;
  };

  const parseTSV = (content: string): Comment[] => {
    // Similar to CSV but with tab separator
    const tsvContent = content.replace(/\t/g, ',');
    return parseCSV(tsvContent);
  };

  const parseTXT = (content: string): Comment[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('Empty file');

    return lines.map((line, index) => ({
      id: `file-comment-${Date.now()}-${index}`,
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
        id: `file-comment-${Date.now()}-${index}`,
        text: typeof item === 'string' ? item : (item.comment || item.text || item.content || JSON.stringify(item)),
        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
        stakeholder: item.stakeholder || item.author || item.user || 'JSON Upload',
        section: item.section || item.category || undefined
      }));
    } else if (data.comments && Array.isArray(data.comments)) {
      return data.comments.map((comment: any, index: number) => ({
        id: `file-comment-${Date.now()}-${index}`,
        text: comment.text || comment.comment || comment.content || '',
        timestamp: comment.timestamp ? new Date(comment.timestamp) : new Date(),
        stakeholder: comment.stakeholder || comment.author || 'JSON Upload',
        section: comment.section || undefined
      }));
    } else {
      throw new Error('Invalid JSON format. Expected array of comments or object with comments array.');
    }
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

  const findCommentColumn = (headers: string[]): number => {
    const commentHeaders = ['comment', 'text', 'content', 'feedback', 'message', 'response', 'remarks'];
    for (const header of commentHeaders) {
      const index = headers.findIndex(h => h.includes(header));
      if (index !== -1) return index;
    }
    return 0; // Default to first column
  };

  const findStakeholderColumn = (headers: string[]): number => {
    const stakeholderHeaders = ['stakeholder', 'author', 'user', 'name', 'organization', 'entity'];
    for (const header of stakeholderHeaders) {
      const index = headers.findIndex(h => h.includes(header));
      if (index !== -1) return index;
    }
    return -1;
  };

  const findSectionColumn = (headers: string[]): number => {
    const sectionHeaders = ['section', 'category', 'topic', 'area', 'clause'];
    for (const header of sectionHeaders) {
      const index = headers.findIndex(h => h.includes(header));
      if (index !== -1) return index;
    }
    return -1;
  };

  const findTimestampColumn = (headers: string[]): number => {
    const timestampHeaders = ['timestamp', 'date', 'time', 'created', 'submitted'];
    for (const header of timestampHeaders) {
      const index = headers.findIndex(h => h.includes(header));
      if (index !== -1) return index;
    }
    return -1;
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  const getFileIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Database className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Comments File
          </CardTitle>
          <CardDescription>
            Upload CSV, TXT, JSON, or TSV files containing stakeholder comments for AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              
              <div>
                <p className="text-lg font-medium">
                  Drop your files here, or{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-500"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Supports multiple files up to 10MB each
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.txt,.json,.tsv"
                onChange={handleChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Processing files...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Formats */}
      <Card>
        <CardHeader>
          <CardTitle>Supported File Formats</CardTitle>
          <CardDescription>
            The system can automatically detect and parse these file formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportedFormats.map((format, index) => (
              <div key={index} className="flex items-center p-3 border rounded-lg">
                <FileText className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <div className="font-medium">{format.ext}</div>
                  <div className="text-sm text-muted-foreground">{format.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>
                  {uploadedFiles.length} file(s) uploaded
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearAllFiles}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                        {file.commentsCount && (
                          <span className="ml-2">• {file.commentsCount} comments</span>
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
                    >
                      {file.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Format Guidelines */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>File Format Guidelines:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• CSV files should have headers like 'comment', 'stakeholder', 'section', 'timestamp'</li>
            <li>• TXT files should have one comment per line</li>
            <li>• JSON files should contain an array of comment objects or have a 'comments' property</li>
            <li>• Files are automatically parsed and analyzed using advanced AI/ML models</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}