from django.urls import path

from .views import JobSiteListCreateView

urlpatterns = [
    path("job-sites/", JobSiteListCreateView.as_view(), name="job-sites"),
]
