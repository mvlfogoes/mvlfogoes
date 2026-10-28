import os
import requests

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "mvl-fogoes"
_key = None


def init_storage(force: bool = False):
    global _key
    if _key and not force:
        return _key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ["EMERGENT_LLM_KEY"]}, timeout=30)
    resp.raise_for_status()
    _key = resp.json()["storage_key"]
    return _key


def _req(method, path, headers=None, **kw):
    resp = requests.request(method, f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(), **(headers or {})}, **kw)
    resp.raise_for_status()
    return resp


def put_object(path: str, data: bytes, content_type: str) -> dict:
    return _req("PUT", path, headers={"Content-Type": content_type}, data=data, timeout=120).json()


def get_object(path: str):
    resp = _req("GET", path, timeout=60)
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
