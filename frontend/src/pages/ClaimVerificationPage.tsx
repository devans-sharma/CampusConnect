import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  Lock,
  User,
  Calendar,
  Building,
  ArrowLeft,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { claimService } from '../services/claimService';
import { collectionService } from '../services/collectionService';
import { Claim } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export const ClaimVerificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Rejection modal
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Info request modal
  const [isInfoRequestOpen, setIsInfoRequestOpen] = useState(false);
  const [infoRequestNotes, setInfoRequestNotes] = useState('');

  // Collection schedule modal
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [collectionLocation, setCollectionLocation] = useState('Campus Security Office, Counter A (Building A)');
  const [collectionInstructions, setCollectionInstructions] = useState('Bring your student ID card for photo and signature verification.');
  const [scheduledAt, setScheduledAt] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );

  const fetchClaim = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await claimService.getClaimById(id);
      setClaim(data);
    } catch (err: any) {
      console.error('Failed to load claim:', err);
      setErrorMessage(err.response?.data?.error || 'Could not load claim details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaim();
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    try {
      setIsActionLoading(true);
      setErrorMessage(null);
      await claimService.reviewClaim(id, {
        status: 'APPROVED',
        verificationNotes: 'Claim details verified against recorded identifying marks.',
      });
      setSuccessMessage('Claim approved! You can now arrange the collection handover.');
      setIsScheduleOpen(true);
      fetchClaim();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to approve claim.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) {
      setErrorMessage('A rejection reason is strictly required.');
      return;
    }
    try {
      setIsActionLoading(true);
      setErrorMessage(null);
      await claimService.reviewClaim(id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      });
      setIsRejectOpen(false);
      setSuccessMessage('Claim has been rejected.');
      fetchClaim();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to reject claim.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!id) return;
    try {
      setIsActionLoading(true);
      setErrorMessage(null);
      await claimService.reviewClaim(id, {
        status: 'ADDITIONAL_INFORMATION_REQUIRED',
        verificationNotes: infoRequestNotes.trim() || 'Please provide additional photos or serial proof.',
      });
      setIsInfoRequestOpen(false);
      setSuccessMessage('Request for additional information sent to student.');
      fetchClaim();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to request information.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim) return;
    try {
      setIsActionLoading(true);
      setErrorMessage(null);
      await collectionService.scheduleCollection({
        claimId: claim.id,
        collectionLocation,
        collectionInstructions,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      setIsScheduleOpen(false);
      setSuccessMessage('Collection handover scheduled successfully!');
      fetchClaim();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to schedule collection.');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading claim verification record..." />;
  }

  if (!claim) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Claim Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">{errorMessage || 'Access denied or claim does not exist.'}</p>
        <Link to="/dashboard" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isFinder = claim.item?.reporterId === user?.id;
  const isAuthorizedReviewer = isFinder || isAdmin;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-mono text-xs font-bold text-blue-600">{claim.referenceNumber}</span>
            <span className="text-slate-300">&bull;</span>
            <StatusBadge status={claim.status} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Claim Verification Review
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submitted on {new Date(claim.createdAt).toLocaleDateString()} by {claim.claimant?.fullName}
          </p>
        </div>

        {/* Action Buttons for Authorized Reviewer */}
        {isAuthorizedReviewer && claim.status !== 'APPROVED' && claim.status !== 'REJECTED' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsRejectOpen(true)}
              disabled={isActionLoading}
              className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition"
            >
              Reject Claim
            </button>
            <button
              onClick={() => setIsInfoRequestOpen(true)}
              disabled={isActionLoading}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
            >
              Request Info
            </button>
            <button
              onClick={handleApprove}
              disabled={isActionLoading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Ownership</span>
            </button>
          </div>
        )}

        {/* If approved, show Collection link or button */}
        {claim.status === 'APPROVED' && !claim.collection && isAuthorizedReviewer && (
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            Schedule Handover
          </button>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Item & Private Verification details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
            Claimed Item Listing
          </h2>

          <div className="flex items-center space-x-3">
            {claim.item?.images?.[0] ? (
              <img
                src={claim.item.images[0].imageUrl}
                alt={claim.item.itemName}
                className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <span className="font-mono text-[10px] text-blue-600 font-semibold">{claim.item?.referenceNumber}</span>
              <h3 className="font-bold text-slate-900 text-sm truncate">{claim.item?.itemName}</h3>
              <p className="text-xs text-slate-500 truncate">{claim.item?.location}</p>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block">Public Description:</span>
            <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {claim.item?.publicDescription}
            </p>
          </div>

          {/* CONFIDENTIAL VERIFICATION DETAILS CARD */}
          {claim.item?.privateVerificationDetails && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Recorded Finder Private Verification Details:</span>
              </div>
              <p className="text-xs text-amber-900 font-mono bg-white/70 p-2 rounded-lg border border-amber-200/70">
                {claim.item.privateVerificationDetails}
              </p>
              <p className="text-[10px] text-amber-700">
                Compare claimant's statement below against these confidential notes.
              </p>
            </div>
          )}
        </div>

        {/* Claimant's Evidence & Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
            Claimant's Submission
          </h2>

          {claim.claimant && (
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                {claim.claimant.fullName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{claim.claimant.fullName}</p>
                <p className="text-[11px] text-slate-500">
                  {claim.claimant.studentId} &bull; {claim.claimant.department} (Year {claim.claimant.yearOfStudy})
                </p>
                <p className="text-[11px] text-blue-600 font-mono">{claim.claimant.email}</p>
              </div>
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-slate-700 block">Claim Statement:</span>
            <p className="text-xs text-slate-800 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              {claim.claimDescription}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block">Stated Identifying Marks:</span>
            <p className="text-xs text-slate-800 mt-1 bg-blue-50/60 p-3 rounded-xl border border-blue-200/60 leading-relaxed font-medium">
              {claim.identifyingCharacteristics}
            </p>
          </div>

          {claim.supportingEvidence && (
            <div>
              <span className="text-xs font-semibold text-slate-700 block">Supporting Evidence:</span>
              <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 break-all font-mono">
                {claim.supportingEvidence}
              </p>
            </div>
          )}

          {claim.rejectionReason && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <span className="font-bold block">Rejection Reason:</span>
              <p>{claim.rejectionReason}</p>
            </div>
          )}

          {claim.verificationNotes && (
            <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-700 space-y-1">
              <span className="font-bold block">Verification Notes:</span>
              <p>{claim.verificationNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* COLLECTION STATUS IF SCHEDULED */}
      {claim.collection && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Handover Collection Record</span>
            </h3>
            <StatusBadge status={claim.collection.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Location:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{claim.collection.collectionLocation}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Scheduled Time:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{new Date(claim.collection.scheduledAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Instructions:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{claim.collection.collectionInstructions}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <Link
              to={`/collection/${claim.collection.id}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Open Full Collection Page &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Decline Ownership Claim</h3>
            <p className="text-xs text-slate-500 mb-4">
              A formal reason is mandatory when declining an ownership claim. This explanation will be delivered to the student.
            </p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Identifying marks described do not match the item's verified serial number or physical characteristics..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsRejectOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isActionLoading}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INFO REQUEST MODAL */}
      {isInfoRequestOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Request Additional Ownership Proof</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ask the claimant for additional distinguishing details or documentation before finalizing verification.
            </p>
            <textarea
              rows={4}
              value={infoRequestNotes}
              onChange={(e) => setInfoRequestNotes(e.target.value)}
              placeholder="e.g. Please provide a copy of your purchase invoice or describe what keychain was attached to the zipper..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsInfoRequestOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestInfo}
                disabled={isActionLoading}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE COLLECTION MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Schedule Item Collection</h3>
            <p className="text-xs text-slate-500 mb-4">
              Set the designated pickup location and date/time for the student to collect their verified item.
            </p>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Collection Location</label>
                <input
                  type="text"
                  value={collectionLocation}
                  onChange={(e) => setCollectionLocation(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Handover Instructions</label>
                <textarea
                  rows={2}
                  value={collectionInstructions}
                  onChange={(e) => setCollectionInstructions(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
