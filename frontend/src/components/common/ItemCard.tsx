import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { Item } from '../../types';
import { StatusBadge } from './StatusBadge';

interface ItemCardProps {
  item: Item;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  // Find primary image or use first available
  const primaryImage = item.images?.find(img => img.isPrimary)?.imageUrl || item.images?.[0]?.imageUrl;
  const formattedDate = new Date(item.dateOccurred).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      to={`/items/${item.id}`}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full"
    >
      {/* Image container */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={item.itemName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
            <Tag className="w-8 h-8 stroke-1 mb-1" />
            <span className="text-xs font-medium">No photograph attached</span>
          </div>
        )}

        {/* Type pill on top-left */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={item.itemType} type="type" />
        </div>

        {/* Status on top-right */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <div className="flex items-center space-x-1.5 text-xs text-blue-600 font-semibold mb-1.5">
            <span>{item.category?.name || 'Uncategorized'}</span>
            <span className="text-slate-300">&bull;</span>
            <span className="font-mono text-[11px] text-slate-500">{item.referenceNumber}</span>
          </div>

          {/* Item Name */}
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-base">
            {item.itemName}
          </h3>

          {/* Description preview */}
          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
            {item.publicDescription}
          </p>
        </div>

        {/* Metadata Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1 truncate max-w-[65%]" title={item.location}>
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{item.location}</span>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
