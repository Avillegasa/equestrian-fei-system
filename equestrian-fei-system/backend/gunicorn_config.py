"""
Gunicorn Configuration for Production
Sistema de Gestión Ecuestre FEI
"""

import multiprocessing
import os

# ============================================
# SERVER SOCKET
# ============================================
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"
backlog = 2048

# ============================================
# WORKER PROCESSES
# ============================================
# Render Free Tier: 512MB RAM
# Cada worker consume ~80-120MB
# Fórmula: (2 * CPU cores) + 1
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))

# Para free tier, limitar workers
if os.getenv('RENDER_PLAN', 'free') == 'free':
    workers = min(workers, 2)  # Máximo 2 workers en free tier

worker_class = 'sync'  # Opciones: sync, gevent, eventlet
worker_connections = 1000
max_requests = 1000  # Reciclar workers después de 1000 requests
max_requests_jitter = 50  # Agregar aleatoriedad para evitar reciclar todos a la vez

# ============================================
# TIMEOUTS
# ============================================
timeout = 120  # 2 minutos para requests largos (reportes PDF/Excel)
graceful_timeout = 30
keepalive = 5

# ============================================
# LOGGING
# ============================================
accesslog = '-'  # Stdout
errorlog = '-'   # Stderr
loglevel = os.getenv('LOG_LEVEL', 'info')  # debug, info, warning, error, critical
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# ============================================
# PROCESS NAMING
# ============================================
proc_name = 'equestrian_fei_backend'

# ============================================
# SERVER MECHANICS
# ============================================
daemon = False
pidfile = None
user = None
group = None
tmp_upload_dir = None

# ============================================
# SSL (Render maneja SSL automáticamente)
# ============================================
# No necesitamos configurar SSL aquí

# ============================================
# SECURITY
# ============================================
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190

# ============================================
# HOOKS (para debugging y monitoreo)
# ============================================
def on_starting(server):
    """
    Called just before the master process is initialized.
    """
    print("🚀 Equestrian FEI Backend starting...")


def on_reload(server):
    """
    Called to recycle workers during a reload via SIGHUP.
    """
    print("🔄 Reloading Equestrian FEI Backend...")


def when_ready(server):
    """
    Called just after the server is started.
    """
    print("✅ Equestrian FEI Backend ready!")
    print(f"   Workers: {workers}")
    print(f"   Binding: {bind}")
    print(f"   Timeout: {timeout}s")


def worker_int(worker):
    """
    Called when a worker receives the SIGINT or SIGQUIT signal.
    """
    print(f"⚠️  Worker {worker.pid} interrupted")


def worker_abort(worker):
    """
    Called when a worker receives the SIGABRT signal.
    """
    print(f"❌ Worker {worker.pid} aborted")


def pre_fork(server, worker):
    """
    Called just before a worker is forked.
    """
    pass


def post_fork(server, worker):
    """
    Called just after a worker has been forked.
    """
    print(f"👷 Worker {worker.pid} spawned")


def pre_exec(server):
    """
    Called just before a new master process is forked.
    """
    print("🔄 Preparing to exec new master process...")


def pre_request(worker, req):
    """
    Called just before a worker processes the request.
    """
    worker.log.debug(f"{req.method} {req.path}")


def post_request(worker, req, environ, resp):
    """
    Called after a worker processes the request.
    """
    pass


def child_exit(server, worker):
    """
    Called when a worker is exited.
    """
    print(f"👋 Worker {worker.pid} exited")


def worker_exit(server, worker):
    """
    Called when a worker is exited, in the worker process.
    """
    pass


def nworkers_changed(server, new_value, old_value):
    """
    Called when the number of workers is changed.
    """
    print(f"👷 Workers changed: {old_value} → {new_value}")


def on_exit(server):
    """
    Called just before exiting Gunicorn.
    """
    print("👋 Equestrian FEI Backend shutting down...")
