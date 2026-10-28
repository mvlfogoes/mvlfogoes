# Fotos do fogão + Documentos (flyers guardados) API tests
import io, json, os, struct, zlib
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


def png_bytes():
    raw = b"\x00\xff\x00\x00"
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")


PNG = png_bytes()


@pytest.fixture(scope="module")
def cli():
    r = requests.post(f"{BASE_URL}/api/clientes", json={"nome": "TEST_Fotos Cli", "tel": "32999990000"})
    assert r.status_code == 200, r.text
    c = r.json()
    yield c
    requests.delete(f"{BASE_URL}/api/clientes/{c['id']}")


# Fotos
class TestFotos:
    def test_reject_non_image(self, cli):
        r = requests.post(f"{BASE_URL}/api/clientes/{cli['id']}/fotos", files={"file": ("a.txt", b"hello", "text/plain")})
        assert r.status_code == 400

    def test_foto_lifecycle(self, cli):
        r = requests.post(f"{BASE_URL}/api/clientes/{cli['id']}/fotos", files={"file": ("a.png", PNG, "image/png")})
        assert r.status_code == 200, r.text
        f = r.json()
        assert f["cliId"] == cli["id"] and "path" not in f and isinstance(f["id"], str)
        lst = requests.get(f"{BASE_URL}/api/clientes/{cli['id']}/fotos").json()
        assert any(x["id"] == f["id"] for x in lst)
        assert all("path" not in x and "_id" not in x for x in lst)
        img = requests.get(f"{BASE_URL}/api/fotos/{f['id']}/img")
        assert img.status_code == 200 and img.content == PNG
        assert img.headers["content-type"].startswith("image/png")
        d = requests.delete(f"{BASE_URL}/api/fotos/{f['id']}")
        assert d.status_code == 200
        lst = requests.get(f"{BASE_URL}/api/clientes/{cli['id']}/fotos").json()
        assert not any(x["id"] == f["id"] for x in lst)
        assert requests.get(f"{BASE_URL}/api/fotos/{f['id']}/img").status_code == 404

    def test_img_unknown_404(self):
        assert requests.get(f"{BASE_URL}/api/fotos/nao-existe/img").status_code == 404


# Documentos
class TestDocumentos:
    def test_invalid_tipo(self, cli):
        r = requests.post(f"{BASE_URL}/api/documentos", files={"file": ("a.png", PNG, "image/png")}, data={"tipo": "xyz", "cliId": cli["id"]})
        assert r.status_code == 400

    def test_invalid_dados(self, cli):
        r = requests.post(f"{BASE_URL}/api/documentos", files={"file": ("a.png", PNG, "image/png")}, data={"tipo": "recibo", "cliId": cli["id"], "dados": "{bad"})
        assert r.status_code == 400

    def test_non_image(self, cli):
        r = requests.post(f"{BASE_URL}/api/documentos", files={"file": ("a.txt", b"x", "text/plain")}, data={"tipo": "recibo", "cliId": cli["id"]})
        assert r.status_code == 400

    @pytest.mark.parametrize("tipo", ["agenda", "orcamento", "recibo"])
    def test_doc_lifecycle(self, cli, tipo):
        dados = {"valor": "150", "x": [1, 2]}
        r = requests.post(f"{BASE_URL}/api/documentos", files={"file": ("a.png", PNG, "image/png")},
                          data={"tipo": tipo, "cliId": cli["id"], "nomeCli": cli["nome"], "resumo": f"TEST_{tipo}", "dados": json.dumps(dados)})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["tipo"] == tipo and d["dados"] == dados and d["resumo"] == f"TEST_{tipo}" and "path" not in d
        lst = requests.get(f"{BASE_URL}/api/documentos", params={"cliId": cli["id"]}).json()
        assert any(x["id"] == d["id"] for x in lst) and all(x["cliId"] == cli["id"] for x in lst)
        img = requests.get(f"{BASE_URL}/api/documentos/{d['id']}/img")
        assert img.status_code == 200 and img.content == PNG
        assert requests.delete(f"{BASE_URL}/api/documentos/{d['id']}").status_code == 200
        lst = requests.get(f"{BASE_URL}/api/documentos", params={"cliId": cli["id"]}).json()
        assert not any(x["id"] == d["id"] for x in lst)
        assert requests.get(f"{BASE_URL}/api/documentos/{d['id']}/img").status_code == 404
