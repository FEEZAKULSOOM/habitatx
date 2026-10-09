import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tenant reference is required'],
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Landlord reference is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
status: {
      type: String,
      enum: ['pending', 'approved', 'confirmed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    message: {
      type: String,
      default: '',
    },

    // Add this field to your booking schema
isDismissedByUser: {
  type: Boolean,
  default: false,
}
  },
  {
    timestamps: true,
  }
);

// Prevent overlapping bookings for the same listing when already confirmed
bookingSchema.index({ listing: 1, startDate: 1, endDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;