import React, { useState } from 'react';
import { History, Tag, UserPlus, Package, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Activity } from './types';

interface ActivityLogProps {
  activities: Activity[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ activities }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'sale': return <Tag size={12} className="text-emerald-600" />;
      case 'customer': return <UserPlus size={12} className="text-blue-600" />;
      case 'stock': return <Package size={12} className="text-amber-600" />;
      default: return <Settings size={12} className="text-slate-600" />;
    }
  };

  const getActivityBg = (type: Activity['type']) => {
    switch (type) {
      case 'sale': return 'bg-emerald-100';
      case 'customer': return 'bg-blue-100';
      case 'stock': return 'bg-amber-100';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${isCollapsed ? 'h-[44px]' : 'h-[200px]'}`}>
      <div 
        className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <History size={16} className="text-slate-500" />
          <h2 className="font-bold text-slate-700 text-sm">Recent Activity</h2>
          {activities.length > 0 && (
            <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {activities.length}
            </span>
          )}
        </div>
        {isCollapsed ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
      </div>
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {activities.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${getActivityBg(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{activity.action}</p>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{activity.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">{activity.details}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
