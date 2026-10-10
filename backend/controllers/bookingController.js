import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import Transaction from '../models/Transaction.js';

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private (Tenant only)
export const createBooking = async (req, res) => {
  try {
    const { listingId, listing: bodyListing, startDate, endDate, message, totalPrice } = req.body;
    const resolvedListingId = listingId || bodyListing;

    console.log('[BOOKING] Initiating booking request for listing:', resolvedListingId);

    if (!resolvedListingId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Listing, start date, and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start or end date' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    const listing = await Listing.findById(resolvedListingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.status !== 'available') {
      return res.status(400).json({ message: 'Listing is not available for booking' });
    }

    // Property-specific conflict check: Only checks THIS specific listing ID
    const existingConflict = await Booking.findOne({
      listing: listing._id,
      status: { $in: ['confirmed', 'pending'] },$or: [
        { startDate: { $lt: end }, endDate: {$gt: start } },
      ],
    });

    if (existingConflict) {
      return res.status(400).json({
        message: 'This specific property is already reserved for the selected dates. Please choose different dates.',
      });
    }

    // Calculate nights & price
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const calculatedTotal = diffNights * Number(listing.price);

    const booking = await Booking.create({
      listing: listing._id,
      tenant: req.user._id,
      landlord: listing.landlord,
      startDate: start,
      endDate: end,
      totalPrice: Number(totalPrice) || calculatedTotal,
      message,
      status: 'pending',
    });

    // Broadcast instant socket events
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_created', booking);
      io.emit('booking_updated', { type: 'created', booking });
    }

    console.log(`[BOOKING] Created booking ${booking._id} on listing ${listing._id} for tenant ${req.user._id}`);
    res.status(201).json(booking);
  } catch (error) {
    console.error('[BOOKING ERROR] createBooking:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged-in user bookings (Tenant view vs Landlord view)
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Landlord sees all their bookings; Tenant sees only bookings that have NOT been dismissed from their dashboard
    const filter = req.user.role === 'landlord'
      ? { landlord: req.user._id }
      : { tenant: req.user._id, isDismissedByUser: { $ne: true } };

console.log(`[BOOKING] Fetching bookings for ${req.user.role} ID: ${req.user._id}`);

    // Auto-complete confirmed stays past checkout date in MongoDB
    await Booking.updateMany(
      {
        ...filter,
        status: 'confirmed',
        endDate: { $lte: new Date() },
      },
      { $set: { status: 'completed' } }
    );

    const bookings = await Booking.find(filter)
      .populate('listing', 'title address price images')
      .populate('tenant', 'name email avatar')
      .populate('landlord', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('[BOOKING ERROR] getMyBookings:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Dismiss a rejected booking from user dashboard (Soft delete: kept in database for records)
// @route   PATCH /api/bookings/:id/dismiss
// @access  Private (Tenant only)
export const dismissBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.tenant.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to dismiss this record' });
    }

    booking.isDismissedByUser = true;
    await booking.save();
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_updated', { type: 'dismissed', bookingId: id });
    }

    console.log(`[BOOKING] Dismissed booking ${id} from dashboard for user ${req.user._id}`);
    res.status(200).json({ message: 'Record dismissed successfully from dashboard', booking });
  } catch (error) {
    console.error('[BOOKING ERROR] dismissBooking:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get bookings for admin workspace (strictly isolated to properties owned by this admin/landlord)
// @route   GET /api/bookings/admin/all
// @access  Private (Admin or Landlord)
export const getAllBookingsAdmin = async (req, res) => {
  try {
    console.log(`[BOOKING ADMIN] Fetching isolated bookings for host/admin: ${req.user._id}`);

const filter = req.user.role === 'superadmin' ? {} : { landlord: req.user._id };

    // Auto-complete confirmed stays past checkout date in MongoDB
    await Booking.updateMany(
      {
        ...filter,
        status: 'confirmed',
        endDate: { $lte: new Date() },
      },
      { $set: { status: 'completed' } }
    );

    const bookings = await Booking.find(filter)
      .populate('listing', 'title address price images')
      .populate('tenant', 'name email avatar')
      .populate('landlord', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('[BOOKING ERROR] getAllBookingsAdmin:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status (Confirm / Reject / Cancel)
// @route   PATCH /api/bookings/:id/status
// @access  Private (Admin, Landlord, or Tenant)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

if (!['approved', 'confirmed', 'completed', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Completed bookings are finalized and cannot be modified or cancelled' });
    }

    const isSuperAdmin = req.user.role === 'superadmin';
    const isLandlordOwner = booking.landlord.toString() === req.user._id.toString();
    const isTenant = booking.tenant.toString() === req.user._id.toString();

    // Verify authorized party: Must be property host, the tenant, or superadmin
    if (!isSuperAdmin && !isLandlordOwner && !isTenant) {
      return res.status(403).json({ message: 'Not authorized: You do not own this property' });
    }

// Host/superadmin can set any status. 
    // Tenant is allowed to confirm ONLY IF the stay was already pre-approved by the host.
    const isTenantConfirmingApproved = isTenant && status === 'confirmed' && booking.status === 'approved';

    if (['approved', 'confirmed', 'rejected'].includes(status) && !isSuperAdmin && !isLandlordOwner && !isTenantConfirmingApproved) {
      return res.status(403).json({ message: 'Only the property host can approve or reject reservations' });
    }

    if (isTenantConfirmingApproved) {
      booking.paymentStatus = 'paid';
    }
    // Tenant can cancel pending requests; Host can cancel either pending or already-confirmed reservations
    if (status === 'cancelled' && !isSuperAdmin && !isTenant && !isLandlordOwner) {
      return res.status(403).json({ message: 'Only booking participants or the host can cancel' });
    }

    booking.status = status;
    await booking.save();
const io = req.app.get('io');
    if (io) {
      io.emit('booking_status_updated', booking);
      io.emit('booking_updated', { type: 'status_changed', booking });
    }

    console.log(`[BOOKING] Status updated to "${status}" for booking ID: ${booking._id}`);
    res.status(200).json(booking);
  } catch (error) {
    console.error('[BOOKING ERROR] updateBookingStatus:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active booked date ranges for a listing (for date-picker blocking)
// @route   GET /api/bookings/listing/:listingId
// @access  Public
export const getListingBookings = async (req, res) => {
  try {
    const { listingId } = req.params;

    // Retrieve active bookings so the frontend calendar can block unavailable dates
    const activeBookings = await Booking.find({
      listing: listingId,
      status: { $in: ['pending', 'approved', 'confirmed'] },
    }).select('startDate endDate status');

    res.status(200).json(activeBookings);
  } catch (error) {
    console.error('[BOOKING ERROR] getListingBookings:', error.message);
    res.status(500).json({ message: error.message });
  }
};



// @desc    Delete/Cancel a booking (Permanently removes from DB)
// @route   DELETE /api/bookings/:id
// @access  Private (Admin, Tenant who created it, or assigned Landlord)
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isSuperAdmin = req.user.role === 'superadmin';
    const isTenant = booking.tenant.toString() === req.user._id.toString();
    const isLandlordOwner = booking.landlord.toString() === req.user._id.toString();

    if (!isSuperAdmin && !isTenant && !isLandlordOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    // Also delete any associated pending transaction ledger record
    await Transaction.deleteMany({ booking: id });

    // Permanently remove booking record
    await Booking.findByIdAndDelete(id);

    // Free up reserved dates
    await Listing.findOneAndUpdate({ _id: booking.listing }, { $pull: { reservedDates: { $in: [booking.startDate, booking.endDate] } } });

// Broadcast instant socket event
const io = req.app.get('io');
if (io) {
  io.emit('booking_deleted', { bookingId: id });
  io.emit('booking_updated', { type: 'deleted', bookingId: id });
}


    console.log(`[BOOKING] Permanently deleted booking ${id} and freed dates`);
    res.status(200).json({ message: 'Booking and reserved dates successfully cleared' });
  } catch (error) {
    console.error('[BOOKING ERROR] deleteBooking:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get real-time actionable reservation count for navbar badge
// @route   GET /api/bookings/badge-count
// @access  Private
export const getBookingBadgeCount = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ count: 0 });
    }

    let count = 0;
    const role = req.user.role;

    if (role === 'superadmin') {
      // Superadmin sees all pending or approved reservations across the platform
      count = await Booking.countDocuments({
        status: { $in: ['pending', 'approved'] },
      });
    } else if (role === 'admin' || role === 'landlord') {
      // Landlord/Admin sees pending or approved requests for their properties
      count = await Booking.countDocuments({
        landlord: req.user._id,
        status: { $in: ['pending', 'approved'] },
      });
    } else {
      // Tenant sees their active bookings (pending, approved to pay, or confirmed)
      count = await Booking.countDocuments({
        tenant: req.user._id,
        isDismissedByUser: { $ne: true },
        status: { $in: ['pending', 'approved', 'confirmed'] },
      });
    }

    res.status(200).json({ count });
  } catch (error) {
    console.error('[BADGE COUNT ERROR]:', error.message);
    res.status(500).json({ count: 0 });
  }
};