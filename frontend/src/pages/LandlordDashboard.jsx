import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Building,
  CalendarCheck,
  PlusCircle,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Star,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

export default function LandlordDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('inventory');
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const isAuthorized = user?.role === 'landlord' || user?.role === 'admin' || user?.role === 'superadmin';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['landlord-dashboard', user?._id],
    queryFn: async () => {
      const res = await api.get('/landlord/dashboard');
      return res.data;
    },
    enabled: Boolean(user?._id && isAuthorized),
    refetchInterval: 5000,
  });

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['landlord-reviews', user?._id],
    queryFn: async () => {
      const res = await api.get('/reviews/landlord');
      return res.data;
    },
    enabled: Boolean(user?._id && isAuthorized),
    refetchInterval: 5000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, price }) => {
      const res = await api.patch(`/landlord/listings/${id}`, { price });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-dashboard', user?._id] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      if (!window.confirm('Are you sure you want to delete this property listing?')) return;
      const res = await api.delete(`/landlord/listings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-dashboard', user?._id] });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      if (!window.confirm('Moderate Review: Are you sure you want to remove this tenant review?')) return;
      const res = await api.delete(`/reviews/${reviewId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-reviews', user?._id] });
    },
  });

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center font-mono text-xs uppercase text-rose-400">
        Authentication failure. Steward dashboard requires elevated landlord or admin role.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 border border-[#262522] bg-[#0E0E0D] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center font-mono text-xs uppercase text-rose-400">
        Unable to load dashboard data. Please check connection.
      </div>
    );
  }

  const { metrics = {}, listings = [] } = data || {};

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#262522] pb-6">
        <div>
          <h1 className="font-['Syne'] text-2xl font-bold tracking-tight text-[#F4F0E6] sm:text-3xl">Steward Workspace</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[#A5A095]">
            Monitor property performance, pricing matrices, and tenant evaluations.
          </p>
        </div>
        <Link
          to="/create-listing"
          className="inline-flex items-center gap-2 border border-[#D2A52C] bg-[#D2A52C] px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-bold text-[#070707] transition hover:bg-[#E3B53B] shadow-[0_2px_12px_rgba(210,165,44,0.2)]"
        >
          <PlusCircle className="h-4 w-4 stroke-[2.5]" />
          <span>Index Space</span>
        </Link>
      </div>

      {/* Analytics Matrix */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-[#262522] bg-[#0E0E0D] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#A5A095]">Settled Yield</span>
            <div className="flex h-8 w-8 items-center justify-center border border-[#262522] bg-[#141413] text-[#D2A52C]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-['Syne'] text-2xl font-bold text-[#F4F0E6]">${metrics.totalEarnings || 0}</p>
          <span className="font-mono text-[10px] text-[#A5A095]">From locked stays</span>
        </div>

        <div className="border border-[#262522] bg-[#0E0E0D] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#A5A095]">Active Spaces</span>
            <div className="flex h-8 w-8 items-center justify-center border border-[#262522] bg-[#141413] text-[#D2A52C]">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-['Syne'] text-2xl font-bold text-[#F4F0E6]">{metrics.totalListings || 0}</p>
          <span className="font-mono text-[10px] text-[#A5A095]">Indexed across system</span>
        </div>

        <div className="border border-[#262522] bg-[#0E0E0D] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#A5A095]">Confirmed Stays</span>
            <div className="flex h-8 w-8 items-center justify-center border border-[#262522] bg-[#141413] text-[#D2A52C]">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-['Syne'] text-2xl font-bold text-[#F4F0E6]">{metrics.confirmedBookings || 0}</p>
          <span className="font-mono text-[10px] text-[#A5A095]">Completed reservations</span>
        </div>

        <div className="border border-[#262522] bg-[#0E0E0D] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#A5A095]">Tenant Records</span>
            <div className="flex h-8 w-8 items-center justify-center border border-[#262522] bg-[#141413] text-[#D2A52C]">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-['Syne'] text-2xl font-bold text-[#F4F0E6]">{reviews.length}</p>
          <span className="font-mono text-[10px] text-[#A5A095]">Across your inventory</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-[#262522] font-mono text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 uppercase tracking-wider transition ${
            activeTab === 'inventory'
              ? 'border-[#D2A52C] text-[#D2A52C] font-bold'
              : 'border-transparent text-[#A5A095] hover:text-[#F4F0E6]'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Indexed Spaces ({listings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 uppercase tracking-wider transition ${
            activeTab === 'reviews'
              ? 'border-[#D2A52C] text-[#D2A52C] font-bold'
              : 'border-transparent text-[#A5A095] hover:text-[#F4F0E6]'
          }`}
        >
          <Star className="h-4 w-4" />
          <span>Evaluation Moderation ({reviews.length})</span>
        </button>
      </div>

      {/* Tab 1: Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="border border-[#262522] bg-[#0E0E0D]">
          <div className="border-b border-[#262522] px-6 py-4">
            <h2 className="font-['Syne'] text-base font-bold text-[#F4F0E6]">Structure Portfolio</h2>
          </div>

          {listings.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-[#A5A095]">
              No architectural structures registered to your steward account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs text-[#A5A095]">
                <thead className="border-b border-[#262522] bg-[#141413] text-[10px] uppercase text-[#A5A095]">
                  <tr>
                    <th className="px-6 py-3.5">Property Details</th>
                    <th className="px-6 py-3.5">Classification</th>
                    <th className="px-6 py-3.5">Nightly Rate</th>
                    <th className="px-6 py-3.5">Condition</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A18]">
                  {listings.map((l) => (
                    <tr key={l._id} className="hover:bg-[#141413] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={l.images?.[0] || 'https://via.placeholder.com/150'}
                            alt={l.title}
                            className="h-12 w-14 border border-[#262522] object-cover"
                          />
                          <div>
                            <p className="font-['Syne'] font-semibold text-[#F4F0E6] line-clamp-1">{l.title}</p>
                            <p className="text-[10px] text-[#A5A095]">{l.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 uppercase">{l.propertyType || 'Property'}</td>
                      <td className="px-6 py-4">
                        {editingId === l._id ? (
                          <div className="flex items-center gap-1.5">
                            <span>$</span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 border border-[#D2A52C] bg-[#070707] px-2 py-1 text-xs text-[#F4F0E6] focus:outline-none"
                            />
                            <button
                              onClick={() => updateMutation.mutate({ id: l._id, price: editPrice })}
                              className="p-1 text-[#D2A52C] hover:text-[#E3B53B]"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-[#A5A095] hover:text-[#F4F0E6]"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#F4F0E6]">${l.price}</span>
                            <button
                              onClick={() => {
                                setEditingId(l._id);
                                setEditPrice(l.price);
                              }}
                              className="text-[#A5A095] hover:text-[#D2A52C]"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block border px-2 py-0.5 text-[9px] uppercase tracking-wider ${
                            l.status === 'available'
                              ? 'border-[#D2A52C]/30 bg-[#141413] text-[#D2A52C]'
                              : 'border-rose-900/40 bg-rose-950/40 text-rose-300'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/listings/${l._id}`}
                            className="border border-[#262522] bg-[#141413] p-1.5 text-[#A5A095] hover:border-[#D2A52C] hover:text-[#D2A52C]"
                            title="Inspect View"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => deleteMutation.mutate(l._id)}
                            className="border border-[#262522] bg-[#141413] p-1.5 text-[#A5A095] hover:border-rose-900 hover:text-rose-400"
                            title="Delete Listing"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Review Moderation Panel */}
      {activeTab === 'reviews' && (
        <div className="border border-[#262522] bg-[#0E0E0D] p-6">
          <div className="mb-6">
            <h2 className="font-['Syne'] text-base font-bold text-[#F4F0E6]">Tenant Evaluation Oversight</h2>
            <p className="mt-0.5 font-mono text-xs text-[#A5A095]">
              Moderate public reflections posted to your structures.
            </p>
          </div>

          {isLoadingReviews ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 border border-[#262522] bg-[#141413] animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="border border-[#262522] p-12 text-center">
              <Star className="mx-auto h-10 w-10 text-[#65635D]" />
              <p className="mt-3 font-mono text-xs uppercase text-[#A5A095]">No evaluations documented</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="flex flex-col justify-between gap-4 border border-[#262522] bg-[#141413] p-4 sm:flex-row sm:items-start"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-[#F4F0E6]">
                        {rev.tenant?.name || 'Verified Tenant'}
                      </span>
                      <span className="text-[#65635D]">•</span>
                      <span className="text-[#A5A095]">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[#65635D]">•</span>
                      <span className="border border-[#262522] bg-[#0E0E0D] px-2 py-0.5 text-[10px] text-[#D2A52C]">
                        {rev.listing?.title || 'Property'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[#D2A52C]">
                      {'★'.repeat(rev.rating)}
                      <span className="text-[#262522]">{'★'.repeat(5 - rev.rating)}</span>
                      <span className="ml-1 font-mono text-[10px] text-[#A5A095]">
                        ({rev.rating}/5)
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-[#A5A095] whitespace-pre-line">
                      "{rev.comment}"
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 border-t border-[#262522] pt-2 sm:border-0 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => deleteReviewMutation.mutate(rev._id)}
                      disabled={deleteReviewMutation.isPending}
                      className="inline-flex items-center gap-1.5 border border-rose-900/50 bg-rose-950/20 px-3 py-1.5 font-mono text-xs text-rose-300 hover:bg-rose-950/50 disabled:opacity-50"
                      title="Remove Inappropriate Review"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Expunge</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}