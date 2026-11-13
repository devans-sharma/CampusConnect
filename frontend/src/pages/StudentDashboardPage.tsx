import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  FileCheck2,
  Bell,
  CheckCircle2,
  Clock,
  PlusCircle,
  Trash2,
  Edit3,
  ExternalLink,
  MapPin,
  Building,
  AlertCircle,
  Eye,
  Check,
} from 'lucide-react';
import api from '../services/api';
import { itemService } from '../services/itemService';
import { Item, Claim, Notification } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'claims' | 'notifications'>('overview');
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status update modal state
  const [statusUpdateItem, setStatusUpdateItem] = useState<Item | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [itemsRes, claimsRes] = await Promise.all([
        api.get('/users/me/items'),
        api.get('/users/me/claims'),
      ]);
      setMyItems(itemsRes.data.data || []);
      setMyClaims(claimsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to remove this item listing? This action cannot be undone.')) {
      return;
    }
    try {
      await itemService.deleteItem(itemId);
      setMyItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete listing.');
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateItem || !newStatus) return;
    try {
      await itemService.updateStatus(statusUpdateItem.id, newStatus);
      setStatusUpdateItem(null);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update item status.');
    }
  };

  // Metrics calculations from real database records
  const totalReported = myItems.length;
  const lostCount = myItems.filter(i => i.itemType === 'LOST').length;
  const foundCount = myItems.filter(i => i.itemType === 'FOUND').length;
  const activeClaimsCount = myClaims.filter(c => c.status === 'PENDING' || c.status === 'UNDER_REVIEW').length;
  const reunitedCount = myItems.filter(i => i.status === 'RETURNED' || i.status === 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Student Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-2xl flex items-center justify-center border border-blue-200">
            {user?.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {user?.fullName}
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Student ID: {user?.studentId} &bull; {user?.department} (Year {user?.yearOfStudy})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/report-lost"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4 text-rose-400" />
            <span>Report Lost</span>
          </Link>
          <Link
            to="/report-found"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Found</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 mb-8 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview Metrics' },
          { id: 'listings', label: `My Reported Items (${myItems.length})` },
          { id: 'claims', label: `My Claims (${myClaims.length})` },
          { id: 'notifications', label: `Notifications (${notifications.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner message="Fetching your student activity records..." />
      ) : (
        <>
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Total Reported</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalReported}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Lost Items</span>
                  <p className="text-2xl font-extrabold text-rose-600 mt-1">{lostCount}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Found Items</span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">{foundCount}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Active Claims</span>
                  <p className="text-2xl font-extrabold text-amber-600 mt-1">{activeClaimsCount}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm col-span-2 sm:col-span-1">
                  <span className="text-xs font-semibold text-slate-400">Reunited Items</span>
                  <p className="text-2xl font-extrabold text-teal-600 mt-1">{reunitedCount}</p>
                </div>
              </div>

              {/* Recent activity summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Latest listings preview */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-slate-900">Your Recent Listings</h3>
                    <button
                      onClick={() => setActiveTab('listings')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View all
                    </button>
                  </div>
                  {myItems.length > 0 ? (
                    <div className="space-y-3">
                      {myItems.slice(0, 3).map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="min-w-0 flex-1 pr-3">
                            <span className="font-mono text-[10px] text-slate-400">{item.referenceNumber}</span>
                            <p className="text-xs font-bold text-slate-900 truncate">{item.itemName}</p>
                            <span className="text-[11px] text-slate-500">{item.location}</span>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">No reported items yet.</p>
                  )}
                </div>

                {/* Latest claims preview */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-slate-900">Your Recent Claims</h3>
                    <button
                      onClick={() => setActiveTab('claims')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View all
                    </button>
                  </div>
                  {myClaims.length > 0 ? (
                    <div className="space-y-3">
                      {myClaims.slice(0, 3).map(claim => (
                        <div key={claim.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="min-w-0 flex-1 pr-3">
                            <span className="font-mono text-[10px] text-slate-400">{claim.referenceNumber}</span>
                            <p className="text-xs font-bold text-slate-900 truncate">{claim.item?.itemName}</p>
                            <span className="text-[11px] text-slate-500">Submitted {new Date(claim.createdAt).toLocaleDateString()}</span>
                          </div>
                          <StatusBadge status={claim.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">No claims submitted yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY REPORTED ITEMS */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              {myItems.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                  <div className="divide-y divide-slate-100">
                    {myItems.map(item => (
                      <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                        <div className="flex items-start space-x-4 min-w-0">
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0].imageUrl}
                              alt={item.itemName}
                              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Tag className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[11px] text-blue-600 font-semibold">{item.referenceNumber}</span>
                              <StatusBadge status={item.itemType} type="type" />
                              <StatusBadge status={item.status} />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm mt-1 truncate">{item.itemName}</h3>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.location} &bull; {new Date(item.dateOccurred).toLocaleDateString()}</p>
                            
                            {/* Associated Claims count if Found item */}
                            {item.itemType === 'FOUND' && item.claims && item.claims.length > 0 && (
                              <div className="mt-2 flex items-center space-x-2">
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  {item.claims.length} claim(s) submitted
                                </span>
                                {item.claims.map(c => (
                                  <Link
                                    key={c.id}
                                    to={`/claim-verification/${c.id}`}
                                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                                  >
                                    Review Claim ({c.referenceNumber}) &rarr;
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                          <Link
                            to={`/items/${item.id}`}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                            title="View Public Page"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setStatusUpdateItem(item);
                              setNewStatus(item.status);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                          >
                            Change Status
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No listings yet"
                  description="You haven't reported any lost or found items. Create your first report to start tracking."
                  actionLabel="Report Lost Item"
                  actionLink="/report-lost"
                />
              )}
            </div>
          )}

          {/* TAB 3: MY CLAIMS */}
          {activeTab === 'claims' && (
            <div className="space-y-4">
              {myClaims.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm divide-y divide-slate-100">
                  {myClaims.map(claim => (
                    <div key={claim.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-blue-600">{claim.referenceNumber}</span>
                          <StatusBadge status={claim.status} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Claimed: {claim.item?.itemName}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-xl">
                          <strong>Your statement:</strong> {claim.claimDescription}
                        </p>

                        {/* Admin or reviewer response if rejected */}
                        {claim.rejectionReason && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                            <strong>Reviewer Note:</strong> {claim.rejectionReason}
                          </div>
                        )}

                        {/* Collection tracking link if approved */}
                        {claim.collection && (
                          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between max-w-xl">
                            <div>
                              <span className="font-bold">Collection Status:</span> {claim.collection.status} &bull; {claim.collection.collectionLocation}
                            </div>
                            <Link
                              to={`/collection/${claim.collection.id}`}
                              className="font-bold text-blue-600 hover:underline"
                            >
                              Track Pickup &rarr;
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <Link
                          to={`/items/${claim.itemId}`}
                          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                        >
                          View Item
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No active claims"
                  description="You have not submitted any ownership claims for found items."
                  actionLabel="Browse Found Directory"
                  actionLink="/browse?type=FOUND"
                />
              )}
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              </div>

              {notifications.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm divide-y divide-slate-100">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-4 flex items-start space-x-3 ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-blue-600' : 'bg-slate-300'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-xs text-slate-900">{n.title}</h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                            className="inline-block text-[11px] font-semibold text-blue-600 hover:underline mt-2"
                          >
                            View details &rarr;
                          </Link>
                        )}
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-lg"
                          title="Mark read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="All caught up!"
                  description="You have no notifications at this time."
                />
              )}
            </div>
          )}
        </>
      )}

      {/* CHANGE STATUS MODAL */}
      {statusUpdateItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Update Item Availability</h3>
            <p className="text-xs text-slate-500 mb-4">{statusUpdateItem.itemName}</p>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900"
                >
                  {statusUpdateItem.itemType === 'LOST' ? (
                    <>
                      <option value="ACTIVE">ACTIVE (Still Searching)</option>
                      <option value="MATCHED">MATCHED</option>
                      <option value="RESOLVED">RESOLVED (Recovered)</option>
                      <option value="CLOSED">CLOSED</option>
                    </>
                  ) : (
                    <>
                      <option value="ACTIVE">ACTIVE (Waiting for Claim)</option>
                      <option value="CLAIM_PENDING">CLAIM_PENDING</option>
                      <option value="CLAIM_APPROVED">CLAIM_APPROVED</option>
                      <option value="AWAITING_COLLECTION">AWAITING_COLLECTION</option>
                      <option value="RETURNED">RETURNED</option>
                      <option value="CLOSED">CLOSED</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusUpdateItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
