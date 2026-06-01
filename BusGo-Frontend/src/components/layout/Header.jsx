import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from '@nextui-org/react'
import { Clock, LogIn, LogOut, User, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StorageUtil } from '../../utils/helpers'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const userData = StorageUtil.getUser()
    setUser(userData)
    setIsMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    StorageUtil.clearAuth()
    setUser(null)
    navigate('/')
  }

  const navLinks = [
    { label: 'TRANG CHỦ', href: '/' },
    { label: 'TÌM VÉ', href: '/search' },
    { label: 'LỊCH SỬ', href: '/history' },
    { label: 'GỬI HÀNG', href: '/cargo-consignment' }
  ]

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 w-full z-50"
    >
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        maxWidth="full"
        className={`transition-all duration-300 bg-white ${
          scrolled ? 'shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]' : 'border-b border-slate-100'
        }`}
        classNames={{
          wrapper: 'px-4 lg:px-12',
        }}
      >
        {/* === LEFT: Logo === */}
        <NavbarContent justify="start">
          <NavbarBrand>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-[#004b87] rounded-full flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                <span className="text-xl">🚌</span>
              </div>
              <span className="text-2xl font-black text-[#004b87] tracking-tight">BusGo</span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        {/* === CENTER: Nav Links – Desktop === */}
        <NavbarContent className="hidden lg:flex gap-8" justify="center">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href))
            return (
              <NavbarItem key={link.href}>
                <Link
                  to={link.href}
                  className={`text-[13px] font-bold tracking-widest uppercase transition-all duration-200 py-1 ${
                    isActive
                      ? 'text-[#004b87] border-b-2 border-[#004b87]'
                      : 'text-slate-500 hover:text-[#004b87]'
                  }`}
                >
                  {link.label}
                </Link>
              </NavbarItem>
            )
          })}
        </NavbarContent>

        {/* === RIGHT: Auth === */}
        <NavbarContent justify="end" className="gap-4">
          <div className="hidden lg:block w-px h-6 bg-slate-200 mx-2"></div>
          
          {user ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-slate-700 transition-all duration-200">
                  <div className="w-8 h-8 rounded-full bg-[#004b87] flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-bold hidden sm:block max-w-[120px] truncate">{user.name}</span>
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="User menu"
                className="w-48"
                itemClasses={{ base: 'gap-3' }}
              >
                <DropdownItem
                  key="profile"
                  startContent={<User size={16} className="text-[#004b87]" />}
                  onPress={() => navigate('/profile')}
                >
                  <span className="font-semibold text-slate-700">Hồ sơ cá nhân</span>
                </DropdownItem>
                <DropdownItem
                  key="history"
                  startContent={<Clock size={16} className="text-slate-500" />}
                  onPress={() => navigate('/history')}
                >
                  <span className="font-semibold text-slate-700">Lịch sử đặt vé</span>
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  startContent={<LogOut size={16} />}
                  onPress={handleLogout}
                >
                  <span className="font-semibold">Đăng xuất</span>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div className="hidden lg:flex items-center">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-[#004b87] hover:bg-[#003666] text-white px-6 py-2.5 rounded-full font-bold text-[13px] tracking-wide shadow-md transition-all uppercase"
              >
                Đăng nhập
                <LogIn size={16} />
              </button>
            </div>
          )}

          {/* Mobile Hamburger */}
          <NavbarMenuToggle
            icon={<Menu size={24} className="text-[#004b87]" />}
            aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
            className="lg:hidden"
          />
        </NavbarContent>

        {/* === MOBILE MENU === */}
        <NavbarMenu className="bg-white/95 backdrop-blur-xl pt-6 pb-8 gap-2 border-t border-slate-100">
          {navLinks.map((link) => (
            <NavbarMenuItem key={link.href}>
              <Link
                to={link.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all uppercase ${
                  location.pathname === link.href
                    ? 'text-[#004b87] bg-blue-50'
                    : 'text-slate-600 hover:text-[#004b87] hover:bg-slate-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            </NavbarMenuItem>
          ))}

          <div className="h-px bg-slate-100 my-4" />

          {user ? (
            <>
              <button
                onClick={() => { navigate('/profile'); setIsMenuOpen(false) }}
                className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl text-left w-full border border-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-[#004b87] flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-slate-800 font-bold">{user.name}</div>
                  <div className="text-slate-500 text-xs font-semibold">Hồ sơ cá nhân</div>
                </div>
              </button>
              <button
                onClick={() => { handleLogout(); setIsMenuOpen(false) }}
                className="flex items-center justify-center gap-2 py-3 mt-2 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all w-full border border-red-100"
              >
                <LogOut size={18} /> Đăng xuất
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 mt-2 px-2">
              <button
                onClick={() => { navigate('/login'); setIsMenuOpen(false) }}
                className="flex items-center justify-center gap-2 py-3.5 text-white bg-[#004b87] rounded-xl font-bold tracking-wide shadow-md transition-all uppercase text-sm"
              >
                Đăng nhập
                <LogIn size={18} />
              </button>
            </div>
          )}
        </NavbarMenu>
      </Navbar>
    </motion.div>
  )
}
