"""
Django settings for TaskFlow backend (migrated from NestJS).
"""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key-change-me')
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'corsheaders',

    'users',
    'auth_app',
    'projects',
    'tasks',
    'comments',
    'activity',
    'dashboard',
    'common',
    'realtime',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # NOTE: CSRF middleware intentionally NOT used for the API -- auth uses
    # JWT bearer tokens + an httpOnly refresh cookie verified manually,
    # mirroring the original NestJS app (which never used csrf middleware).
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

AUTH_USER_MODEL = 'users.User'

# Database -- mirrors the TypeORM Postgres config in app.module.ts
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'USER': os.environ.get('DB_USERNAME', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'NAME': os.environ.get('DB_NAME', ''),
    }
}

# Password hashing -- bcrypt, matching bcrypt.hash(password, 12) in Nest
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

AUTH_PASSWORD_VALIDATORS = []  # validation handled explicitly in serializers, like the Nest DTOs

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── DRF ──────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'common.authentication.JWTAccessTokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'EXCEPTION_HANDLER': 'common.exceptions.nest_style_exception_handler',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# ── JWT settings -- mirrors JWT_ACCESS_SECRET / JWT_REFRESH_SECRET in Nest ──
JWT_ACCESS_SECRET = os.environ.get('JWT_ACCESS_SECRET', 'access-secret-change-me')
JWT_REFRESH_SECRET = os.environ.get('JWT_REFRESH_SECRET', 'refresh-secret-change-me')
JWT_ACCESS_EXPIRES = os.environ.get('JWT_ACCESS_EXPIRES', '15m')   # e.g. '15m'
JWT_REFRESH_EXPIRES = os.environ.get('JWT_REFRESH_EXPIRES', '7d')  # e.g. '7d'
JWT_ALGORITHM = 'HS256'

# ── CORS -- mirrors app.enableCors({ origin: FRONTEND_URL, credentials: true }) ──
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
CORS_ALLOWED_ORIGINS = [FRONTEND_URL]
CORS_ALLOW_CREDENTIALS = True

# ── Refresh cookie config -- mirrors setRefreshCookie() in AuthController ──
REFRESH_COOKIE_NAME = 'refresh_token'
REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days, in seconds
# REFRESH_COOKIE_SECURE = not DEBUG
# REFRESH_COOKIE_SAMESITE = 'Strict'
REFRESH_COOKIE_SECURE   = os.environ.get('REFRESH_COOKIE_SECURE', 'False') == 'True'
REFRESH_COOKIE_SAMESITE = os.environ.get('REFRESH_COOKIE_SAMESITE', 'Strict')

