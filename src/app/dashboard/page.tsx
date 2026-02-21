'use client';

import { useState } from 'react';
import { Download, Users, Calendar as CalendarIcon, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

interface Client {
  email: string;
  name: string;
  meetings: number;
  lastMeeting: string | null;
  phoneNumber?: string | null;
}

export default function Dashboard() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setClients([]);

    try {
      const res = await fetch('/api/calendar/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month, year }),
      });

      if (!res.ok) {
        if (res.status === 401) {
            window.location.href = '/'; // Redirect to login
            return;
        }
        throw new Error('Failed to fetch data');
      }

      const data = await res.json();
      setClients(data.clients);
      setHasSearched(true);
    } catch (err) {
      setError('An error occurred while fetching data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Appointments', 'Last Meeting'];
    const csvContent = [
      headers.join(','),
      ...clients.map(c => [
        `"${c.name}"`,
        `"${c.email}"`,
        c.meetings,
        c.lastMeeting ? new Date(c.lastMeeting).toLocaleDateString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clients_${year}_${month}.csv`;
    link.click();
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
                Select Period
              </h2>
              <form onSubmit={handleExtract} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
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
                <p className="text-gray-500">Select a month and year to start analyzing your calendar events.</p>
              </div>
            )}

            {hasSearched && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Found {clients.length} Clients</h2>
                    <p className="text-sm text-gray-500">
                       {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {clients.length > 0 && (
                    <button
                      onClick={downloadCSV}
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
    </div>
  );
}
