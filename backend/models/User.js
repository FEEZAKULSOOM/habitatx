import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      validate: {
        validator: function (v) {
          return /^[a-zA-Z\s'-]+$/.test(v);
        },
        message: 'Name can only contain alphabetic letters, spaces, hyphens, and apostrophes',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
password: {
  type: String,
  required: function () {
    return !this.firebaseUid; // Password only required for native email/password accounts
  },
},
firebaseUid: {
  type: String,
  default: null,
},
    googleId: {
      type: String,
      default: null,
    },
// BEFORE:
role: {
  type: String,
  enum: ['tenant', 'landlord', 'admin' , 'superadmin'],
  default: 'tenant',
},
    avatar: {
      type: String,
      default: '',
    },
    // Wishlist / Saved listings array
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;