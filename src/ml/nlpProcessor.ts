// Advanced NLP Processing Engine for eConsultation Platform

export interface TokenizedText {
  tokens: string[];
  sentences: string[];
  lemmatized: string[];
  stems: string[];
  namedEntities: NamedEntity[];
  posTags: POSTag[];
}

export interface NamedEntity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

export interface POSTag {
  token: string;
  tag: string;
  confidence: number;
}

export interface NGramResult {
  bigrams: { [key: string]: number };
  trigrams: { [key: string]: number };
  skipgrams: { [key: string]: number };
}

export interface TFIDFResult {
  terms: { [term: string]: number };
  documentFrequency: { [term: string]: number };
  inverseDocumentFrequency: { [term: string]: number };
}

export class NLPProcessor {
  private stopWords: Set<string>;
  private legalTerms: Set<string>;
  private businessTerms: Set<string>;
  private sentimentLexicon: Map<string, number>;

  constructor() {
    this.initializeResources();
  }

  private initializeResources() {
    // Enhanced stop words for legal and business context
    this.stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might',
      'can', 'shall', 'must', 'do', 'does', 'did', 'a', 'an', 'as', 'if', 'then',
      'than', 'so', 'very', 'just', 'now', 'only', 'also', 'each', 'which', 'where',
      'when', 'who', 'what', 'how', 'why', 'there', 'here', 'before', 'after'
    ]);

    // Legal domain-specific terms
    this.legalTerms = new Set([
      'section', 'clause', 'provision', 'amendment', 'act', 'regulation', 'law',
      'statute', 'precedent', 'judgment', 'court', 'case', 'ruling', 'legal',
      'constitutional', 'judicial', 'legislative', 'compliance', 'violation',
      'enforcement', 'jurisdiction', 'tribunal', 'bench', 'appeal', 'writ',
      'petition', 'order', 'directive', 'notification', 'gazette', 'ordinance'
    ]);

    // Business domain-specific terms
    this.businessTerms = new Set([
      'corporate', 'company', 'business', 'enterprise', 'organization', 'entity',
      'stakeholder', 'shareholder', 'director', 'board', 'governance', 'management',
      'operations', 'strategy', 'revenue', 'profit', 'loss', 'investment',
      'capital', 'finance', 'accounting', 'audit', 'transparency', 'disclosure',
      'liability', 'asset', 'equity', 'debt', 'merger', 'acquisition', 'subsidiary'
    ]);

    // Sentiment lexicon with Indian legal/business context
    this.sentimentLexicon = new Map([
      // Positive terms
      ['support', 1.0], ['agree', 0.8], ['beneficial', 0.9], ['excellent', 1.0],
      ['good', 0.7], ['positive', 0.8], ['helpful', 0.7], ['effective', 0.8],
      ['constructive', 0.9], ['progressive', 0.8], ['innovative', 0.9],
      ['commendable', 0.9], ['appreciate', 0.8], ['welcome', 0.7], ['endorse', 0.9],
      
      // Negative terms
      ['oppose', -1.0], ['disagree', -0.8], ['problematic', -0.9], ['concerning', -0.7],
      ['harmful', -0.9], ['detrimental', -0.9], ['ineffective', -0.8], ['inadequate', -0.8],
      ['unrealistic', -0.8], ['burdensome', -0.9], ['excessive', -0.8], ['prohibitive', -0.9],
      ['reject', -1.0], ['object', -0.8], ['criticize', -0.7], ['flawed', -0.8],
      
      // Legal context terms
      ['constitutional', 0.1], ['unconstitutional', -0.9], ['precedent', 0.2],
      ['landmark', 0.6], ['binding', 0.3], ['advisory', 0.1], ['mandatory', 0.2],
      ['discretionary', 0.1], ['retrospective', -0.3], ['prospective', 0.3],
      
      // Business context terms
      ['compliance', 0.3], ['transparency', 0.8], ['accountability', 0.7],
      ['governance', 0.6], ['oversight', 0.4], ['disclosure', 0.5], ['audit', 0.3],
      ['regulatory', 0.2], ['streamline', 0.8], ['facilitate', 0.7], ['burden', -0.6]
    ]);
  }

  // Advanced text preprocessing
  public preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\-]/g, ' ') // Keep hyphens for compound words
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Tokenization with sentence boundary detection
  public tokenize(text: string): TokenizedText {
    const preprocessed = this.preprocessText(text);
    
    // Sentence segmentation using simple rules (can be enhanced with ML models)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Word tokenization
    const tokens = preprocessed.split(/\s+/).filter(token => token.length > 2);
    
    // Lemmatization (simplified - in production, use proper lemmatizer)
    const lemmatized = tokens.map(token => this.lemmatize(token));
    
    // Stemming (simplified Porter stemmer)
    const stems = tokens.map(token => this.stem(token));
    
    // Named Entity Recognition
    const namedEntities = this.extractNamedEntities(text);
    
    // POS Tagging
    const posTags = this.performPOSTagging(tokens);

    return {
      tokens,
      sentences,
      lemmatized,
      stems,
      namedEntities,
      posTags
    };
  }

  // Simplified lemmatization
  private lemmatize(word: string): string {
    const lemmaRules: { [key: string]: string } = {
      'companies': 'company',
      'entities': 'entity',
      'amendments': 'amendment',
      'provisions': 'provision',
      'regulations': 'regulation',
      'requirements': 'requirement',
      'suggestions': 'suggestion',
      'recommendations': 'recommendation',
      'considerations': 'consideration',
      'implementations': 'implementation',
      'complexities': 'complexity',
      'responsibilities': 'responsibility'
    };
    
    return lemmaRules[word] || word;
  }

  // Simplified Porter stemming
  private stem(word: string): string {
    if (word.length <= 3) return word;
    
    // Remove common suffixes
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment', 'able', 'ible'];
    
    for (const suffix of suffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        return word.slice(0, -suffix.length);
      }
    }
    
    return word;
  }

  // Named Entity Recognition for legal/business context
  private extractNamedEntities(text: string): NamedEntity[] {
    const entities: NamedEntity[] = [];
    
    // Legal entities patterns
    const legalPatterns = [
      { pattern: /section\s+\d+[a-z]?/gi, label: 'LEGAL_SECTION' },
      { pattern: /clause\s+\d+/gi, label: 'LEGAL_CLAUSE' },
      { pattern: /(supreme court|high court|district court)/gi, label: 'COURT' },
      { pattern: /\b[A-Z][a-z]+\s+(?:vs?\.?|v\.?)\s+[A-Z][a-z]+/g, label: 'CASE_NAME' },
      { pattern: /(companies act|corporations act|securities act)/gi, label: 'LEGISLATION' },
      { pattern: /mca\s*\d*/gi, label: 'REGULATORY_BODY' }
    ];

    // Business entities patterns
    const businessPatterns = [
      { pattern: /\b[A-Z][a-z]+\s+(ltd|limited|inc|corporation|corp|llp)/gi, label: 'COMPANY' },
      { pattern: /(board of directors|management|shareholders)/gi, label: 'BUSINESS_ENTITY' },
      { pattern: /(compliance|governance|audit|disclosure)/gi, label: 'BUSINESS_PROCESS' }
    ];

    const allPatterns = [...legalPatterns, ...businessPatterns];

    allPatterns.forEach(({ pattern, label }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          label,
          start: match.index,
          end: match.index + match[0].length,
          confidence: this.calculateEntityConfidence(match[0], label)
        });
      }
    });

    return entities;
  }

  private calculateEntityConfidence(text: string, label: string): number {
    // Simple confidence calculation based on text characteristics
    let confidence = 0.7; // Base confidence
    
    if (label === 'LEGAL_SECTION' && /section\s+\d+/i.test(text)) confidence += 0.2;
    if (label === 'COURT' && /(supreme|high)/i.test(text)) confidence += 0.2;
    if (label === 'COMPANY' && /(ltd|limited)/i.test(text)) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // POS Tagging (simplified)
  private performPOSTagging(tokens: string[]): POSTag[] {
    const posRules: { [key: string]: string } = {
      // Nouns
      'company': 'NN', 'section': 'NN', 'amendment': 'NN', 'provision': 'NN',
      'regulation': 'NN', 'law': 'NN', 'court': 'NN', 'case': 'NN',
      
      // Verbs
      'support': 'VB', 'oppose': 'VB', 'agree': 'VB', 'disagree': 'VB',
      'recommend': 'VB', 'suggest': 'VB', 'implement': 'VB', 'comply': 'VB',
      
      // Adjectives
      'beneficial': 'JJ', 'harmful': 'JJ', 'effective': 'JJ', 'problematic': 'JJ',
      'constitutional': 'JJ', 'legal': 'JJ', 'regulatory': 'JJ', 'corporate': 'JJ'
    };

    return tokens.map(token => ({
      token,
      tag: posRules[token] || this.guessReactPOSTag(token),
      confidence: posRules[token] ? 0.9 : 0.6
    }));
  }

  private guessReactPOSTag(token: string): string {
    if (token.endsWith('ly')) return 'RB'; // Adverb
    if (token.endsWith('ed') || token.endsWith('ing')) return 'VB'; // Verb
    if (token.endsWith('tion') || token.endsWith('ness')) return 'NN'; // Noun
    if (token.endsWith('able') || token.endsWith('ible')) return 'JJ'; // Adjective
    return 'NN'; // Default to noun
  }

  // N-gram extraction
  public extractNGrams(tokens: string[]): NGramResult {
    const bigrams: { [key: string]: number } = {};
    const trigrams: { [key: string]: number } = {};
    const skipgrams: { [key: string]: number } = {};

    // Bigrams
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      bigrams[bigram] = (bigrams[bigram] || 0) + 1;
    }

    // Trigrams
    for (let i = 0; i < tokens.length - 2; i++) {
      const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      trigrams[trigram] = (trigrams[trigram] || 0) + 1;
    }

    // Skip-grams (2-skip-2-grams)
    for (let i = 0; i < tokens.length - 3; i++) {
      const skipgram = `${tokens[i]} ${tokens[i + 2]}`;
      skipgrams[skipgram] = (skipgrams[skipgram] || 0) + 1;
    }

    return { bigrams, trigrams, skipgrams };
  }

  // TF-IDF Calculation
  public calculateTFIDF(documents: string[]): TFIDFResult {
    const allTokens = documents.map(doc => this.tokenize(doc).tokens);
    const vocabulary = new Set(allTokens.flat());
    
    const terms: { [term: string]: number } = {};
    const documentFrequency: { [term: string]: number } = {};
    const inverseDocumentFrequency: { [term: string]: number } = {};

    // Calculate document frequency
    vocabulary.forEach(term => {
      documentFrequency[term] = allTokens.filter(tokens => tokens.includes(term)).length;
      inverseDocumentFrequency[term] = Math.log(documents.length / documentFrequency[term]);
    });

    // Calculate TF-IDF for each term
    allTokens.forEach(tokens => {
      const termFrequency: { [term: string]: number } = {};
      tokens.forEach(token => {
        termFrequency[token] = (termFrequency[token] || 0) + 1;
      });

      Object.keys(termFrequency).forEach(term => {
        const tf = termFrequency[term] / tokens.length;
        const idf = inverseDocumentFrequency[term];
        terms[term] = (terms[term] || 0) + (tf * idf);
      });
    });

    return { terms, documentFrequency, inverseDocumentFrequency };
  }

  // Advanced sentiment scoring using lexicon and context
  public calculateSentimentScore(text: string): number {
    const tokens = this.tokenize(text).tokens;
    let sentimentScore = 0;
    let totalWords = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const baseScore = this.sentimentLexicon.get(token) || 0;
      
      if (baseScore !== 0) {
        let contextualScore = baseScore;
        
        // Check for negation in surrounding context
        const negationWords = ['not', 'no', 'never', 'neither', 'nor', 'none', 'cannot', 'unable'];
        const negationRange = 3; // Look 3 words before and after
        
        for (let j = Math.max(0, i - negationRange); j <= Math.min(tokens.length - 1, i + negationRange); j++) {
          if (j !== i && negationWords.includes(tokens[j])) {
            contextualScore *= -0.8; // Reverse and dampen sentiment
            break;
          }
        }
        
        // Check for intensifiers
        const intensifiers = ['very', 'extremely', 'highly', 'significantly', 'strongly', 'completely'];
        for (let j = Math.max(0, i - 2); j <= Math.min(tokens.length - 1, i + 2); j++) {
          if (j !== i && intensifiers.includes(tokens[j])) {
            contextualScore *= 1.3; // Amplify sentiment
            break;
          }
        }
        
        sentimentScore += contextualScore;
        totalWords++;
      }
    }

    // Normalize score
    return totalWords > 0 ? sentimentScore / totalWords : 0;
  }

  // Extract domain-specific features
  public extractDomainFeatures(text: string): {
    legalTermsCount: number;
    businessTermsCount: number;
    complexityScore: number;
    formalityScore: number;
    technicalTermsRatio: number;
  } {
    const tokens = this.tokenize(text).tokens;
    
    let legalTermsCount = 0;
    let businessTermsCount = 0;
    let complexWords = 0;
    let formalWords = 0;

    tokens.forEach(token => {
      if (this.legalTerms.has(token)) legalTermsCount++;
      if (this.businessTerms.has(token)) businessTermsCount++;
      if (token.length > 8) complexWords++; // Complex words are typically longer
      if (this.isFormalWord(token)) formalWords++;
    });

    const complexityScore = complexWords / tokens.length;
    const formalityScore = formalWords / tokens.length;
    const technicalTermsRatio = (legalTermsCount + businessTermsCount) / tokens.length;

    return {
      legalTermsCount,
      businessTermsCount,
      complexityScore,
      formalityScore,
      technicalTermsRatio
    };
  }

  private isFormalWord(word: string): boolean {
    const formalWords = new Set([
      'pursuant', 'whereas', 'heretofore', 'notwithstanding', 'aforementioned',
      'consequently', 'furthermore', 'nevertheless', 'accordingly', 'therefore',
      'specifically', 'particularly', 'respectively', 'substantially', 'comprehensive'
    ]);
    return formalWords.has(word);
  }

  // Language detection (simplified for Indian context)
  public detectLanguage(text: string): { language: string; confidence: number } {
    const hindiPatterns = /[\u0900-\u097F]/; // Devanagari script
    const englishPatterns = /[a-zA-Z]/;
    
    const hindiChars = (text.match(hindiPatterns) || []).length;
    const englishChars = (text.match(englishPatterns) || []).length;
    const totalChars = hindiChars + englishChars;
    
    if (totalChars === 0) return { language: 'unknown', confidence: 0 };
    
    if (hindiChars > englishChars) {
      return { language: 'hindi', confidence: hindiChars / totalChars };
    } else {
      return { language: 'english', confidence: englishChars / totalChars };
    }
  }
}