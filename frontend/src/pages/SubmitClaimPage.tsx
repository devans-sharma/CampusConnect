import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileCheck2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Building,
} from 'lucide-react';
import { itemService } from '../services/itemService';
import { claimService } from '../services/claimService';
import { Item, Claim } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const claimSchema = z.object({
  claimDescription: z.string().min(15, 'Please explain in detail why this item belongs to you (at least 15 characters)'),
  identifyingCharacteristics: z.string().min(5, 'Please provide distinct identifying features (scratches, marks, serial info, etc.)'),
  supportingEvidence: z.string().optional(),
});

type ClaimFormData = z.infer<typeof claimSchema>;

export const SubmitClaimPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedClaim, setSubmittedClaim] = useState<Claim | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
  });

  useEffect(() => {
    if (!itemId) return;
    const fetchItem = async () => {
      try {
        setIsLoading(true);
        const data = await itemService.getItemById(itemId);
        setItem(data.item);

        // Client check: own item
        if (user && data.item.reporterId === user.id) {
          setErrorMessage('You cannot submit an ownership claim on an item you reported found yourself.');
        }
      } catch (err: any) {
        setErrorMessage(err.response?.data?.error || 'Could not load item details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [itemId, user]);

  const onSubmit = async (data: ClaimFormData) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/claim/${itemId}`);
      return;
    }

    if (!itemId) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const claim = await claimService.createClaim({
        itemId,
        claimDescription: data.claimDescription,
        identifyingCharacteristics: data.identifyingCharacteristics,
        supportingEvidence: data.supportingEvidence,
      });

      setSubmittedClaim(claim);
    } catch (err: any) {
      console.error('Claim submission failed:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to submit ownership claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading item details for ownership claim..." />;
  }

  // SUCCESS CONFIRMATION SCREEN
  if (submittedClaim) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 w-full">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-bold mb-2">
            CLAIM ID: {submittedClaim.referenceNumber}
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Ownership Claim Submitted!
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Your claim has been submitted to the item finder and campus security for verification. You will receive an in-portal notification when a decision is made.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Track in Student Dashboard
            </Link>
            <Link
              to={`/items/${itemId}`}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Back to Item Listing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryImage = item?.images?.find(i => i.isPrimary)?.imageUrl || item?.images?.[0]?.imageUrl;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Cancel and return</span>
      </button>

      <div className="mb-8">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
          Ownership Verification Process
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Submit Ownership Claim
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Verify your ownership by providing authentic details that distinguish this belonging.
        </p>
      </div>

      {/* Item Summary Card */}
      {item && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 mb-8 flex items-center space-x-4 shadow-sm">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={item.itemName}
              className="w-20 h-20 rounded-xl object-cover border border-slate-100 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-mono text-blue-600 font-semibold">{item.referenceNumber}</span>
            <h3 className="font-bold text-slate-900 text-base truncate">{item.itemName}</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Found at: {item.location} &bull; Kept: {item.currentHoldingLocation || 'Campus Security'}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Why do you believe this item belongs to you? <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe where and when you lost it, contents, or circumstances..."
              {...register('claimDescription')}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            {errors.claimDescription && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.claimDescription.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Unique Identifying Characteristics / Private Marks <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Provide unique details that match the private verification information recorded by the finder.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Scratches, engravings, stickers, unique items in the pocket, lock screen picture..."
              {...register('identifyingCharacteristics')}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            {errors.identifyingCharacteristics && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.identifyingCharacteristics.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Supporting Proof / Evidence (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Serial number, Amazon receipt order number, photo reference link..."
              {...register('supportingEvidence')}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start space-x-3 text-xs text-blue-900">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Campus Verification Safeguard</span>
            <p className="mt-0.5 text-blue-800">
              Claims are evaluated against recorded confidential notes. False or fraudulent claims are subject to student code of conduct disciplinary action.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={Boolean(isSubmitting || (user && item && item.reporterId === user.id))}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition flex items-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying and Submitting...</span>
              </>
            ) : (
              <span>Submit Claim</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
