import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, X, MapPin } from 'lucide-react';
import { listingSchema } from '../validations/listingSchema';
import LocationPickerMap from '../components/LocationPickerMap';
import api from '../api/axios';

const AMENITIES_LIST = [
  'Wifi',
  'Air conditioning',
  'Kitchen',
  'Free parking',
  'Pool',
  'Gym',
  'Dedicated workspace',
];

export default function CreateListing() {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [coordinates, setCoordinates] = useState({ lat: 33.6844, lng: 73.0479 });
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      propertyType: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
    },
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (item) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const onSubmit = async (values) => {
    if (images.length === 0) {
      setServerError('Please upload at least one image of your property.');
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError('');

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('price', values.price);

      formData.append('propertyType', values.propertyType);
      formData.append('type', values.propertyType);

      formData.append('bedrooms', values.bedrooms);
      formData.append('bathrooms', values.bathrooms);
      formData.append('address', values.address);
      formData.append('city', values.city);

      formData.append('coordinates', JSON.stringify([Number(coordinates.lng), Number(coordinates.lat)]));
      formData.append('latitude', String(coordinates.lat));
      formData.append('longitude', String(coordinates.lng));

      selectedAmenities.forEach((amenity) => {
        formData.append('amenities', amenity);
      });

      images.forEach((img) => {
        formData.append('images', img);
      });

      await api.post('/listings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await queryClient.invalidateQueries({ queryKey: ['listings'] });
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border border-[#262522] bg-[#0E0E0D] p-6 sm:p-10">
        <h1 className="font-['Syne'] text-2xl font-bold tracking-tight text-[#F4F0E6] sm:text-3xl">Index a New Space</h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[#A5A095]">
          Publish structural specifications, coordinates, and architectural photography.
        </p>

        {serverError && (
          <div className="mt-6 border border-rose-900/50 bg-rose-950/20 p-3 font-mono text-xs text-rose-300">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
              Architectural Title
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Minimalist Concrete Villa overlooking Margalla Hills"
              className="mt-1.5 w-full border border-[#262522] bg-[#141413] px-3.5 py-2.5 text-xs sm:text-sm text-[#F4F0E6] placeholder-[#A5A095]/40 focus:border-[#D2A52C] focus:outline-none"
            />
            {errors.title && <p className="mt-1 font-mono text-xs text-rose-400">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
              Architectural Narrative & Spatial Notes
            </label>
            <textarea
              rows={4}
              {...register('description')}
              placeholder="Describe materiality, illumination, orientation, and context..."
              className="mt-1.5 w-full border border-[#262522] bg-[#141413] px-3.5 py-2.5 text-xs sm:text-sm text-[#F4F0E6] placeholder-[#A5A095]/40 focus:border-[#D2A52C] focus:outline-none"
            />
            {errors.description && (
              <p className="mt-1 font-mono text-xs text-rose-400">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
                Nightly Tariff ($ USD)
              </label>
              <input
                type="number"
                {...register('price')}
                placeholder="150"
                className="mt-1.5 w-full border border-[#262522] bg-[#141413] px-3.5 py-2.5 text-xs sm:text-sm text-[#F4F0E6] placeholder-[#A5A095]/40 focus:border-[#D2A52C] focus:outline-none"
              />
              {errors.price && <p className="mt-1 font-mono text-xs text-rose-400">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
                Typology
              </label>
              <select
                {...register('propertyType')}
                className="mt-1.5 w-full border border-[#262522] bg-[#141413] px-3.5 py-2.5 text-xs sm:text-sm capitalize text-[#F4F0E6] focus:border-[#D2A52C] focus:outline-none"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="cabin">Cabin</option>
                <option value="studio">Studio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
                Bedrooms
              </label>
              <input
                type="number"
                {...register('bedrooms')}
                className="mt-1.5 w-full border border-[#262522] bg-[#141413] px-3.5 py-2.5 text-xs sm:text-sm text-[#F4F0E6] focus:border-[#D2A52C] focus:outline-none"
              />
              {errors.bedrooms && <p className="mt-1 font-mono text-xs text-rose-400">{errors.bedrooms.message}</p>}
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
                Bathrooms
              </label>
              <input
                type="number"
                {...register('bathrooms')}
                className="mt-1.5 w-full border border-[#262522] bg-[#141413] px-3.5 py-2.5 text-xs sm:text-sm text-[#F4F0E6] focus:border-[#D2A52C] focus:outline-none"
              />
              {errors.bathrooms && <p className="mt-1 font-mono text-xs text-rose-400">{errors.bathrooms.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
                Street Address
              </label>
              <input
                type="text"
                {...register('address')}
                placeholder="Sector F-7/2, Street 15"
                className="mt-1.5 w-full border border-[#262522] bg-[#141413] px-3.5 py-2.5 text-xs sm:text-sm text-[#F4F0E6] placeholder-[#A5A095]/40 focus:border-[#D2A52C] focus:outline-none"
              />
              {errors.address && <p className="mt-1 font-mono text-xs text-rose-400">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
                City / Region
              </label>
              <input
                type="text"
                {...register('city')}
                placeholder="Islamabad"
                className="mt-1.5 w-full border border-[#262522] bg-[#141413] px-3.5 py-2.5 text-xs sm:text-sm text-[#F4F0E6] placeholder-[#A5A095]/40 focus:border-[#D2A52C] focus:outline-none"
              />
              {errors.city && <p className="mt-1 font-mono text-xs text-rose-400">{errors.city.message}</p>}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
                Cartographic Coordinates Pin
              </label>
              <span className="flex items-center gap-1 font-mono text-xs text-[#D2A52C]">
                <MapPin className="h-3.5 w-3.5" />
                {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </span>
            </div>
            <LocationPickerMap coordinates={coordinates} setCoordinates={setCoordinates} />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
              Structural Amenities
            </label>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {AMENITIES_LIST.map((item) => {
                const active = selectedAmenities.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleAmenity(item)}
                    className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition ${
                      active
                        ? 'border border-[#D2A52C] bg-[#D2A52C] text-[#070707] font-bold'
                        : 'border border-[#262522] bg-[#141413] text-[#A5A095] hover:border-[#3D3B35] hover:text-[#F4F0E6]'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
              Editorial Imagery
            </label>
            <label className="mt-2.5 flex cursor-pointer flex-col items-center justify-center border border-dashed border-[#262522] bg-[#141413] p-8 transition hover:border-[#D2A52C]">
              <Upload className="h-6 w-6 text-[#A5A095]" />
              <span className="mt-2 font-mono text-xs uppercase tracking-wider text-[#F4F0E6]">
                Upload High-Resolution Imagery (PNG, JPG, WEBP)
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square overflow-hidden border border-[#262522]">
                    <img src={src} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 border border-[#262522] bg-black/80 p-1 text-white hover:text-rose-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full border border-[#D2A52C] bg-[#D2A52C] py-3.5 font-mono text-xs uppercase tracking-widest font-bold text-[#070707] transition hover:bg-[#E3B53B] disabled:opacity-50"
          >
            {isSubmitting ? 'INDEXING ARTIFACT TO REPOSITORY...' : 'PUBLISH SPACE TO REGISTRY'}
          </button>
        </form>
      </div>
    </div>
  );
}