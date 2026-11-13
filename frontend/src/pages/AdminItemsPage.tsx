import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Trash2, Eye, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { adminService } from '../services/adminService';
import { itemService } from '../services/itemService';
import { Item } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AdminItemsPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Selected item modal for viewing details + private notes
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAdminItems({
        search: search.trim() || undefined,
        itemType: itemType || undefined,
        status: status || undefined,
        page,
        limit: 15,
      });
      setItems(data.items || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Error fetching admin items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search, itemType, status, page]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing from campus records?')) return;
    try {
      await itemService.deleteItem(id);
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete item.');
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Campus Item Listings Management</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review, moderate, and inspect confidential details for all lost and found records.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reference, name, location..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={itemType}
          onChange={(e) => { setItemType(e.target.value); setPage(1); }}
          className="text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="LOST">Lost Only</option>
          <option value="FOUND">Found Only</option>
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="CLAIM_PENDING">CLAIM_PENDING</option>
          <option value="CLAIM_APPROVED">CLAIM_APPROVED</option>
          <option value="AWAITING_COLLECTION">AWAITING_COLLECTION</option>
          <option value="RETURNED">RETURNED</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner message="Querying listings table..." />
      ) : items.length > 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Ref / Item</th>
                  <th className="px-5 py-3.5">Type &bull; Status</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Reporter</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Claims</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-5 py-4">
                      <span className="font-mono text-[10px] text-blue-400 font-bold block">{it.referenceNumber}</span>
                      <span className="font-semibold text-white block mt-0.5">{it.itemName}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col space-y-1">
                        <StatusBadge status={it.itemType} type="type" />
                        <StatusBadge status={it.status} />
                      </div>
                    </td>
                    <td className="px-5 py-4">{it.category?.name}</td>
                    <td className="px-5 py-4">
                      <span className="text-white block font-medium">{it.reporter?.fullName}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">{it.reporter?.studentId}</span>
                    </td>
                    <td className="px-5 py-4 max-w-xs truncate" title={it.location}>
                      {it.location}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold">
                      {it._count?.claims || 0}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedItem(it)}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        title="Inspect Private Verification &amp; Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(it.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
          No items found matching the selected filters.
        </div>
      )}

      {/* INSPECTION MODAL (Shows confidential info to admin) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs text-blue-400">{selectedItem.referenceNumber}</span>
                <h3 className="font-bold text-base text-white">{selectedItem.itemName}</h3>
              </div>
              <StatusBadge status={selectedItem.status} />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Public Description:</span>
                <p className="text-slate-200 mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedItem.publicDescription}
                </p>
              </div>

              {/* Admin view of confidential private info */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confidential Private Verification Information:</span>
                </div>
                <p className="font-mono text-xs bg-black/40 p-2.5 rounded-lg border border-amber-500/20">
                  {selectedItem.privateVerificationDetails || 'None recorded by reporter.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500">Location:</span> {selectedItem.location}
                </div>
                <div>
                  <span className="text-slate-500">Holding:</span> {selectedItem.currentHoldingLocation || 'With Finder'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
