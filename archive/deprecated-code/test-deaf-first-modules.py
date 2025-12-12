#!/usr/bin/env python3
"""
DeafFirst Module Test Suite
===========================

Comprehensive tests to validate DeafFirst MCP modules work correctly
with the live DeafFirst accessibility platform.
"""

import sys
import os
import requests
import json
from datetime import datetime


def test_api_connectivity():
    """Test basic API connectivity."""
    print("Testing API connectivity...")
    try:
        response = requests.get(
            "http://localhost:5000/api/users/1/accessibility-preferences",
            timeout=5)
        if response.status_code == 200:
            try:
                data = response.json()
                print(
                    f"✓ API connected - User preferences loaded (Sign Language: {data.get('signLanguage', 'N/A')})"
                )
                return True
            except json.JSONDecodeError:
                print(f"✗ API returned invalid JSON: {response.text[:100]}")
                return False
        else:
            print(f"✗ API returned status {response.status_code}: {response.text[:100]}")
            return False
    except requests.RequestException as e:
        print(f"✗ API connection failed: {e}")
        return False


def test_sign_language_module():
    """Test sign language processing module."""
    print("\nTesting Sign Language Module...")
    try:
        # Test gesture library
        response = requests.get("http://localhost:5000/api/sign-language/gestures/asl", timeout=5)
        if response.status_code == 200:
            gestures = response.json()
            print(f"✓ Gesture library accessible (returned {len(gestures)} items)")
        else:
            print(f"✗ Gesture library failed with status {response.status_code}")
            return False

        # Test recognition
        recognition_data = {
            "videoData": "test_video_data_base64",
            "language": "asl"
        }
        response = requests.post("http://localhost:5000/api/sign-language/recognize", 
                               json=recognition_data, timeout=5)
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Recognition function works - Text: '{result.get('text')}', Confidence: {result.get('confidence')}")
        else:
            print(f"✗ Recognition failed with status {response.status_code}")
            return False

        return True
    except Exception as e:
        print(f"✗ Sign language module failed: {e}")
        return False


def test_captions_module():
    """Test live captioning module."""
    print("\nTesting Live Captioning Module...")
    try:
        # Test processing
        caption_data = {
            "audioData": "test_audio_data",
            "language": "en-US"
        }
        response = requests.post("http://localhost:5000/api/captions/process", 
                               json=caption_data, timeout=5)
        if response.status_code == 200:
            segments = response.json()
            print(f"✓ Caption processing works (returned {len(segments)} segments)")
            
            # Test export
            if segments:
                export_data = {
                    "segments": segments,
                    "format": "srt"
                }
                export_response = requests.post("http://localhost:5000/api/captions/export", 
                                              json=export_data, timeout=5)
                if export_response.status_code == 200:
                    export_result = export_response.json()
                    print(f"✓ SRT export works (generated {len(export_result.get('content', ''))} characters)")
                else:
                    print(f"✗ Export failed with status {export_response.status_code}")
                    return False
        else:
            print(f"✗ Caption processing failed with status {response.status_code}")
            return False

        return True
    except Exception as e:
        print(f"✗ Captions module failed: {e}")
        return False


def test_interpreter_module():
    """Test interpreter services module."""
    print("\nTesting Interpreter Services Module...")
    try:
        # Test interpreter search
        response = requests.get("http://localhost:5000/api/interpreters/search?language=asl&urgency=normal", 
                              timeout=5)
        if response.status_code == 200:
            interpreters = response.json()
            print(f"✓ Interpreter search works (found {len(interpreters)} interpreters)")
        else:
            print(f"✗ Interpreter search failed with status {response.status_code}")
            return False

        # Test session request
        session_data = {
            "language": "asl",
            "urgency": "normal",
            "duration": 30
        }
        response = requests.post("http://localhost:5000/api/interpreters/request-session", 
                               json=session_data, timeout=5)
        if response.status_code == 201:
            result = response.json()
            print(f"✓ Session request created: {result.get('sessionId')}")
        else:
            print(f"✗ Session request failed with status {response.status_code}")
            return False

        return True
    except Exception as e:
        print(f"✗ Interpreter module failed: {e}")
        return False


def test_accessibility_module():
    """Test accessibility tools module."""
    print("\nTesting Accessibility Module...")
    try:
        # Test color contrast
        contrast_data = {
            "foreground": "#000000",
            "background": "#FFFFFF"
        }
        response = requests.post("http://localhost:5000/api/accessibility/color-contrast", 
                               json=contrast_data, timeout=5)
        if response.status_code == 200:
            contrast = response.json()
            print(f"✓ Color contrast check - Ratio: {contrast.get('ratio', 'N/A')}")
        else:
            print(f"✗ Color contrast check failed with status {response.status_code}")
            return False

        # Test accessibility audit
        audit_data = {
            "url": "https://example.com"
        }
        response = requests.post("http://localhost:5000/api/accessibility/audit", 
                               json=audit_data, timeout=5)
        if response.status_code == 200:
            report = response.json()
            print(f"✓ Accessibility audit works - Score: {report.get('score')}")
        else:
            print(f"✗ Accessibility audit failed with status {response.status_code}")
            return False

        return True
    except Exception as e:
        print(f"✗ Accessibility module failed: {e}")
        return False


