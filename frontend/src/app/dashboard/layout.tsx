'use client';

import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prevent body scroll and hide footer when on dashboard
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Hide the footer
    const footer = document.querySelector('footer');
    if (footer) {
      footer.style.display = 'none';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Show the footer again
      const footer = document.querySelector('footer');
      if (footer) {
        footer.style.display = '';
      }
    };
  }, []);

  return <>{children}</>;
}
