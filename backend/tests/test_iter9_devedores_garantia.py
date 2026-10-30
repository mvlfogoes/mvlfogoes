# Iteration 9: devedores CRUD, OS dataConclusao/garantia, video fotos upload, config templates
import os
import io
from datetime import datetime, timezone, timedelta
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
HOJE_BR = datetime.now(timezone(timedelta(hours=-3))).strftime("%Y-%m-%d")


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def cliente(s):
    r = s.post(f"{API}/clientes", json={"nome": "TEST_Iter9 Cli", "tel": "32999990000"})
    assert r.status_code == 200
    c = r.json()
    yield c
    s.delete(f"{API}/clientes/{c['id']}")


# ---- Devedores ----
class TestDevedores:
    def test_crud_and_pago(self, s):
        r = s.post(f"{API}/devedores", json={"nome": "TEST_Dev", "valor": 150.5, "vencimento": "2026-02-10", "tel": "32988887777", "obs": "fogão"})
        assert r.status_code == 200
        d = r.json()
        assert d["nome"] == "TEST_Dev" and d["valor"] == 150.5 and d["pago"] is False and d["pagoEm"] == ""
        did = d["id"]
        lst = s.get(f"{API}/devedores").json()
        assert any(x["id"] == did for x in lst)
        assert all("_id" not in x for x in lst)
        # mark pago
        r = s.put(f"{API}/devedores/{did}", json={**d, "pago": True})
        assert r.status_code == 200 and r.json()["pago"] is True and r.json()["pagoEm"] == HOJE_BR
        got = next(x for x in s.get(f"{API}/devedores").json() if x["id"] == did)
        assert got["pago"] is True and got["pagoEm"] == HOJE_BR
        # undo
        r = s.put(f"{API}/devedores/{did}", json={**d, "pago": False, "valor": 99})
        assert r.json()["pago"] is False and r.json()["pagoEm"] == "" and r.json()["valor"] == 99
        # delete
        assert s.delete(f"{API}/devedores/{did}").status_code == 200
        assert not any(x["id"] == did for x in s.get(f"{API}/devedores").json())

    def test_create_pago_sets_pagoEm(self, s):
        r = s.post(f"{API}/devedores", json={"nome": "TEST_DevPago", "valor": 10, "pago": True})
        assert r.status_code == 200 and r.json()["pagoEm"] == HOJE_BR
        s.delete(f"{API}/devedores/{r.json()['id']}")

    @pytest.mark.parametrize("payload", [{"nome": "", "valor": 10}, {"nome": "   ", "valor": 10}, {"valor": 10}, {"nome": "TEST_x", "valor": -1}])
    def test_validation(self, s, payload):
        assert s.post(f"{API}/devedores", json=payload).status_code == 422

    def test_update_404(self, s):
        assert s.put(f"{API}/devedores/nope", json={"nome": "x"}).status_code == 404


# ---- Ordens garantia / dataConclusao ----
class TestOrdensGarantia:
    def test_default_and_conclusao(self, s, cliente):
        r = s.post(f"{API}/ordens", json={"cliId": cliente["id"], "nomeCli": cliente["nome"], "servico": "TEST_os"})
        o = r.json()
        assert o["garantia"] == 30 and o["dataConclusao"] == "" and o["status"] == "pendente"
        r = s.put(f"{API}/ordens/{o['id']}", json={**o, "status": "concluida"})
        assert r.json()["dataConclusao"] == HOJE_BR
        got = next(x for x in s.get(f"{API}/ordens").json() if x["id"] == o["id"])
        assert got["dataConclusao"] == HOJE_BR
        r = s.put(f"{API}/ordens/{o['id']}", json={**o, "status": "pendente"})
        assert r.json()["dataConclusao"] == ""
        s.delete(f"{API}/ordens/{o['id']}")

    def test_create_concluida(self, s, cliente):
        o = s.post(f"{API}/ordens", json={"cliId": cliente["id"], "servico": "TEST_os2", "status": "concluida"}).json()
        assert o["dataConclusao"] == HOJE_BR
        s.delete(f"{API}/ordens/{o['id']}")


# ---- Fotos video ----
class TestFotosVideo:
    def test_video_upload(self, s, cliente):
        data = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 200
        r = s.post(f"{API}/clientes/{cliente['id']}/fotos", files={"file": ("v.mp4", io.BytesIO(data), "video/mp4")})
        assert r.status_code == 200, r.text
        f = r.json()
        assert f["content_type"] == "video/mp4" and "path" not in f
        img = s.get(f"{API}/fotos/{f['id']}/img")
        assert img.status_code == 200 and img.headers["content-type"].startswith("video/mp4")
        assert any(x["id"] == f["id"] for x in s.get(f"{API}/clientes/{cliente['id']}/fotos").json())

    def test_bad_type(self, s, cliente):
        r = s.post(f"{API}/clientes/{cliente['id']}/fotos", files={"file": ("a.txt", io.BytesIO(b"hi"), "text/plain")})
        assert r.status_code == 400


# ---- Config templates ----
class TestTemplates:
    def test_templates_persist_and_restore(self, s):
        orig = s.get(f"{API}/config").json()
        tpl = [{"id": "t1", "label": "TEST_lbl", "texto": "Oi {nome}"}]
        r = s.put(f"{API}/config", json={"templates": tpl})
        assert r.status_code == 200 and r.json()["templates"] == tpl
        assert s.get(f"{API}/config").json()["templates"] == tpl
        assert s.get(f"{API}/config").json()["tecnico"] == orig["tecnico"]
        s.put(f"{API}/config", json={"templates": orig.get("templates", [])})
        assert s.get(f"{API}/config").json()["templates"] == orig.get("templates", [])
