// Advanced AI-Powered Summary Generation with Extractive and Abstractive Techniques

import { NLPProcessor } from './nlpProcessor';
import { SentimentModel } from './sentimentModel';

export interface SummaryOptions {
  max_length: number;
  min_length: number;
  summary_type: 'extractive' | 'abstractive' | 'hybrid';
  focus_areas: string[];
  include_sentiment: boolean;
  include_stakeholder_breakdown: boolean;
  include_recommendations: boolean;
}

export interface SentenceScore {
  sentence: string;
  index: number;
  score: number;
  features: {
    position_score: number;
    tf_idf_score: number;
    sentiment_score: number;
    length_score: number;
    keyword_density: number;
    stakeholder_relevance: number;
  };
}

export interface ExtractedSummary {
  sentences: SentenceScore[];
  summary_text: string;
  coverage_score: number;
  coherence_score: number;
  key_themes: string[];
}

export interface AbstractiveSummary {
  generated_text: string;
  key_points: string[];
  confidence_score: number;
  factual_consistency: number;
  fluency_score: number;
}

export interface HybridSummary {
  extractive_component: ExtractedSummary;
  abstractive_component: AbstractiveSummary;
  final_summary: string;
  summary_quality_metrics: {
    relevance: number;
    coherence: number;
    coverage: number;
    conciseness: number;
    factual_accuracy: number;
  };
}

export interface StakeholderSummary {
  stakeholder_type: string;
  summary: string;
  key_concerns: string[];
  sentiment_overview: string;
  document_count: number;
}

export interface RecommendationEngine {
  generate_recommendations(
    summaries: HybridSummary,
    sentiment_analysis: any,
    stakeholder_input: StakeholderSummary[]
  ): string[];
}

export class AdvancedSummaryGenerator {
  private nlpProcessor: NLPProcessor;
  private sentimentModel: SentimentModel;
  private stopWords: Set<string>;
  private importantTerms: Set<string>;

  constructor() {
    this.nlpProcessor = new NLPProcessor();
    this.sentimentModel = new SentimentModel();
    this.initializeTermLists();
  }

