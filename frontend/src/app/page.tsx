'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [redisStatus, setRedisStatus] = useState<'loading' | 'connected' | 'error'>('loading')

  useEffect(() => {
    // Verificar conexión con backend
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/schema/')
        if (response.ok) {
          setBackendStatus('connected')
        } else {
          setBackendStatus('error')
        }
      } catch (error) {
        setBackendStatus('error')
      }
    }

    // Verificar Redis (indirectamente a través del backend)
    const checkRedis = async () => {
      try {
        const response = await fetch('http://localhost:8000/admin/')
        if (response.ok) {
          setRedisStatus('connected')
        } else {
          setRedisStatus('error')
        }
      } catch (error) {
        setRedisStatus('error')
      }
    }

    checkBackend()
    checkRedis()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '✅'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema FEI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Gestión de Competencias Ecuestres
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">
              🚀 Fase 1: Configuración del Entorno
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Backend (Django)</span>
                <span className={`flex items-center gap-2 ${getStatusColor(backendStatus)}`}>
                  {getStatusIcon(backendStatus)}
                  {backendStatus === 'loading' ? 'Verificando...' : 
                   backendStatus === 'connected' ? 'Conectado' : 'Error de conexión'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Cache (Redis)</span>
                <span className={`flex items-center gap-2 ${getStatusColor(redisStatus)}`}>
                  {getStatusIcon(redisStatus)}
                  {redisStatus === 'loading' ? 'Verificando...' : 
                   redisStatus === 'connected' ? 'Conectado' : 'Error de conexión'}
                </span>
              </div>
            </div>

            <div className="text-left space-y-2">
              <p className="text-gray-700">
                <strong>✅ Frontend:</strong> Next.js 14 + TypeScript
              </p>
              <p className="text-gray-700">
                <strong>✅ Backend:</strong> Django 5.0 + REST Framework
              </p>
              <p className="text-gray-700">
                <strong>✅ Base de datos:</strong> PostgreSQL
              </p>
              <p className="text-gray-700">
                <strong>✅ Cache:</strong> Redis
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Próximo paso:</strong> FASE 2 - Gestión de Usuarios y Autenticación
              </p>
            </div>

            <div className="mt-6 flex gap-4 justify-center">
              <a 
                href="http://localhost:8000/admin/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Admin Django
              </a>
              <a 
                href="http://localhost:8000/api/docs/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                API Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}