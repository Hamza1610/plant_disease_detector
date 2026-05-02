import sys
import os

# Add the current directory to sys.path to allow importing the omnivax package
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from omnivax.main import app

if __name__ == "__main__":
    app()
