/**
 * PrivateRoute Component
 * 
 * MULTI-USER AUTHENTICATION:
 * - บังคับให้ผู้ใช้ต้อง login ก่อนเข้าหน้าเว็บใดๆ
 * - ถ้ายังไม่ login → redirect ไปหน้า landing/login
 * - ถ้า login แล้ว → แสดงหน้าเว็บที่ต้องการ
 * 
 * Usage:
 * <PrivateRoute user={user} isLoading={isLoading}>
 *   <YourProtectedComponent />
 * </PrivateRoute>
 */

import { ReactNode } from 'react';
import { LandingPage } from './LandingPage';
import type { User } from '../App';

interface PrivateRouteProps {
  user: User | null;
  isLoading: boolean;
  children: ReactNode;
  redirectTo?: string;
}

export function PrivateRoute({ 
  user, 
  isLoading, 
  children, 
  redirectTo = 'landing' 
}: PrivateRouteProps) {
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show landing page
  if (!user) {
    return <LandingPage onGetStarted={() => window.location.reload()} />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}

