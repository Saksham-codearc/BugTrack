const { User } = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, publicUser } = require('../utils/helpers');

/**
 * User directory used by the "invite member" and assignee pickers.
 * Only authenticated users can search, and results are capped.
 */
const searchUsers = asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim();

  if (query.length < 2) {
    return res.json({ users: [] });
  }

  const regex = new RegExp(escapeRegex(query), 'i');
  const users = await User.find({
    $or: [{ name: regex }, { email: regex }],
  })
    .select('name email role avatarColor')
    .limit(12)
    .sort({ name: 1 });

  return res.json({ users: users.map(publicUser) });
});

module.exports = { searchUsers };
