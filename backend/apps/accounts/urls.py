from django.urls import path

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    TokenRefreshView,
    ProfileView,
    MeView,
    TokenValidationView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("me/", MeView.as_view(), name="me"),  # Legacy endpoint
    path("validate-token/", TokenValidationView.as_view(), name="validate_token"),
]
