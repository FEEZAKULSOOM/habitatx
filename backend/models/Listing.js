import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Listing description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price must be a positive number'],
    },
    propertyType: {
      type: String,
      enum: ['apartment', 'house', 'villa', 'cabin', 'studio'],
      default: 'apartment',
      required: [true, 'Property type is required'],
    },
    bedrooms: {
      type: Number,
      default: 1,
    },
    bathrooms: {
      type: Number,
      default: 1,
    },
    amenities: {
      type: [String],
      default: [],
    },
    address: {
      type: String,
      required: [true, 'Street address is required'],
    },
    city: {
      type: String,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      // GeoJSON standard: [longitude, latitude]
      coordinates: {
        type: [Number],
        required: [true, 'Location coordinates are required'],
      },
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A listing must have at least one image',
      },
    },
    status: {
      type: String,
      enum: ['available', 'pending', 'rented'],
      default: 'available',
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // In Listing.js schema:
isArchived: {
  type: Boolean,
  default: false,
  index: true, // Speeds up discovery queries
},
decommissionedAt: {
  type: Date,
  default: null,
},
decommissionedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null,
}
  },
  {
    timestamps: true,
  }
);

// 2dsphere index enables geospatial queries ($near, $geoWithin)
listingSchema.index({ location: '2dsphere' });

const Listing = mongoose.model('Listing', listingSchema);
export default Listing;