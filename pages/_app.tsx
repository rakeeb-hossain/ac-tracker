import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient, ConvexProvider } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider publishableKey='pk_test_c291bmQtcmVpbmRlZXItMi5jbGVyay5hY2NvdW50cy5kZXYk'>    
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>      
        <Component {...pageProps} />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
