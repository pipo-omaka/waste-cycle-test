import { Recycle, LogOut, Menu, X, Home, ShoppingBag, Calculator, BarChart3, User, MessageCircle, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState } from 'react';
import type { User as UserType } from '../App';

interface HeaderProps {
  user: UserType | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ user, onLogout, onNavigate, currentPage }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const menuItems = user.role === 'admin' 
    ? [
        { id: 'dashboard', label: 'แดชบอร์ด', icon: Home },
        { id: 'admin', label: 'จัดการระบบ', icon: BarChart3 },
      ]
    : [
        { id: 'dashboard', label: 'แผนที่', icon: Home },
        { id: 'marketplace', label: 'ตลาดกลาง', icon: ShoppingBag },
        { id: 'fertilizer-advisor', label: 'คำนวนปุ๋ย', icon: BookOpen },
        { id: 'npk-calculator', label: 'คำนวณ NPK', icon: Calculator },
        { id: 'circular-view', label: 'วงจรหมุนเวียน', icon: BarChart3 },
      ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigate('dashboard')}>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                <Recycle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Waste Cycle</p>
                <p className="text-xs text-gray-500">Smart Farming Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentPage === item.id 
                        ? 'bg-green-50 text-green-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Create Post Button (Desktop) */}
              {user.role !== 'admin' && (
                <Button 
                  onClick={() => handleNavigate('create-post')}
                  className="hidden md:flex bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  + ลงประกาศ
                </Button>
              )}

              {/* Chat Button */}
              {user.role !== 'admin' && (
                <button
                  onClick={() => handleNavigate('chat')}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-gray-700" />
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px]">
                    3
                  </Badge>
                </button>
              )}

              {/* Profile Button */}
              <button
                onClick={() => handleNavigate('profile')}
                className="hidden md:flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.[0] ?? ""}</span>
                  )}
                </div>
                <span className="text-sm text-gray-700">{user.name}</span>
              </button>

              {/* Logout */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onLogout}
                className="text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="w-5 h-5" />
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-gray-700 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="fixed top-16 right-0 bottom-0 w-64 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col p-4">
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.name?.[0] ?? ""}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">
                      {user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.farmName}
                    </p>
                  </div>
                </div>
              </div>
              
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex items-center gap-3 text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                      currentPage === item.id 
                        ? 'bg-green-100 text-green-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}