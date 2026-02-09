"""
Test script for file upload functionality
Run this script to test the /upload endpoint with different file types
"""

import requests
import os
import tempfile

API_BASE_URL = "http://localhost:8000"

def create_test_files():
    """Create temporary test files for upload testing"""
    test_files = {}
    
    # Create a simple text file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write("This is a test PRD document.\n\nIt contains multiple lines of text.\n\nFeature: User Authentication\nDescription: Implement secure login...")
        test_files['txt'] = f.name
    
    # Create a markdown file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as f:
        f.write("# Product Requirements Document\n\n## Overview\n\nThis is a test PRD in markdown format.\n\n## Features\n\n- Feature 1\n- Feature 2")
        test_files['md'] = f.name
    
    return test_files

def test_upload(file_path, test_name):
    """Test uploading a file to the /upload endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {test_name}")
    print(f"File: {file_path}")
    print(f"{'='*60}")
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (os.path.basename(file_path), f)}
            response = requests.post(f"{API_BASE_URL}/upload", files=files)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS")
            print(f"Filename: {data.get('filename')}")
            print(f"Text Length: {data.get('length')} characters")
            print(f"Extracted Text Preview (first 200 chars):")
            print(f"{data.get('text', '')[:200]}...")
        else:
            print(f"❌ FAILED")
            print(f"Error: {response.json().get('detail', 'Unknown error')}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ CONNECTION ERROR")
        print("Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

def test_invalid_file_type():
    """Test uploading an invalid file type"""
    print(f"\n{'='*60}")
    print(f"Testing: Invalid File Type (.exe)")
    print(f"{'='*60}")
    
    try:
        # Create a fake .exe file
        with tempfile.NamedTemporaryFile(suffix='.exe', delete=False) as f:
            f.write(b"fake executable")
            fake_exe_path = f.name
        
        with open(fake_exe_path, 'rb') as f:
            files = {'file': (os.path.basename(fake_exe_path), f)}
            response = requests.post(f"{API_BASE_URL}/upload", files=files)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print(f"✅ VALIDATION WORKING - Correctly rejected invalid file type")
            print(f"Error Message: {response.json().get('detail')}")
        else:
            print(f"⚠️ UNEXPECTED - Should have rejected .exe file")
            
        os.unlink(fake_exe_path)
            
    except requests.exceptions.ConnectionError:
        print(f"❌ CONNECTION ERROR")
        print("Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

def test_large_file():
    """Test uploading a file larger than 10MB"""
    print(f"\n{'='*60}")
    print(f"Testing: Large File (>10MB)")
    print(f"{'='*60}")
    
    try:
        # Create a file larger than 10MB
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            # Write 11MB of data
            f.write("x" * (11 * 1024 * 1024))
            large_file_path = f.name
        
        print(f"Created {os.path.getsize(large_file_path) / (1024*1024):.2f}MB file")
        
        with open(large_file_path, 'rb') as f:
            files = {'file': (os.path.basename(large_file_path), f)}
            response = requests.post(f"{API_BASE_URL}/upload", files=files)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print(f"✅ VALIDATION WORKING - Correctly rejected file >10MB")
            print(f"Error Message: {response.json().get('detail')}")
        else:
            print(f"⚠️ UNEXPECTED - Should have rejected large file")
            
        os.unlink(large_file_path)
            
    except requests.exceptions.ConnectionError:
        print(f"❌ CONNECTION ERROR")
        print("Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

def main():
    print("="*60)
    print("FILE UPLOAD ENDPOINT TEST SUITE")
    print("="*60)
    print("\nThis script tests the POST /upload endpoint")
    print("Ensure the backend server is running before proceeding\n")
    
    # Create test files
    print("Creating test files...")
    test_files = create_test_files()
    
    try:
        # Test valid uploads
        test_upload(test_files['txt'], "Text File Upload (.txt)")
        test_upload(test_files['md'], "Markdown File Upload (.md)")
        
        # Test validation
        test_invalid_file_type()
        test_large_file()
        
        print(f"\n{'='*60}")
        print("TEST SUITE COMPLETE")
        print(f"{'='*60}\n")
        
    finally:
        # Cleanup test files
        print("Cleaning up test files...")
        for file_path in test_files.values():
            if os.path.exists(file_path):
                os.unlink(file_path)
        print("Cleanup complete")

if __name__ == "__main__":
    main()
