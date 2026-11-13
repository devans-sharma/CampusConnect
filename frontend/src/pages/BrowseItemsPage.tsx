import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { itemService } from '../services/itemService';
import { Item, Category } from '../types';
import { ItemCard } from '../components/common/ItemCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const BrowseItemsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state initialized from URL search params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [itemType, setItemType] = useState<'ALL' | 'LOST' | 'FOUND'>(
    (searchParams.get('type') as any) || 'ALL'
  );
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Load categories once
  useEffect(() => {
    itemService.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch items whenever filters change
  useEffect(() => {
    const fetchFilteredItems = async () => {
      try {
        setIsLoading(true);
        const data = await itemService.getItems({
          search: search.trim() || undefined,
          itemType: itemType === 'ALL' ? undefined : itemType,
          categoryId: categoryId || undefined,
          location: location || undefined,
          status: status || undefined,
          sortBy,
          page: currentPage,
          limit: 12,
        });

        setItems(data.items || []);
        setPagination(data.pagination || { total: 0, totalPages: 1 });
      } catch (err) {
        console.error('Failed to load items:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilteredItems();
  }, [search, itemType, categoryId, location, status, sortBy, currentPage]);

  const handleResetFilters = () => {
    setSearch('');
    setItemType('ALL');
    setCategoryId('');
    setLocation('');
    setStatus('');
    setSortBy('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Lost &amp; Found Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse all property reported lost or found across university campus grounds.
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-500">Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main layout: Filters Bar & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filters</span>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Keyword, brand, color..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Listing Type Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Listing Type</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setItemType('ALL'); setCurrentPage(1); }}
                  className={`py-1.5 rounded-lg transition ${
                    itemType === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => { setItemType('LOST'); setCurrentPage(1); }}
                  className={`py-1.5 rounded-lg transition ${
                    itemType === 'LOST' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Lost
                </button>
                <button
                  type="button"
                  onClick={() => { setItemType('FOUND'); setCurrentPage(1); }}
                  className={`py-1.5 rounded-lg transition ${
                    itemType === 'FOUND' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Found
                </button>
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Campus Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Library, Cafe, Gym..."
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Availability / Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active (Available)</option>
                <option value="CLAIM_PENDING">Claim Pending</option>
                <option value="AWAITING_COLLECTION">Awaiting Collection</option>
                <option value="RETURNED">Reunited / Returned</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <LoadingSpinner message="Searching campus listings..." />
          ) : items.length > 0 ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
                <span>
                  Showing <strong className="text-slate-900">{items.length}</strong> of{' '}
                  <strong className="text-slate-900">{pagination.total}</strong> results
                </span>
                <span>Page {currentPage} of {pagination.totalPages}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center space-x-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-semibold text-slate-700 px-4">
                    Page {currentPage} of {pagination.totalPages}
                  </span>

                  <button
                    disabled={currentPage >= pagination.totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    className="p-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="No items found"
              description="No property listings matched your specified search keywords and filters. Try clearing your filters or check back later."
              actionLabel="Reset All Filters"
              actionLink="/browse"
            />
          )}
        </div>
      </div>
    </div>
  );
};