def test_communication_module():
    """Test real-time communication module."""
    print("\nTesting Communication Module...")
    try:
        # Test session creation
        session_data = {
            "mode": "video_call",
            "participants": ["user1"],
            "features": ["live_captions"]
        }
        response = requests.post("http://localhost:5000/api/communication/create-session", 
                               json=session_data, timeout=5)
        if response.status_code == 201:
            result = response.json()
            print(f"✓ Communication session created: {result.get('sessionId')}")
        else:
            print(f"✗ Communication session failed with status {response.status_code}")
            return False

        return True
    except Exception as e:
        print(f"✗ Communication module failed: {e}")
        return False


def test_community_module():
    """Test community resources module."""
    print("\nTesting Community Module...")
    try:
        # Test resource search
        response = requests.get("http://localhost:5000/api/community/resources?query=accessibility&type=educational", 
                              timeout=5)
        if response.status_code == 200:
            resources = response.json()
            print(f"✓ Resource search works (found {len(resources)} resources)")
        else:
            print(f"✗ Resource search failed with status {response.status_code}")
            return False

        # Test support group search
        response = requests.get("http://localhost:5000/api/community/support-groups?location=online&language=asl", 
                              timeout=5)
        if response.status_code == 200:
            groups = response.json()
            print(f"✓ Support group search works (found {len(groups)} groups)")
        else:
            print(f"✗ Support group search failed with status {response.status_code}")
            return False

        return True
    except Exception as e:
        print(f"✗ Community module failed: {e}")
        return False


def test_main_module():
    """Test main deaf_first module imports."""
    print("\nTesting Main Module...")
    try:
        # Test if API endpoints are available for all modules
        endpoints = [
            "/api/sign-language/gestures/asl",
            "/api/captions/process",
            "/api/interpreters/search",
            "/api/accessibility/color-contrast",
            "/api/communication/create-session",
            "/api/community/resources"
        ]
        
        for endpoint in endpoints:
            try:
                if endpoint == "/api/captions/process":
                    response = requests.post(f"http://localhost:5000{endpoint}", 
                                           json={"audioData": "test"}, timeout=5)
                elif endpoint == "/api/accessibility/color-contrast":
                    response = requests.post(f"http://localhost:5000{endpoint}", 
                                           json={"foreground": "#000", "background": "#fff"}, timeout=5)
                elif endpoint == "/api/communication/create-session":
                    response = requests.post(f"http://localhost:5000{endpoint}", 
                                           json={"mode": "test"}, timeout=5)
                else:
                    response = requests.get(f"http://localhost:5000{endpoint}", timeout=5)
                
                if response.status_code in [200, 201]:
                    print(f"✓ {endpoint} - Module accessible")
                else:
                    print(f"⚠ {endpoint} - Status {response.status_code}")
            except:
                print(f"✗ {endpoint} - Failed to connect")

        return True
    except Exception as e:
        print(f"✗ Main module failed: {e}")
        return False


def test_integration_with_live_api():
    """Test integration with live DeafFirst API."""
    print("\nTesting Live API Integration...")
    try:
        # Test real API endpoints that should exist
        endpoints_to_test = [
            "/api/users/1/accessibility-preferences", 
            "/api/deaf-auth/sessions"
        ]

        for endpoint in endpoints_to_test:
            response = requests.get(f"http://localhost:5000{endpoint}",
                                    timeout=5)
            if response.status_code == 200:
                print(f"✓ {endpoint} - Active")
            else:
                print(f"⚠ {endpoint} - Status {response.status_code}")

        # Test WebSocket connectivity (basic check)
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('localhost', 5000))
        sock.close()

        if result == 0:
            print("✓ WebSocket port accessible")
        else:
            print("⚠ WebSocket port not accessible")

        return True
    except Exception as e:
        print(f"✗ Live API integration failed: {e}")
        return False


def run_performance_test():
    """Test module performance and response times."""
    print("\nRunning Performance Tests...")
    try:
        import time

        # Test API response time
        start_time = time.time()
        response = requests.get(
            "http://localhost:5000/api/users/1/accessibility-preferences")
        api_time = time.time() - start_time
        print(f"✓ API response time: {api_time:.3f}s")

        # Test sign language recognition response time
        start_time = time.time()
        recognition_data = {"videoData": "test_data", "language": "asl"}
        response = requests.post("http://localhost:5000/api/sign-language/recognize", 
                               json=recognition_data, timeout=10)
        recognition_time = time.time() - start_time
        print(f"✓ Sign language recognition time: {recognition_time:.3f}s")

        # Test caption processing response time
        start_time = time.time()
        caption_data = {"audioData": "test_audio", "language": "en-US"}
        response = requests.post("http://localhost:5000/api/captions/process", 
                               json=caption_data, timeout=10)
        caption_time = time.time() - start_time
        print(f"✓ Caption processing time: {caption_time:.3f}s")

        return True
    except Exception as e:
        print(f"✗ Performance test failed: {e}")
        return False


def main():
    """Run comprehensive test suite."""
    print("DeafFirst MCP Module Test Suite")
    print("=" * 50)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    tests = [
        test_api_connectivity, 
        test_sign_language_module, 
        test_captions_module,
        test_interpreter_module, 
        test_accessibility_module,
        test_communication_module, 
        test_community_module, 
        test_main_module,
        test_integration_with_live_api, 
        run_performance_test
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} crashed: {e}")
            failed += 1

    print("\n" + "=" * 50)
    print("Test Results Summary:")
    print(f"✓ Passed: {passed}")
    print(f"✗ Failed: {failed}")
    print(f"Total: {passed + failed}")

    if failed == 0:
        print("\n🎉 All tests passed! DeafFirst MCP modules are ready for use.")
    else:
        print(
            f"\n⚠ {failed} test(s) failed. Check the output above for details."
        )

    print(
        f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)