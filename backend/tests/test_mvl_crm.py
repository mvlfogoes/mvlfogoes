# MVL Fogões CRM backend regression: clientes, ordens, agendamentos, config, stats, relatorio, backup
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    ses = requests.Session()
    ses.headers.update({"Content-Type": "application/json"})
    return ses


@pytest.fixture(scope="module")
def cliente(s):
    r = s.post(f"{API}/clientes", json={"nome": "TEST_Cliente", "tel": "(32) 99999-0000", "end": "Rua Teste 1"})
    assert r.status_code == 200
    c = r.json()
    yield c
    s.delete(f"{API}/clientes/{c['id']}")


# Health
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200 and "MVL" in r.json()["message"]


# Clientes CRUD
class TestClientes:
    def test_create_get(self, s, cliente):
        assert cliente["nome"] == "TEST_Cliente" and isinstance(cliente["id"], str)
        lst = s.get(f"{API}/clientes").json()
        assert any(c["id"] == cliente["id"] for c in lst)
        assert all("_id" not in c for c in lst)

    def test_update_cascades_nome(self, s, cliente):
        ag = s.post(f"{API}/agendamentos", json={"cliId": cliente["id"], "nomeCli": "TEST_Cliente", "servico": "x"}).json()
        r = s.put(f"{API}/clientes/{cliente['id']}", json={"nome": "TEST_Cliente2", "tel": "123"})
        assert r.status_code == 200 and r.json()["nome"] == "TEST_Cliente2"
        lst = s.get(f"{API}/agendamentos").json()
        assert next(a for a in lst if a["id"] == ag["id"])["nomeCli"] == "TEST_Cliente2"
        s.delete(f"{API}/agendamentos/{ag['id']}")

    def test_update_404(self, s):
        assert s.put(f"{API}/clientes/nope", json={"nome": "x"}).status_code == 404

    def test_create_missing_nome_422(self, s):
        assert s.post(f"{API}/clientes", json={"tel": "1"}).status_code == 422

    def test_delete_cascade(self, s):
        c = s.post(f"{API}/clientes", json={"nome": "TEST_Del"}).json()
        o = s.post(f"{API}/ordens", json={"cliId": c["id"], "servico": "TEST_x"}).json()
        assert s.delete(f"{API}/clientes/{c['id']}").json()["ok"] is True
        assert not any(x["id"] == c["id"] for x in s.get(f"{API}/clientes").json())
        assert not any(x["id"] == o["id"] for x in s.get(f"{API}/ordens").json())


# Ordens CRUD + status
class TestOrdens:
    def test_crud(self, s, cliente):
        r = s.post(f"{API}/ordens", json={"cliId": cliente["id"], "nomeCli": "TEST", "servico": "TEST_Troca", "valor": 150.5, "garantia": 3, "data": "2026-01-10"})
        assert r.status_code == 200
        o = r.json()
        assert o["num"] >= 1001 and o["status"] == "pendente" and o["valor"] == 150.5
        o2 = s.post(f"{API}/ordens", json={"servico": "TEST_2"}).json()
        assert o2["num"] == o["num"] + 1
        u = s.put(f"{API}/ordens/{o['id']}", json={**o, "status": "concluida"})
        assert u.status_code == 200 and u.json()["status"] == "concluida" and u.json()["num"] == o["num"]
        got = next(x for x in s.get(f"{API}/ordens").json() if x["id"] == o["id"])
        assert got["status"] == "concluida"
        rel = s.get(f"{API}/relatorio", params={"mes": "2026-01"}).json()
        assert rel["visitas"] >= 1
        for x in (o, o2):
            assert s.delete(f"{API}/ordens/{x['id']}").status_code == 200
        assert not any(x["id"] == o["id"] for x in s.get(f"{API}/ordens").json())

    def test_update_404(self, s):
        assert s.put(f"{API}/ordens/nope", json={}).status_code == 404


