import { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Cloud, RefreshCw, Download, Filter } from 'lucide-react';
import { WordCloudData } from '../services/aiAnalysis';

interface WordCloudVisualizationProps {
  wordCloudData: WordCloudData[];
  totalComments: number;
}

interface WordPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  word: WordCloudData;
}

export function WordCloudVisualization({ wordCloudData, totalComments }: WordCloudVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wordPositions, setWordPositions] = useState<WordPosition[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAnimating, setIsAnimating] = useState(false);

  const maxValue = Math.max(...wordCloudData.map(word => word.value));
  const minValue = Math.min(...wordCloudData.map(word => word.value));

  const categories = useMemo(() => 
    ['all', ...new Set(wordCloudData.map(word => word.category).filter(Boolean))],
    [wordCloudData]
  );
  
  const filteredData = useMemo(() => 
    selectedCategory === 'all' 
      ? wordCloudData 
      : wordCloudData.filter(word => word.category === selectedCategory),
    [wordCloudData, selectedCategory]
  );

  // Analysis for categorized keywords
  const categoryKeywords = useMemo(() => ({
    legal: wordCloudData.filter(w => 
      ['legal', 'court', 'case', 'judgment', 'precedent', 'provision', 'law', 'regulation', 'section', 'clause'].some(term =>
        w.text.toLowerCase().includes(term)
      )
    ),
    business: wordCloudData.filter(w => 
      ['company', 'business', 'corporate', 'compliance', 'industry', 'enterprise', 'commercial', 'stakeholder'].some(term =>
        w.text.toLowerCase().includes(term)
      )
    ),
    governance: wordCloudData.filter(w => 
      ['governance', 'transparency', 'accountability', 'oversight', 'board', 'director', 'audit', 'management'].some(term =>
        w.text.toLowerCase().includes(term)
      )
    )
  }), [wordCloudData]);

  const getFontSize = (value: number) => {
    const minSize = 14;
    const maxSize = 48;
    const normalized = (value - minValue) / (maxValue - minValue);
    return minSize + normalized * (maxSize - minSize);
  };

  const getColor = (word: WordCloudData) => {
    const colors = {
      legal: '#3B82F6',
      business: '#10B981', 
      process: '#F59E0B',
      phrase: '#8B5CF6',
      general: '#6B7280'
    };
    return colors[word.category as keyof typeof colors] || '#6B7280';
  };

  const checkCollision = (newPos: WordPosition, existingPositions: WordPosition[]): boolean => {
    const margin = 8;
    return existingPositions.some(pos => 
      newPos.x < pos.x + pos.width + margin &&
      newPos.x + newPos.width + margin > pos.x &&
      newPos.y < pos.y + pos.height + margin &&
      newPos.y + newPos.height + margin > pos.y
    );
  };

  const generateWordCloud = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with high DPI support
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Create gradient background
    const gradient = ctx.createRadialGradient(
      canvasWidth / 2, canvasHeight / 2, 0,
      canvasWidth / 2, canvasHeight / 2, Math.max(canvasWidth, canvasHeight) / 2
    );
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const positions: WordPosition[] = [];
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Sort by importance and limit to prevent overcrowding
    const sortedData = [...filteredData]
      .sort((a, b) => (b.tfidf_score || b.value) - (a.tfidf_score || a.value))
      .slice(0, 50);

    sortedData.forEach((word, index) => {
      const fontSize = getFontSize(word.value);
      const color = getColor(word);
      
      ctx.font = `${word.value > maxValue * 0.7 ? 'bold' : 'normal'} ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = color;

      const textMetrics = ctx.measureText(word.text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      let position: WordPosition | null = null;
      let attempts = 0;
      const maxAttempts = 200;

      // Improved spiral placement algorithm
      while (!position && attempts < maxAttempts) {
        let x, y;
        
        if (attempts < 10) {
          // Try placing near center first
          const angle = (attempts / 10) * Math.PI * 2;
          const radius = 20 + attempts * 5;
          x = centerX + Math.cos(angle) * radius - textWidth / 2;
          y = centerY + Math.sin(angle) * radius - textHeight / 2;
        } else {
          // Spiral outward
          const angle = attempts * 0.3;
          const radius = (attempts - 10) * 4;
          x = centerX + Math.cos(angle) * radius - textWidth / 2;
          y = centerY + Math.sin(angle) * radius - textHeight / 2;
        }

        // Ensure word stays within canvas bounds with padding
        const padding = 15;
        if (x >= padding && y >= padding && 
            x + textWidth <= canvasWidth - padding && 
            y + textHeight <= canvasHeight - padding) {
          
          const testPosition: WordPosition = {
            x,
            y,
            width: textWidth,
            height: textHeight,
            word
          };

          if (!checkCollision(testPosition, positions)) {
            position = testPosition;
          }
        }
        attempts++;
      }

      if (position) {
        positions.push(position);
        
        // Add glow effect for important words
        if (word.value > maxValue * 0.8) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        // Draw the text
        ctx.fillText(word.text, position.x, position.y + fontSize * 0.8);
        
        // Reset shadow
        ctx.shadowBlur = 0;
      }
    });

    setWordPositions(positions);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedWord = wordPositions.find(pos => 
      x >= pos.x && x <= pos.x + pos.width &&
      y >= pos.y && y <= pos.y + pos.height
    );

    if (clickedWord) {
      // Create a more detailed popup or modal
      const details = [
        `Word: "${clickedWord.word.text}"`,
        `Frequency: ${clickedWord.word.value} occurrences`,
        `Category: ${clickedWord.word.category || 'General'}`,
        clickedWord.word.tfidf_score ? `TF-IDF Score: ${clickedWord.word.tfidf_score.toFixed(3)}` : '',
        clickedWord.word.semantic_weight ? `Semantic Weight: ${clickedWord.word.semantic_weight.toFixed(1)}x` : ''
      ].filter(Boolean).join('\n');
      
      alert(details);
    }
  };

  const regenerateCloud = () => {
    setIsAnimating(true);
    setTimeout(() => {
      generateWordCloud();
      setIsAnimating(false);
    }, 300);
  };

  const downloadWordCloud = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `wordcloud-${selectedCategory}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    if (filteredData.length > 0) {
      const timer = setTimeout(() => generateWordCloud(), 100);
      return () => clearTimeout(timer);
    }
  }, [filteredData, selectedCategory]);

  useEffect(() => {
    const handleResize = () => {
      const timer = setTimeout(() => generateWordCloud(), 200);
      return () => clearTimeout(timer);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const topKeywords = wordCloudData.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Advanced Word Cloud */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              <div>
                <CardTitle>Advanced Word Cloud</CardTitle>
                <CardDescription>
                  Interactive visualization with collision detection and TF-IDF weighting ({filteredData.length} words displayed)
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadWordCloud}>
                <Download className="h-4 w-4 mr-1" />
                Download PNG
              </Button>
              <Button variant="outline" size="sm" onClick={regenerateCloud}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isAnimating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by category:</span>
            <div className="flex gap-1 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category} {category !== 'all' && `(${wordCloudData.filter(w => w.category === category).length})`}
                </Button>
              ))}
            </div>
          </div>

          {/* Word Cloud Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className={`w-full h-96 border rounded-lg cursor-pointer transition-opacity duration-300 bg-gradient-to-br from-slate-50 to-slate-100 ${
                isAnimating ? 'opacity-50' : 'opacity-100'
              }`}
            />
            {isAnimating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-lg">
                <div className="text-lg font-medium text-gray-600 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Regenerating word cloud...
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Click on words for detailed information. Larger words appear more frequently.
            </p>
          </div>

          {/* Word Cloud Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{filteredData.length}</div>
              <div className="text-sm text-muted-foreground">Total Words</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{wordPositions.length}</div>
              <div className="text-sm text-muted-foreground">Displayed</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{categories.length - 1}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{maxValue}</div>
              <div className="text-sm text-muted-foreground">Max Frequency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Top Keywords</CardTitle>
            <CardDescription>
              Most frequently mentioned terms with detailed metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topKeywords.map((word, index) => (
                <div key={word.text} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-medium" style={{ color: getColor(word) }}>
                      #{index + 1}
                    </div>
                    <div>
                      <Badge variant="outline" className="capitalize font-medium">
                        {word.text}
                      </Badge>
                      {word.category && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {word.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{word.value}</div>
                    <div className="text-sm text-muted-foreground">
                      {word.tfidf_score && `TF-IDF: ${word.tfidf_score.toFixed(3)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Keyword Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Keyword Categories</CardTitle>
            <CardDescription>
              Thematic analysis of frequently used terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-red-600 flex items-center gap-2">
                  🏛️ Legal Terms
                  <Badge variant="outline">{categoryKeywords.legal.length}</Badge>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {categoryKeywords.legal.slice(0, 8).map(word => (
                    <Badge key={word.text} variant="outline" className="text-xs">
                      {word.text} ({word.value})
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-blue-600 flex items-center gap-2">
                  🏢 Business Terms
                  <Badge variant="outline">{categoryKeywords.business.length}</Badge>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {categoryKeywords.business.slice(0, 8).map(word => (
                    <Badge key={word.text} variant="outline" className="text-xs">
                      {word.text} ({word.value})
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-green-600 flex items-center gap-2">
                  ⚖️ Governance Terms
                  <Badge variant="outline">{categoryKeywords.governance.length}</Badge>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {categoryKeywords.governance.slice(0, 8).map(word => (
                    <Badge key={word.text} variant="outline" className="text-xs">
                      {word.text} ({word.value})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Word Frequency Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Frequency Distribution Analysis</CardTitle>
          <CardDescription>
            Statistical analysis of word usage patterns from {totalComments} comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{wordCloudData.length}</div>
              <div className="text-sm text-muted-foreground">Unique Words</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{maxValue}</div>
              <div className="text-sm text-muted-foreground">Highest Frequency</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(wordCloudData.reduce((sum, word) => sum + word.value, 0) / wordCloudData.length)}
              </div>
              <div className="text-sm text-muted-foreground">Average Frequency</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((wordCloudData.length / totalComments) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Diversity Index</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-3">AI-Powered Insights</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong>Most discussed topic:</strong> "{topKeywords[0]?.text}" mentioned {topKeywords[0]?.value} times</li>
              <li>• <strong>Legal focus:</strong> {categoryKeywords.legal.length} legal terms indicate regulatory awareness</li>
              <li>• <strong>Business impact:</strong> {categoryKeywords.business.length} business terms suggest commercial concern</li>
              <li>• <strong>Governance emphasis:</strong> {categoryKeywords.governance.length} governance keywords reflect oversight interest</li>
              <li>• <strong>Language complexity:</strong> Average {Math.round(wordCloudData.reduce((sum, w) => sum + w.text.length, 0) / wordCloudData.length)} characters per word</li>
              <li>• <strong>Vocabulary richness:</strong> {Math.round((wordCloudData.length / totalComments) * 100)}% unique words per comment indicates detailed feedback</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Category Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Category Legend</CardTitle>
          <CardDescription>
            Color coding and semantic categorization system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries({
              legal: { color: '#3B82F6', desc: 'Legal & regulatory terms' },
              business: { color: '#10B981', desc: 'Business & commercial terms' }, 
              process: { color: '#F59E0B', desc: 'Process & implementation terms' },
              phrase: { color: '#8B5CF6', desc: 'Multi-word phrases' },
              general: { color: '#6B7280', desc: 'General terminology' }
            }).map(([category, info]) => (
              <div key={category} className="flex flex-col space-y-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: info.color }}
                  />
                  <span className="text-sm font-medium capitalize">{category}</span>
                </div>
                <span className="text-xs text-muted-foreground">{info.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}