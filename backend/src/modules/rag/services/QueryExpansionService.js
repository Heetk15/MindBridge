/**
 * Query Expansion Service
 * Expands user queries with synonyms and related terms for better retrieval
 */

class QueryExpansionService {
  /**
   * Synonym mapping for common health/wellness queries
   */
  static synonymMap = {
    // Nutrition related
    protein: ['protein', 'amino acids', 'meat', 'fish', 'eggs', 'legumes', 'nutrition'],
    nutrition: ['nutrition', 'diet', 'food', 'eating', 'meals', 'nutrients'],
    calcium: ['calcium', 'bones', 'dairy', 'milk', 'strong bones', 'osteoporosis'],
    vitamin: ['vitamin', 'supplement', 'deficiency', 'nutrient'],
    weight: ['weight', 'lose weight', 'gain weight', 'obesity', 'healthy weight'],
    
    // Exercise related
    exercise: ['exercise', 'workout', 'physical activity', 'fitness', 'movement'],
    walking: ['walking', 'walk', 'step', 'movement', 'exercise'],
    yoga: ['yoga', 'stretch', 'flexibility', 'balance', 'exercise'],
    swimming: ['swimming', 'water exercise', 'aquatic'],
    strength: ['strength', 'resistance', 'weights', 'muscle', 'training'],
    
    // Health related
    blood: ['blood', 'pressure', 'circulation', 'hypertension'],
    sleep: ['sleep', 'insomnia', 'rest', 'fatigue', 'tired', 'bedroom'],
    heart: ['heart', 'cardiac', 'cardiovascular', 'blood pressure', 'cholesterol'],
    
    // Family related
    family: ['family', 'relatives', 'relationships', 'loved ones', 'grandchildren'],
    grandchildren: ['grandchildren', 'grandkids', 'kids', 'family'],
    communication: ['communication', 'talk', 'conversation', 'connect', 'contact'],
    
    // General wellness
    health: ['health', 'wellness', 'healthy', 'medical'],
    elderly: ['elderly', 'senior', 'aging', 'older', 'age'],
    safe: ['safe', 'safety', 'prevent', 'prevent injury', 'precaution'],
  }

  /**
   * Expand query with synonyms
   */
  static expandQuery(query) {
    const lowerQuery = query.toLowerCase()
    const expandedTerms = new Set([query])

    // Find matching synonyms
    Object.keys(this.synonymMap).forEach((key) => {
      if (lowerQuery.includes(key)) {
        this.synonymMap[key].forEach((synonym) => {
          expandedTerms.add(synonym)
        })
      }
    })

    return Array.from(expandedTerms)
  }

  /**
   * Create expanded query string
   */
  static getExpandedQueryString(query) {
    const expandedTerms = this.expandQuery(query)
    return expandedTerms.join(' ')
  }

  /**
   * Extract keywords from query for fallback search
   */
  static extractKeywords(query) {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter((word) => !['that', 'this', 'what', 'when', 'where', 'which', 'help', 'tell', 'give'].includes(word))
  }
}

module.exports = QueryExpansionService