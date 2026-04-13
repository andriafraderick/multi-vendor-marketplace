"""
core/settings.py
Multi-Vendor Marketplace — Django Settings

Environments handled automatically:
  Local dev  → SQLite3, no Redis required, DEBUG=True
  Production → PostgreSQL (Render), Redis, DEBUG=False
"""

import os
from pathlib import Path
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

# ══════════════════════════════════════════════════════════════════════════════
# BASE
# ══════════════════════════════════════════════════════════════════════════════

BASE_DIR = Path(__file__).resolve().parent.parent


# ══════════════════════════════════════════════════════════════════════════════
# SECURITY
# ══════════════════════════════════════════════════════════════════════════════

SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "django-insecure-f$sy8bs9_a$q1-@$70pstr+w2cpp1x^jv!5&5=1w10un$=67m4",
)

DEBUG = os.environ.get("DEBUG", "True") == "True"

# Allowed hosts — split comma-separated string from env
_raw_hosts = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1")
ALLOWED_HOSTS = [h.strip() for h in _raw_hosts.split(",") if h.strip()]

# In production add Render domain automatically
RENDER_EXTERNAL_HOSTNAME = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)


# ══════════════════════════════════════════════════════════════════════════════
# APPLICATIONS
# ══════════════════════════════════════════════════════════════════════════════

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "cloudinary",
    "cloudinary_storage",
]

LOCAL_APPS = [
    "accounts.apps.AccountsConfig",
    "vendors.apps.VendorsConfig",
    "products.apps.ProductsConfig",
    "orders.apps.OrdersConfig",
    "reviews.apps.ReviewsConfig",
    "analytics.apps.AnalyticsConfig",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


# ══════════════════════════════════════════════════════════════════════════════
# MIDDLEWARE
# ══════════════════════════════════════════════════════════════════════════════

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",          # Must be first
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",      # Static files
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ══════════════════════════════════════════════════════════════════════════════
# URL & WSGI
# ══════════════════════════════════════════════════════════════════════════════

ROOT_URLCONF = "core.urls"
WSGI_APPLICATION = "core.wsgi.application"


# ══════════════════════════════════════════════════════════════════════════════
# TEMPLATES
# ══════════════════════════════════════════════════════════════════════════════

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ══════════════════════════════════════════════════════════════════════════════
# DATABASE
# Local dev  → SQLite3  (no setup needed)
# Production → PostgreSQL via DATABASE_URL env var
# ══════════════════════════════════════════════════════════════════════════════

DATABASE_URL = os.environ.get("DATABASE_URL", "")

if DATABASE_URL:
    # ── Production: PostgreSQL on Render ──────────────────────────────────────
    import dj_database_url
    DATABASES = {
        "default": dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # ── Local development: SQLite3 ────────────────────────────────────────────
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME":   BASE_DIR / "db.sqlite3",
        }
    }


# ══════════════════════════════════════════════════════════════════════════════
# CACHE
# Local dev  → in-memory (no Redis needed)
# Production → Redis via REDIS_URL env var
# ══════════════════════════════════════════════════════════════════════════════

REDIS_URL = os.environ.get("REDIS_URL", "")

if REDIS_URL:
    # ── Production: Redis ─────────────────────────────────────────────────────
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "SOCKET_CONNECT_TIMEOUT": 5,
                "SOCKET_TIMEOUT": 5,
                "IGNORE_EXCEPTIONS": True,
            },
        }
    }
else:
    # ── Local development: in-memory cache ───────────────────────────────────
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "marketplace-cache",
        }
    }


# ══════════════════════════════════════════════════════════════════════════════
# CUSTOM USER MODEL
# ══════════════════════════════════════════════════════════════════════════════

AUTH_USER_MODEL = "accounts.User"


# ══════════════════════════════════════════════════════════════════════════════
# PASSWORD VALIDATION
# ══════════════════════════════════════════════════════════════════════════════

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation"
            ".UserAttributeSimilarityValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation"
            ".MinimumLengthValidator"
        ),
        "OPTIONS": {"min_length": 8},
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation"
            ".CommonPasswordValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation"
            ".NumericPasswordValidator"
        )
    },
]


# ══════════════════════════════════════════════════════════════════════════════
# INTERNATIONALIZATION
# ══════════════════════════════════════════════════════════════════════════════

LANGUAGE_CODE = "en-us"
TIME_ZONE     = "UTC"
USE_I18N      = True
USE_TZ        = True


