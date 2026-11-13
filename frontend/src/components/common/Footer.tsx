import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, PhoneCall, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#172554] text-white border-t border-blue-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">CampusConnect</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Official university-wide property recovery portal. Helping students, faculty, and campus security reunite lost belongings quickly, securely, and transparently.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Campus Security Partner</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Explore Portal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <Link to="/browse" className="hover:text-white transition">
                  Browse All Items
                </Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-white transition">
                  Report a Lost Item
                </Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-white transition">
                  Report a Found Item
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition">
                  Student Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Verification & Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Campus Guidelines
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>&bull; Hand in found items within 24 hours</li>
              <li>&bull; Private verification prevents false claims</li>
              <li>&bull; Bring student ID for pickup handover</li>
              <li>&bull; High-value items secured at Security Bldg A</li>
            </ul>
          </div>

          {/* Campus Support & Locations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Security Contacts
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Security HQ, West Wing Bldg A (Room 102)</span>
              </div>
              <div className="flex items-center space-x-2">
                <PhoneCall className="w-4 h-4 text-blue-400 shrink-0" />
                <span>+1 (555) 234-CAMPUS (24/7 Desk)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>lostandfound@campusconnect.edu</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>&copy; {new Date().getFullYear()} CampusConnect — University Property Management Portal. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-medium text-slate-400">
            Engineered with React &bull; Node.js &bull; Express &bull; PostgreSQL &amp; Prisma
          </p>
        </div>
      </div>
    </footer>
  );
};
