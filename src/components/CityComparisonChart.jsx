import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Abbreviates city names to standard forms (Delhi -> Del, Mumbai -> Mum, etc.)
 */
const cityAbbrMap = {
  'Delhi': 'Del',
  'Mumbai': 'Mum',
  'Pune': 'Pun',
  'Ahmedabad': 'Ahm',
  'Jaipur': 'Jai',
  'Hyderabad': 'Hyd',
  'Kolkata': 'Kol',
  'Bengaluru': 'Ben',
  'Chennai': 'Che',
  'Lucknow': 'Luc'
};

const getCityAbbr = (city) => cityAbbrMap[city] || (city ? city.slice(0, 3) : '');

/**
 * Format Indian currency numbers to short readable strings (e.g. ₹5.4L, ₹12.5Cr, or just ₹K)
 */
const formatShortCurrency = (val) => {
  const num = Number(val) || 0;
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(1)}Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(0)}K`;
  }
  return `₹${num}`;
};

const formatFullCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

export default function CityComparisonChart({ cityStats }) {
  // Map and prepare data for charts
  const chartData = useMemo(() => {
    if (!cityStats || !Array.isArray(cityStats)) return [];
    return cityStats.map((stat) => ({
      ...stat,
      abbr: getCityAbbr(stat.city),
      approved: stat.approved || 0,
      rejected: stat.rejected || 0,
      pending: stat.pending || 0,
      collection: Number(stat.totalCollection) || 0
    })).sort((a, b) => b.collection - a.collection); // Sort by collection for visual order
  }, [cityStats]);

  // Custom tooltips
  const CollectionTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl text-xs font-semibold text-slate-100 flex flex-col gap-1">
          <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{data.city}</p>
          <p className="text-sm font-extrabold text-teal-400">
            {formatFullCurrency(data.collection)}
          </p>
          <p className="text-[10px] text-slate-500">Total Tax Revenue</p>
        </div>
      );
    }
    return null;
  };

  const StatusTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      // Find payload data
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl text-xs font-semibold text-slate-100 flex flex-col gap-1.5 min-w-[140px]">
          <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-900 pb-1 mb-1">{data.city}</p>
          <div className="flex justify-between items-center gap-4">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Approved
            </span>
            <span className="font-extrabold">{data.approved}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-rose-450 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Rejected
            </span>
            <span className="font-extrabold">{data.rejected}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-amber-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Pending
            </span>
            <span className="font-extrabold">{data.pending}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="flex flex-col gap-4 mt-6">
      {/* Section Heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-display text-white tracking-wide">City-wise Comparison</h2>
        <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Visual Metrics</span>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Total Collections Bar Chart */}
        <div className="bg-[#1e293b] rounded-2xl p-5 shadow-xl border border-white/5 flex flex-col gap-3 h-[320px]">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Total Tax Collections</h3>
            <p className="text-[10px] text-slate-400">Total revenue collection (₹) per municipality</p>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155/30" />
                <XAxis
                  dataKey="abbr"
                  stroke="#64748b"
                  fontSize={11}
                  fontWeight={650}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  fontWeight={650}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatShortCurrency}
                />
                <Tooltip content={<CollectionTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                <Bar
                  dataKey="collection"
                  fill="url(#colorTeal)"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Status Counts Grouped Bar Chart */}
        <div className="bg-[#1e293b] rounded-2xl p-5 shadow-xl border border-white/5 flex flex-col gap-3 h-[320px]">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Application Approvals &amp; Audits</h3>
            <p className="text-[10px] text-slate-400">Approved, Rejected, and Pending counts per city</p>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155/30" />
                <XAxis
                  dataKey="abbr"
                  stroke="#64748b"
                  fontSize={11}
                  fontWeight={650}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  fontWeight={650}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<StatusTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '10px' }}
                />
                <Bar
                  dataKey="approved"
                  name="Approved"
                  fill="#10b981"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
                <Bar
                  dataKey="rejected"
                  name="Rejected"
                  fill="#ef4444"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  fill="#f59e0b"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </section>
  );
}
