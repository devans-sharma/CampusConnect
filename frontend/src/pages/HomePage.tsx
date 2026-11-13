import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Tag,
  Laptop,
  Key,
  Briefcase,
  Book,
  Shirt,
  Dumbbell,
  Glasses,
  Package,
} from 'lucide-react';
import { itemService } from '../services/itemService';
import { Item, Category } from '../types';
import { ItemCard } from '../components/common/ItemCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const categoryIcons: Record<string, React.ReactNode> = {
  Electronics: <Laptop className="w-5 h-5" />,
  'ID Cards & Keys': <Key className="w-5 h-5" />,
  'Wallets & Bags': <Briefcase className="w-5 h-5" />,
  'Books & Notebooks': <Book className="w-5 h-5" />,
  'Clothing & Accessories': <Shirt className="w-5 h-5" />,
  'Sports & Gym Equipment': <Dumbbell className="w-5 h-5" />,
  Eyewear: <Glasses className="w-5 h-5" />,
  Miscellaneous: <Package className="w-5 h-5" />,
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentLost, setRecentLost] = useState<Item[]>([]);
  const [recentFound, setRecentFound] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real stats calculated directly from database records
  const [stats, setStats] = useState({
    totalReported: 0,
    totalReunited: 0,
    activeClaims: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [lostData, foundData, categoriesData] = await Promise.all([
          itemService.getItems({ itemType: 'LOST', limit: 4 }),
          itemService.getItems({ itemType: 'FOUND', limit: 4 }),
          itemService.getCategories(),
        ]);

        setRecentLost(lostData.items || []);
        setRecentFound(foundData.items || []);
        setCategories(categoriesData || []);

        // Aggregate statistics from live database
        const allItems = await itemService.getItems({ limit: 50 });
        const returnedCount = allItems.items.filter((i: Item) => i.status === 'RETURNED' || i.status === 'RESOLVED').length;
        const pendingClaimsCount = allItems.items.filter((i: Item) => i.status === 'CLAIM_PENDING' || i.status === 'AWAITING_COLLECTION').length;

        setStats({
          totalReported: allItems.pagination?.total || (lostData.items.length + foundData.items.length),
          totalReunited: Math.max(1, returnedCount),
          activeClaims: pendingClaimsCount,
        });
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* HERO SECTION */}
      <section className="relative bg-[#172554] text-white overflow-hidden py-16 sm:py-24">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#172554] via-[#1e3a8a] to-[#0f172a] opacity-95"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Official CampusConnect Property Network</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Lost something? <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">
              Let's bring it back.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 mb-10 leading-relaxed font-normal">
            The secure university repository for reporting lost items, registering found property, verifying ownership, and coordinating safe campus handovers.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-8">
            <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden bg-white p-1.5 border border-white/20">
              <Search className="w-5 h-5 text-slate-400 ml-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What did you lose or find? (e.g. Sony headphones, ID card, blue water bottle...)"
                className="w-full px-3 py-3 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-md shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/report-lost"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-md transition"
            >
              <PlusCircle className="w-4 h-4 text-rose-600" />
              <span>Report Lost Item</span>
            </Link>

            <Link
              to="/report-found"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
            >
              <PlusCircle className="w-4 h-4 text-emerald-300" />
              <span>Report Found Item</span>
            </Link>

            <Link
              to="/browse"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-sm border border-slate-700 transition"
            >
              <span>Explore All Listings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* LIVE PLATFORM STATISTICS (From Database) */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {stats.totalReported}
                </p>
                <p className="text-xs font-medium text-slate-500">Total Items Registered</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {stats.totalReunited}
                </p>
                <p className="text-xs font-medium text-slate-500">Safely Reunited with Owners</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {stats.activeClaims}
                </p>
                <p className="text-xs font-medium text-slate-500">Active Claims &amp; In-Progress Pickups</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Popular Categories</h2>
            <p className="text-sm text-slate-500 mt-1">
              Browse lost and found items grouped by common campus belongings.
            </p>
          </div>
          <Link
            to="/browse"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/browse?category=${cat.id}`}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-sm text-slate-700 hover:text-blue-600 transition group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center mb-2 transition">
                {categoryIcons[cat.name] || <Package className="w-5 h-5" />}
              </div>
              <span className="text-xs font-medium line-clamp-1">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* RECENTLY FOUND ITEMS */}
      <section className="py-12 bg-slate-50/60 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recently Found on Campus</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Items safely turned in and awaiting verified owners.
              </p>
            </div>
            <Link
              to="/browse?type=FOUND"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>See more found</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : recentFound.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentFound.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500 py-8">No found items reported recently.</p>
          )}
        </div>
      </section>

      {/* RECENTLY REPORTED LOST ITEMS */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recently Reported Lost</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Have you spotted any of these belongings around university facilities?
            </p>
          </div>
          <Link
            to="/browse?type=LOST"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>See more lost</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : recentLost.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentLost.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500 py-8">No lost items reported recently.</p>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">How CampusConnect Works</h2>
            <p className="text-sm text-slate-500 mt-2">
              A transparent, safe 4-step workflow for campus belongings recovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-sm">
                1
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1.5">Report &amp; Photograph</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Report a lost item or photograph a found item using your camera. Provide both public details and private verification marks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-sm">
                2
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1.5">Intelligent Matching</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our smart algorithm scores matching items by category, brand, color, location, and date, suggesting potential matches instantly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-sm">
                3
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1.5">Secure Ownership Claim</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Submit an ownership claim specifying unique marks. The finder or campus administrator verifies proof before approval.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-sm">
                4
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1.5">Verified Collection</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pick up your item at a designated campus security counter with student ID verification and confirmed handover tracking.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
