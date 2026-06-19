"""
inner-compass — FastAPI backend
Serves static frontend files and provides a health check endpoint.
All paths use the /projects/inner-compass/ base path prefix.
"""

from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware

BASE_PATH = "/projects/inner-compass"
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(title="inner-compass", version="0.0.1")


class CacheControlMiddleware(BaseHTTPMiddleware):
    """Inject Cache-Control: no-cache for HTML documents."""

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        content_type = response.headers.get("content-type", "")
        if "text/html" in content_type:
            response.headers["Cache-Control"] = "no-cache"
        return response


app.add_middleware(CacheControlMiddleware)


@app.get(f"{BASE_PATH}/healthz")
async def healthz():
    """Health check endpoint for deployment monitoring."""
    return {"status": "healthy", "project": "inner-compass", "version": "0.0.1"}


@app.get(f"{BASE_PATH}/")
async def index():
    """Serve the main HTML page with no-cache header."""
    response = FileResponse(
        STATIC_DIR / "index.html",
        media_type="text/html",
    )
    response.headers["Cache-Control"] = "no-cache"
    return response


# Mount static files under the base path
app.mount(
    f"{BASE_PATH}",
    StaticFiles(directory=str(STATIC_DIR), html=False),
    name="static",
)
