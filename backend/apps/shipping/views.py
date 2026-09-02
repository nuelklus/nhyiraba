from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import JobSiteSerializer
from .services import create_job_site

class JobSiteListCreateView(APIView):
    def get(self, request):
        return Response({"detail": "Not implemented"}, status=501)

    def post(self, request):
        serializer = JobSiteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job_site = create_job_site(created_by=request.user, **serializer.validated_data)
        return Response(JobSiteSerializer(job_site).data, status=201)
