import Listing from '../models/Listing.js';

// @desc    Create a new property listing
// @route   POST /api/listings
// @access  Private (Landlord only)
export const createListing = async (req, res) => {
  try {
    let {
      title,
      description,
      price,
      address,
      city,
      propertyType,
      type,
      bedrooms,
      bathrooms,
      amenities,
      coordinates,
      latitude,
      longitude,
    } = req.body;

    console.log('[LISTING] Creating listing with payload:', {
      title,
      price,
      address,
      propertyType: propertyType || type,
    });

    // 1. Handle coordinates parsing
    let parsedCoordinates = coordinates;
    if (typeof parsedCoordinates === 'string') {
      try {
        parsedCoordinates = JSON.parse(parsedCoordinates);
      } catch {
        parsedCoordinates = parsedCoordinates.split(',').map((val) => Number(val.trim()));
      }
    } else if (!parsedCoordinates && longitude !== undefined && latitude !== undefined) {
      parsedCoordinates = [Number(longitude), Number(latitude)];
    }

    // 2. Handle images parsing (Prioritize Cloudinary URLs populated by handleCloudinaryUpload)
    let finalImages = [];
    if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        finalImages = req.body.images;
      } else if (typeof req.body.images === 'string') {
        try {
          finalImages = JSON.parse(req.body.images);
        } catch {
          finalImages = [req.body.images];
        }
      }
    } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      finalImages = req.files
        .map((file) => file.path || file.secure_url || file.url)
        .filter(Boolean);
    }

    finalImages = (Array.isArray(finalImages) ? finalImages.flat() : [finalImages]).filter(
      (img) => typeof img === 'string' && img.startsWith('http')
    );

    console.log('[LISTING] Cloudinary URLs to save:', finalImages);

    // 3. Handle amenities parsing
    let parsedAmenities = amenities || [];
    if (typeof parsedAmenities === 'string') {
      try {
        parsedAmenities = JSON.parse(parsedAmenities);
      } catch {
        parsedAmenities = [parsedAmenities];
      }
    }

    // 4. Validation checks
    if (!title || !description || !price || !address || !parsedCoordinates || finalImages.length === 0) {
      console.warn('[LISTING] Failed to create: missing required fields', {
        title: Boolean(title),
        description: Boolean(description),
        price: Boolean(price),
        address: Boolean(address),
        coordinates: Boolean(parsedCoordinates),
        images: finalImages.length > 0,
      });
      return res.status(400).json({ message: 'All required listing fields must be provided' });
    }

    if (!Array.isArray(parsedCoordinates) || parsedCoordinates.length !== 2) {
      return res.status(400).json({
        message: 'Coordinates must be an array of two numbers: [longitude, latitude]',
      });
    }

    const [lng, lat] = parsedCoordinates.map(Number);
    if (Number.isNaN(lng) || Number.isNaN(lat)) {
      return res.status(400).json({
        message: 'Coordinates must contain valid numbers for longitude and latitude',
      });
    }

    // 5. Normalize property type
    const resolvedPropertyType = (propertyType || type || 'apartment').toLowerCase().trim();

    // 6. Create listing document in MongoDB
    const listing = await Listing.create({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      propertyType: resolvedPropertyType,
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      amenities: Array.isArray(parsedAmenities) ? parsedAmenities : [],
      address: address.trim(),
      city: (city || '').trim(),
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      images: finalImages,
      landlord: req.user._id,
    });

    console.log('[LISTING] Listing created successfully with ID:', listing._id);
    res.status(201).json(listing);
  } catch (error) {
    console.error('[LISTING ERROR] createListing:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all listings with optional search, property type, & price filters
// @route   GET /api/listings
// @access  Public
export const getListings = async (req, res) => {
  try {
    const { keyword, search, propertyType, type, minPrice, maxPrice, status, lng, lat, distance = 10 } = req.query;

    let query = {};

    const term = search || keyword;
    if (term) {
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { address: { $regex: term, $options: 'i' } },
        { city: { $regex: term, $options: 'i' } },
      ];
    }

    const selectedType = propertyType || type;
    if (selectedType && selectedType.toLowerCase() !== 'all') {
      query.propertyType = selectedType.toLowerCase();
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (status) {
      query.status = status;
    }

    if (lng && lat) {
      const radiusInMeters = Number(distance) * 1000;
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: radiusInMeters,
        },
      };
    }

    const listings = await Listing.find(query)
      .populate('landlord', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(listings);
  } catch (error) {
    console.error('[LISTING ERROR] getListings:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single listing by ID
// @route   GET /api/listings/:id
// @access  Public
export const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      'landlord',
      'name email avatar'
    );

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.status(200).json(listing);
  } catch (error) {
    console.error('[LISTING ERROR] getListingById:', error.message);
    res.status(500).json({ message: error.message });
  }
};