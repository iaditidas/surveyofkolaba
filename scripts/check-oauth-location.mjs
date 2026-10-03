async function checkRedirect() {
  const url = 'https://ayxdrxspmyngihamvilm.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback%3Fnext%3D%252Fsurvey';
  const res = await fetch(url, { redirect: 'manual' });
  console.log("Status:", res.status);
  const location = res.headers.get("location");
  console.log("Location:", location);
  if (location) {
    const locUrl = new URL(location);
    console.log("Google OAuth host:", locUrl.host);
    console.log("Google OAuth searchParams:", Object.fromEntries(locUrl.searchParams.entries()));
  }
}

checkRedirect().catch(console.error);