# ══════════════════════════════════════════════════════════════════════════════
# STATIC FILES
# WhiteNoise serves static files in production without a CDN
# ══════════════════════════════════════════════════════════════════════════════

STATIC_URL  = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_DIRS = [
    BASE_DIR / "static",
] if (BASE_DIR / "static").exists() else []

# WhiteNoise compression + caching
STATICFILES_STORAGE = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
)


# ══════════════════════════════════════════════════════════════════════════════
# MEDIA FILES (user uploads)
# Local dev  → local filesystem
# Production → Cloudinary
# ══════════════════════════════════════════════════════════════════════════════

CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY    = os.environ.get("CLOUDINARY_API_KEY",    "")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    # ── Production: Cloudinary ────────────────────────────────────────────────
    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"
    CLOUDINARY_STORAGE   = {
        "CLOUD_NAME": CLOUDINARY_CLOUD_NAME,
        "API_KEY":    CLOUDINARY_API_KEY,
        "API_SECRET": CLOUDINARY_API_SECRET,
    }
    MEDIA_URL = f"https://res.cloudinary.com/{CLOUDINARY_CLOUD_NAME}/"
else:
    # ── Local development: filesystem ─────────────────────────────────────────
    DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
    MEDIA_URL  = "/media/"
    MEDIA_ROOT = BASE_DIR / "media"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ══════════════════════════════════════════════════════════════════════════════
# REST FRAMEWORK
# ══════════════════════════════════════════════════════════════════════════════

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "200/day",
        "user": "2000/day",
    },
    # Return JSON for browser API errors in production
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ]
    if not DEBUG
    else [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}


# ══════════════════════════════════════════════════════════════════════════════
# JWT SETTINGS
# ══════════════════════════════════════════════════════════════════════════════

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":  timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS":  True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN":      True,
    "AUTH_HEADER_TYPES":      ("Bearer",),
    "AUTH_TOKEN_CLASSES":     (
        "rest_framework_simplejwt.tokens.AccessToken",
    ),
    "TOKEN_OBTAIN_SERIALIZER": (
        "rest_framework_simplejwt.serializers.TokenObtainPairSerializer"
    ),
}


# ══════════════════════════════════════════════════════════════════════════════
# CORS (Cross-Origin Resource Sharing)
# ══════════════════════════════════════════════════════════════════════════════

_raw_cors = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
)
CORS_ALLOWED_ORIGINS = [o.strip() for o in _raw_cors.split(",") if o.strip()]
CORS_ALLOW_CREDENTIALS = True

# Allow all origins in local dev only
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

# Headers the frontend is allowed to send
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]


# ══════════════════════════════════════════════════════════════════════════════
# CSRF
# ══════════════════════════════════════════════════════════════════════════════

_raw_csrf = os.environ.get(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _raw_csrf.split(",") if o.strip()]

# Add Render domain to CSRF trusted origins if available
if RENDER_EXTERNAL_HOSTNAME:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")


# ══════════════════════════════════════════════════════════════════════════════
# STRIPE
# ══════════════════════════════════════════════════════════════════════════════

