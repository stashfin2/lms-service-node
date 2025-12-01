/**
 * Fineract API Constants
 * Centralized configuration for Fineract-specific values
 */

export const FineractConstants = {
  /**
   * Default office ID for client creation
   * TODO: Make this configurable per environment
   */
  DEFAULT_OFFICE_ID: parseInt(process.env.FINERACT_DEFAULT_OFFICE_ID || '1', 10),

  /**
   * Legal form ID for individual clients
   * 1 = Person/Individual (as per Fineract conventions)
   */
  LEGAL_FORM_PERSON: 1,

  /**
   * Default savings product ID
   * TODO: Make this configurable per environment
   */
  DEFAULT_SAVINGS_PRODUCT_ID: parseInt(process.env.FINERACT_DEFAULT_SAVINGS_PRODUCT_ID || '1', 10),

  /**
   * Date format for Fineract API requests
   */
  DATE_FORMAT: process.env.FINERACT_DATE_FORMAT || 'dd MMMM yyyy',

  /**
   * Locale for Fineract API requests
   */
  LOCALE: process.env.FINERACT_LOCALE || 'en',

  /**
   * Client default settings
   */
  CLIENT_DEFAULTS: {
    IS_STAFF: false,
    ACTIVE_ON_CREATION: true,
  },

  /**
   * Family details datatable name (as registered in Fineract)
   */
  DATATABLE_FAMILY_DETAILS: 'Family Details',
} as const;

