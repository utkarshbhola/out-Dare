"use client";

import React, { Suspense } from 'react';
import AuthPage from '../login/page';

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0E0B08] text-[#F5EDD8] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#E07340]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    }>
      <AuthPageWrapper />
    </Suspense>
  );
}

function AuthPageWrapper() {
  // We can render AuthPage directly. The AuthPage itself reads the 'mode' query param,
  // or we can let AuthPage handle the setup. Since we want /signup to default to signup,
  // we can use the AuthPage component which will initialize and read from useSearchParams,
  // and we'll ensure that when they link to /signup it loads the signup form.
  return <AuthPage />;
}
