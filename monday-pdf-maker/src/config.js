// Settings come from environment variables / monday code secrets.
module.exports = {
  port: process.env.PORT || 8080,
  signingSecret: process.env.MONDAY_SIGNING_SECRET || '',
  apiToken: process.env.MONDAY_API_TOKEN || '', // fallback if monday sends no short-lived token
  apiVersion: process.env.MONDAY_API_VERSION || '2026-01',

  // Files column the PDF is attached to (can also be chosen per automation).
  filesColumnId: process.env.FILES_COLUMN_ID || 'file_mkzzq158', // "Files"

  // Column IDs on "Production Quotes 26" (5090759229) and its subitems board (5090759318).
  // If you copy the board, update these (or set them as env vars with the same names).
  columns: {
    team: process.env.COL_TEAM || 'text_mkzzej45',
    quoteType: process.env.COL_QUOTE_TYPE || 'text_mkzzpyvk',
    quoteDate: process.env.COL_QUOTE_DATE || 'date_mkzz1td2',
    jobNo: process.env.COL_JOB_NO || 'text_mkzz1g43',
    versionNo: process.env.COL_VERSION_NO || 'text_mkzz6n87',
    quoteDescription: process.env.COL_QUOTE_DESCRIPTION || 'long_text_mm036kj9',
    notes: process.env.COL_NOTES || 'long_text_mm02y09x',
  },
  subitemColumns: {
    description: process.env.COL_SUB_DESCRIPTION || 'text_mkzzjzdp',
    budgetType: process.env.COL_SUB_BUDGET_TYPE || 'color_mkzzt8h9',
    spendType: process.env.COL_SUB_SPEND_TYPE || 'color_mm1c6k34',
    quotedQty: process.env.COL_SUB_QTY || 'numeric_mkzzhtz7',
    quotedCost: process.env.COL_SUB_COST || 'numeric_mkzz27x1',
    spendSummary: process.env.COL_SUB_SPEND_SUMMARY || 'long_text_mm1tfkt9',
  },

  // Linked project (Project Board 5090728485). The first project linked in either column is used.
  project: {
    linkColumns: (process.env.PROJECT_LINK_COLUMNS || 'board_relation_mm0mbkn8,board_relation_mm1d86tj')
      .split(',').map((x) => x.trim()).filter(Boolean), // "Link to Project", "2026 Brand Projects"
    projectId: process.env.COL_PROJECT_ID || 'pulse_id_mm1jp3nq',
    projectIdText: process.env.COL_PROJECT_ID_TEXT || 'text_mm3fv6ar', // fallback "Item ID (TEXT)"
    shootDate: process.env.COL_PROJECT_SHOOT_DATE || 'timerange_mm0xyw8w',
    campaignOwner: process.env.COL_PROJECT_OWNER || 'person',
  },

  // Company block at the top of every PDF
  company: {
    name: process.env.COMPANY_NAME || 'THG Nutrition',
    team: process.env.COMPANY_TEAM || 'THG Nutrition Production Team',
    email: process.env.COMPANY_EMAIL || 'thgnutrition_production@thg.com',
  },
  defaultNotes:
    process.env.DEFAULT_NOTES ||
    'If you require any further information or have questions, please do not hesitate to contact us.',
};
