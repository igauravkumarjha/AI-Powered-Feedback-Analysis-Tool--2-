// Advanced Topic Modeling and Clustering for eConsultation Analysis

import { NLPProcessor } from './nlpProcessor';

export interface Topic {
  id: string;
  label: string;
  keywords: Array<{ word: string; weight: number }>;
  probability: number;
  coherence_score: number;
  document_count: number;
  representative_documents: string[];
}

export interface DocumentTopicAssignment {
  document_id: string;
  topic_distribution: { [topic_id: string]: number };
  dominant_topic: string;
  topic_confidence: number;
}

export interface TopicModelResults {
  topics: Topic[];
  document_assignments: DocumentTopicAssignment[];
  model_perplexity: number;
  topic_coherence: number;
  optimal_num_topics: number;
}

export interface TopicEvolution {
  topic_id: string;
  time_periods: Array<{
    period: string;
    keyword_changes: Array<{ word: string; weight_change: number }>;
    document_count: number;
    sentiment_shift: number;
  }>;
}

export class TopicModeling {
  private nlpProcessor: NLPProcessor;
  private vocabulary: Map<string, number>;
  private documentTermMatrix: number[][];
  private topics: Topic[];
  private numTopics: number;

  constructor(numTopics: number = 8) {
    this.nlpProcessor = new NLPProcessor();
    this.vocabulary = new Map();
    this.documentTermMatrix = [];
    this.topics = [];
    this.numTopics = numTopics;
  }

  // Latent Dirichlet Allocation (LDA) implementation
  public performLDA(documents: string[]): TopicModelResults {
    console.log(`Performing LDA topic modeling on ${documents.length} documents...`);
    
    // Preprocess documents and build vocabulary
    const processedDocs = this.preprocessDocuments(documents);
    this.buildVocabulary(processedDocs);
    
    // Create document-term matrix
    this.documentTermMatrix = this.createDocumentTermMatrix(processedDocs);
    
    // Run LDA algorithm (simplified implementation)
    const { topics, documentTopicDistributions } = this.runLDAAlgorithm();
    
    // Calculate document assignments
    const documentAssignments = this.calculateDocumentAssignments(documentTopicDistributions, documents);
    
    // Calculate model metrics
    const modelPerplexity = this.calculatePerplexity(documentTopicDistributions);
    const topicCoherence = this.calculateTopicCoherence(topics);
    const optimalNumTopics = this.findOptimalTopicCount(documents);

    return {
      topics,
      document_assignments: documentAssignments,
      model_perplexity: modelPerplexity,
      topic_coherence: topicCoherence,
      optimal_num_topics: optimalNumTopics
    };
  }

  private preprocessDocuments(documents: string[]): string[][] {
    return documents.map(doc => {
      const tokenized = this.nlpProcessor.tokenize(doc);
      return tokenized.tokens.filter(token => 
        token.length > 2 && 
        !this.isStopWord(token) &&
        this.isRelevantToken(token)
      );
    });
  }

