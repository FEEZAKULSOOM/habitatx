import { z } from 'zod';

export const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(15, 'Description must be at least 15 characters'),
  price: z.coerce.number().min(1, 'Price must be greater than zero'),
  propertyType: z.enum(['apartment', 'house', 'villa', 'cabin', 'studio']),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  bedrooms: z.coerce.number().min(1, 'Must have at least 1 bedroom'),
  bathrooms: z.coerce.number().min(1, 'Must have at least 1 bathroom'),
});