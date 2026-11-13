import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  User,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { collectionService } from '../services/collectionService';
import { Collection } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export const CollectionTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [handoverNotes, setHandoverNotes] = useState('');

  const fetchCollection = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await collectionService.getCollectionById(id);
      setCollection(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to load collection record.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const handleConfirmHandover = async () => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await collectionService.confirmCollection(id, handoverNotes.trim() || undefined);
      setSuccessMessage('Item collection confirmed! Status updated to RETURNED.');
      fetchCollection();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to confirm handover.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Retrieving collection handover record..." />;
  }

  if (!collection) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Collection Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">{errorMessage || 'Access denied or invalid ID.'}</p>
        <Link to="/dashboard" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isFinder = collection.claim?.item?.reporterId === user?.id;
  const isClaimant = collection.claim?.claimantId === user?.id;
  const canConfirm = (isFinder || isAdmin) && collection.status !== 'COLLECTED';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-mono text-xs font-bold text-blue-600">
              CLAIM: {collection.claim?.referenceNumber}
            </span>
            <span className="text-slate-300">&bull;</span>
            <StatusBadge status={collection.status} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Item Handover &amp; Collection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official handover workflow for verified belongings.
          </p>
        </div>

        {collection.status === 'COLLECTED' && (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Safely Handed Over &amp; Reunited</span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Item & Participant Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6 mb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Item Being Collected</span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">{collection.claim?.item?.itemName}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Reference: {collection.claim?.item?.referenceNumber}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Verified Owner (Claimant)</span>
            <p className="text-xs font-bold text-slate-900">{collection.claim?.claimant?.fullName}</p>
            <p className="text-[11px] text-slate-500 font-mono">{collection.claim?.claimant?.studentId} &bull; {collection.claim?.claimant?.department}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Item Finder</span>
            <p className="text-xs font-bold text-slate-900">{collection.claim?.item?.reporter?.fullName || 'Campus Member'}</p>
            <p className="text-[11px] text-slate-500">{collection.claim?.item?.reporter?.department || 'University Community'}</p>
          </div>
        </div>
      </div>

      {/* Handover Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5 mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
          Handover Instructions &amp; Pickup Counter
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-start space-x-3">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Designated Pickup Location:</span>
              <p className="text-slate-600 mt-0.5">{collection.collectionLocation}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Scheduled Date &amp; Time:</span>
              <p className="text-slate-600 mt-0.5">{new Date(collection.scheduledAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Handover Protocol &amp; Instructions:</span>
              <p className="text-slate-600 mt-0.5">{collection.collectionInstructions}</p>
            </div>
          </div>
        </div>

        {/* Audit Record if already confirmed */}
        {collection.status === 'COLLECTED' && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <p className="font-bold">Official Handover Confirmation Record</p>
            <p>Confirmed on {new Date(collection.collectedAt!).toLocaleString()} by {collection.confirmedBy?.fullName || 'Campus Security'}.</p>
            {collection.handoverNotes && (
              <p className="italic text-emerald-800 mt-1">"{collection.handoverNotes}"</p>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Action for Authorized Finder or Admin */}
      {canConfirm && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Confirm Physical Item Handover</h3>
          <p className="text-xs text-slate-600">
            Once the student has presented their university ID and physically received their item, confirm the handover below to complete the lifecycle and mark the item as RETURNED.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Handover Verification Notes (Optional)
            </label>
            <input
              type="text"
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              placeholder="e.g. Student ID verified in person, signed counter receipt..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleConfirmHandover}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Handover...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Item Handed Over</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
