const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { protect, superAdminOnly } = require('../middleware/auth');
const XLSX = require('xlsx');

router.use(protect);

const validation = [
  body('leaderId').notEmpty().withMessage('Leader required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('purpose').trim().notEmpty().withMessage('Purpose required'),
  body('paymentMethod').isIn(['phonepe','googlepay','cash','bank_transfer','other']),
  body('timeOfDay').isIn(['morning','afternoon','evening']).withMessage('Time of day required'),
  body('paymentDate').notEmpty().withMessage('Date required'),
];

// Helper — get owner userId based on role
const getOwnerId = async (user) => {
  // superadmin and adminviewer see all (pass null = no filter)
  if (user.role === 'superadmin' || user.role === 'adminviewer') return null;
  // leader sees only own
  return user._id;
};

// GET stats
router.get('/stats', async (req, res) => {
  try {
    const ownerId = await getOwnerId(req.user);
    const matchQuery = ownerId ? { leaderId: ownerId } : {};

    const overall = await Payment.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Per leader (admin roles only)
    let perLeader = [];
    if (!ownerId) {
      perLeader = await Payment.aggregate([
        { $group: { _id: '$leaderId', leaderName: { $first: '$leaderName' }, total: { $sum: '$amount' }, count: { $sum: 1 }, lastPayment: { $max: '$paymentDate' } } },
        { $sort: { total: -1 } }
      ]);
      const leaderIds = perLeader.map(p => p._id);
      const leaders = await User.find({ _id: { $in: leaderIds } }).select('name nameInTelugu');
      const leaderMap = {};
      leaders.forEach(l => { leaderMap[l._id.toString()] = l; });
      perLeader = perLeader.map(p => ({
        ...p,
        nameInTelugu: leaderMap[p._id?.toString()]?.nameInTelugu || '',
      }));
    }

    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const thisMonth = await Payment.aggregate([
      { $match: { ...matchQuery, paymentDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const sixAgo = new Date(); sixAgo.setMonth(sixAgo.getMonth()-5); sixAgo.setDate(1); sixAgo.setHours(0,0,0,0);
    const monthly = await Payment.aggregate([
      { $match: { ...matchQuery, paymentDate: { $gte: sixAgo } } },
      { $group: { _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const recent = await Payment.find(matchQuery).sort({ paymentDate: -1, createdAt: -1 }).limit(10);

    res.json({
      success: true,
      stats: {
        totalAmount: overall[0]?.total || 0,
        totalCount: overall[0]?.count || 0,
        monthAmount: thisMonth[0]?.total || 0,
        monthCount: thisMonth[0]?.count || 0,
        perLeader, monthly, recent,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET all payments
router.get('/', async (req, res) => {
  try {
    const ownerId = await getOwnerId(req.user);
    const { leaderId, search, paymentMethod, timeOfDay, startDate, endDate, sortBy = 'paymentDate', sortOrder = 'desc', page = 1, limit = 30 } = req.query;

    const query = ownerId ? { leaderId: ownerId } : {};
    if (!ownerId && leaderId) query.leaderId = leaderId;
    if (search) query.$or = [{ leaderName: { $regex: search, $options: 'i' } }, { purpose: { $regex: search, $options: 'i' } }, { notes: { $regex: search, $options: 'i' } }];
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (timeOfDay) query.timeOfDay = timeOfDay;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); query.paymentDate.$lte = e; }
    }

    const sort = {};
    sort[['paymentDate','amount','leaderName','createdAt'].includes(sortBy) ? sortBy : 'paymentDate'] = sortOrder === 'asc' ? 1 : -1;
    const pg = parseInt(page), lim = Math.min(parseInt(limit), 100);

    const [payments, total] = await Promise.all([
      Payment.find(query).sort(sort).skip((pg-1)*lim).limit(lim),
      Payment.countDocuments(query)
    ]);

    res.json({ success: true, payments, total, page: pg, pages: Math.ceil(total/lim) });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// POST — superadmin only
router.post('/', superAdminOnly, validation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const leader = await User.findById(req.body.leaderId);
    if (!leader) return res.status(404).json({ success: false, message: 'Leader not found' });
    const payment = await Payment.create({
      leaderId: req.body.leaderId,
      leaderName: leader.name,
      amount: parseFloat(req.body.amount),
      purpose: req.body.purpose.trim(),
      paymentMethod: req.body.paymentMethod,
      paymentDate: new Date(req.body.paymentDate),
      timeOfDay: req.body.timeOfDay,
      notes: req.body.notes?.trim() || '',
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, payment });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// PUT — superadmin only
router.put('/:id', superAdminOnly, validation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const leader = await User.findById(req.body.leaderId);
    if (!leader) return res.status(404).json({ success: false, message: 'Leader not found' });
    const payment = await Payment.findByIdAndUpdate(req.params.id, {
      leaderId: req.body.leaderId,
      leaderName: leader.name,
      amount: parseFloat(req.body.amount),
      purpose: req.body.purpose.trim(),
      paymentMethod: req.body.paymentMethod,
      paymentDate: new Date(req.body.paymentDate),
      timeOfDay: req.body.timeOfDay,
      notes: req.body.notes?.trim() || '',
    }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, payment });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// DELETE — superadmin only
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Payment deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Export Excel — all roles can export their own data
router.get('/export/excel', async (req, res) => {
  try {
    const ownerId = await getOwnerId(req.user);
    const query = ownerId ? { leaderId: ownerId } : {};
    const payments = await Payment.find(query).sort({ paymentDate: -1 });
    const timeMap = { morning: 'Morning (ఉదయం)', afternoon: 'Afternoon (మధ్యాహ్నం)', evening: 'Evening (సాయంత్రం)' };
    const data = payments.map((p, i) => ({
      'S.No': i+1,
      'Date': new Date(p.paymentDate).toLocaleDateString('en-IN'),
      'Time': timeMap[p.timeOfDay],
      'Leader Name': p.leaderName,
      'Amount (₹)': p.amount,
      'Purpose': p.purpose,
      'Payment Method': p.paymentMethod.replace('_',' ').toUpperCase(),
      'Notes': p.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=LabourPayments_${Date.now()}.xlsx`);
    res.send(buf);
  } catch { res.status(500).json({ success: false, message: 'Export failed' }); }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const ownerId = await getOwnerId(req.user);
    const query = ownerId ? { _id: req.params.id, leaderId: ownerId } : { _id: req.params.id };
    const payment = await Payment.findOne(query);
    if (!payment) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, payment });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
