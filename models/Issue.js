const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedByName: String,
  comment: String,
  timestamp: { type: Date, default: Date.now }
});

const issueSchema = new mongoose.Schema({
  issueId: { type: String, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Pothole', 'Garbage', 'Water Leakage', 'Damaged Road', 'Broken Streetlight', 'Sewage', 'Encroachment', 'Other']
  },
  area: { type: String, required: true },
  locality: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  address: { type: String, default: '' },
  images: [String],
  status: {
    type: String,
    enum: ['Reported', 'Verified', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Reported'
  },
  severity: { type: Number, min: 1, max: 5, default: 3 }, // S: 1-5
  priorityScore: { type: Number, default: 0 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNote: { type: String, default: '' },
  statusHistory: [statusHistorySchema],
  isSpam: { type: Boolean, default: false },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  updatedAt: { type: Date, default: Date.now }
});

// Geospatial index
issueSchema.index({ location: '2dsphere' });
issueSchema.index({ area: 1, category: 1, status: 1 });

// Auto-generate Issue ID: UIR-YYYYMMDD-XXXX
issueSchema.pre('save', async function(next) {
  if (!this.issueId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Issue').countDocuments();
    this.issueId = `UIR-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  this.updatedAt = new Date();
  next();
});

// Priority Score Algorithm: (A×2) + (S×5) + (D×1)
// A = area complaint count (calculated externally), S = severity, D = days pending
issueSchema.methods.calculatePriority = async function() {
  const daysOld = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  const areaCount = await mongoose.model('Issue').countDocuments({
    area: this.area,
    status: { $ne: 'Resolved' }
  });
  this.priorityScore = (areaCount * 2) + (this.severity * 5) + (daysOld * 1);
  return this.priorityScore;
};

// Priority label
issueSchema.virtual('priorityLabel').get(function() {
  if (this.priorityScore >= 40) return 'Critical';
  if (this.priorityScore >= 25) return 'High';
  if (this.priorityScore >= 15) return 'Medium';
  return 'Low';
});

issueSchema.virtual('daysPending').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

issueSchema.set('toObject', { virtuals: true });
issueSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Issue', issueSchema);
