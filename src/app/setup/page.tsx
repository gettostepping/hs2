import Link from 'next/link';
import { ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react';

export default function Setup() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Instructions</h1>
            <p className="text-gray-600">How to configure your Google Calendar for data extraction</p>
          </div>

          <div className="p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">1</span>
                Prerequisites
              </h2>
              <ul className="space-y-3 pl-12 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span>A Google Account with an active Calendar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span>Events populated with attendees (clients) for the analysis to work.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">2</span>
                Authentication
              </h2>
              <div className="pl-12 space-y-4 text-gray-600">
                <p>
                  Our application uses Google's secure OAuth 2.0 protocol. When you click "Sign in with Google", you will be redirected to Google's consent screen.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-900 mb-2">Permissions we request:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                    <li>View your calendar events (read-only)</li>
                    <li>View your email address (to identify you)</li>
                    <li>View your basic profile info</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">3</span>
                Troubleshooting
              </h2>
              <div className="pl-12 text-gray-600">
                <p className="mb-4">
                  If you encounter issues connecting your account:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Ensure you are not blocking third-party cookies.</li>
                  <li>Check if your Google Workspace administrator allows third-party app connections.</li>
                  <li>Try signing out and signing back in.</li>
                </ul>
              </div>
            </section>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <Link 
                href="/api/auth/google"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                Connect Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
