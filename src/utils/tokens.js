export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export const TOKEN_BUDGETS = {
  quickstart: 15000,
  apiRef: 25000,
  guide: 20000,
  llmsTxt: 5000,
};

export function checkTokenBudget(text, type) {
  const tokens = estimateTokens(text);
  const budget = TOKEN_BUDGETS[type];
  if (!budget) return { tokens, withinBudget: true, budget: null };
  return { tokens, withinBudget: tokens <= budget, budget };
}