STRIPE_PUBLIC_KEY     = os.environ.get("STRIPE_PUBLIC_KEY",     "")
STRIPE_SECRET_KEY     = os.environ.get("STRIPE_SECRET_KEY",     "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


# ══════════════════════════════════════════════════════════════════════════════
# EMAIL
# Local dev  → prints to console (no SMTP needed)
# Production → Gmail SMTP (or any SMTP provider)
# ══════════════════════════════════════════════════════════════════════════════

EMAIL_HOST_USER     = os.environ.get("EMAIL_HOST_USER",     "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")

if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    # ── Production: real SMTP ─────────────────────────────────────────────────
    EMAIL_BACKEND       = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST          = os.environ.get("EMAIL_HOST",     "smtp.gmail.com")
    EMAIL_PORT          = int(os.environ.get("EMAIL_PORT", "587"))
    EMAIL_USE_TLS       = True
    EMAIL_USE_SSL       = False
    DEFAULT_FROM_EMAIL  = os.environ.get(
        "DEFAULT_FROM_EMAIL", f"Marketplace <{EMAIL_HOST_USER}>"
    )
else:
    # ── Local development: console backend (emails print to terminal) ─────────
    EMAIL_BACKEND      = "django.core.mail.backends.console.EmailBackend"
    DEFAULT_FROM_EMAIL = "noreply@marketplace.local"


# ══════════════════════════════════════════════════════════════════════════════
# FRONTEND URL (used in email links)
# ══════════════════════════════════════════════════════════════════════════════

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


# ══════════════════════════════════════════════════════════════════════════════
# PLATFORM DEFAULTS
# ══════════════════════════════════════════════════════════════════════════════

DEFAULT_COMMISSION_RATE = float(
    os.environ.get("DEFAULT_COMMISSION_RATE", "10.0")
)


# ══════════════════════════════════════════════════════════════════════════════
# CELERY (async tasks — analytics snapshots, email sending)
# Uses Redis in production, falls back gracefully if Redis not available
# ══════════════════════════════════════════════════════════════════════════════

CELERY_BROKER_URL        = REDIS_URL or "memory://"
CELERY_RESULT_BACKEND    = REDIS_URL or "cache+memory://"
CELERY_ACCEPT_CONTENT    = ["application/json"]
CELERY_TASK_SERIALIZER   = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE          = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = not bool(REDIS_URL)  # Run tasks sync if no Redis


# ══════════════════════════════════════════════════════════════════════════════
# PRODUCTION SECURITY SETTINGS
# Only applied when DEBUG=False (production)
# ══════════════════════════════════════════════════════════════════════════════

if not DEBUG:
    # Force HTTPS
    SECURE_SSL_REDIRECT              = True
    SECURE_PROXY_SSL_HEADER          = ("HTTP_X_FORWARDED_PROTO", "https")

    # HSTS — tell browsers to always use HTTPS
    SECURE_HSTS_SECONDS              = 31_536_000   # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS   = True
    SECURE_HSTS_PRELOAD              = True

    # Cookie security
    SESSION_COOKIE_SECURE            = True
    CSRF_COOKIE_SECURE               = True
    SESSION_COOKIE_HTTPONLY          = True
    CSRF_COOKIE_HTTPONLY             = True

    # Prevent clickjacking
    X_FRAME_OPTIONS                  = "DENY"

    # Content type sniffing protection
    SECURE_CONTENT_TYPE_NOSNIFF      = True

    # XSS filter for older browsers
    SECURE_BROWSER_XSS_FILTER        = True

    # Referrer policy
    SECURE_REFERRER_POLICY           = "strict-origin-when-cross-origin"


# ══════════════════════════════════════════════════════════════════════════════
# LOGGING
# Local dev  → simple console output
# Production → structured logs (Render captures stdout)
# ══════════════════════════════════════════════════════════════════════════════

LOGGING = {
    "version":                  1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style":  "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style":  "{",
        },
    },
    "handlers": {
        "console": {
            "class":     "logging.StreamHandler",
            "formatter": "verbose" if not DEBUG else "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level":    "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level":    "INFO" if not DEBUG else "DEBUG",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level":    "WARNING",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console"],
            # Set to DEBUG locally to see all SQL queries
            "level":    "WARNING",
            "propagate": False,
        },
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN CUSTOMIZATION
# ══════════════════════════════════════════════════════════════════════════════

ADMIN_SITE_HEADER  = "Marketplace Admin"
ADMIN_SITE_TITLE   = "Marketplace"
ADMIN_INDEX_TITLE  = "Platform Management"


# ══════════════════════════════════════════════════════════════════════════════
# DEV SUMMARY (printed when DEBUG=True)
# ══════════════════════════════════════════════════════════════════════════════

if DEBUG:
    _db_engine = DATABASES["default"]["ENGINE"]
    _db_name   = DATABASES["default"].get(
        "NAME", DATABASES["default"].get("default", "—")
    )
    _cache     = "Redis" if REDIS_URL else "In-Memory"
    _storage   = "Cloudinary" if CLOUDINARY_CLOUD_NAME else "Local FileSystem"
    _email     = "SMTP" if EMAIL_HOST_USER else "Console (printed to terminal)"

    print(
        f"\n"
        f"  ┌─────────────────────────────────────────┐\n"
        f"  │       Marketplace — Dev Config          │\n"
        f"  ├─────────────────────────────────────────┤\n"
        f"  │  Database : {_db_engine.split('.')[-1]:<29}│\n"
        f"  │  Cache    : {_cache:<29}│\n"
        f"  │  Storage  : {_storage:<29}│\n"
        f"  │  Email    : {_email:<29}│\n"
        f"  │  Frontend : {FRONTEND_URL:<29}│\n"
        f"  └─────────────────────────────────────────┘\n"
    )
