/**
 * Small class-name combiner (keeps JSX readable without an extra dependency).
 */
export const cn = (...values) => values.filter(Boolean).join(' ');
