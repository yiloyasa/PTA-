"""Shared test bootstrap: put project root and vendored libs on sys.path."""
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(PROJECT_ROOT, "libs"), PROJECT_ROOT]
