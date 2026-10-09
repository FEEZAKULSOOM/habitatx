import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
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