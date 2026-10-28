# Iteration 8: client delete cascades soft-delete to fotos/documentos; image/jpg accepted
import os
import requests
from test_fotos_documentos import PNG

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


def _cli():
    r = requests.post(f"{BASE_URL}/api/clientes", json={"nome": "TEST_Cascade", "tel": "32999991111"})
    assert r.status_code == 200
    return r.json()


def test_image_jpg_accepted():
    c = _cli()
    try:
        r = requests.post(f"{BASE_URL}/api/clientes/{c['id']}/fotos", files={"file": ("a.jpg", PNG, "image/jpg")})
        assert r.status_code == 200, r.text
        assert r.json()["content_type"] == "image/jpg"
        img = requests.get(f"{BASE_URL}/api/fotos/{r.json()['id']}/img")
        assert img.status_code == 200 and img.content == PNG
    finally:
        requests.delete(f"{BASE_URL}/api/clientes/{c['id']}")


def test_delete_cliente_cascades_fotos_docs():
    c = _cli()
    f = requests.post(f"{BASE_URL}/api/clientes/{c['id']}/fotos", files={"file": ("a.png", PNG, "image/png")}).json()
    d = requests.post(f"{BASE_URL}/api/documentos", files={"file": ("a.png", PNG, "image/png")},
                      data={"tipo": "orcamento", "cliId": c["id"], "nomeCli": "TEST_Cascade", "resumo": "x"}).json()
    assert len(requests.get(f"{BASE_URL}/api/clientes/{c['id']}/fotos").json()) == 1
    assert len(requests.get(f"{BASE_URL}/api/documentos", params={"cliId": c["id"]}).json()) == 1
    r = requests.delete(f"{BASE_URL}/api/clientes/{c['id']}")
    assert r.status_code == 200
    assert requests.get(f"{BASE_URL}/api/clientes/{c['id']}/fotos").json() == []
    assert requests.get(f"{BASE_URL}/api/documentos", params={"cliId": c["id"]}).json() == []
    assert requests.get(f"{BASE_URL}/api/fotos/{f['id']}/img").status_code == 404
    assert requests.get(f"{BASE_URL}/api/documentos/{d['id']}/img").status_code == 404
    assert not any(x["id"] == d["id"] for x in requests.get(f"{BASE_URL}/api/documentos").json())
