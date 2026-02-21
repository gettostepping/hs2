'use client';

import { useState } from 'react';
import { Mail, Calendar as CalendarIcon, Loader2, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

interface Client {
  email: string;
  name: string;
  meetings: number;
  lastMeeting: string | null;
  phoneNumber?: string | null;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: Template[] = [
  {
    id: 'holidays2025',
    name: 'Holidays - Renew',
    subject: 'AHA Certification Renewal',
    body: "Good Day, Please be advised that your CPR/BLS, FIRST AID, ACLS and/or PALS certification is about to expire. Please give us a call between the hours of 9am and 5pm to register and renew your certifications. We do appreciate our clients and hope to hear from you soon. Happy Holidays! Kindly, HeartSaver-NY 3220 Church Avenue."
  },
  {
    id: '2025',
    name: 'Renew',
    subject: 'AHA Certification Renewal',
    body: "Good Day, Please be advised that your CPR/BLS, FIRST AID, ACLS and/or PALS certification is about to expire. Please give us a call between the hours of 9am and 5pm to register and renew your certifications. We do appreciate our clients and hope to hear from you soon. Kindly, HeartSaver-NY 3220 Church Avenue."
  },
];

export default function EmailPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(EMAIL_TEMPLATES[0].id);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: number; failed: number } | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setClients([]);
    setSendResult(null);

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
            window.location.href = '/'; 
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

  const handleSendSingle = async (client: Client) => {
    if (!confirm(`Send email to ${client.name}?`)) return;

    setSending(true);
    setSendResult(null);
    setError('');

    const template = EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId);
    if (!template) {
        setError('Template not found');
        setSending(false);
        return;
    }

    try {
        const res = await fetch('/api/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clients: [client],
                templateId: template.id,
                templateSubject: template.subject,
                templateBody: template.body
            }),
        });

        if (!res.ok) {
             throw new Error('Failed to send email');
        }

        const data = await res.json();
        setSendResult({ success: data.sent, failed: data.failed });
        if (data.sent === 1) {
            alert(`Email sent successfully to ${client.name}`);
        } else {
            alert(`Failed to send email to ${client.name}`);
        }
    } catch (err) {
        setError('An error occurred while sending email.');
    } finally {
        setSending(false);
    }
  };

  // Placeholder removed. We now use handleSendSingle for individual sends.
  // const getMailtoLink = ... 

  const handleSendAll = async () => {
    if (!confirm(`Send email to ${clients.length} clients?`)) return;

    setSending(true);
    setSendResult(null);
    setError('');

    const template = EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId);
    if (!template) {
        setError('Template not found');
        setSending(false);
        return;
    }

    try {
        const res = await fetch('/api/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clients: clients,
                templateId: template.id,
                templateSubject: template.subject,
                templateBody: template.body
            }),
        });

        if (!res.ok) {
             throw new Error('Failed to send email');
        }

        const data = await res.json();
        setSendResult({ success: data.sent, failed: data.failed });
        alert(`Process complete. Sent: ${data.sent}, Failed: ${data.failed}`);
    } catch (err) {
        setError('An error occurred while sending email.');
    } finally {
        setSending(false);
    }
  };

  // Placeholder removed. We now use handleSendAll for bulk sends.
  // const getSendAllLink = ...

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link href="/dashboard" className="flex items-center text-sm text-gray-500 hover:text-blue-600 mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Email Clients</h1>
            <p className="text-gray-600">Send bulk emails to clients from a specific period</p>
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-12">
          {/* Controls */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
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
                      Loading...
                    </>
                  ) : (
                    'Fetch Clients'
                  )}
                </button>
              </form>

              {hasSearched && clients.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSendAll}
                    disabled={sending}
                    className="w-full flex justify-center items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {sending ? (
                        <>
                           <Loader2 className="w-4 h-4 animate-spin" />
                           Sending...
                        </>
                    ) : (
                        <>
                           <Send className="w-4 h-4" />
                           Send to All ({clients.length})
                        </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Sends actual emails via your Gmail account.
                  </p>
                  
                  {sendResult && (
                      <div className={`mt-4 p-3 rounded-md text-sm ${sendResult.failed === 0 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                          <p className="font-medium">Sending Complete</p>
                          <p>Successfully sent: {sendResult.success}</p>
                          {sendResult.failed > 0 && <p>Failed: {sendResult.failed}</p>}
                      </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Message Template
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {EMAIL_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">Subject Preview:</p>
                  <p className="text-sm text-gray-900 mb-2 font-medium">
                    {EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId)?.subject}
                  </p>
                  <p className="text-xs font-medium text-gray-500 mb-1">Body Preview:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId)?.body.replace('{{name}}', '[Client Name]')}
                  </p>
                </div>
              </div>
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
                  <Mail className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Ready to Email</h3>
                <p className="text-gray-500">Fetch clients to start sending emails using your selected template.</p>
              </div>
            )}

            {hasSearched && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                   <h2 className="text-lg font-semibold text-gray-900">Found {clients.length} Clients</h2>
                   <p className="text-sm text-gray-500">
                      Click the send button to open your default email client with the pre-filled message.
                   </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                      <tr>
                        <th className="px-6 py-4 font-medium">Client</th>
                        <th className="px-6 py-4 font-medium">Email</th>
                        <th className="px-6 py-4 font-medium">Last Met</th>
                        <th className="px-6 py-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clients.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            No clients found for this period.
                          </td>
                        </tr>
                      ) : (
                        clients.map((client, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                            <td className="px-6 py-4 text-gray-600">{client.email}</td>
                            <td className="px-6 py-4 text-gray-600">
                              {client.lastMeeting ? new Date(client.lastMeeting).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleSendSingle(client)}
                                disabled={sending}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                <Send className="w-3 h-3" />
                                Send
                              </button>
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
