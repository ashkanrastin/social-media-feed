const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function monthLabel(monthIndex: number): string {
  const label = monthLabels.at(monthIndex);
  if (typeof label !== 'string') {
    return '';
  }
  return label;
}

export function publishedOnLabel(createdAt: string): string {
  const date = new Date(createdAt);
  const day = String(date.getUTCDate());
  const month = monthLabel(date.getUTCMonth());
  const year = String(date.getUTCFullYear());
  return `${day} ${month} ${year}`;
}

export function commentCountLabel(count: number): string {
  if (count === 1) {
    return '1 comment';
  }
  return `${String(count)} comments`;
}