  private isStopWord(token: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might'
    ]);
    return stopWords.has(token.toLowerCase());
  }

  private isRelevantToken(token: string): boolean {
    // Filter for domain-relevant tokens
    const irrelevantPatterns = /^\d+$|^[^\w]$/;
    return !irrelevantPatterns.test(token) && token.length >= 3;
  }

  private buildVocabulary(processedDocs: string[][]): void {
    const wordCounts = new Map<string, number>();
    
    // Count word frequencies across all documents
    processedDocs.forEach(doc => {
      doc.forEach(token => {
        wordCounts.set(token, (wordCounts.get(token) || 0) + 1);
      });
    });
    
    // Filter vocabulary based on frequency and document frequency
    const minFreq = Math.max(2, Math.floor(processedDocs.length * 0.01)); // At least 1% of documents
    const maxFreq = Math.floor(processedDocs.length * 0.8); // At most 80% of documents
    
    let vocabIndex = 0;
    wordCounts.forEach((count, word) => {
      if (count >= minFreq && count <= maxFreq) {
        this.vocabulary.set(word, vocabIndex++);
      }
    });
    
    console.log(`Built vocabulary with ${this.vocabulary.size} terms`);
  }

  private createDocumentTermMatrix(processedDocs: string[][]): number[][] {
    const matrix: number[][] = [];
    
    processedDocs.forEach(doc => {
      const docVector = new Array(this.vocabulary.size).fill(0);
      
      doc.forEach(token => {
        const termIndex = this.vocabulary.get(token);
        if (termIndex !== undefined) {
          docVector[termIndex]++;
        }
      });
      
      // Apply TF-IDF weighting
      const tfIdfVector = this.applyTFIDF(docVector, processedDocs.length);
      matrix.push(tfIdfVector);
    });
    
    return matrix;
  }

  private applyTFIDF(termVector: number[], totalDocs: number): number[] {
    const tfIdfVector: number[] = [];
    
    termVector.forEach((tf, termIndex) => {
      if (tf > 0) {
        // Calculate document frequency for this term
        const df = this.documentTermMatrix.filter(doc => doc[termIndex] > 0).length + 1; // +1 for current doc
        
        // TF-IDF calculation
        const tfNormalized = tf / termVector.reduce((sum, val) => sum + val, 0);
        const idf = Math.log(totalDocs / df);
        const tfIdf = tfNormalized * idf;
        
        tfIdfVector.push(tfIdf);
      } else {
        tfIdfVector.push(0);
      }
    });
    
    return tfIdfVector;
  }

  private runLDAAlgorithm(): { topics: Topic[]; documentTopicDistributions: number[][] } {
    // Simplified LDA using Gibbs sampling approach
    const alpha = 0.1; // Document-topic concentration
    const beta = 0.01; // Topic-word concentration
    const iterations = 100;
    
    // Initialize topic assignments randomly
    const docTopicCounts = this.initializeDocumentTopicCounts();
    const topicWordCounts = this.initializeTopicWordCounts();
    
    // Gibbs sampling iterations
    for (let iter = 0; iter < iterations; iter++) {
      this.gibbsSamplingIteration(docTopicCounts, topicWordCounts, alpha, beta);
    }
    
    // Extract topics and document distributions
    const topics = this.extractTopics(topicWordCounts, beta);
    const documentTopicDistributions = this.calculateDocumentTopicDistributions(docTopicCounts, alpha);
    
    return { topics, documentTopicDistributions };
  }

  private initializeDocumentTopicCounts(): number[][] {
    return this.documentTermMatrix.map(() => {
      const topicCounts = new Array(this.numTopics).fill(0);
      // Random initialization
      for (let i = 0; i < 10; i++) { // Assume 10 words per doc on average
        const randomTopic = Math.floor(Math.random() * this.numTopics);
        topicCounts[randomTopic]++;
      }
      return topicCounts;
    });
  }

  private initializeTopicWordCounts(): number[][] {
    const topicWordCounts: number[][] = [];
    
    for (let topic = 0; topic < this.numTopics; topic++) {
      const wordCounts = new Array(this.vocabulary.size).fill(0);
      
      // Initialize with some random distributions
      this.vocabulary.forEach((index, word) => {
        wordCounts[index] = Math.random() * 2; // Small random values
      });
      
      topicWordCounts.push(wordCounts);
    }
    
    return topicWordCounts;
  }

  private gibbsSamplingIteration(
    docTopicCounts: number[][],
    topicWordCounts: number[][],
    alpha: number,
    beta: number
  ): void {
    // Simplified Gibbs sampling step
    this.documentTermMatrix.forEach((doc, docIndex) => {
      doc.forEach((termCount, termIndex) => {
        if (termCount > 0) {
          // Sample new topic assignment
          const topicProbs = this.calculateTopicProbabilities(
            docIndex, termIndex, docTopicCounts, topicWordCounts, alpha, beta
          );
          
          const newTopic = this.sampleFromDistribution(topicProbs);
          
          // Update counts
          docTopicCounts[docIndex][newTopic] += termCount;
          topicWordCounts[newTopic][termIndex] += termCount;
        }
      });
    });
  }

  private calculateTopicProbabilities(
    docIndex: number,
    termIndex: number,
    docTopicCounts: number[][],
    topicWordCounts: number[][],
    alpha: number,
    beta: number
  ): number[] {
    const probabilities: number[] = [];
    
    for (let topic = 0; topic < this.numTopics; topic++) {
      const docTopicProb = (docTopicCounts[docIndex][topic] + alpha) / 
        (docTopicCounts[docIndex].reduce((sum, val) => sum + val, 0) + this.numTopics * alpha);
      
      const topicWordProb = (topicWordCounts[topic][termIndex] + beta) /
        (topicWordCounts[topic].reduce((sum, val) => sum + val, 0) + this.vocabulary.size * beta);
      
      probabilities.push(docTopicProb * topicWordProb);
    }
    
    return probabilities;
  }

  private sampleFromDistribution(probabilities: number[]): number {
    const sum = probabilities.reduce((total, prob) => total + prob, 0);
    const normalizedProbs = probabilities.map(prob => prob / sum);
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < normalizedProbs.length; i++) {
      cumulative += normalizedProbs[i];
      if (random <= cumulative) {
        return i;
      }
    }
    
    return normalizedProbs.length - 1; // Fallback
  }

  private extractTopics(topicWordCounts: number[][], beta: number): Topic[] {
    const topics: Topic[] = [];
    const vocabularyArray = Array.from(this.vocabulary.keys());
    
    topicWordCounts.forEach((wordCounts, topicIndex) => {
      // Calculate word probabilities for this topic
      const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
      const wordProbs = wordCounts.map(count => (count + beta) / (totalWords + this.vocabulary.size * beta));
      
      // Get top keywords for this topic
      const keywordIndices = wordProbs
        .map((prob, index) => ({ index, prob }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 10);
      
      const keywords = keywordIndices.map(({ index, prob }) => ({
        word: vocabularyArray[index],
        weight: prob
      }));
      
      // Generate topic label based on top keywords
      const topWords = keywords.slice(0, 3).map(k => k.word);
      const label = this.generateTopicLabel(topWords);
      
      // Calculate topic coherence
      const coherenceScore = this.calculateTopicCoherenceScore(keywords.map(k => k.word));
      
      topics.push({
        id: `topic_${topicIndex}`,
        label,
        keywords,
        probability: totalWords / topicWordCounts.reduce((sum, counts) => 
          sum + counts.reduce((s, c) => s + c, 0), 0),
        coherence_score: coherenceScore,
        document_count: 0, // Will be calculated later
        representative_documents: []
      });
    });
    
    return topics;
  }

  private generateTopicLabel(topWords: string[]): string {
    // Domain-specific topic labeling
    const legalWords = ['section', 'law', 'legal', 'court', 'case', 'provision', 'amendment'];
    const businessWords = ['company', 'corporate', 'business', 'governance', 'compliance'];
    const processWords = ['implementation', 'process', 'procedure', 'requirement'];
    const stakeholderWords = ['stakeholder', 'industry', 'association', 'organization'];
    
    const hasLegal = topWords.some(word => legalWords.includes(word.toLowerCase()));
    const hasBusiness = topWords.some(word => businessWords.includes(word.toLowerCase()));
    const hasProcess = topWords.some(word => processWords.includes(word.toLowerCase()));
    const hasStakeholder = topWords.some(word => stakeholderWords.includes(word.toLowerCase()));
    
    if (hasLegal && hasBusiness) return 'Legal-Business Compliance';
    if (hasLegal) return 'Legal & Regulatory Matters';
    if (hasBusiness && hasProcess) return 'Business Process & Implementation';
    if (hasBusiness) return 'Corporate Governance';
    if (hasProcess) return 'Implementation & Procedures';
    if (hasStakeholder) return 'Stakeholder Concerns';
    
    // Fallback: use top words
    return topWords.join('-').replace(/\b\w/g, l => l.toUpperCase());
  }

  private calculateTopicCoherenceScore(topWords: string[]): number {
    // Simplified coherence calculation based on word co-occurrence
    let coherenceSum = 0;
    let pairCount = 0;
    
    for (let i = 0; i < topWords.length - 1; i++) {
      for (let j = i + 1; j < topWords.length; j++) {
        const cooccurrence = this.calculateWordCooccurrence(topWords[i], topWords[j]);
        coherenceSum += cooccurrence;
        pairCount++;
      }
    }
    
    return pairCount > 0 ? coherenceSum / pairCount : 0;
  }

  private calculateWordCooccurrence(word1: string, word2: string): number {
    // Simplified co-occurrence calculation
    let cooccurrenceCount = 0;
    let word1Count = 0;
    let word2Count = 0;
    
    this.documentTermMatrix.forEach(doc => {
      const word1Index = this.vocabulary.get(word1);
      const word2Index = this.vocabulary.get(word2);
      
      if (word1Index !== undefined && word2Index !== undefined) {
        const hasWord1 = doc[word1Index] > 0;
        const hasWord2 = doc[word2Index] > 0;
        
        if (hasWord1) word1Count++;
        if (hasWord2) word2Count++;
        if (hasWord1 && hasWord2) cooccurrenceCount++;
      }
    });
    
    if (word1Count === 0 || word2Count === 0) return 0;
    
    return cooccurrenceCount / Math.sqrt(word1Count * word2Count);
  }

  private calculateDocumentTopicDistributions(docTopicCounts: number[][], alpha: number): number[][] {
    return docTopicCounts.map(topicCounts => {
      const total = topicCounts.reduce((sum, count) => sum + count, 0) + this.numTopics * alpha;
      return topicCounts.map(count => (count + alpha) / total);
    });
  }

  private calculateDocumentAssignments(
    documentTopicDistributions: number[][],
    documents: string[]
  ): DocumentTopicAssignment[] {
    return documentTopicDistributions.map((distribution, docIndex) => {
      const topicProbs: { [topic_id: string]: number } = {};
      let dominantTopic = 'topic_0';
      let maxProb = 0;
      
      distribution.forEach((prob, topicIndex) => {
        const topicId = `topic_${topicIndex}`;
        topicProbs[topicId] = prob;
        
        if (prob > maxProb) {
          maxProb = prob;
          dominantTopic = topicId;
        }
      });
      
      return {
        document_id: `doc_${docIndex}`,
        topic_distribution: topicProbs,
        dominant_topic: dominantTopic,
        topic_confidence: maxProb
      };
    });
  }

  private calculatePerplexity(documentTopicDistributions: number[][]): number {
    // Simplified perplexity calculation
    let logLikelihood = 0;
    let totalWords = 0;
    
    documentTopicDistributions.forEach((distribution, docIndex) => {
      const docLength = this.documentTermMatrix[docIndex].reduce((sum, count) => sum + count, 0);
      totalWords += docLength;
      
      distribution.forEach(prob => {
        if (prob > 0) {
          logLikelihood += docLength * Math.log(prob);
        }
      });
    });
    
    return Math.exp(-logLikelihood / totalWords);
  }

  private calculateTopicCoherence(topics: Topic[]): number {
    const coherenceScores = topics.map(topic => topic.coherence_score);
    return coherenceScores.reduce((sum, score) => sum + score, 0) / coherenceScores.length;
  }

  private findOptimalTopicCount(documents: string[]): number {
    // Simplified topic count optimization using coherence scores
    const candidateCounts = [5, 8, 10, 12, 15];
    let bestCount = this.numTopics;
    let bestCoherence = 0;
    
    candidateCounts.forEach(count => {
      // This would normally run full LDA for each count
      // For now, we'll use a heuristic based on document count
      const estimatedCoherence = Math.max(0, 1 - Math.abs(count - Math.sqrt(documents.length)) / 10);
      
      if (estimatedCoherence > bestCoherence) {
        bestCoherence = estimatedCoherence;
        bestCount = count;
      }
    });
    
    return bestCount;
  }

  // Topic evolution analysis
  public analyzeTopicEvolution(
    documents: Array<{ text: string; timestamp: Date }>,
    timeWindow: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): TopicEvolution[] {
    // Group documents by time periods
    const timePeriods = this.groupDocumentsByTime(documents, timeWindow);
    
    // Run topic modeling for each time period
    const periodTopics = timePeriods.map(period => ({
      period: period.label,
      topics: this.performLDA(period.documents.map(d => d.text)).topics
    }));
    
    // Track topic evolution
    const topicEvolution: TopicEvolution[] = [];
    
    // For each topic in the first period, track its evolution
    if (periodTopics.length > 0) {
      periodTopics[0].topics.forEach((initialTopic, index) => {
        const evolution: TopicEvolution = {
          topic_id: initialTopic.id,
          time_periods: []
        };
        
        periodTopics.forEach((periodData, periodIndex) => {
          const currentTopic = periodData.topics[index];
          
          if (currentTopic) {
            const keywordChanges = this.calculateKeywordChanges(
              periodIndex > 0 ? periodTopics[periodIndex - 1].topics[index] : initialTopic,
              currentTopic
            );
            
            evolution.time_periods.push({
              period: periodData.period,
              keyword_changes: keywordChanges,
              document_count: currentTopic.document_count,
              sentiment_shift: Math.random() * 0.4 - 0.2 // Placeholder
            });
          }
        });
        
        topicEvolution.push(evolution);
      });
    }
    
    return topicEvolution;
  }

  private groupDocumentsByTime(
    documents: Array<{ text: string; timestamp: Date }>,
    timeWindow: 'daily' | 'weekly' | 'monthly'
  ): Array<{ label: string; documents: Array<{ text: string; timestamp: Date }> }> {
    const groups = new Map<string, Array<{ text: string; timestamp: Date }>>();
    
    documents.forEach(doc => {
      let key: string;
      
      switch (timeWindow) {
        case 'daily':
          key = doc.timestamp.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(doc.timestamp);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${doc.timestamp.getFullYear()}-${String(doc.timestamp.getMonth() + 1).padStart(2, '0')}`;
          break;
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(doc);
    });
    
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, documents]) => ({ label, documents }));
  }

  private calculateKeywordChanges(
    previousTopic: Topic,
    currentTopic: Topic
  ): Array<{ word: string; weight_change: number }> {
    const changes: Array<{ word: string; weight_change: number }> = [];
    
    // Create maps for easier lookup
    const prevWeights = new Map(previousTopic.keywords.map(k => [k.word, k.weight]));
    const currWeights = new Map(currentTopic.keywords.map(k => [k.word, k.weight]));
    
    // Find all unique words
    const allWords = new Set([...prevWeights.keys(), ...currWeights.keys()]);
    
    allWords.forEach(word => {
      const prevWeight = prevWeights.get(word) || 0;
      const currWeight = currWeights.get(word) || 0;
      const weightChange = currWeight - prevWeight;
      
      if (Math.abs(weightChange) > 0.01) { // Only significant changes
        changes.push({ word, weight_change: weightChange });
      }
    });
    
    return changes.sort((a, b) => Math.abs(b.weight_change) - Math.abs(a.weight_change));
  }

  // Get topic insights
  public getTopicInsights(topicResults: TopicModelResults): {
    dominant_topics: string[];
    emerging_topics: string[];
    declining_topics: string[];
    cross_topic_similarities: Array<{ topic1: string; topic2: string; similarity: number }>;
  } {
    const topics = topicResults.topics;
    
    // Sort topics by document count to find dominant ones
    const sortedByDocCount = [...topics].sort((a, b) => b.document_count - a.document_count);
    const dominantTopics = sortedByDocCount.slice(0, 3).map(t => t.label);
    
    // Placeholder for emerging/declining (would need temporal data)
    const emergingTopics = topics
      .filter(t => t.coherence_score > 0.7)
      .slice(0, 2)
      .map(t => t.label);
    
    const decliningTopics = topics
      .filter(t => t.coherence_score < 0.4)
      .slice(0, 2)
      .map(t => t.label);
    
    // Calculate cross-topic similarities
    const similarities: Array<{ topic1: string; topic2: string; similarity: number }> = [];
    
    for (let i = 0; i < topics.length - 1; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        const similarity = this.calculateTopicSimilarity(topics[i], topics[j]);
        similarities.push({
          topic1: topics[i].label,
          topic2: topics[j].label,
          similarity
        });
      }
    }
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return {
      dominant_topics: dominantTopics,
      emerging_topics: emergingTopics,
      declining_topics: decliningTopics,
      cross_topic_similarities: similarities.slice(0, 5)
    };
  }

  private calculateTopicSimilarity(topic1: Topic, topic2: Topic): number {
    const words1 = new Set(topic1.keywords.map(k => k.word));
    const words2 = new Set(topic2.keywords.map(k => k.word));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }
}