import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Lock,
} from 'lucide-react';
import { itemService } from '../services/itemService';
import { Category, PotentialMatch } from '../types';
import { ImageUploadZone, PhotoItem } from '../components/common/ImageUploadZone';
import { ItemCard } from '../components/common/ItemCard';
import { useAuth } from '../contexts/AuthContext';

const reportLostSchema = z.object({
  itemName: z.string().min(3, 'Item name must be at least 3 characters'),
  categoryId: z.string().min(1, 'Please select an item category'),
  dateOccurred: z.string().min(1, 'Please specify the date lost'),
  location: z.string().min(3, 'Approximate campus location is required'),
  publicDescription: z.string().min(10, 'Public description must be at least 10 characters'),
  colour: z.string().optional(),
  brand: z.string().optional(),
  distinguishingFeatures: z.string().optional(),
  privateVerificationDetails: z.string().optional(),
  contactPreference: z.enum(['EMAIL', 'PHONE', 'IN_APP']).default('IN_APP'),
});

type ReportLostFormInput = z.input<typeof reportLostSchema>;
type ReportLostFormData = z.output<typeof reportLostSchema>;

export const ReportLostPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success state after submission
  const [submittedItem, setSubmittedItem] = useState<any | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportLostFormInput, any, ReportLostFormData>({
    resolver: zodResolver(reportLostSchema),
    defaultValues: {
      contactPreference: 'IN_APP',
      dateOccurred: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    itemService.getCategories().then(setCategories).catch(console.error);
  }, []);

  const onSubmit = async (data: ReportLostFormData) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/report-lost');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('itemName', data.itemName);
      formData.append('categoryId', data.categoryId);
      formData.append('itemType', 'LOST');
      formData.append('dateOccurred', data.dateOccurred);
      formData.append('location', data.location);
      formData.append('publicDescription', data.publicDescription);
      if (data.colour) formData.append('colour', data.colour);
      if (data.brand) formData.append('brand', data.brand);
      if (data.distinguishingFeatures) formData.append('distinguishingFeatures', data.distinguishingFeatures);
      if (data.privateVerificationDetails) formData.append('privateVerificationDetails', data.privateVerificationDetails);
      formData.append('contactPreference', data.contactPreference);

      // Append uploaded photograph files
      const primaryIndex = photos.findIndex(p => p.isPrimary);
      formData.append('primaryImageIndex', (primaryIndex >= 0 ? primaryIndex : 0).toString());

      photos.forEach(photo => {
        if (photo.file) {
          formData.append('images', photo.file);
        }
      });

      const response = await itemService.createItem(formData);
      setSubmittedItem(response.item);
      setPotentialMatches(response.potentialMatches || []);
    } catch (err: any) {
      console.error('Error reporting lost item:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to submit lost item report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (submittedItem) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-bold mb-2">
            REFERENCE: {submittedItem.referenceNumber}
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Lost Item Report Registered!
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-8">
            Your report for <strong className="text-slate-800">"{submittedItem.itemName}"</strong> has been indexed in the campus lost-and-found system.
          </p>

          {/* Potential Matches found by engine */}
          {potentialMatches.length > 0 && (
            <div className="my-8 text-left bg-gradient-to-br from-blue-50 to-indigo-50/30 p-6 rounded-2xl border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  We found {potentialMatches.length} existing FOUND item(s) that may match!
                </h3>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Review these candidates to see if someone already turned in your property:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {potentialMatches.map(match => (
                  <div key={match.item.id} className="relative">
                    <span className="absolute top-2 right-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      {match.confidenceScore}% Match
                    </span>
                    <ItemCard item={match.item} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to={`/items/${submittedItem.id}`}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              View Listing
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Go to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
      <div className="mb-8">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-2">
          Lost Item Declaration
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Report a Lost Belonging
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Provide complete details to help campus security and fellow students identify and return your property.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SECTION 1: Item Basic Information */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            1. Core Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sony WH-1000XM4 Wireless Headphones, TI-84 Plus CE..."
              {...register('itemName')}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            {errors.itemName && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.itemName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('categoryId')}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Lost <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('dateOccurred')}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
              {errors.dateOccurred && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.dateOccurred.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Last Known Campus Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Central Library 3rd Floor Silent Study, North Gym Locker Room..."
              {...register('location')}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            {errors.location && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.location.message}</p>
            )}
          </div>
        </div>

        {/* SECTION 2: Visual & Distinguishing Attributes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            2. Identifying Characteristics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand or Manufacturer</label>
              <input
                type="text"
                placeholder="e.g. Apple, Hydro Flask, Nike, Sony..."
                {...register('brand')}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Colour</label>
              <input
                type="text"
                placeholder="e.g. Matte Black, Pacific Blue, Rose Gold..."
                {...register('colour')}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Public Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Provide general circumstances and appearance visible to other students browsing the portal..."
              {...register('publicDescription')}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            {errors.publicDescription && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.publicDescription.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Visible Distinguishing Marks
            </label>
            <input
              type="text"
              placeholder="e.g. Scratch on top cover, yellow keychain, stickers on back..."
              {...register('distinguishingFeatures')}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {/* SECTION 3: Photographs (MANDATORY Real File/Camera Upload) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <ImageUploadZone photos={photos} onChange={setPhotos} maxPhotos={5} />
        </div>

        {/* SECTION 4: Confidential Ownership Verification Info */}
        <div className="bg-amber-50/50 rounded-2xl border border-amber-200 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <Lock className="w-4 h-4 text-amber-700" />
            <span>Private Ownership Verification Information (Confidential)</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Specify private marks, serial numbers, password clues, custom engravings, or contents known only to you.
            <strong> This information is NEVER visible on public listings</strong> and is only used to evaluate potential matches.
          </p>
          <textarea
            rows={3}
            placeholder="e.g. Serial number ends in 4490, inside pouch contains a receipt for coffee, engraved initials 'SC'..."
            {...register('privateVerificationDetails')}
            className="w-full text-xs bg-white border border-amber-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
          />
        </div>

        {/* SECTION 5: Contact Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <label className="block text-xs font-semibold text-slate-700">Preferred Contact Method</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: 'IN_APP', label: 'In-Portal Messages' },
              { val: 'EMAIL', label: 'University Email' },
              { val: 'PHONE', label: 'Phone / SMS' },
            ].map(pref => (
              <label
                key={pref.val}
                className="flex items-center space-x-2 p-3 rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer text-xs font-medium text-slate-700 bg-slate-50"
              >
                <input
                  type="radio"
                  value={pref.val}
                  {...register('contactPreference')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{pref.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition flex items-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Report...</span>
              </>
            ) : (
              <span>Submit Lost Report</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
