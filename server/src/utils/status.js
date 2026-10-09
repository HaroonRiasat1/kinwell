// Health status scale used across the product: normal → watch → attention.
export const STATUSES = ['normal', 'watch', 'attention'];
export const STATUS_RANK = { normal: 0, watch: 1, attention: 2 };
export const worstStatus = (list) =>
  list.reduce((worst, s) => (STATUS_RANK[s] > STATUS_RANK[worst] ? s : worst), 'normal');
