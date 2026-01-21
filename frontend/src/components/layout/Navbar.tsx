'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, UserRole, getDashboardRoute } from '@/lib/store';
import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui';
import { authApi } from '@/lib/auth-api';

// Hamburger Menu Icon
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="flex flex-col justify-center items-center w-6 h-6 cursor-pointer">
      <span
        className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${
          isOpen ? 'rotate-45 translate-y-1.5' : ''
        }`}
      />
      <span
        className={`block w-5 h-0.5 bg-gray-600 my-1 transition-all duration-300 ${
          isOpen ? 'opacity-0' : ''
        }`}
      />
      <span
        className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${
          isOpen ? '-rotate-45 -translate-y-1.5' : ''
        }`}
      />
    </div>
  );
}

// Mobile Menu Overlay
function MobileMenuOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      onClick={onClose}
    />
  );
}

// Navigation items per role - using translation keys
const navItemsByRole: Record<UserRole, { key: string; href: string }[]> = {
  CLIENT: [
    { key: 'dashboard', href: '/client/dashboard' },
    { key: 'orders', href: '/client/orders' },
    { key: 'products', href: '/client/products' },
    { key: 'inbounds', href: '/client/inbounds' },
    { key: 'returns', href: '/client/returns' },
    { key: 'chat', href: '/client/chat' },
    { key: 'channels', href: '/client/channels' },
  ],
  EMPLOYEE: [
    { key: 'dashboard', href: '/employee/dashboard' },
    { key: 'orders', href: '/employee/orders' },
    { key: 'products', href: '/employee/products' },
    { key: 'inbounds', href: '/employee/inbounds' },
    { key: 'returns', href: '/employee/returns' },
    { key: 'chat', href: '/employee/chat' },
    { key: 'tasks', href: '/employee/tasks' },
  ],
  ADMIN: [
    { key: 'dashboard', href: '/admin/dashboard' },
    { key: 'orders', href: '/admin/orders' },
    { key: 'fulfillment', href: '/admin/fulfillment' },
    { key: 'products', href: '/admin/products' },
    { key: 'inbounds', href: '/admin/inbounds' },
    { key: 'returns', href: '/admin/returns' },
    { key: 'clients', href: '/admin/clients' },
    { key: 'shipping', href: '/admin/shipping' },
    { key: 'chat', href: '/admin/chat' },
    { key: 'tasks', href: '/admin/tasks' },
  ],
  SUPER_ADMIN: [
    { key: 'dashboard', href: '/admin/dashboard' },
    { key: 'orders', href: '/admin/orders' },
    { key: 'fulfillment', href: '/admin/fulfillment' },
    { key: 'products', href: '/admin/products' },
    { key: 'inbounds', href: '/admin/inbounds' },
    { key: 'returns', href: '/admin/returns' },
    { key: 'clients', href: '/admin/clients' },
    { key: 'shipping', href: '/admin/shipping' },
    { key: 'employees', href: '/admin/employees' },
    { key: 'system', href: '/admin/system' },
  ],
};

// Fallback for unauthenticated users
const defaultNavItems = [
  { key: 'dashboard', href: '/dashboard' },
  { key: 'orders', href: '/orders' },
  { key: 'products', href: '/products' },
  { key: 'returns', href: '/returns' },
  { key: 'chat', href: '/chat' },
  { key: 'tasks', href: '/tasks' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('navbar');
  const tCommon = useTranslations('common');

  // Get navigation items based on user role
  const navItems = user?.role ? navItemsByRole[user.role] : defaultNavItems;

  // Get home route based on role
  const homeRoute = user?.role ? getDashboardRoute(user.role) : '/dashboard';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      router.push('/');
    } catch (error) {
      // Still logout locally even if API call fails
      logout();
      router.push('/');
    }
  };

  // Get role display label
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'CLIENT':
        return t('fulfillmentClient');
      case 'EMPLOYEE':
        return t('warehouse');
      case 'ADMIN':
        return t('dashboard');
      case 'SUPER_ADMIN':
        return t('dashboard');
      default:
        return tCommon('user');
    }
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      <MobileMenuOverlay isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Mobile Slide-out Drawer */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          boxShadow: mobileMenuOpen ? '4px 0 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
        }}
      >
        {/* Mobile Menu Header */}
        <div
          className="flex items-center justify-between px-4 border-b border-gray-200"
          style={{ height: '65px' }}
        >
          <Link href={homeRoute} onClick={() => setMobileMenuOpen(false)}>
            <Image
              src="/no_limits.png"
              alt="NoLimits Logo"
              width={100}
              height={32}
              priority
              className="h-auto w-auto"
              style={{ maxHeight: '32px' }}
            />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="#6B7280"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Items */}
        <nav className="flex flex-col py-4 px-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 65px - 80px)' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg mx-1 transition-colors ${
                  isActive
                    ? 'bg-[#003450]/10 text-[#003450]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '15px',
                }}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Footer - User Info */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <Image
                src="/tom_cooks.jpg"
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full py-2 px-4 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
            >
              {tCommon('signOut')}
            </button>
          </div>
        )}
      </div>

      {/* Main Navbar */}
      <nav
        className="w-full flex items-center justify-between px-4 md:px-6"
        style={{
          height: '65px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        {/* Left Section: Hamburger + Logo + Nav Items */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Hamburger Menu - Only visible on mobile/tablet */}
          <button
            className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <HamburgerIcon isOpen={mobileMenuOpen} />
          </button>

          {/* Logo */}
          <Link href={homeRoute}>
            <Image
              src="/no_limits.png"
              alt="NoLimits Logo"
              width={100}
              height={32}
              priority
              className="h-auto w-auto"
              style={{ maxHeight: '32px' }}
            />
          </Link>

          {/* Navigation Items - Hidden on mobile/tablet */}
          <div className="hidden lg:flex items-center" style={{ gap: '24px' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: isActive ? '#111827' : '#6B7280',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                  }}
                  className="hover:text-[#111827]"
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Section: Language Switcher + Bell Icon + Profile */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Role Badge - Hidden on small screens */}
          {user?.role && (
            <span
              className="hidden md:block"
              style={{
                padding: '6px 14px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                color: '#111827',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 400,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {getRoleLabel(user.role)}
            </span>
          )}

          {/* Bell Icon */}
          <button
            className="flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{
              width: '24px',
              height: '24px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                stroke="#6B7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                stroke="#6B7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <Image
                src="/tom_cooks.jpg"
                alt="Profile"
                width={32}
                height={32}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  objectFit: 'cover',
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                className="absolute right-0 mt-2 py-2"
                style={{
                  width: '200px',
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #E5E7EB',
                  zIndex: 50,
                }}
              >
                {/* User Info */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px', color: '#111827' }}>
                    {user?.name || 'User'}
                  </p>
                  <p style={{ fontFamily: 'Inter', fontSize: '12px', color: '#6B7280' }}>
                    {user?.email}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push(homeRoute.replace('dashboard', 'settings'));
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    style={{
                      fontFamily: 'Inter',
                      fontSize: '14px',
                      color: '#374151',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {tCommon('settings')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    style={{
                      fontFamily: 'Inter',
                      fontSize: '14px',
                      color: '#DC2626',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {tCommon('signOut')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
