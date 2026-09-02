"""
Supabase Storage Service for Image Uploads
"""
import os
import uuid
from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image
import io
from supabase import create_client, Client

class SupabaseStorageService:
    """Service for handling Supabase storage operations"""
    
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_SERVICE_KEY
        self.bucket_name = 'product-images'
        
        # Initialize Supabase client
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        
        # Storage URL for public access
        self.storage_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}"
    
    def upload_image(self, image_file, filename=None):
        """
        Upload an image to Supabase storage
        
        Args:
            image_file: Django uploaded file or InMemoryUploadedFile
            filename: Optional custom filename
            
        Returns:
            tuple: (success: bool, url: str, error: str)
        """
        try:
            # Generate unique filename if not provided
            if not filename:
                original_filename = getattr(image_file, 'name', 'image')
                file_extension = original_filename.split('.')[-1] if '.' in original_filename else 'jpg'
                unique_id = uuid.uuid4().hex[:12]
                filename = f"{unique_id}.{file_extension}"
            
            # Process and optimize image
            processed_image = self._process_image(image_file)
            
            # Upload to Supabase
            storage_path = f"{self.bucket_name}/{filename}"
            
            # Convert PIL Image to bytes
            img_byte_arr = io.BytesIO()
            processed_image.save(img_byte_arr, format='JPEG', quality=85)
            img_byte_arr.seek(0)
            
            # Upload file
            result = self.client.storage.from_(self.bucket_name).upload(
                filename,
                img_byte_arr.getvalue(),
                {'content-type': 'image/jpeg'}
            )
            
            # Get public URL
            public_url = f"{self.storage_url}/{filename}"
            
            print(f"✅ Image uploaded successfully: {public_url}")
            return True, public_url, None
            
        except Exception as e:
            error_msg = f"Failed to upload image to Supabase: {str(e)}"
            print(f"❌ {error_msg}")
            return False, None, error_msg
    
    def _process_image(self, image_file):
        """
        Process and optimize image before upload
        
        Args:
            image_file: Django uploaded file
            
        Returns:
            PIL.Image: Processed image
        """
        try:
            # Open image with PIL
            if isinstance(image_file, InMemoryUploadedFile):
                image = Image.open(image_file)
            else:
                # Handle other file types
                image = Image.open(io.BytesIO(image_file.read()))
                image_file.seek(0)  # Reset file pointer
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize if too large (max 1200x1200)
            max_size = (1200, 1200)
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            return image
            
        except Exception as e:
            print(f"⚠️ Image processing failed, using original: {e}")
            # Return original image if processing fails
            return Image.open(image_file) if hasattr(image_file, 'read') else image_file
    
    def delete_image(self, filename):
        """
        Delete an image from Supabase storage
        
        Args:
            filename: Filename to delete
            
        Returns:
            tuple: (success: bool, error: str)
        """
        try:
            storage_path = f"{self.bucket_name}/{filename}"
            self.client.storage.from_(self.bucket_name).remove([storage_path])
            print(f"✅ Image deleted successfully: {filename}")
            return True, None
            
        except Exception as e:
            error_msg = f"Failed to delete image from Supabase: {str(e)}"
            print(f"❌ {error_msg}")
            return False, error_msg
    
    def get_public_url(self, filename):
        """
        Get public URL for a stored image
        
        Args:
            filename: Filename in storage
            
        Returns:
            str: Public URL
        """
        return f"{self.storage_url}/{filename}"
    
    def create_bucket_if_not_exists(self):
        """
        Create the products bucket if it doesn't exist
        """
        try:
            # Check if bucket exists
            buckets = self.client.storage.list_buckets()
            bucket_exists = any(bucket['name'] == self.bucket_name for bucket in buckets)
            
            if not bucket_exists:
                # Create bucket with public access
                self.client.storage.create_bucket(
                    self.bucket_name,
                    options={'public': True}
                )
                print(f"✅ Created bucket: {self.bucket_name}")
            else:
                print(f"✅ Bucket already exists: {self.bucket_name}")
                
        except Exception as e:
            print(f"⚠️ Bucket creation failed: {e}")
            # Don't fail the operation if bucket creation fails
            # The bucket might already exist or have different permissions

# Global instance
supabase_storage = SupabaseStorageService()
