const { User } = require('./models/User');
const { Project } = require('./models/Project');
const { Ticket } = require('./models/Ticket');
const { Comment } = require('./models/Comment');

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const PASSWORD = 'password123';

/**
 * Creates demo users, two projects, tickets, and threaded comments.
 * Refuses to overwrite an existing database unless force=true.
 */
async function seedDatabase({ force = false, silent = false } = {}) {
  const existingUsers = await User.countDocuments();

  if (existingUsers > 0 && !force) {
    throw new Error(
      'The database already contains users. Use "npm run seed -- --force" to wipe and reseed it.'
    );
  }

  if (existingUsers > 0) {
    await Promise.all([
      Comment.deleteMany({}),
      Ticket.deleteMany({}),
      Project.deleteMany({}),
      User.deleteMany({}),
    ]);
  }

  const [aarav, meera, dev, riya, kabir] = await User.create([
    {
      name: 'Aarav Sharma',
      email: 'aarav@bugtrack.dev',
      password: PASSWORD,
      role: 'admin',
      avatarColor: '#4f46e5',
    },
    {
      name: 'Meera Patel',
      email: 'meera@bugtrack.dev',
      password: PASSWORD,
      role: 'user',
      avatarColor: '#db2777',
    },
    {
      name: 'Dev Kapoor',
      email: 'dev@bugtrack.dev',
      password: PASSWORD,
      role: 'user',
      avatarColor: '#0891b2',
    },
    {
      name: 'Riya Singh',
      email: 'riya@bugtrack.dev',
      password: PASSWORD,
      role: 'user',
      avatarColor: '#16a34a',
    },
    {
      name: 'Kabir Rao',
      email: 'kabir@bugtrack.dev',
      password: PASSWORD,
      role: 'user',
      avatarColor: '#ea580c',
    },
  ]);

  const aurora = await Project.create({
    title: 'Aurora Web App',
    key: 'AUR',
    description:
      'Customer-facing storefront and checkout experience. This is the primary product squad project.',
    color: '#4f46e5',
    owner: aarav._id,
    members: [
      { user: aarav._id, role: 'admin' },
      { user: meera._id, role: 'manager' },
      { user: dev._id, role: 'developer' },
      { user: riya._id, role: 'viewer' },
      { user: kabir._id, role: 'developer' },
    ],
  });

  const banking = await Project.create({
    title: 'Mobile Banking App',
    key: 'MOB',
    description:
      'iOS and Android banking app. Focused on secure payments, statements, and notifications.',
    color: '#0891b2',
    owner: meera._id,
    members: [
      { user: meera._id, role: 'admin' },
      { user: aarav._id, role: 'admin' },
      { user: kabir._id, role: 'manager' },
      { user: dev._id, role: 'developer' },
      { user: riya._id, role: 'viewer' },
    ],
  });

  const auroraRows = [
    {
      title: 'Checkout page crashes on Safari 17',
      description:
        'Opening checkout on Safari 17.2 crashes the tab after the payment sheet loads.\n\nSteps to reproduce:\n1. Add any item to the cart\n2. Go to checkout\n3. Choose "Pay with card"\n\nExpected: payment form renders.\nActual: Safari shows "A problem repeatedly occurred".',
      type: 'bug',
      status: 'in_progress',
      priority: 'urgent',
      reporter: riya._id,
      assignee: dev._id,
      labels: ['checkout', 'safari'],
      dueInDays: 2,
    },
    {
      title: 'Add dark mode to the dashboard',
      description:
        'We already have design tokens for dark mode. Add a toggle in the user menu, persist the preference, and respect prefers-color-scheme by default.',
      type: 'feature',
      status: 'todo',
      priority: 'medium',
      reporter: aarav._id,
      assignee: meera._id,
      labels: ['design', 'dashboard'],
      dueInDays: 12,
    },
    {
      title: 'Login session expires too quickly',
      description:
        'Users are signed out after roughly 15 minutes even with "remember me" enabled. Refresh tokens should keep the session alive for 7 days.',
      type: 'bug',
      status: 'todo',
      priority: 'high',
      reporter: meera._id,
      assignee: null,
      labels: ['auth'],
      dueInDays: 5,
    },
    {
      title: 'Improve empty-state illustrations',
      description:
        'Replace the generic grey placeholder boxes with friendly illustrations and a clear next action button.',
      type: 'improvement',
      status: 'done',
      priority: 'low',
      reporter: aarav._id,
      assignee: kabir._id,
      labels: ['design', 'polish'],
      dueInDays: -3,
    },
    {
      title: 'Payment webhook retries fail after timeout',
      description:
        'Stripe webhook retries return 500 when the order service takes longer than 10 seconds. Move the fulfilment work to a queue and acknowledge immediately.',
      type: 'bug',
      status: 'todo',
      priority: 'urgent',
      reporter: dev._id,
      assignee: dev._id,
      labels: ['payments', 'backend'],
      dueInDays: 1,
    },
    {
      title: 'Export project tickets as CSV',
      description:
        'Add an export button to the ticket list that downloads the current filtered view as CSV, including key, title, status, priority, and assignee.',
      type: 'feature',
      status: 'in_progress',
      priority: 'high',
      reporter: meera._id,
      assignee: kabir._id,
      labels: ['reporting'],
      dueInDays: 8,
    },
    {
      title: 'Fix avatar overflow on mobile',
      description:
        'Member avatars overflow the project card at widths below 380px. Stack them with a +N counter instead.',
      type: 'bug',
      status: 'done',
      priority: 'medium',
      reporter: riya._id,
      assignee: meera._id,
      labels: ['mobile', 'css'],
      dueInDays: -1,
    },
    {
      title: 'Add keyboard shortcuts for search',
      description:
        'Pressing Cmd/Ctrl+K should focus the ticket search. Escape should clear the filters.',
      type: 'feature',
      status: 'todo',
      priority: 'low',
      reporter: kabir._id,
      assignee: aarav._id,
      labels: ['ux'],
      dueInDays: 20,
    },
    {
      title: 'Upgrade Tailwind to the latest stable release',
      description:
        'Update Tailwind, re-run the design token build, and verify that no utility classes were removed.',
      type: 'task',
      status: 'done',
      priority: 'medium',
      reporter: aarav._id,
      assignee: dev._id,
      labels: ['maintenance'],
      dueInDays: -7,
    },
    {
      title: 'Comment mentions trigger duplicate emails',
      description:
        'Mentioning a teammate in a comment sends two notification emails. Ensure the queue job is idempotent per comment recipient.',
      type: 'bug',
      status: 'in_progress',
      priority: 'high',
      reporter: meera._id,
      assignee: meera._id,
      labels: ['notifications', 'backend'],
      dueInDays: 4,
    },
    {
      title: 'Write onboarding checklist documentation',
      description:
        'Document the first-day setup: local environment, seed data, branch conventions, and how to move a ticket through the board.',
      type: 'task',
      status: 'todo',
      priority: 'low',
      reporter: aarav._id,
      assignee: riya._id,
      labels: ['docs'],
      dueInDays: 15,
    },
  ];

  const bankingRows = [
    {
      title: 'Biometric login fails on Android 14',
      description:
        'Fingerprint prompt dismisses immediately on Pixel devices running Android 14. Fall back to PIN when biometrics are unavailable.',
      type: 'bug',
      status: 'in_progress',
      priority: 'urgent',
      reporter: kabir._id,
      assignee: dev._id,
      labels: ['android', 'auth'],
      dueInDays: 2,
    },
    {
      title: 'Monthly statements load slowly',
      description:
        'Statement PDFs take 8-12 seconds to generate for accounts with more than 500 transactions. Cache generated statements per month.',
      type: 'bug',
      status: 'todo',
      priority: 'high',
      reporter: riya._id,
      assignee: null,
      labels: ['performance'],
      dueInDays: 9,
    },
    {
      title: 'Add transaction search filters',
      description:
        'Let customers filter transactions by date range, amount, and category with saved filter chips.',
      type: 'feature',
      status: 'todo',
      priority: 'medium',
      reporter: kabir._id,
      assignee: kabir._id,
      labels: ['ux', 'transactions'],
      dueInDays: 18,
    },
    {
      title: 'Add Face ID confirmation for transfers',
      description:
        'Require Face ID for transfers above ₹10,000 with a clear fallback to app PIN.',
      type: 'feature',
      status: 'done',
      priority: 'high',
      reporter: meera._id,
      assignee: dev._id,
      labels: ['ios', 'security'],
      dueInDays: -5,
    },
    {
      title: 'Polish notification permission prompt',
      description:
        'Explain the value of notifications before triggering the OS prompt, and remember dismissals for 14 days.',
      type: 'improvement',
      status: 'done',
      priority: 'low',
      reporter: riya._id,
      assignee: kabir._id,
      labels: ['notifications', 'ux'],
      dueInDays: -10,
    },
  ];

  let auroraTicketCount = 0;
  const auroraTickets = [];

  for (const row of auroraRows) {
    auroraTicketCount += 1;
    auroraTickets.push({
      ...row,
      project: aurora._id,
      number: auroraTicketCount,
      key: `AUR-${auroraTicketCount}`,
      reporter: row.reporter,
      assignee: row.assignee,
      dueDate: row.dueInDays === undefined ? null : daysFromNow(row.dueInDays),
    });
  }

  let bankingTicketCount = 0;
  const bankingTickets = [];

  for (const row of bankingRows) {
    bankingTicketCount += 1;
    bankingTickets.push({
      ...row,
      project: banking._id,
      number: bankingTicketCount,
      key: `MOB-${bankingTicketCount}`,
      reporter: row.reporter,
      assignee: row.assignee,
      dueDate: row.dueInDays === undefined ? null : daysFromNow(row.dueInDays),
    });
  }

  const countByStatus = (rows) => {
    const counters = { todo: 0, in_progress: 0, done: 0 };
    return rows.map((row) => {
      const order = counters[row.status];
      counters[row.status] += 1;
      return { ...row, order };
    });
  };

  const createdAurora = await Ticket.create(countByStatus(auroraTickets));
  const createdBanking = await Ticket.create(countByStatus(bankingTickets));

  aurora.ticketCounter = auroraTicketCount;
  await aurora.save();
  banking.ticketCounter = bankingTicketCount;
  await banking.save();

  const byKey = new Map([...createdAurora, ...createdBanking].map((ticket) => [ticket.key, ticket]));

  const first = byKey.get('AUR-1');
  const exportTicket = byKey.get('AUR-6');
  const biometric = byKey.get('MOB-1');

  const meeraComment = await Comment.create({
    ticket: first._id,
    project: aurora._id,
    author: meera._id,
    text: 'Reproduced on Safari 17.2 on macOS Sonoma. The crash happens right after the payment sheet is mounted, so I suspect the third-party SDK is accessing a detached element.',
  });

  const devReply = await Comment.create({
    ticket: first._id,
    project: aurora._id,
    author: dev._id,
    text: 'Confirmed. The SDK calls window.paymentRequest on an unmounted iframe. I have a fix in a branch — will open a PR after adding a regression test.',
    parent: meeraComment._id,
  });

  await Comment.create({
    ticket: first._id,
    project: aurora._id,
    author: riya._id,
    text: 'I added a screen recording to the ticket so QA can verify the fix on the same device.',
    parent: devReply._id,
  });

  await Comment.create({
    ticket: first._id,
    project: aurora._id,
    author: aarav._id,
    text: 'Marking this urgent — checkout conversion drops sharply on Safari. Please include it in today’s release train.',
  });

  const exportComment = await Comment.create({
    ticket: exportTicket._id,
    project: aurora._id,
    author: kabir._id,
    text: 'CSV export is working behind a feature flag. I still need to verify the filtered-view behaviour before I move this to Done.',
  });

  await Comment.create({
    ticket: exportTicket._id,
    project: aurora._id,
    author: meera._id,
    text: 'Please include the assignee email as well as the name. Finance wants to reconcile by owner.',
    parent: exportComment._id,
  });

  await Comment.create({
    ticket: biometric._id,
    project: banking._id,
    author: meera._id,
    text: 'Let us ship the PIN fallback first and investigate the Android 14 biometric regression separately.',
  });

  await Ticket.updateOne({ _id: first._id }, { $set: { commentsCount: 4 } });
  await Ticket.updateOne({ _id: exportTicket._id }, { $set: { commentsCount: 2 } });
  await Ticket.updateOne({ _id: biometric._id }, { $set: { commentsCount: 1 } });

  if (!silent) {
    console.log('\n🌱 Demo data ready');
    console.log('   Projects: Aurora Web App (AUR), Mobile Banking App (MOB)');
    console.log('   Tickets: 11 + 5, with threaded comments');
    console.log('   Sign in with any of these accounts (password: password123):');
    console.log('     aarav@bugtrack.dev  (Aarav Sharma, global + project admin)');
    console.log('     meera@bugtrack.dev  (Meera Patel, project manager)');
    console.log('     dev@bugtrack.dev    (Dev Kapoor, developer)');
    console.log('     riya@bugtrack.dev   (Riya Singh, viewer)\n');
  }

  return { users: [aarav, meera, dev, riya, kabir], projects: [aurora, banking] };
}

if (require.main === module) {
  const { connectDB, disconnectDB } = require('./config/db');

  (async () => {
    await connectDB();
    await seedDatabase({ force: process.argv.includes('--force') });
    await disconnectDB();
  })().catch(async (error) => {
    console.error('❌ Seed failed:', error.message);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
}

module.exports = { seedDatabase, PASSWORD };
