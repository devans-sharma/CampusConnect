import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  Loader2,
  Lock,
} from 'lucide-react';
import { itemService } from '../services/itemService';
import { Category } from '../types';
import { ImageUploadZone, PhotoItem } from '../components/common/ImageUploadZone';
import { useAuth } from '../contexts/AuthContext';

const reportFoundSchema = z.object({
  itemName: z.string().min(3, 'Item name must be at least 3 characters'),
  categoryId: z.string().min(1, 'Please select an item category'),
  dateOccurred: z.string().min(1, 'Please specify the date found'),
  location: z.string().min(3, 'Location found is required'),
  publicDescription: z.string().min(10, 'Public description must be at least 10 characters'),
  privateVerificationDetails: z.string().min(5, 'Private verification information is required to evaluate ownership claims'),
  colour: z.string().optional(),
  brand: z.string().optional(),
  distinguishingFeatures: z.string().optional(),
  currentHoldingLocation: z.string().min(1, 'Please select where the item is currently kept'),
  contactPreference: z.enum(['EMAIL', 'PHONE', 'IN_APP']).default('IN_APP'),
});

type ReportFoundFormData = z.infer<typeof reportFoundSchema>;

export const ReportFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedItem, setSubmittedItem] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFoundFormData>({
    resolver: zodResolver(reportFoundSchema),
    defaultValues: {
      currentHoldingLocation: 'Deposited at Security Office',
      contactPreference: 'IN_APP',
      dateOccurred: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    itemService.getCategories().then(setCategories).catch(console.error);
  }, []);

  const onSubmit = async (data: ReportFoundFormData) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/report-found');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('itemName', data.itemName);
      formData.append('categoryId', data.categoryId);
      formData.append('itemType', 'FOUND');
      formData.append('dateOccurred', data.dateOccurred);
      formData.append('location', data.location);
      formData.append('publicDescription', data.publicDescription);
      formData.append('privateVerificationDetails', data.privateVerificationDetails);
      if (data.colour) formData.append('colour', data.colour);
      if (data.brand) formData.append('brand', data.brand);
      if (data.distinguishingFeatures) formData.append('distinguishingFeatures', data.distinguishingFeatures);
      formData.append('currentHoldingLocation', data.currentHoldingLocation);
      formData.append('contactPreference', data.contactPreference);

      const primaryIndex = photos.findIndex(p => p.isPrimary);
      formData.append('primaryImageIndex', (primaryIndex >= 0 ? primaryIndex : 0).toString());

      photos.forEach(photo => {
        if (photo.file) {
          formData.append('images', photo.file);
        }
      });

      const response = await itemService.createItem(formData);
      setSubmittedItem(response.item);
    } catch (err: any) {
      console.error('Error reporting found item:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to submit found item report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (submittedItem) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 w-full">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-bold mb-2">
            REFERENCE: {submittedItem.referenceNumber}
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Found Item Registered!
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Thank you for turning in <strong className="text-slate-800">"{submittedItem.itemName}"</strong>. Your report is now live in the directory so the rightful student can discover it and submit an ownership claim.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 max-w-md mx-auto mb-8 border border-slate-200 text-left space-y-1">
            <p><strong>Storage:</strong> {submittedItem.currentHoldingLocation}</p>
            <p><strong>Private Details:</strong> Securely saved &amp; hidden from public APIs.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to={`/items/${submittedItem.id}`}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              View Public Listing
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Return to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
      <div className="mb-8">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          Found Property Registration
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Report a Found Item
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Help return a lost belonging to its rightful campus owner safely and securely.
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
            1. What Did You Find?
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Hydro Flask Blue Water Bottle, Brown Leather Wallet..."
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
                Date Found <span className="text-rose-500">*</span>
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
              Exact / Approximate Location Found <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Student Union 2nd Floor Dining Table, Science Quad Bench..."
              {...register('location')}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            {errors.location && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.location.message}</p>
            )}
          </div>
        </div>

        {/* SECTION 2: Holding Location & Storage */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>2. Where is the item currently kept?</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { val: 'Deposited at Security Office', label: 'Deposited at Security Office (Building A)', desc: 'Recommended for high-value items, wallets & IDs' },
              { val: 'Deposited at Administration Office', label: 'Deposited at Administration Office', desc: 'Main Campus Admin Room 104' },
              { val: 'With Finder', label: 'Kept with Finder (Safe Keeping)', desc: 'You will arrange handover when claim is approved' },
              { val: 'Department Front Desk', label: 'Departmental Front Desk', desc: 'Specific academic hall reception' },
            ].map(loc => (
              <label
                key={loc.val}
                className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer text-xs bg-slate-50"
              >
                <input
                  type="radio"
                  value={loc.val}
                  {...register('currentHoldingLocation')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">{loc.label}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{loc.desc}</span>
                </div>
              </label>
            ))}
          </div>
          {errors.currentHoldingLocation && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.currentHoldingLocation.message}</p>
          )}
        </div>

        {/* SECTION 3: Photographs (MANDATORY Real File/Camera Upload) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <ImageUploadZone photos={photos} onChange={setPhotos} maxPhotos={5} />
        </div>

        {/* SECTION 4: TWO SEPARATE DESCRIPTION FIELDS (Public vs Private) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            3. Public vs. Private Descriptions
          </h2>

          {/* Field A: Public Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-800">
                Public Description <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Visible to all students browsing</span>
            </div>
            <textarea
              rows={3}
              placeholder="e.g. Black wireless earbuds in a dark case found on a study desk near the library exit."
              {...register('publicDescription')}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            {errors.publicDescription && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.publicDescription.message}</p>
            )}
          </div>

          {/* Field B: Private Verification Information (CRITICAL REQUIREMENT) */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Private Ownership Verification Information <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">CONFIDENTIAL &bull; HIDDEN FROM PUBLIC</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Describe identifying details that only the true owner would know. 
              <strong> This information is NEVER exposed through public APIs or listings</strong>, allowing you and campus admins to verify authentic claims.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Has a small scratch on left hinge, serial ends in 99, custom sticker 'SJ-2024' on the inner lid..."
              {...register('privateVerificationDetails')}
              className="w-full text-xs bg-white border border-amber-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
            {errors.privateVerificationDetails && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.privateVerificationDetails.message}</p>
            )}
          </div>
        </div>

        {/* SECTION 5: Additional Characteristics */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                placeholder="e.g. Apple, Hydro Flask, Fossil..."
                {...register('brand')}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Colour</label>
              <input
                type="text"
                placeholder="e.g. Black, Navy, Brown..."
                {...register('colour')}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
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
            className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition flex items-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Found Property...</span>
              </>
            ) : (
              <span>Submit Found Property Report</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
