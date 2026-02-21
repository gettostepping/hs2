import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-white text-black">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-12">
        <div className="flex w-full justify-center border-b border-gray-200 bg-gray-50 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-100 lg:p-4">
          <code className="font-mono font-bold text-gray-700">Google Calendar Client Extractor</code>
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-8 max-w-4xl mx-auto z-10">
        <div className="rounded-full bg-blue-50 p-6 ring-1 ring-blue-100 shadow-sm">
          <Calendar className="h-16 w-16 text-blue-600" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-center text-gray-900 tracking-tight">
          Analyze Your <span className="text-blue-600">Client Meetings</span>
        </h1>
        
        <p className="text-xl text-gray-600 text-center max-w-2xl leading-relaxed">
          Connect your Google Calendar to extract client interaction data, track meeting frequency, and manage your professional relationships efficiently.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link 
            href="/api/auth/google"
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6 bg-white rounded-full p-0.5" />
            Sign in with Google
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center w-full">
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="font-bold text-gray-900 mb-2 text-lg">Secure</div>
            <p className="text-gray-600">Read-only access to your calendar events. Your data is never shared.</p>
          </div>
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="font-bold text-gray-900 mb-2 text-lg">Fast</div>
            <p className="text-gray-600">Instant analysis of monthly activities and client interactions.</p>
          </div>
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="font-bold text-gray-900 mb-2 text-lg">Exportable</div>
            <p className="text-gray-600">Download your reports as CSV for further analysis in Excel.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
