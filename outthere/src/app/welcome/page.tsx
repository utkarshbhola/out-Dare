import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function WelcomePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log('WELCOME USER:', user);
  console.log('WELCOME ERROR:', error);

  if (error || !user) {
    redirect('/');
  }

  const name = user.user_metadata?.full_name || 'there';

  return (
    <div className="min-h-screen bg-[#0E0B08] text-[#F5EDD8] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center bg-[#14100c] border border-[#E07340]/20 rounded-3xl p-10">

        <div className="flex justify-center mb-6">
          <CheckCircle2
            size={64}
            className="text-[#E07340]"
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          🎉 Welcome, {name}
        </h1>

        <p className="text-[#9C8B72] text-lg mb-8">
          Your email has been verified and you're officially on the
          Out-Dare early access list.
        </p>

        <div className="bg-white/5 rounded-2xl p-6 mb-8">
          <p className="text-sm text-[#9C8B72]">
            Email
          </p>

          <p className="font-semibold mt-2">
            {user.email}
          </p>
        </div>

        <div className="space-y-3 text-[#9C8B72]">
          <p>✅ Early Access Reserved</p>
          <p>✅ Founding Member Status</p>
          <p>✅ Launch Updates Enabled</p>
        </div>

        <Link
          href="/"
          className="inline-block mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C4622D] to-[#E07340] text-white font-semibold"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}