  private initializeTermLists() {
    this.stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might'
    ]);

    this.importantTerms = new Set([
      'amendment', 'section', 'provision', 'regulation', 'compliance', 'governance',
      'stakeholder', 'recommendation', 'concern', 'issue', 'challenge', 'benefit',
      'implementation', 'impact', 'requirement', 'proposal', 'suggestion', 'opposition',
      'support', 'criticism', 'analysis', 'evaluation', 'assessment', 'review'
    ]);
  }

  // Main summary generation method
  public async generateComprehensiveSummary(
    documents: Array<{ text: string; stakeholder: string; timestamp: Date; id: string }>,
    options: SummaryOptions = {
      max_length: 500,
      min_length: 100,
      summary_type: 'hybrid',
      focus_areas: [],
      include_sentiment: true,
      include_stakeholder_breakdown: true,
      include_recommendations: true
    }
  ): Promise<{
    main_summary: HybridSummary;
    stakeholder_summaries: StakeholderSummary[];
    recommendations: string[];
    executive_summary: string;
    detailed_analysis: any;
  }> {
    console.log(`Generating comprehensive summary for ${documents.length} documents...`);

    // Step 1: Preprocess and analyze documents
    const processedDocs = this.preprocessDocuments(documents);
    
    // Step 2: Generate main summary based on type
    let mainSummary: HybridSummary;
    
    switch (options.summary_type) {
      case 'extractive':
        const extractive = this.generateExtractiveSummary(processedDocs, options);
        mainSummary = this.convertToHybrid(extractive);
        break;
      case 'abstractive':
        const abstractive = this.generateAbstractiveSummary(processedDocs, options);
        mainSummary = this.convertToHybrid(abstractive);
        break;
      case 'hybrid':
      default:
        mainSummary = this.generateHybridSummary(processedDocs, options);
        break;
    }

    // Step 3: Generate stakeholder-specific summaries
    const stakeholderSummaries = options.include_stakeholder_breakdown
      ? this.generateStakeholderSummaries(documents)
      : [];

    // Step 4: Generate recommendations
    const recommendations = options.include_recommendations
      ? this.generateRecommendations(mainSummary, stakeholderSummaries, documents)
      : [];

    // Step 5: Create executive summary
    const executiveSummary = this.generateExecutiveSummary(mainSummary, stakeholderSummaries);

    // Step 6: Compile detailed analysis
    const detailedAnalysis = this.compileDetailedAnalysis(documents, mainSummary, stakeholderSummaries);

    return {
      main_summary: mainSummary,
      stakeholder_summaries: stakeholderSummaries,
      recommendations,
      executive_summary: executiveSummary,
      detailed_analysis: detailedAnalysis
    };
  }

  // Extractive summarization using sentence ranking
  private generateExtractiveSummary(
    documents: Array<{ text: string; metadata: any }>,
    options: SummaryOptions
  ): ExtractedSummary {
    console.log('Generating extractive summary...');
    
    // Step 1: Extract and score all sentences
    const allSentences: SentenceScore[] = [];
    
    documents.forEach((doc, docIndex) => {
      const sentences = this.extractSentences(doc.text);
      
      sentences.forEach((sentence, sentIndex) => {
        if (sentence.trim().length > 20) { // Filter very short sentences
          const score = this.scoreSentence(sentence, sentIndex, sentences, documents, options);
          allSentences.push({
            sentence: sentence.trim(),
            index: docIndex * 1000 + sentIndex, // Unique index
            score: score.total_score,
            features: score.features
          });
        }
      });
    });

    // Step 2: Rank sentences and select top ones
    allSentences.sort((a, b) => b.score - a.score);
    
    // Step 3: Select sentences ensuring diversity and coherence
    const selectedSentences = this.selectDiverseSentences(allSentences, options);
    
    // Step 4: Order selected sentences for coherence
    const orderedSentences = this.orderSentencesForCoherence(selectedSentences);
    
    // Step 5: Generate final summary text
    const summaryText = orderedSentences.map(s => s.sentence).join(' ');
    
    // Step 6: Calculate quality metrics
    const coverageScore = this.calculateCoverage(orderedSentences, documents);
    const coherenceScore = this.calculateCoherence(orderedSentences);
    const keyThemes = this.extractKeyThemes(orderedSentences);

    return {
      sentences: orderedSentences,
      summary_text: summaryText,
      coverage_score: coverageScore,
      coherence_score: coherenceScore,
      key_themes: keyThemes
    };
  }

  private scoreSentence(
    sentence: string,
    position: number,
    allSentences: string[],
    documents: any[],
    options: SummaryOptions
  ): { total_score: number; features: any } {
    const tokenized = this.nlpProcessor.tokenize(sentence);
    
    // Position score (first and last sentences often important)
    const positionScore = this.calculatePositionScore(position, allSentences.length);
    
    // TF-IDF score
    const tfIdfScore = this.calculateTFIDFScore(tokenized.tokens, documents);
    
    // Sentiment score (controversial content might be important)
    const sentimentScore = Math.abs(this.nlpProcessor.calculateSentimentScore(sentence));
    
    // Length score (prefer sentences of medium length)
    const lengthScore = this.calculateLengthScore(sentence);
    
    // Keyword density
    const keywordDensity = this.calculateKeywordDensity(tokenized.tokens);
    
    // Stakeholder relevance
    const stakeholderRelevance = this.calculateStakeholderRelevance(sentence);
    
    // Focus area relevance
    const focusAreaScore = this.calculateFocusAreaScore(sentence, options.focus_areas);

    const features = {
      position_score: positionScore,
      tf_idf_score: tfIdfScore,
      sentiment_score: sentimentScore,
      length_score: lengthScore,
      keyword_density: keywordDensity,
      stakeholder_relevance: stakeholderRelevance
    };

    // Weighted combination
    const totalScore = 
      positionScore * 0.15 +
      tfIdfScore * 0.25 +
      sentimentScore * 0.1 +
      lengthScore * 0.1 +
      keywordDensity * 0.2 +
      stakeholderRelevance * 0.1 +
      focusAreaScore * 0.1;

    return { total_score: totalScore, features };
  }

  private calculatePositionScore(position: number, totalSentences: number): number {
    // U-shaped distribution: first and last sentences are important
    const normalizedPosition = position / totalSentences;
    return 1 - Math.abs(0.5 - normalizedPosition);
  }

  private calculateTFIDFScore(tokens: string[], documents: any[]): number {
    // Simplified TF-IDF calculation
    const termFreq = new Map<string, number>();
    tokens.forEach(token => {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    });

    let score = 0;
    termFreq.forEach((tf, term) => {
      const docFreq = documents.filter(doc => 
        doc.text.toLowerCase().includes(term.toLowerCase())).length;
      
      if (docFreq > 0) {
        const idf = Math.log(documents.length / docFreq);
        score += (tf / tokens.length) * idf;
      }
    });

    return score;
  }

  private calculateLengthScore(sentence: string): number {
    const wordCount = sentence.split(/\s+/).length;
    const optimalLength = 20; // Optimal sentence length
    const penalty = Math.abs(wordCount - optimalLength) / optimalLength;
    return Math.max(0, 1 - penalty);
  }

  private calculateKeywordDensity(tokens: string[]): number {
    const importantTokens = tokens.filter(token => 
      this.importantTerms.has(token.toLowerCase()));
    return importantTokens.length / Math.max(1, tokens.length);
  }

  private calculateStakeholderRelevance(sentence: string): number {
    const stakeholderIndicators = [
      'industry', 'association', 'organization', 'company', 'firm',
      'stakeholder', 'participant', 'respondent', 'contributor'
    ];
    
    let relevanceScore = 0;
    stakeholderIndicators.forEach(indicator => {
      if (sentence.toLowerCase().includes(indicator)) {
        relevanceScore += 0.2;
      }
    });
    
    return Math.min(1, relevanceScore);
  }

  private calculateFocusAreaScore(sentence: string, focusAreas: string[]): number {
    if (focusAreas.length === 0) return 0.5; // Neutral if no focus areas
    
    let score = 0;
    focusAreas.forEach(area => {
      if (sentence.toLowerCase().includes(area.toLowerCase())) {
        score += 1 / focusAreas.length;
      }
    });
    
    return score;
  }

  // Abstractive summarization using template-based generation
  private generateAbstractiveSummary(
    documents: Array<{ text: string; metadata: any }>,
    options: SummaryOptions
  ): AbstractiveSummary {
    console.log('Generating abstractive summary...');
    
    // Step 1: Extract key information
    const keyInfo = this.extractKeyInformation(documents);
    
    // Step 2: Generate summary using templates and rules
    const generatedText = this.generateTemplateBasedSummary(keyInfo, options);
    
    // Step 3: Extract key points
    const keyPoints = this.extractKeyPointsFromGenerated(generatedText, keyInfo);
    
    // Step 4: Calculate quality metrics
    const confidenceScore = this.calculateGenerationConfidence(generatedText, keyInfo);
    const factualConsistency = this.checkFactualConsistency(generatedText, documents);
    const fluencyScore = this.calculateFluency(generatedText);

    return {
      generated_text: generatedText,
      key_points: keyPoints,
      confidence_score: confidenceScore,
      factual_consistency: factualConsistency,
      fluency_score: fluencyScore
    };
  }

  private extractKeyInformation(documents: Array<{ text: string; metadata: any }>): any {
    const keyInfo = {
      total_documents: documents.length,
      main_themes: new Map<string, number>(),
      stakeholder_positions: new Map<string, string[]>(),
      sentiment_distribution: { positive: 0, negative: 0, neutral: 0 },
      key_sections_mentioned: new Set<string>(),
      legal_references: new Set<string>(),
      main_concerns: new Set<string>(),
      recommendations: new Set<string>()
    };

    documents.forEach(doc => {
      const tokenized = this.nlpProcessor.tokenize(doc.text);
      
      // Extract themes
      tokenized.tokens.forEach(token => {
        if (this.importantTerms.has(token.toLowerCase())) {
          keyInfo.main_themes.set(token, (keyInfo.main_themes.get(token) || 0) + 1);
        }
      });

      // Extract sentiment
      const sentiment = this.sentimentModel.predict(doc.text);
      keyInfo.sentiment_distribution[sentiment.sentiment as keyof typeof keyInfo.sentiment_distribution]++;

      // Extract section references
      const sectionMatches = doc.text.match(/section\s+\d+/gi);
      if (sectionMatches) {
        sectionMatches.forEach(match => keyInfo.key_sections_mentioned.add(match.toLowerCase()));
      }

      // Extract legal references
      const legalMatches = doc.text.match(/\b[A-Z][a-z]+\s+(?:vs?\.?|v\.?)\s+[A-Z][a-z]+/g);
      if (legalMatches) {
        legalMatches.forEach(match => keyInfo.legal_references.add(match));
      }

      // Extract concerns and recommendations
      if (doc.text.toLowerCase().includes('concern') || doc.text.toLowerCase().includes('issue')) {
        keyInfo.main_concerns.add(this.extractConcernSentence(doc.text));
      }

      if (doc.text.toLowerCase().includes('recommend') || doc.text.toLowerCase().includes('suggest')) {
        keyInfo.recommendations.add(this.extractRecommendationSentence(doc.text));
      }
    });

    return keyInfo;
  }

  private extractConcernSentence(text: string): string {
    const sentences = this.extractSentences(text);
    const concernSentence = sentences.find(s => 
      s.toLowerCase().includes('concern') || s.toLowerCase().includes('issue'));
    return concernSentence?.substring(0, 100) + '...' || 'General concerns raised';
  }

  private extractRecommendationSentence(text: string): string {
    const sentences = this.extractSentences(text);
    const recSentence = sentences.find(s => 
      s.toLowerCase().includes('recommend') || s.toLowerCase().includes('suggest'));
    return recSentence?.substring(0, 100) + '...' || 'Recommendations provided';
  }

  private generateTemplateBasedSummary(keyInfo: any, options: SummaryOptions): string {
    const templates = {
      opening: [
        `Analysis of ${keyInfo.total_documents} stakeholder submissions reveals`,
        `Comprehensive review of ${keyInfo.total_documents} consultation responses shows`,
        `Examination of ${keyInfo.total_documents} stakeholder comments indicates`
      ],
      sentiment: [
        `predominantly ${this.getDominantSentiment(keyInfo.sentiment_distribution)} sentiment`,
        `mixed reactions with ${this.getDominantSentiment(keyInfo.sentiment_distribution)} views leading`,
        `diverse opinions trending toward ${this.getDominantSentiment(keyInfo.sentiment_distribution)} positions`
      ],
      themes: [
        `Key themes include ${this.getTopThemes(keyInfo.main_themes, 3).join(', ')}`,
        `Primary focus areas are ${this.getTopThemes(keyInfo.main_themes, 3).join(', ')}`,
        `Main discussion points center on ${this.getTopThemes(keyInfo.main_themes, 3).join(', ')}`
      ],
      sections: [
        `Most frequently discussed sections include ${Array.from(keyInfo.key_sections_mentioned).slice(0, 3).join(', ')}`,
        `Stakeholders particularly focus on ${Array.from(keyInfo.key_sections_mentioned).slice(0, 3).join(', ')}`,
        `Key legislative provisions under discussion: ${Array.from(keyInfo.key_sections_mentioned).slice(0, 3).join(', ')}`
      ],
      conclusion: [
        `The consultation process has generated substantial feedback requiring careful consideration`,
        `Stakeholder input provides valuable insights for policy refinement`,
        `The feedback indicates need for balanced approach addressing various concerns`
      ]
    };

    // Select random templates for variety
    const summary = [
      this.selectRandomTemplate(templates.opening),
      this.selectRandomTemplate(templates.sentiment),
      this.selectRandomTemplate(templates.themes),
      this.selectRandomTemplate(templates.sections),
      this.selectRandomTemplate(templates.conclusion)
    ].join('. ') + '.';

    return summary;
  }

  private selectRandomTemplate(templates: string[]): string {
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private getDominantSentiment(distribution: { positive: number; negative: number; neutral: number }): string {
    const max = Math.max(distribution.positive, distribution.negative, distribution.neutral);
    if (max === distribution.positive) return 'positive';
    if (max === distribution.negative) return 'negative';
    return 'neutral';
  }

  private getTopThemes(themes: Map<string, number>, count: number): string[] {
    return Array.from(themes.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([theme]) => theme);
  }

  // Hybrid summarization combining extractive and abstractive approaches
  private generateHybridSummary(
    documents: Array<{ text: string; metadata: any }>,
    options: SummaryOptions
  ): HybridSummary {
    console.log('Generating hybrid summary...');
    
    // Generate both extractive and abstractive summaries
    const extractive = this.generateExtractiveSummary(documents, options);
    const abstractive = this.generateAbstractiveSummary(documents, options);
    
    // Combine approaches
    const finalSummary = this.combineExtractiveAndAbstractive(extractive, abstractive, options);
    
    // Calculate quality metrics
    const qualityMetrics = this.calculateSummaryQuality(finalSummary, extractive, abstractive, documents);

    return {
      extractive_component: extractive,
      abstractive_component: abstractive,
      final_summary: finalSummary,
      summary_quality_metrics: qualityMetrics
    };
  }

  private combineExtractiveAndAbstractive(
    extractive: ExtractedSummary,
    abstractive: AbstractiveSummary,
    options: SummaryOptions
  ): string {
    // Start with abstractive introduction
    const intro = abstractive.generated_text.split('.')[0] + '.';
    
    // Add key extractive sentences
    const keyExtractedSentences = extractive.sentences
      .slice(0, Math.min(3, Math.floor(options.max_length / 100)))
      .map(s => s.sentence);
    
    // Add abstractive conclusion
    const conclusion = abstractive.generated_text.split('.').slice(-2).join('.');
    
    const combined = [intro, ...keyExtractedSentences, conclusion].join(' ');
    
    // Ensure length constraints
    return this.truncateToLength(combined, options.max_length, options.min_length);
  }

  private truncateToLength(text: string, maxLength: number, minLength: number): string {
    if (text.length <= maxLength) return text;
    
    // Truncate at sentence boundaries
    const sentences = this.extractSentences(text);
    let result = '';
    
    for (const sentence of sentences) {
      if ((result + sentence).length <= maxLength) {
        result += sentence + ' ';
      } else {
        break;
      }
    }
    
    // Ensure minimum length
    if (result.length < minLength && sentences.length > 0) {
      result = sentences[0] + ' ' + (sentences[1] || '');
    }
    
    return result.trim();
  }

  // Generate stakeholder-specific summaries
  private generateStakeholderSummaries(
    documents: Array<{ text: string; stakeholder: string; timestamp: Date; id: string }>
  ): StakeholderSummary[] {
    console.log('Generating stakeholder-specific summaries...');
    
    // Group documents by stakeholder type
    const stakeholderGroups = this.groupByStakeholderType(documents);
    
    const summaries: StakeholderSummary[] = [];
    
    stakeholderGroups.forEach((docs, stakeholderType) => {
      const stakeholderTexts = docs.map(d => d.text);
      
      // Generate summary for this stakeholder group
      const extractive = this.generateExtractiveSummary(
        stakeholderTexts.map(text => ({ text, metadata: {} })),
        {
          max_length: 200,
          min_length: 50,
          summary_type: 'extractive',
          focus_areas: [],
          include_sentiment: false,
          include_stakeholder_breakdown: false,
          include_recommendations: false
        }
      );
      
      // Extract key concerns
      const keyConcerns = this.extractStakeholderConcerns(stakeholderTexts);
      
      // Analyze sentiment for this group
      const sentiments = docs.map(doc => this.sentimentModel.predict(doc.text));
      const sentimentOverview = this.generateSentimentOverview(sentiments);
      
      summaries.push({
        stakeholder_type: stakeholderType,
        summary: extractive.summary_text,
        key_concerns: keyConcerns,
        sentiment_overview: sentimentOverview,
        document_count: docs.length
      });
    });
    
    return summaries.sort((a, b) => b.document_count - a.document_count);
  }

  private groupByStakeholderType(
    documents: Array<{ text: string; stakeholder: string; timestamp: Date; id: string }>
  ): Map<string, typeof documents> {
    const groups = new Map<string, typeof documents>();
    
    documents.forEach(doc => {
      const type = this.categorizeStakeholder(doc.stakeholder);
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(doc);
    });
    
    return groups;
  }

  private categorizeStakeholder(stakeholder: string): string {
    const lowerStakeholder = stakeholder.toLowerCase();
    
    if (lowerStakeholder.includes('association') || lowerStakeholder.includes('federation')) {
      return 'Industry Associations';
    }
    if (lowerStakeholder.includes('legal') || lowerStakeholder.includes('law') || lowerStakeholder.includes('bar')) {
      return 'Legal Practitioners';
    }
    if (lowerStakeholder.includes('institute') || lowerStakeholder.includes('academic')) {
      return 'Academic Institutions';
    }
    if (lowerStakeholder.includes('company') || lowerStakeholder.includes('corporate') || lowerStakeholder.includes('ltd')) {
      return 'Corporate Entities';
    }
    if (lowerStakeholder.includes('government') || lowerStakeholder.includes('ministry')) {
      return 'Government Bodies';
    }
    
    return 'Individual Contributors';
  }

  private extractStakeholderConcerns(texts: string[]): string[] {
    const concerns: string[] = [];
    const concernKeywords = ['concern', 'issue', 'problem', 'challenge', 'difficulty', 'objection'];
    
    texts.forEach(text => {
      const sentences = this.extractSentences(text);
      sentences.forEach(sentence => {
        if (concernKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          const cleaned = sentence.substring(0, 80).trim() + (sentence.length > 80 ? '...' : '');
          if (cleaned.length > 20) {
            concerns.push(cleaned);
          }
        }
      });
    });
    
    // Remove duplicates and return top concerns
    return [...new Set(concerns)].slice(0, 5);
  }

  private generateSentimentOverview(sentiments: any[]): string {
    const positive = sentiments.filter(s => s.sentiment === 'positive').length;
    const negative = sentiments.filter(s => s.sentiment === 'negative').length;
    const neutral = sentiments.filter(s => s.sentiment === 'neutral').length;
    
    const total = sentiments.length;
    const posPercent = Math.round((positive / total) * 100);
    const negPercent = Math.round((negative / total) * 100);
    const neuPercent = Math.round((neutral / total) * 100);
    
    if (positive > negative && positive > neutral) {
      return `Predominantly positive (${posPercent}% positive, ${negPercent}% negative, ${neuPercent}% neutral)`;
    } else if (negative > positive && negative > neutral) {
      return `Predominantly negative (${negPercent}% negative, ${posPercent}% positive, ${neuPercent}% neutral)`;
    } else {
      return `Mixed sentiment (${posPercent}% positive, ${negPercent}% negative, ${neuPercent}% neutral)`;
    }
  }

  // Generate recommendations based on analysis
  private generateRecommendations(
    mainSummary: HybridSummary,
    stakeholderSummaries: StakeholderSummary[],
    documents: any[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Analyze main themes for recommendations
    const themes = mainSummary.extractive_component.key_themes;
    
    if (themes.includes('implementation')) {
      recommendations.push('Consider phased implementation approach to address stakeholder concerns about transition timelines');
    }
    
    if (themes.includes('compliance')) {
      recommendations.push('Provide detailed compliance guidelines and support mechanisms for affected entities');
    }
    
    if (themes.includes('amendment')) {
      recommendations.push('Review specific section amendments based on concentrated stakeholder feedback');
    }
    
    // Analyze stakeholder distribution
    const corporateStakeholders = stakeholderSummaries.find(s => s.stakeholder_type === 'Corporate Entities');
    const legalStakeholders = stakeholderSummaries.find(s => s.stakeholder_type === 'Legal Practitioners');
    
    if (corporateStakeholders && corporateStakeholders.document_count > documents.length * 0.3) {
      recommendations.push('Address business impact concerns raised by corporate stakeholders through impact assessment');
    }
    
    if (legalStakeholders && legalStakeholders.key_concerns.length > 0) {
      recommendations.push('Conduct legal review to address constitutional and procedural concerns raised');
    }
    
    // Sentiment-based recommendations
    const avgQuality = (
      mainSummary.summary_quality_metrics.relevance +
      mainSummary.summary_quality_metrics.coherence +
      mainSummary.summary_quality_metrics.coverage
    ) / 3;
    
    if (avgQuality > 0.8) {
      recommendations.push('Strong stakeholder engagement evident - proceed with refinements based on feedback');
    } else {
      recommendations.push('Consider additional consultation rounds to address gaps in stakeholder input');
    }
    
    // Default recommendations
    if (recommendations.length < 3) {
      recommendations.push('Establish stakeholder feedback integration mechanism for ongoing policy development');
      recommendations.push('Create public dashboard for transparent tracking of consultation response integration');
    }
    
    return recommendations.slice(0, 6); // Limit to 6 recommendations
  }

  // Generate executive summary
  private generateExecutiveSummary(
    mainSummary: HybridSummary,
    stakeholderSummaries: StakeholderSummary[]
  ): string {
    const totalStakeholders = stakeholderSummaries.reduce((sum, s) => sum + s.document_count, 0);
    const dominantStakeholder = stakeholderSummaries.length > 0 ? stakeholderSummaries[0] : null;
    
    const executive = `
Executive Summary: The eConsultation process generated ${totalStakeholders} submissions from diverse stakeholder groups, 
with ${dominantStakeholder?.stakeholder_type || 'various stakeholders'} providing the largest volume of feedback 
(${dominantStakeholder?.document_count || 0} submissions). 

${mainSummary.abstractive_component.generated_text}

Key stakeholder groups include ${stakeholderSummaries.slice(0, 3).map(s => s.stakeholder_type).join(', ')}, 
each raising distinct concerns and recommendations. The analysis indicates a need for balanced policy development 
that addresses the diverse perspectives while maintaining regulatory effectiveness.

Quality metrics show ${Math.round(mainSummary.summary_quality_metrics.relevance * 100)}% relevance, 
${Math.round(mainSummary.summary_quality_metrics.coherence * 100)}% coherence, and 
${Math.round(mainSummary.summary_quality_metrics.coverage * 100)}% coverage of key consultation themes.
    `.trim();
    
    return executive;
  }

  // Utility methods
  private extractSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  }

  private preprocessDocuments(documents: any[]): Array<{ text: string; metadata: any }> {
    return documents.map(doc => ({
      text: doc.text,
      metadata: {
        stakeholder: doc.stakeholder,
        timestamp: doc.timestamp,
        id: doc.id
      }
    }));
  }

  private selectDiverseSentences(sentences: SentenceScore[], options: SummaryOptions): SentenceScore[] {
    const selected: SentenceScore[] = [];
    const maxSentences = Math.min(
      Math.floor(options.max_length / 50), // Rough estimate of sentences needed
      sentences.length
    );
    
    // Greedy selection for diversity
    while (selected.length < maxSentences && sentences.length > 0) {
      let bestSentence = sentences[0];
      let bestDiversityScore = 0;
      
      for (const sentence of sentences.slice(0, Math.min(10, sentences.length))) {
        const diversityScore = this.calculateDiversityScore(sentence, selected);
        if (diversityScore > bestDiversityScore) {
          bestDiversityScore = diversityScore;
          bestSentence = sentence;
        }
      }
      
      selected.push(bestSentence);
      sentences.splice(sentences.indexOf(bestSentence), 1);
    }
    
    return selected;
  }

  private calculateDiversityScore(sentence: SentenceScore, selectedSentences: SentenceScore[]): number {
    if (selectedSentences.length === 0) return sentence.score;
    
    // Calculate semantic diversity (simplified using word overlap)
    const sentenceWords = new Set(sentence.sentence.toLowerCase().split(/\s+/));
    
    let minSimilarity = 1;
    selectedSentences.forEach(selected => {
      const selectedWords = new Set(selected.sentence.toLowerCase().split(/\s+/));
      const intersection = new Set([...sentenceWords].filter(word => selectedWords.has(word)));
      const similarity = intersection.size / Math.max(sentenceWords.size, selectedWords.size);
      minSimilarity = Math.min(minSimilarity, similarity);
    });
    
    // Higher score for less similar sentences
    return sentence.score * (1 - minSimilarity);
  }

  private orderSentencesForCoherence(sentences: SentenceScore[]): SentenceScore[] {
    // Simple ordering by original document position for now
    return sentences.sort((a, b) => a.index - b.index);
  }

  private calculateCoverage(sentences: SentenceScore[], documents: any[]): number {
    // Calculate what proportion of key themes are covered
    const allThemes = new Set<string>();
    const coveredThemes = new Set<string>();
    
    documents.forEach(doc => {
      const tokenized = this.nlpProcessor.tokenize(doc.text);
      tokenized.tokens.forEach(token => {
        if (this.importantTerms.has(token.toLowerCase())) {
          allThemes.add(token.toLowerCase());
        }
      });
    });
    
    sentences.forEach(sentence => {
      const tokenized = this.nlpProcessor.tokenize(sentence.sentence);
      tokenized.tokens.forEach(token => {
        if (allThemes.has(token.toLowerCase())) {
          coveredThemes.add(token.toLowerCase());
        }
      });
    });
    
    return allThemes.size > 0 ? coveredThemes.size / allThemes.size : 0;
  }

  private calculateCoherence(sentences: SentenceScore[]): number {
    // Simple coherence based on connecting words and topic consistency
    let coherenceScore = 0;
    const connectingWords = ['however', 'furthermore', 'moreover', 'additionally', 'consequently', 'therefore'];
    
    sentences.forEach((sentence, index) => {
      if (index > 0) {
        const hasConnector = connectingWords.some(word => 
          sentence.sentence.toLowerCase().includes(word));
        if (hasConnector) coherenceScore += 0.2;
        
        // Check topic consistency with previous sentence
        const prevWords = new Set(sentences[index - 1].sentence.toLowerCase().split(/\s+/));
        const currWords = new Set(sentence.sentence.toLowerCase().split(/\s+/));
        const overlap = new Set([...prevWords].filter(word => currWords.has(word)));
        
        if (overlap.size > 0) coherenceScore += 0.1;
      }
    });
    
    return Math.min(1, coherenceScore / sentences.length);
  }

  private extractKeyThemes(sentences: SentenceScore[]): string[] {
    const themeCount = new Map<string, number>();
    
    sentences.forEach(sentence => {
      const tokenized = this.nlpProcessor.tokenize(sentence.sentence);
      tokenized.tokens.forEach(token => {
        if (this.importantTerms.has(token.toLowerCase())) {
          themeCount.set(token.toLowerCase(), (themeCount.get(token.toLowerCase()) || 0) + 1);
        }
      });
    });
    
    return Array.from(themeCount.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  private extractKeyPointsFromGenerated(text: string, keyInfo: any): string[] {
    const sentences = this.extractSentences(text);
    return sentences.slice(0, Math.min(5, sentences.length));
  }

  private calculateGenerationConfidence(text: string, keyInfo: any): number {
    // Simple confidence based on coverage of key information
    let coverage = 0;
    const themes = Array.from(keyInfo.main_themes.keys());
    
    themes.forEach(theme => {
      if (text.toLowerCase().includes(theme.toLowerCase())) {
        coverage += 1 / themes.length;
      }
    });
    
    return Math.min(0.95, coverage + 0.3);
  }

  private checkFactualConsistency(text: string, documents: any[]): number {
    // Simplified factual consistency check
    const claims = this.extractClaims(text);
    let consistentClaims = 0;
    
    claims.forEach(claim => {
      const isSupported = documents.some(doc => 
        this.isClaimSupported(claim, doc.text));
      if (isSupported) consistentClaims++;
    });
    
    return claims.length > 0 ? consistentClaims / claims.length : 0.8;
  }

  private extractClaims(text: string): string[] {
    // Extract factual claims (simplified)
    const sentences = this.extractSentences(text);
    return sentences.filter(sentence => 
      sentence.includes('stakeholder') || 
      sentence.includes('section') || 
      sentence.includes('documents') ||
      /\d+/.test(sentence) // Contains numbers
    );
  }

  private isClaimSupported(claim: string, documentText: string): boolean {
    // Simple support check based on keyword overlap
    const claimWords = new Set(claim.toLowerCase().split(/\s+/));
    const docWords = new Set(documentText.toLowerCase().split(/\s+/));
    const overlap = new Set([...claimWords].filter(word => docWords.has(word)));
    
    return overlap.size >= Math.min(3, claimWords.size * 0.3);
  }

  private calculateFluency(text: string): number {
    // Simple fluency check based on sentence structure
    const sentences = this.extractSentences(text);
    let fluencyScore = 0;
    
    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/);
      
      // Check sentence length (not too short or too long)
      if (words.length >= 8 && words.length <= 30) fluencyScore += 0.3;
      
      // Check for complete sentences
      if (/^[A-Z]/.test(sentence.trim()) && /[.!?]$/.test(sentence.trim())) {
        fluencyScore += 0.2;
      }
    });
    
    return Math.min(1, fluencyScore / sentences.length);
  }

  private calculateSummaryQuality(
    finalSummary: string,
    extractive: ExtractedSummary,
    abstractive: AbstractiveSummary,
    documents: any[]
  ): any {
    return {
      relevance: (extractive.coverage_score + abstractive.confidence_score) / 2,
      coherence: (extractive.coherence_score + abstractive.fluency_score) / 2,
      coverage: extractive.coverage_score,
      conciseness: Math.min(1, 300 / finalSummary.length), // Prefer shorter summaries
      factual_accuracy: abstractive.factual_consistency
    };
  }

  private convertToHybrid(summary: ExtractedSummary | AbstractiveSummary): HybridSummary {
    if ('sentences' in summary) {
      // Convert extractive to hybrid
      return {
        extractive_component: summary,
        abstractive_component: {
          generated_text: summary.summary_text,
          key_points: summary.key_themes,
          confidence_score: summary.coverage_score,
          factual_consistency: 0.85,
          fluency_score: summary.coherence_score
        },
        final_summary: summary.summary_text,
        summary_quality_metrics: {
          relevance: summary.coverage_score,
          coherence: summary.coherence_score,
          coverage: summary.coverage_score,
          conciseness: 0.8,
          factual_accuracy: 0.85
        }
      };
    } else {
      // Convert abstractive to hybrid
      return {
        extractive_component: {
          sentences: [],
          summary_text: summary.generated_text,
          coverage_score: summary.confidence_score,
          coherence_score: summary.fluency_score,
          key_themes: summary.key_points.slice(0, 5)
        },
        abstractive_component: summary,
        final_summary: summary.generated_text,
        summary_quality_metrics: {
          relevance: summary.confidence_score,
          coherence: summary.fluency_score,
          coverage: summary.confidence_score,
          conciseness: 0.8,
          factual_accuracy: summary.factual_consistency
        }
      };
    }
  }

  private compileDetailedAnalysis(
    documents: any[],
    mainSummary: HybridSummary,
    stakeholderSummaries: StakeholderSummary[]
  ): any {
    return {
      document_count: documents.length,
      analysis_timestamp: new Date(),
      stakeholder_distribution: stakeholderSummaries.map(s => ({
        type: s.stakeholder_type,
        count: s.document_count,
        percentage: Math.round((s.document_count / documents.length) * 100)
      })),
      quality_metrics: mainSummary.summary_quality_metrics,
      key_themes: mainSummary.extractive_component.key_themes,
      processing_details: {
        extractive_sentences_analyzed: mainSummary.extractive_component.sentences.length,
        abstractive_confidence: mainSummary.abstractive_component.confidence_score,
        overall_coherence: mainSummary.summary_quality_metrics.coherence
      }
    };
  }
}