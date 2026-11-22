const PALETTE = [
  '#4f46e5',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#2563eb',
  '#9333ea',
];

const colorForName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  }
  return PALETTE[hash % PALETTE.length];
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const publicUser = (user) => {
  if (!user) return null;
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatarColor: user.avatarColor,
  };
};

module.exports = { PALETTE, colorForName, escapeRegex, parseDate, publicUser };
