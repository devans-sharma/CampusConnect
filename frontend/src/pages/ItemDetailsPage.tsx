import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Tag,
  ShieldCheck,
  Lock,
  Eye,
  AlertCircle,
  FileCheck,
  User,
  Share2,
  ArrowLeft,
  Sparkles,
  Building,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { itemService } from '../services/itemService';
import { Item, PotentialMatch } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ItemCard } from '../components/common/ItemCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export const ItemDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [similarItems, setSimilarItems] = useState<Item[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await itemService.getItemById(id);
        setItem(data.item);
        setSimilarItems(data.similarItems || []);
        setPotentialMatches(data.potentialMatches || []);
        setSelectedImageIndex(0);
      } catch (err: any) {
        console.error('Failed to fetch item details:', err);
        setError(err.response?.data?.error || 'Unable to load item details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (isLoading) {
    return <LoadingSpinner message="Retrieving listing details from campus database..." />;
  }

  if (error || !item) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Item Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">{error || 'This listing does not exist or has been removed.'}</p>
        <Link
          to="/browse"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Browse</span>
        </Link>
      </div>
    );
  }

  const isReporter = user?.id === item.reporterId;
  const canClaim = item.itemType === 'FOUND' && !isReporter && item.status !== 'RETURNED' && item.status !== 'CLOSED';
  const hasImages = item.images && item.images.length > 0;
  const currentImage = hasImages ? item.images[selectedImageIndex]?.imageUrl : null;

  const formattedDate = new Date(item.dateOccurred).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to listings</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Large Main Photograph */}
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
            {currentImage ? (
              <img
                src={currentImage}
                alt={item.itemName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8">
                <Tag className="w-12 h-12 stroke-1 mb-2" />
                <span className="text-xs font-medium">No photographs attached</span>
              </div>
            )}

            {/* Type badge overlay */}
            <div className="absolute top-4 left-4">
              <StatusBadge status={item.itemType} type="type" />
            </div>
            <div className="absolute top-4 right-4">
              <StatusBadge status={item.status} />
            </div>
          </div>

          {/* Thumbnail Strip */}
          {hasImages && item.images.length > 1 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {item.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    selectedImageIndex === idx
                      ? 'border-blue-600 ring-2 ring-blue-500/20'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Secure Holding Location Notice */}
          {item.currentHoldingLocation && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start space-x-3">
              <Building className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">Current Storage Location:</span>
                <p className="text-slate-600 mt-0.5">{item.currentHoldingLocation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Information & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center space-x-2 text-xs text-blue-600 font-semibold mb-2">
                <span>{item.category?.name}</span>
                <span className="text-slate-300">&bull;</span>
                <span className="font-mono text-slate-500">REF: {item.referenceNumber}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {item.itemName}
              </h1>
            </div>

            {/* Quick Metadata badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Date Occurred</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{formattedDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Campus Location</span>
                <span className="font-semibold text-slate-800 mt-0.5 block truncate" title={item.location}>
                  {item.location}
                </span>
              </div>
              {item.brand && (
                <div>
                  <span className="text-slate-400 font-medium block">Brand</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{item.brand}</span>
                </div>
              )}
              {item.colour && (
                <div>
                  <span className="text-slate-400 font-medium block">Colour</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{item.colour}</span>
                </div>
              )}
            </div>

            {/* Public Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Public Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {item.publicDescription}
              </p>
            </div>

            {/* Distinguishing Characteristics */}
            {item.distinguishingFeatures && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Distinguishing Characteristics
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {item.distinguishingFeatures}
                </p>
              </div>
            )}

            {/* CRITICAL: PRIVATE VERIFICATION INFORMATION SECTION */}
            <div className="pt-4 border-t border-slate-100">
              {item.privateVerificationDetails ? (
                // Visible ONLY to Reporter or Admin
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs mb-1.5">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>Confidential Verification Details (Authorized Access Only)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-mono">
                    {item.privateVerificationDetails}
                  </p>
                  <p className="text-[10px] text-amber-600 mt-2">
                    Note: This information is strictly hidden from general students to evaluate authentic claims.
                  </p>
                </div>
              ) : (
                // Public view explanation
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs text-slate-600">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700">Protected Verification Info:</span>
                    <p className="mt-0.5 text-slate-500">
                      Private identifying marks are withheld by campus protocol to prevent fraudulent ownership claims.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Reporter Card */}
            {item.reporter && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    {item.reporter.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Reported by {item.reporter.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {item.reporter.department} &bull; Preference: {item.contactPreference}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Student</span>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS (CLAIM THIS ITEM) */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              {canClaim ? (
                <Link
                  to={`/claim/${item.id}`}
                  className="flex-1 inline-flex items-center justify-center space-x-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Submit Ownership Claim</span>
                </Link>
              ) : isReporter ? (
                <div className="flex-1 p-3 rounded-xl bg-blue-50 text-blue-800 text-xs font-medium text-center border border-blue-200">
                  You reported this listing. Manage and review claims in your student dashboard.
                </div>
              ) : item.status === 'RETURNED' ? (
                <div className="flex-1 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium text-center border border-emerald-200 flex items-center justify-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>This item has been officially reunited and returned to its owner.</span>
                </div>
              ) : null}

              {isReporter && (
                <Link
                  to="/dashboard"
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Manage Listing
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* POTENTIAL MATCHES SECTION (Algorithm Powered) */}
      {potentialMatches.length > 0 && (
        <section className="mb-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-200/80">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Intelligent Algorithm Matches
            </h2>
          </div>
          <p className="text-xs text-slate-600 mb-6">
            Our campus matching engine discovered potential matching {item.itemType === 'LOST' ? 'FOUND' : 'LOST'} listings based on category, color, keywords, and timeline.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {potentialMatches.map((match) => (
              <div key={match.item.id} className="relative flex flex-col">
                <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                  {match.confidenceScore}% Match
                </div>
                <ItemCard item={match.item} />
                <div className="mt-2 text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Criteria:</span>{' '}
                  {match.matchReasons.join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SIMILAR ITEMS IN SAME CATEGORY */}
      {similarItems.length > 0 && (
        <section className="border-t border-slate-200 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              More in {item.category?.name}
            </h2>
            <Link
              to={`/browse?category=${item.categoryId}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarItems.map((sim) => (
              <ItemCard key={sim.id} item={sim} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