# Agendamentos CRUD
class TestAgenda:
    def test_crud(self, s, cliente):
        r = s.post(f"{API}/agendamentos", json={"cliId": cliente["id"], "nomeCli": "TEST", "servico": "TEST_Visita", "tipo": "cooktop", "data": "2026-01-20", "hora": "14:00", "valor": 50})
        assert r.status_code == 200
        a = r.json()
        assert a["status"] == "agendado" and a["tipo"] == "cooktop" and a["valor"] == 50
        u = s.put(f"{API}/agendamentos/{a['id']}", json={**a, "status": "concluido", "hora": "15:00"})
        assert u.status_code == 200 and u.json()["status"] == "concluido"
        got = next(x for x in s.get(f"{API}/agendamentos").json() if x["id"] == a["id"])
        assert got["hora"] == "15:00"
        assert s.delete(f"{API}/agendamentos/{a['id']}").json()["ok"]
        assert not any(x["id"] == a["id"] for x in s.get(f"{API}/agendamentos").json())

    def test_update_404(self, s):
        assert s.put(f"{API}/agendamentos/nope", json={}).status_code == 404


# Config
class TestConfig:
    def test_get_put_restore(self, s):
        orig = s.get(f"{API}/config").json()
        assert {"tecnico", "telefone", "cidade", "slogan"} <= set(orig)
        r = s.put(f"{API}/config", json={"cidade": "TEST_Cidade"})
        assert r.status_code == 200 and r.json()["cidade"] == "TEST_Cidade"
        assert r.json()["telefone"] == orig["telefone"]
        assert s.get(f"{API}/config").json()["cidade"] == "TEST_Cidade"
        s.put(f"{API}/config", json={"cidade": orig["cidade"]})


# Stats / backup / midias
def test_stats(s):
    d = s.get(f"{API}/stats").json()
    for k in ["clientes", "os_total", "os_abertas", "ag_hoje"]:
        assert isinstance(d[k], int)


def test_backup(s):
    d = s.get(f"{API}/backup").json()
    assert isinstance(d["clientes"], list) and "config" in d


def test_midias_crud(s, cliente):
    m = s.post(f"{API}/midias", json={"cliId": cliente["id"], "dataUrl": "data:image/png;base64,AAA", "label": "TEST"}).json()
    assert any(x["id"] == m["id"] for x in s.get(f"{API}/midias", params={"cliId": cliente["id"]}).json())
    s.delete(f"{API}/midias/{m['id']}")


# Iteration 2: validation + timezone fixes
def test_create_empty_nome_422(s):
    r = s.post(f"{BASE_URL}/api/clientes", json={"nome": ""})
    assert r.status_code == 422


def test_stats_ag_hoje_uses_brt(s):
    from datetime import datetime, timezone, timedelta
    hoje = datetime.now(timezone(timedelta(hours=-3))).strftime("%Y-%m-%d")
    before = s.get(f"{BASE_URL}/api/stats").json()["ag_hoje"]
    r = s.post(f"{BASE_URL}/api/agendamentos", json={"nomeCli": "TEST_tz", "data": hoje, "hora": "10:00", "status": "agendado"})
    assert r.status_code in (200, 201)
    aid = r.json()["id"]
    try:
        after = s.get(f"{BASE_URL}/api/stats").json()["ag_hoje"]
        assert after == before + 1
    finally:
        s.delete(f"{BASE_URL}/api/agendamentos/{aid}")


# Whitespace-only nome validation (iteration_3)
def test_create_whitespace_nome_422(s):
    assert s.post(f"{API}/clientes", json={"nome": "   "}).status_code == 422


def test_update_whitespace_nome_422(s, cliente):
    assert s.put(f"{API}/clientes/{cliente['id']}", json={"nome": "   "}).status_code == 422


def test_nome_is_stripped(s):
    r = s.post(f"{API}/clientes", json={"nome": "  TEST_Strip  "})
    assert r.status_code == 200 and r.json()["nome"] == "TEST_Strip"
    s.delete(f"{API}/clientes/{r.json()['id']}")
