import sys
from pathlib import Path


def run():
    try:
        import uvicorn
        from app.main import app
    except ModuleNotFoundError as error:
        requirements = Path(__file__).resolve().parent / "requirements.txt"
        print(f"Missing Python dependency: {error.name}", file=sys.stderr)
        print("Install dependencies with this interpreter (PowerShell):", file=sys.stderr)
        print(f'& "{sys.executable}" -m pip install -r "{requirements}"', file=sys.stderr)
        raise SystemExit(1) from None

    from app.config import FRONTEND_DIRECTORY, TRUSTED_PROXY_IPS

    if not (FRONTEND_DIRECTORY / "index.html").is_file():
        print(
            "Frontend build missing. Run npm run build in the frontend folder.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    print("Open http://127.0.0.1:8000 in your browser. Press Ctrl+C to stop.", flush=True)
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        proxy_headers=True,
        forwarded_allow_ips=TRUSTED_PROXY_IPS,
    )


if __name__ == "__main__":
    run()
