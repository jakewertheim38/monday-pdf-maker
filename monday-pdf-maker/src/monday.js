const config = require('./config');

const API = 'https://api.monday.com/v2';

const VALUE_FIELDS = `
  id text type value column { title }
  ... on MirrorValue { display_value }
  ... on BoardRelationValue { display_value }
  ... on DependencyValue { display_value }
  ... on FormulaValue { display_value }
`;

async function gql(token, query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      'API-Version': config.apiVersion,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error('monday API error: ' + JSON.stringify(json.errors || json));
  }
  return json.data;
}

// Mirror / relation / formula columns return their text in display_value.
function cellText(cv) {
  const t = cv.display_value ?? cv.text;
  return t == null ? '' : String(t).trim();
}

// On the quote itself, also fetch the linked project's details.
const ITEM_FIELDS = `
  ${VALUE_FIELDS}
  ... on BoardRelationValue {
    linked_items {
      id name
      board { id name }
      column_values(ids: $projectCols) { ${VALUE_FIELDS} }
    }
  }
`;

async function getItem(token, itemId) {
  const p = config.project;
  const data = await gql(
    token,
    `query ($ids: [ID!], $projectCols: [String!]) {
      items(ids: $ids) {
        id name created_at
        board { id name }
        group { title }
        column_values { ${ITEM_FIELDS} }
        subitems { id name column_values { ${VALUE_FIELDS} } }
      }
    }`,
    { ids: [String(itemId)], projectCols: [p.projectId, p.projectIdText, p.shootDate, p.campaignOwner] }
  );
  const item = data.items && data.items[0];
  if (!item) throw new Error(`Item ${itemId} not found (or no access)`);
  return item;
}

// Upload a PDF buffer into a Files column on the item.
async function uploadPdf(token, itemId, columnId, filename, buffer) {
  const form = new FormData();
  form.append(
    'query',
    `mutation ($file: File!) {
      add_file_to_column (item_id: ${Number(itemId)}, column_id: "${columnId}", file: $file) { id }
    }`
  );
  form.append('variables[file]', new Blob([buffer], { type: 'application/pdf' }), filename);

  const res = await fetch(`${API}/file`, {
    method: 'POST',
    headers: { Authorization: token, 'API-Version': config.apiVersion },
    body: form,
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error('Upload failed: ' + JSON.stringify(json.errors || json));
  return json.data.add_file_to_column;
}

module.exports = { getItem, uploadPdf, cellText };
