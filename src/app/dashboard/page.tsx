'use client';

import { useState } from 'react';
import { Download, Users, Calendar as CalendarIcon, Loader2, Mail, X, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';

interface Client {
  email: string;
  name: string;
  meetings: number;
  lastMeeting: string | null;
  phoneNumber?: string | null;
}

type FilterMode = 'single' | 'range';

// Returns today's date as yyyy-mm-dd
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// First day of current month as yyyy-mm-dd
function firstOfMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function Dashboard() {
  const [filterMode, setFilterMode] = useState<FilterMode>('single');
  const [singleDate, setSingleDate] = useState(todayStr());
  const [startDate, setStartDate] = useState(firstOfMonthStr());
  const [endDate, setEndDate] = useState(todayStr());

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedLabel, setSearchedLabel] = useState('');

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    name: true,
    email: true,
    phone: true,
    meetings: true,
    lastInteraction: true,
  });

  const toggleAllColumns = () => {
    const allSelected = Object.values(exportColumns).every(Boolean);
    setExportColumns({
      name: !allSelected,
      email: !allSelected,
      phone: !allSelected,
      meetings: !allSelected,
      lastInteraction: !allSelected,
    });
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setClients([]);

    let reqStart: string;
    let reqEnd: string;
    let label: string;

    if (filterMode === 'single') {
      reqStart = singleDate;
      reqEnd = singleDate;
      label = new Date(singleDate + 'T00:00:00').toLocaleDateString('default', {
        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
      });
    } else {
      reqStart = startDate;
      reqEnd = endDate;
      const fmt = (d: string) =>
        new Date(d + 'T00:00:00').toLocaleDateString('default', {
          month: 'short', day: 'numeric', year: 'numeric',
        });
      label = `${fmt(startDate)} – ${fmt(endDate)}`;
    }

    try {
      const res = await fetch('/api/calendar/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: reqStart, endDate: reqEnd }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/';
          return;
        }
        throw new Error('Failed to fetch data');
      }

      const data = await res.json();
      setClients(data.clients);
      setHasSearched(true);
      setSearchedLabel(label);
    } catch {
      setError('An error occurred while fetching data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = [];
    if (exportColumns.name) headers.push('Name');
    if (exportColumns.email) headers.push('Email');
    if (exportColumns.phone) headers.push('Phone Number');
    if (exportColumns.meetings) headers.push('Appointments');
    if (exportColumns.lastInteraction) headers.push('Last Meeting');

    if (headers.length === 0) {
      alert("Please select at least one column to export.");
      return;
    }

    const csvContent = [
      headers.join(','),
      ...clients.map(c => {
        const row = [];
        if (exportColumns.name) row.push(`"${c.name}"`);
        if (exportColumns.email) row.push(`"${c.email}"`);
        if (exportColumns.phone) row.push(`"${c.phoneNumber || ''}"`);
        if (exportColumns.meetings) row.push(c.meetings);
        if (exportColumns.lastInteraction) row.push(c.lastMeeting ? new Date(c.lastMeeting).toLocaleDateString() : 'N/A');
        return row.join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clients_${searchedLabel.replace(/[^a-z0-9]/gi, '_')}.csv`;
    link.click();
    setIsExportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Extract and analyze your client interactions</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/email"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
              <Mail className="w-4 h-4" />
              Email Clients
            </Link>
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-12">
          {/* Sidebar / Controls */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Select Date
              </h2>

              {/* Mode toggle */}
              <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-4">
                <button
                  type="button"
                  onClick={() => setFilterMode('single')}
                  className={`flex-1 py-1.5 text-sm font-medium transition-colors ${filterMode === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  Single Day
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('range')}
                  className={`flex-1 py-1.5 text-sm font-medium transition-colors ${filterMode === 'range'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  Date Range
                </button>
              </div>

              <form onSubmit={handleExtract} className="space-y-4">
                {filterMode === 'single' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={singleDate}
                      onChange={e => setSingleDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        max={endDate}
                        onChange={e => setStartDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={e => setEndDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Extract Data'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-8 lg:col-span-9">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {!hasSearched && !loading && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Data to Display</h3>
                <p className="text-gray-500">Select a date or date range to start analyzing your calendar events.</p>
              </div>
            )}

            {hasSearched && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Found {clients.length} Clients</h2>
                    <p className="text-sm text-gray-500">{searchedLabel}</p>
                  </div>
                  {clients.length > 0 && (
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                      <tr>
                        <th className="px-6 py-4 font-medium">Client Name</th>
                        <th className="px-6 py-4 font-medium">Email Address</th>
                        <th className="px-6 py-4 font-medium">Phone Number</th>
                        <th className="px-6 py-4 font-medium">Meetings</th>
                        <th className="px-6 py-4 font-medium">Last Interaction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clients.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No clients found in this period.
                          </td>
                        </tr>
                      ) : (
                        clients.map((client, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                            <td className="px-6 py-4 text-gray-600">{client.email}</td>
                            <td className="px-6 py-4 text-gray-600">{client.phoneNumber || '-'}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {client.meetings}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {client.lastMeeting ? new Date(client.lastMeeting).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Export Options</h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Columns to Include</span>
                <button
                  onClick={toggleAllColumns}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  {Object.values(exportColumns).every(Boolean) ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'name', label: 'Client Name' },
                  { id: 'email', label: 'Email Address' },
                  { id: 'phone', label: 'Phone Number' },
                  { id: 'meetings', label: 'Appointments' },
                  { id: 'lastInteraction', label: 'Last Meeting' },
                ].map((col) => (
                  <label key={col.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`flex items-center justify-center w-5 h-5 rounded border ${exportColumns[col.id as keyof typeof exportColumns] ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white text-transparent group-hover:border-blue-400'} transition-colors`}>
                      <CheckSquare className={`w-4 h-4 ${exportColumns[col.id as keyof typeof exportColumns] ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={exportColumns[col.id as keyof typeof exportColumns]}
                      onChange={() => setExportColumns(prev => ({ ...prev, [col.id]: !prev[col.id as keyof typeof exportColumns] }))}
                    />
                    <span className="text-sm text-gray-700 select-none group-hover:text-gray-900">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={downloadCSV}
                disabled={!Object.values(exportColumns).some(Boolean)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
