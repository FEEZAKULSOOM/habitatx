import User from '../models/User.js';

// @desc    Toggle save/unsave listing in wishlist
// @route   POST /api/wishlist/:listingId
// @access  Private (Tenants/Authenticated)
export const toggleWishlist = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSaved = user.wishlist.some(
      (id) => id.toString() === listingId.toString()
    );

    let updatedUser;
    if (isSaved) {
      // Remove from wishlist
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { wishlist: listingId } },
        { new: true }
      ).select('wishlist');
    } else {
      // Add uniquely to wishlist
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { wishlist: listingId } },
        { new: true }
      ).select('wishlist');
    }

    res.status(200).json({
      saved: !isSaved,
      wishlist: updatedUser.wishlist,
    });
  } catch (error) {
    console.error('[WISHLIST ERROR] toggleWishlist:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all saved properties for logged-in user
// @route   GET /api/wishlist
// @access  Private
export const getMyWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: {
        path: 'landlord',
        select: 'name email avatar',
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user.wishlist || []);
  } catch (error) {
    console.error('[WISHLIST ERROR] getMyWishlist:', error.message);
    res.status(500).json({ message: error.message });
  }
};