'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { User, UserRole } from '@/types/auth';

import Logo from '../ui/Logo'
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  UserCheck,
  Flag,
  Target,
  Medal,
  Award,
  Settings
} from 'lucide-react'

// Mapeo de iconos temáticos ecuestres
const iconMap: Record<string, any> = {
  'dashboard': LayoutDashboard,
  'competitions': Trophy,
  'participants': Users,
  'judges': UserCheck,
  'categories': Flag,
  'scoring': Target,
  'rankings': Medal,
  'reports': Award,
  'settings': Settings,
}

function getIcon(iconName: string) {
  return iconMap[iconName] || Trophy
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  title?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  current?: boolean;
  roles?: UserRole[];
  badge?: string;
}

// Navegación renovada con iconos temáticos y badges
const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'dashboard',
    current: true
  },
  {
    name: 'Mi Perfil',
    href: '/profile',
    icon: 'participants'
  },
  {
    name: 'Competencias',
    href: '/competitions',
    icon: 'competitions',
    badge: '3'
  },
  {
    name: 'Participantes',
    href: '/participants',
    icon: 'participants'
  },
  {
    name: 'Jueces',
    href: '/judges',
    icon: 'judges'
  },
  {
    name: 'Categorías',
    href: '/categories',
    icon: 'categories'
  },
  {
    name: 'Puntuación',
    href: '/scoring',
    icon: 'scoring',
    roles: [UserRole.ADMIN, UserRole.JUDGE],
  },
  {
    name: 'Rankings',
    href: '/rankings',
    icon: 'rankings'
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: 'reports'
  },
  {
    name: 'Usuarios',
    href: '/admin/users',
    icon: 'participants',
    roles: [UserRole.ADMIN, UserRole.ORGANIZER],
  },
  {
    name: 'Auditoría',
    href: '/admin/audit',
    icon: 'reports',
    roles: [UserRole.ADMIN],
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: 'settings'
  }
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardLayoutNoAuth({ children, user, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock logout para pruebas
  const handleLogout = () => {
    console.log('Mock logout');
    alert('Mock logout - En producción esto cerraría sesión');
  };

  // Filtrar navegación según el rol del usuario
  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(user.role)
  );

  return (
    <div>
      {/* Sidebar móvil */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Cerrar sidebar</span>
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </Transition.Child>

                {/* Sidebar móvil con nuevo diseño */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                  <div className="flex h-16 shrink-0 items-center">
                    <Logo />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {filteredNavigation.map((item) => {
                            const Icon = getIcon(item.icon)
                            return (
                              <li key={item.name}>
                                <a
                                  href={item.href}
                                  className={`group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all duration-200 ${
                                    item.current
                                      ? 'bg-gradient-to-r from-equestrian-gold-50 to-equestrian-gold-100 text-equestrian-gold-700 shadow-sm border border-equestrian-gold-200'
                                      : 'text-gray-700 hover:text-equestrian-gold-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-equestrian-gold-50 hover:shadow-sm'
                                  }`}
                                >
                                  <Icon className={`h-6 w-6 shrink-0 transition-colors ${
                                    item.current ? 'text-equestrian-gold-600' : 'text-gray-400 group-hover:text-equestrian-gold-600'
                                  }`} />
                                  {item.name}
                                  {item.badge && (
                                    <span className="ml-auto inline-flex items-center rounded-full bg-equestrian-gold-100 px-2.5 py-0.5 text-xs font-medium text-equestrian-gold-800">
                                      {item.badge}
                                    </span>
                                  )}
                                </a>
                              </li>
                            )
                          })}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Sidebar estático para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4 shadow-lg">
          <div className="flex h-16 shrink-0 items-center">
            <Logo />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => {
                    const Icon = getIcon(item.icon)
                    return (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={`group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all duration-200 ${
                            item.current
                              ? 'bg-gradient-to-r from-equestrian-gold-50 to-equestrian-gold-100 text-equestrian-gold-700 shadow-sm border border-equestrian-gold-200'
                              : 'text-gray-700 hover:text-equestrian-gold-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-equestrian-gold-50 hover:shadow-sm'
                          }`}
                        >
                          <Icon className={`h-6 w-6 shrink-0 transition-colors ${
                            item.current ? 'text-equestrian-gold-600' : 'text-gray-400 group-hover:text-equestrian-gold-600'
                          }`} />
                          {item.name}
                          {item.badge && (
                            <span className="ml-auto inline-flex items-center rounded-full bg-equestrian-gold-100 px-2.5 py-0.5 text-xs font-medium text-equestrian-gold-800">
                              {item.badge}
                            </span>
                          )}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </li>
              
              {/* Sección de usuario en la parte inferior */}
              <li className="mt-auto">
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-x-3 p-3 rounded-lg bg-gradient-to-r from-equestrian-blue-50 to-indigo-50 border border-equestrian-blue-100">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-equestrian-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        {/* Header renovado con gradiente y glassmorphism */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/10 bg-gradient-to-r from-equestrian-blue-600/90 via-equestrian-blue-700/90 to-indigo-700/90 backdrop-blur-xl px-4 shadow-lg sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" className="-m-2.5 p-2.5 text-white/90 hover:text-white lg:hidden transition-colors" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Abrir sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="h-6 w-px bg-white/20 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center">
              {title && (
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <h1 className="text-lg font-semibold leading-6 text-white">{title}</h1>
                </div>
              )}
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              {/* Icono de notificaciones */}
              <button type="button" className="-m-2.5 p-2.5 text-white/70 hover:text-white transition-colors">
                <span className="sr-only">Ver notificaciones</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a2 2 0 01-2-2V9a2 2 0 012-2h6v10z" />
                </svg>
              </button>

              {/* Menú de usuario renovado */}
              <Menu as="div" className="relative">
                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                  <span className="sr-only">Abrir menú de usuario</span>
                  <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.first_name[0]}{user.last_name[0]}
                    </span>
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-white">
                      {user.full_name}
                    </span>
                    <svg className="ml-2 h-5 w-5 text-white/70" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="/profile"
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block px-3 py-1 text-sm leading-6 text-gray-900'
                          )}
                        >
                          Mi perfil
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block w-full text-left px-3 py-1 text-sm leading-6 text-gray-900'
                          )}
                        >
                          Cerrar sesión
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}