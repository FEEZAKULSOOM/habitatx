import jwt from 'jsonwebtoken';

const generateTokenAndSetCookie = (res, userId, role) => {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('jwt', token, {
    httpOnly: true, // Blocks client-side JavaScript access (prevents XSS)
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // CSRF mitigation
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
  

  return token;
};

export default generateTokenAndSetCookie;