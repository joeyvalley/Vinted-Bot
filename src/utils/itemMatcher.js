import logger from './logger.js';

class ItemMatcher {
  /**
   * Filters items based on user preferences
   * @param {Array} items - Array of Vinted items
   * @param {Object} preferences - User preferences object
   * @returns {Array} Filtered array of items
   */
  static filterItems(items, preferences) {
    try {
      return items.filter(item => {
        // Price range filter
        if (preferences.priceRange) {
          const { min, max } = preferences.priceRange;
          if ((min && item.price < min) || (max && item.price > max)) {
            return false;
          }
        }

        // Size filter
        if (preferences.sizes && preferences.sizes.length > 0) {
          if (!preferences.sizes.includes(item.size)) {
            return false;
          }
        }

        // Brand filter
        if (preferences.brands && preferences.brands.length > 0) {
          if (!preferences.brands.includes(item.brand.toLowerCase())) {
            return false;
          }
        }

        // Condition filter
        if (preferences.conditions && preferences.conditions.length > 0) {
          if (!preferences.conditions.includes(item.condition)) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      logger.error(`Item filtering failed: ${error.message}`, { preferences });
      throw error;
    }
  }

  /**
   * Matches items against user's saved searches
   * @param {Array} items - Array of Vinted items
   * @param {Object} savedSearches - User's saved searches
   * @returns {Array} Array of matched items with search context
   */
  static matchItemsToSearches(items, savedSearches) {
    try {
      const matchedItems = [];

      items.forEach(item => {
        savedSearches.forEach(search => {
          if (this.doesItemMatchSearch(item, search)) {
            matchedItems.push({
              ...item,
              matchedSearch: search.query,
              matchScore: this.calculateMatchScore(item, search)
            });
          }
        });
      });

      // Sort by match score descending
      return matchedItems.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      logger.error(`Item matching failed: ${error.message}`, { savedSearches });
      throw error;
    }
  }

  /**
   * Checks if an item matches a specific search
   * @param {Object} item - Vinted item
   * @param {Object} search - Saved search object
   * @returns {Boolean} True if item matches search
   */
  static doesItemMatchSearch(item, search) {
    // Basic text match in title and description
    const textMatch = item.title.toLowerCase().includes(search.query.toLowerCase()) ||
                     item.description.toLowerCase().includes(search.query.toLowerCase());

    // Category match
    const categoryMatch = search.category ? 
      item.category.toLowerCase() === search.category.toLowerCase() : true;

    return textMatch && categoryMatch;
  }

  /**
   * Calculates a match score between 0-1 for an item and search
   * @param {Object} item - Vinted item
   * @param {Object} search - Saved search object
   * @returns {Number} Match score between 0 and 1
   */
  static calculateMatchScore(item, search) {
    let score = 0;

    // Title match
    if (item.title.toLowerCase().includes(search.query.toLowerCase())) {
      score += 0.4;
    }

    // Description match
    if (item.description.toLowerCase().includes(search.query.toLowerCase())) {
      score += 0.3;
    }

    // Category match
    if (search.category && 
        item.category.toLowerCase() === search.category.toLowerCase()) {
      score += 0.2;
    }

    // Price match (bonus if within preferred range)
    if (search.priceRange) {
      const { min, max } = search.priceRange;
      if ((!min || item.price >= min) && (!max || item.price <= max)) {
        score += 0.1;
      }
    }

    return Math.min(1, score);
  }
}

export default ItemMatcher;
