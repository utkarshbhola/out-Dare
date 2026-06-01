import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Default redirect is /discover
  const next = searchParams.get('next') ?? '/discover';

  if (code) {
    console.log("AUTH CALLBACK HIT, EXCHANGE CODE FOR SESSION");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      const user = data.user;

      try {
        // Query the database to check if the user has a completed profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_completed')
          .eq('id', user.id)
          .maybeSingle();

        const isCompleted = profile?.profile_completed === true;

        // Synchronize state with user session metadata if complete
        if (isCompleted && user.user_metadata?.profile_completed !== true) {
          await supabase.auth.updateUser({
            data: { profile_completed: true },
          });
        }

        // If completed, go to /discover (or next). Otherwise, go to onboarding.
        const redirectPath = isCompleted ? next : '/onboarding';
        return NextResponse.redirect(`${origin}${redirectPath}`);
      } catch (dbErr) {
        console.error("Callback DB profiles fetch error:", dbErr);
        // Fallback: send user to onboarding if DB check fails
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  // Redirect the user to login page with error query param
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
