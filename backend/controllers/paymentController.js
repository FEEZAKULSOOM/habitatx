import axios from 'axios';
import Booking from '../models/Booking.js';
import Transaction from '../models/Transaction.js';

const SAFEPAY_ENV = process.env.SAFEPAY_ENV || 'sandbox';
const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY || 'sec_dummy_sandbox_key';

const SAFEPAY_BASE_URL =
  SAFEPAY_ENV === 'production'
    ? 'https://api.getsafepay.com'
    : 'https://sandbox.api.getsafepay.com';

const SAFEPAY_CHECKOUT_URL =
  SAFEPAY_ENV === 'production'
    ? 'https://checkout.getsafepay.com'
    : 'https://sandbox.api.getsafepay.com/checkout/pay';

// 1. Create Checkout Session & Initial Transaction Record
export const createCheckoutSession = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('listing');
    if (!booking) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (booking.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    let trackerToken = `sandbox_track_${Date.now()}`;

    // Request tracker from Safepay
    try {
      const response = await axios.post(
        `${SAFEPAY_BASE_URL}/order/v1/init`,
        {
          client: SAFEPAY_API_KEY,
          amount: Number(booking.totalPrice),
          currency: 'PKR',
          environment: SAFEPAY_ENV,
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 7000 }
      );
      if (response.data?.data?.token) {
        trackerToken = response.data.data.token;
      }
    } catch (apiErr) {
      console.warn('[SAFEPAY NOTICE] Sandbox fallback token initialized');
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const checkoutUrl = `${SAFEPAY_CHECKOUT_URL}?beacon=${trackerToken}&env=${SAFEPAY_ENV}&source=custom&order_id=${booking._id}&redirect_url=${encodeURIComponent(
      `${clientUrl}/bookings?payment=success&order_id=${booking._id}`
    )}`;

    // Create or update Transaction audit record in DB
    const transaction = await Transaction.findOneAndUpdate(
      { booking: booking._id },
      {
        booking: booking._id,
        tenant: booking.tenant,
        landlord: booking.landlord,
        amount: booking.totalPrice,
        currency: 'PKR',
        gateway: 'safepay',
        trackerToken,
        status: 'pending',
      },
      { upsert: true, new: true }
    );

    booking.transaction = transaction._id;
    await booking.save();

    res.status(200).json({ checkoutUrl, trackerToken });
  } catch (error) {
    console.error('[SAFEPAY ERROR]:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// 2. Finalize & Save Payment to MongoDB (Invoked automatically upon payment)
export const finalizePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // 1. Mark transaction in Database as completed
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { booking: booking._id },
      {
        status: 'completed',
        safepayRef: req.body.tracker || `tx_ref_${Date.now()}`,
      },
      { new: true, upsert: true }
    );

    // 2. Lock & Confirm the Booking
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.transaction = updatedTransaction._id;
    await booking.save();



// Broadcast instant socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_status_updated', booking);
      io.emit('booking_updated', { type: 'payment_settled', booking });
    }
    console.log(`[TRANSACTION STORED] Booking ${booking._id} confirmed. Transaction ID: ${updatedTransaction._id}`);
    res.status(200).json({ message: 'Transaction saved and stay confirmed', booking, transaction: updatedTransaction });
  } catch (error) {
    console.error('[FINALIZE PAYMENT ERROR]:', error.message);
    res.status(500).json({ message: error.message });
  }
};