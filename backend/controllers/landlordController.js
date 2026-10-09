import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

// @desc    Get landlord analytics & inventory of properties
// @route   GET /api/landlord/dashboard
// @access  Private (Landlord/Admin)
export const getLandlordDashboard = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';

    // 1. Get listings (All listings if superadmin, else only own listings)
    // Filter out decommissioned listings
    const listingFilter = isSuperAdmin 
      ? { isArchived: { $ne: true } } 
      : { landlord: req.user._id, isArchived: { $ne: true } };
    const listings = await Listing.find(listingFilter).sort({ createdAt: -1 });
    const listingIds = listings.map((l) => l._id);

    // 2. Get bookings (All bookings if superadmin, else matching listingIds)
    const bookingFilter = isSuperAdmin ? {} : { listing: { $in: listingIds } };
    const bookings = await Booking.find(bookingFilter)
      .populate('listing', 'title price')
      .populate('tenant', 'name email avatar')
      .sort({ createdAt: -1 });

    // 3. Compute aggregate earnings and stats across the queried bookings
    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
    const totalEarnings = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const pendingBookingsCount = bookings.filter((b) => b.status === 'pending').length;

    res.status(200).json({
      metrics: {
        totalEarnings,
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        pendingBookings: pendingBookingsCount,
        totalListings: listings.length,
      },
      listings,
      recentBookings: bookings.slice(0, 10),
    });
  } catch (error) {
    console.error('[LANDLORD ERROR] getLandlordDashboard:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Quick-update price or status of a landlord's listing
// @route   PATCH /api/landlord/listings/:id
// @access  Private (Landlord/Admin)
export const updateLandlordListing = async (req, res) => {
  try {
    const { price, status } = req.body;
    const listing = await Listing.findOne({ _id: req.params.id, landlord: req.user._id });

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found or unauthorized' });
    }

    if (price !== undefined) listing.price = Number(price);
    if (status !== undefined) listing.status = status;

    await listing.save();
    res.status(200).json(listing);
  } catch (error) {
    console.error('[LANDLORD ERROR] updateLandlordListing:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soft-delete / Decommission listing safely
// @route   DELETE /api/landlord/listings/:id
// @access  Private (Landlord/Admin/Superadmin)
export const deleteLandlordListing = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';

    // Allow lookup by ID if superadmin/admin, otherwise ensure landlord ownership
    const query = isSuperAdmin 
      ? { _id: req.params.id } 
      : { _id: req.params.id, landlord: req.user._id };

    const listing = await Listing.findOne(query);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found or unauthorized' });
    }

    // 1. Soft-delete the listing
    listing.status = 'decommissioned';
    listing.isArchived = true;
    listing.decommissionedAt = new Date();
    listing.decommissionedBy = req.user._id;
    await listing.save();

    // 2. Cascade cancel all pending and confirmed bookings for this listing
    await Booking.updateMany(
      {
        listing: listing._id,
        status: { $in: ['pending', 'confirmed'] },
      },
      {
        $set: {
          status: 'cancelled',
          cancellationReason: 'Listing decommissioned by host or platform administration.',
        },
      }
    );

    // 3. Remove the listing from all user wishlists
    await User.updateMany(
      { wishlist: listing._id },
      { $pull: { wishlist: listing._id } }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Listing decommissioned successfully. Active bookings cancelled.' 
    });
  } catch (error) {
    console.error('[LANDLORD ERROR] deleteLandlordListing:', error.message);
    res.status(500).json({ message: error.message });
  }
};