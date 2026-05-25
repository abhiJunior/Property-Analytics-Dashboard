import { useState, useMemo, useRef, useEffect } from 'react';
import { usePropertyData } from '../hooks/usePropertyData';
import CityComparisonChart from './CityComparisonChart';
import {
  Building2,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ChevronDown,
  MapPin,
  Search,
  ArrowUpDown,
  Building,
  TrendingUp,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * AnimatedNumber component that counts up to the target value when it changes.
 */
function AnimatedNumber({ value, format }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = Number(value) || 0;
    if (start === end) return;

    const duration = 600; // ms
    const startTime = performance.now();
    let animationFrameId;

    const updateNumber = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      const current = Math.round(start + (end - start) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateNumber);
      } else {
        setDisplayValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(updateNumber);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{format ? format(displayValue) : displayValue}</>;
}

/**
 * Helper to format numbers with Indian grouping system.
 */
const formatIndianCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const formatIndianNumber = (value) => {
  return new Intl.NumberFormat('en-IN').format(value);
};

export default function Dashboard() {
  const [selectedTenant, setSelectedTenant] = useState('All Cities');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch data via usePropertyData hook
  const {
    filteredData,
    totalRegistered,
    totalApproved,
    totalRejected,
    totalCollection,
    allCities,
    cityStats
  } = usePropertyData(selectedTenant);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cities selection list
  const citiesList = useMemo(() => ['All Cities', ...allCities], [allCities]);

  // Additional Table Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortField, setSortField] = useState('property_id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;



  // Derive property types in the filtered set for dropdown options
  const allPropertyTypes = useMemo(() => {
    const types = filteredData.map((item) => item.property_type);
    return ['All Types', ...new Set(types)].sort();
  }, [filteredData]);

  // Apply UI filters on filteredData
  const uiFilteredData = useMemo(() => {
    let result = [...filteredData];

    // Search term filter (Property ID, Owner Name, Address)
    if (searchTerm.trim() !== '') {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.property_id.toLowerCase().includes(lower) ||
          item.owner_name.toLowerCase().includes(lower) ||
          item.address.toLowerCase().includes(lower)
      );
    }

    // Property Type filter
    if (propertyTypeFilter !== 'All Types') {
      result = result.filter((item) => item.property_type === propertyTypeFilter);
    }

    // Status filter
    if (statusFilter !== 'All Statuses') {
      result = result.filter((item) => item.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Safe numeric conversion for values
      if (sortField === 'annual_tax_inr' || sortField === 'collection_inr' || sortField === 'area_sqft' || sortField === 'floor_count') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [filteredData, searchTerm, propertyTypeFilter, statusFilter, sortField, sortDirection]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return uiFilteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [uiFilteredData, currentPage]);

  const totalPages = Math.max(Math.ceil(uiFilteredData.length / itemsPerPage), 1);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans pb-12 selection:bg-teal-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Building2 className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider font-display bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              UPYOG <span className="text-teal-400 font-normal">|</span> Property Tax Analytics
            </h1>
            <p className="text-xs text-slate-400 tracking-wide">National Multi-Tenant Dashboard</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Active City Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold tracking-wider uppercase">
            <MapPin className="w-3.5 h-3.5" />
            <span>{selectedTenant}</span>
          </div>

          {/* Custom Select Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/50 hover:border-slate-700 transition-all duration-200"
            >
              <span>{selectedTenant}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-slate-900 max-h-60 overflow-y-auto">
                  {citiesList.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedTenant(city);
                        setIsDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors duration-150 flex items-center justify-between ${
                        selectedTenant === city
                          ? 'bg-teal-500/20 text-teal-300 font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                      }`}
                    >
                      <span>{city}</span>
                      {selectedTenant === city && <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-[1600px] mx-auto px-6 mt-8 flex flex-col gap-8">
        
        {/* KPI Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Card 1: Registered */}
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col gap-4 group hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Registered Properties</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Building className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold tracking-tight font-display text-white">
                <AnimatedNumber value={totalRegistered} format={formatIndianNumber} />
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Across filtered boundaries</span>
              </p>
            </div>
          </div>

          {/* Card 2: Approved */}
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col gap-4 group hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Approved Applications</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold tracking-tight font-display text-white">
                <AnimatedNumber value={totalApproved} format={formatIndianNumber} />
              </p>
              <p className="text-xs text-emerald-500/80 mt-1 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active &amp; verified records</span>
              </p>
            </div>
          </div>

          {/* Card 3: Rejected */}
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col gap-4 group hover:border-rose-500/40 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-rose-500/10 blur-xl group-hover:bg-rose-500/20 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Rejected Applications</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold tracking-tight font-display text-white">
                <AnimatedNumber value={totalRejected} format={formatIndianNumber} />
              </p>
              <p className="text-xs text-rose-500/80 mt-1 flex items-center gap-1">
                <span>Requires document auditing</span>
              </p>
            </div>
          </div>

          {/* Card 4: Total Collection */}
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col gap-4 group hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Collection</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold tracking-tight font-display text-amber-300">
                <AnimatedNumber value={totalCollection} format={formatIndianCurrency} />
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Revenue successfully collected</span>
              </p>
            </div>
          </div>
        </section>

        {/* City-wise Comparison Section */}
        <CityComparisonChart cityStats={cityStats} />

        {/* Dashboard Layout: Analytics & Data Table */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Panel: City-wise Analytics Stats */}
          <div className="xl:col-span-1 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold font-display text-white">City-wise Stats (All Data)</h2>
              <p className="text-xs text-slate-400">Aggregated breakdown across 10 municipalities</p>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[550px] pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {cityStats.map((stat) => {
                const total = stat.registered || 1;
                const approvedPct = ((stat.approved || 0) / total) * 100;
                const pendingPct = ((stat.pending || 0) / total) * 100;
                const rejectedPct = ((stat.rejected || 0) / total) * 100;

                return (
                  <div key={stat.city} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-955/50 border border-slate-800/30 hover:border-slate-800 transition-colors duration-150">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-200">{stat.city}</span>
                      <span className="text-xs font-semibold text-amber-400">
                        {formatIndianCurrency(stat.totalCollection)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>{stat.registered} properties</span>
                      <div className="flex gap-2">
                        <span className="text-emerald-400">A:{stat.approved}</span>
                        <span className="text-amber-400">P:{stat.pending}</span>
                        <span className="text-rose-400">R:{stat.rejected}</span>
                      </div>
                    </div>

                    {/* Progress Bar Proportion */}
                    <div className="w-full h-2 rounded-full overflow-hidden bg-slate-850 flex mt-1">
                      <div
                        style={{ width: `${approvedPct}%` }}
                        className="h-full bg-emerald-500 transition-all duration-500"
                        title={`Approved: ${stat.approved}`}
                      />
                      <div
                        style={{ width: `${pendingPct}%` }}
                        className="h-full bg-amber-500 transition-all duration-500"
                        title={`Pending: ${stat.pending}`}
                      />
                      <div
                        style={{ width: `${rejectedPct}%` }}
                        className="h-full bg-rose-500 transition-all duration-500"
                        title={`Rejected: ${stat.rejected}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Detailed Interactive Records Table */}
          <div className="xl:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            
            {/* Table Header with Search & Quick Filters */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold font-display text-white">Registered Property Records</h2>
                  <p className="text-xs text-slate-400">
                    Showing {uiFilteredData.length} records matching search and filters
                  </p>
                </div>
              </div>

              {/* Filter Controls Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ID, owner, or address..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/80 transition-all duration-150"
                  />
                </div>

                {/* Property Type Filter */}
                <div className="relative">
                  <select
                    value={propertyTypeFilter}
                    onChange={(e) => {
                      setPropertyTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-teal-500/80 transition-all duration-150 appearance-none cursor-pointer"
                  >
                    {allPropertyTypes.map((type) => (
                      <option key={type} value={type} className="bg-slate-955 text-slate-200">
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-4 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-teal-500/80 transition-all duration-150 appearance-none cursor-pointer"
                  >
                    <option value="All Statuses" className="bg-slate-955 text-slate-200">All Statuses</option>
                    <option value="Approved" className="bg-slate-955 text-slate-200">Approved</option>
                    <option value="Pending" className="bg-slate-955 text-slate-200">Pending</option>
                    <option value="Rejected" className="bg-slate-955 text-slate-200">Rejected</option>
                  </select>
                  <div className="absolute right-3.5 top-4 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Table Element */}
            <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-950/30 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th onClick={() => handleSort('property_id')} className="py-3 px-4 cursor-pointer hover:text-white transition-colors duration-150">
                      <div className="flex items-center gap-1">
                        <span>Property ID</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('tenant')} className="py-3 px-4 cursor-pointer hover:text-white transition-colors duration-150">
                      <div className="flex items-center gap-1">
                        <span>City</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('owner_name')} className="py-3 px-4 cursor-pointer hover:text-white transition-colors duration-150">
                      <div className="flex items-center gap-1">
                        <span>Owner</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('property_type')} className="py-3 px-4 cursor-pointer hover:text-white transition-colors duration-150">
                      <div className="flex items-center gap-1">
                        <span>Type</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('annual_tax_inr')} className="py-3 px-4 cursor-pointer hover:text-white transition-colors duration-150 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>Annual Tax</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('status')} className="py-3 px-4 cursor-pointer hover:text-white transition-colors duration-150 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-sm">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item) => (
                      <tr key={item.property_id} className="hover:bg-slate-800/10 transition-colors duration-100">
                        <td className="py-3.5 px-4 font-normal text-xs font-semibold text-teal-400">
                          {item.property_id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {item.tenant}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-medium">{item.owner_name}</div>
                          <div className="text-xs text-slate-500 font-normal mt-0.5 truncate max-w-xs">{item.address}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/30">
                            {item.property_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="text-slate-200 font-semibold">{formatIndianNumber(item.annual_tax_inr)}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Paid: {formatIndianNumber(item.collection_inr)}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              item.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : item.status === 'Rejected'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === 'Approved'
                                  ? 'bg-emerald-400'
                                  : item.status === 'Rejected'
                                  ? 'bg-rose-400'
                                  : 'bg-amber-400'
                              }`}
                            />
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500 text-sm">
                        No property records found matching active filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {uiFilteredData.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
                <span className="text-xs text-slate-400">
                  Showing page <span className="font-semibold text-slate-200">{currentPage}</span> of{' '}
                  <span className="font-semibold text-slate-200">{totalPages}</span>
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </section>

      </main>
    </div>
  );
}