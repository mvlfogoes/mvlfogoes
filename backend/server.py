from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import storage

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="MVL Fogões API")
api_router = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return str(uuid.uuid4())


# ---------------- Models ----------------
class Cliente(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    nome: str
    tel: str = ""
    wa: str = ""
    end: str = ""
    fogao: str = ""
    etiqueta: str = ""
    obs: str = ""
    criadoEm: str = Field(default_factory=now_iso)


class ClienteCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    nome: str = Field(min_length=1)
    tel: str = ""
    wa: str = ""
    end: str = ""
    fogao: str = ""
    etiqueta: str = ""
    obs: str = ""


class Ordem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    num: int = 0
    cliId: str = ""
    nomeCli: str = ""
    servico: str = ""
    problema: str = ""
    pecas: str = ""
    valor: float = 0.0
    garantia: int = 0  # meses
    data: str = ""
    hora: str = ""
    status: str = "pendente"  # pendente | concluida | garantia
    obs: str = ""
    criadoEm: str = Field(default_factory=now_iso)


class OrdemCreate(BaseModel):
    cliId: str = ""
    nomeCli: str = ""
    servico: str = ""
    problema: str = ""
    pecas: str = ""
    valor: float = 0.0
    garantia: int = 0
    data: str = ""
    hora: str = ""
    status: str = "pendente"
    obs: str = ""


class Agendamento(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    cliId: str = ""
    nomeCli: str = ""
    servico: str = ""
    tipo: str = ""  # fogao | cooktop | forno | outro
    data: str = ""
    hora: str = ""
    status: str = "agendado"  # agendado | concluido | cancelado
    valor: float = 0.0
    obs: str = ""
    criadoEm: str = Field(default_factory=now_iso)


class AgendamentoCreate(BaseModel):
    cliId: str = ""
    nomeCli: str = ""
    servico: str = ""
    tipo: str = ""
    data: str = ""
    hora: str = ""
    status: str = "agendado"
    valor: float = 0.0
    obs: str = ""


class Midia(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    cliId: str
    dataUrl: str
    label: str = ""
    tipo: str = "foto"  # foto | video
    ts: str = Field(default_factory=now_iso)


class MidiaCreate(BaseModel):
    cliId: str
    dataUrl: str
    label: str = ""
    tipo: str = "foto"


class Config(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "config"
    tecnico: str = "MVL Fogões"
    versao: str = "2.0"
    telefone: str = "(32) 98885-6030"
    cidade: str = "Bicas - MG"
    slogan: str = "A qualidade que dá confiança!"


class ConfigUpdate(BaseModel):
    tecnico: Optional[str] = None
    telefone: Optional[str] = None
    cidade: Optional[str] = None
    slogan: Optional[str] = None


# ---------------- Clientes ----------------
@api_router.get("/clientes", response_model=List[Cliente])
async def list_clientes():
    docs = await db.clientes.find({}, {"_id": 0}).sort("nome", 1).to_list(2000)
    return docs


@api_router.post("/clientes", response_model=Cliente)
async def create_cliente(payload: ClienteCreate):
    obj = Cliente(**payload.model_dump())
    await db.clientes.insert_one(obj.model_dump())
    return obj


@api_router.put("/clientes/{cid}", response_model=Cliente)
async def update_cliente(cid: str, payload: ClienteCreate):
    doc = await db.clientes.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Cliente não encontrado")
    doc.update(payload.model_dump())
    await db.clientes.update_one({"id": cid}, {"$set": payload.model_dump()})
    await db.ordens.update_many({"cliId": cid}, {"$set": {"nomeCli": payload.nome}})
    await db.agendamentos.update_many({"cliId": cid}, {"$set": {"nomeCli": payload.nome}})
    return Cliente(**doc)


@api_router.delete("/clientes/{cid}")
async def delete_cliente(cid: str):
    await db.clientes.delete_one({"id": cid})
    await db.ordens.delete_many({"cliId": cid})
    await db.agendamentos.delete_many({"cliId": cid})
    await db.midias.delete_many({"cliId": cid})
    return {"ok": True}


# ---------------- Ordens de Serviço ----------------
@api_router.get("/ordens", response_model=List[Ordem])
async def list_ordens():
    docs = await db.ordens.find({}, {"_id": 0}).sort("criadoEm", -1).to_list(5000)
    return docs


@api_router.post("/ordens", response_model=Ordem)
async def create_ordem(payload: OrdemCreate):
    last = await db.ordens.find_one({}, {"_id": 0, "num": 1}, sort=[("num", -1)])
    num = (last["num"] + 1) if last and last.get("num") else 1001
    obj = Ordem(**payload.model_dump(), num=num)
    await db.ordens.insert_one(obj.model_dump())
    return obj


@api_router.put("/ordens/{oid}", response_model=Ordem)
async def update_ordem(oid: str, payload: OrdemCreate):
    doc = await db.ordens.find_one({"id": oid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "OS não encontrada")
    await db.ordens.update_one({"id": oid}, {"$set": payload.model_dump()})
    doc.update(payload.model_dump())
    return Ordem(**doc)


@api_router.delete("/ordens/{oid}")
async def delete_ordem(oid: str):
    await db.ordens.delete_one({"id": oid})
    return {"ok": True}


# ---------------- Agendamentos ----------------
@api_router.get("/agendamentos", response_model=List[Agendamento])
async def list_agendamentos():
    docs = await db.agendamentos.find({}, {"_id": 0}).sort("data", 1).to_list(5000)
    return docs


@api_router.post("/agendamentos", response_model=Agendamento)
async def create_agendamento(payload: AgendamentoCreate):
    obj = Agendamento(**payload.model_dump())
    await db.agendamentos.insert_one(obj.model_dump())
    return obj


@api_router.put("/agendamentos/{aid}", response_model=Agendamento)
async def update_agendamento(aid: str, payload: AgendamentoCreate):
    doc = await db.agendamentos.find_one({"id": aid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Agendamento não encontrado")
    await db.agendamentos.update_one({"id": aid}, {"$set": payload.model_dump()})
    doc.update(payload.model_dump())
    return Agendamento(**doc)


@api_router.delete("/agendamentos/{aid}")
async def delete_agendamento(aid: str):
    await db.agendamentos.delete_one({"id": aid})
    return {"ok": True}


# ---------------- Mídias ----------------
@api_router.get("/midias", response_model=List[Midia])
async def list_midias(cliId: Optional[str] = None):
    q = {"cliId": cliId} if cliId else {}
    docs = await db.midias.find(q, {"_id": 0}).sort("ts", -1).to_list(5000)
    return docs


@api_router.post("/midias", response_model=Midia)
async def create_midia(payload: MidiaCreate):
    obj = Midia(**payload.model_dump())
    await db.midias.insert_one(obj.model_dump())
    return obj


@api_router.delete("/midias/{mid}")
async def delete_midia(mid: str):
    await db.midias.delete_one({"id": mid})
    return {"ok": True}


# ---------------- Fotos do fogão ----------------
IMG_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic"}
MAX_BYTES = 12 * 1024 * 1024


async def _store(folder: str, file: UploadFile):
    ct = file.content_type or ""
    if ct not in IMG_TYPES:
        raise HTTPException(400, "Envie uma imagem (jpg, png ou webp)")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "Imagem muito grande")
    path = f"{storage.APP_NAME}/{folder}/{new_id()}.{IMG_TYPES[ct]}"
    res = await run_in_threadpool(storage.put_object, path, data, ct)
    return res["path"], ct


async def _serve(col, fid: str):
    doc = await db[col].find_one({"id": fid, "is_deleted": False}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Arquivo não encontrado")
    data, _ = await run_in_threadpool(storage.get_object, doc["path"])
    return Response(content=data, media_type=doc["content_type"], headers={"Cache-Control": "public, max-age=31536000, immutable"})


@api_router.get("/clientes/{cid}/fotos")
async def list_fotos(cid: str):
    return await db.fotos.find({"cliId": cid, "is_deleted": False}, {"_id": 0, "path": 0}).sort("ts", 1).to_list(500)


@api_router.post("/clientes/{cid}/fotos")
async def upload_foto(cid: str, file: UploadFile = File(...)):
    path, ct = await _store(f"fotos/{cid}", file)
    doc = {"id": new_id(), "cliId": cid, "path": path, "content_type": ct, "is_deleted": False, "ts": now_iso()}
    await db.fotos.insert_one(dict(doc))
    doc.pop("path")
    return doc


@api_router.get("/fotos/{fid}/img")
async def foto_img(fid: str):
    return await _serve("fotos", fid)


@api_router.delete("/fotos/{fid}")
async def delete_foto(fid: str):
    await db.fotos.update_one({"id": fid}, {"$set": {"is_deleted": True}})
    return {"ok": True}


# ---------------- Documentos (flyers guardados) ----------------
DOC_TIPOS = {"agenda", "orcamento", "recibo"}


@api_router.get("/documentos")
async def list_documentos(cliId: Optional[str] = None):
    q = {"is_deleted": False}
    if cliId:
        q["cliId"] = cliId
    return await db.documentos.find(q, {"_id": 0, "path": 0}).sort("ts", -1).to_list(2000)


@api_router.post("/documentos")
async def create_documento(file: UploadFile = File(...), tipo: str = Form(...), cliId: str = Form(""), nomeCli: str = Form(""), resumo: str = Form(""), dados: str = Form("{}")):
    if tipo not in DOC_TIPOS:
        raise HTTPException(400, "Tipo inválido")
    try:
        dados_obj = json.loads(dados)
    except ValueError:
        raise HTTPException(400, "Dados inválidos")
    path, ct = await _store(f"documentos/{tipo}", file)
    doc = {"id": new_id(), "tipo": tipo, "cliId": cliId, "nomeCli": nomeCli, "resumo": resumo, "dados": dados_obj,
           "path": path, "content_type": ct, "is_deleted": False, "ts": now_iso()}
    await db.documentos.insert_one(dict(doc))
    doc.pop("path")
    return doc


@api_router.get("/documentos/{did}/img")
async def documento_img(did: str):
    return await _serve("documentos", did)


@api_router.delete("/documentos/{did}")
async def delete_documento(did: str):
    await db.documentos.update_one({"id": did}, {"$set": {"is_deleted": True}})
    return {"ok": True}


# ---------------- Config ----------------
@api_router.get("/config", response_model=Config)
async def get_config():
    doc = await db.config.find_one({"id": "config"}, {"_id": 0})
    if not doc:
        cfg = Config()
        await db.config.insert_one(cfg.model_dump())
        return cfg
    return Config(**doc)


@api_router.put("/config", response_model=Config)
async def update_config(payload: ConfigUpdate):
    doc = await db.config.find_one({"id": "config"}, {"_id": 0}) or Config().model_dump()
    upd = {k: v for k, v in payload.model_dump().items() if v is not None}
    doc.update(upd)
    await db.config.update_one({"id": "config"}, {"$set": doc}, upsert=True)
    return Config(**doc)


# ---------------- Stats / Dashboard ----------------
@api_router.get("/stats")
async def get_stats():
    clientes = await db.clientes.count_documents({})
    midias = await db.midias.count_documents({})
    os_total = await db.ordens.count_documents({})
    os_abertas = await db.ordens.count_documents({"status": "pendente"})
    os_concluidas = await db.ordens.count_documents({"status": "concluida"})
    ag_total = await db.agendamentos.count_documents({})
    hoje = datetime.now(timezone(timedelta(hours=-3))).strftime("%Y-%m-%d")
    ag_hoje = await db.agendamentos.count_documents({"data": hoje, "status": "agendado"})
    return {
        "clientes": clientes,
        "midias": midias,
        "os_total": os_total,
        "os_abertas": os_abertas,
        "os_concluidas": os_concluidas,
        "ag_total": ag_total,
        "ag_hoje": ag_hoje,
    }


# ---------------- Relatório mensal ----------------
@api_router.get("/relatorio")
async def relatorio(mes: str):
    ordens = await db.ordens.find({"data": {"$regex": f"^{mes}"}}, {"_id": 0}).to_list(5000)
    total_valor = sum(float(o.get("valor") or 0) for o in ordens)
    concluidas = [o for o in ordens if o.get("status") == "concluida"]
    clientes_ids = set(o.get("cliId") for o in ordens if o.get("cliId"))
    return {
        "mes": mes,
        "visitas": len(ordens),
        "concluidas": len(concluidas),
        "clientes_atendidos": len(clientes_ids),
        "valor_recebido": round(total_valor, 2),
        "ordens": ordens,
    }


# ---------------- Backup ----------------
@api_router.get("/backup")
async def backup():
    return {
        "clientes": await db.clientes.find({}, {"_id": 0}).to_list(10000),
        "ordens": await db.ordens.find({}, {"_id": 0}).to_list(10000),
        "agendamentos": await db.agendamentos.find({}, {"_id": 0}).to_list(10000),
        "midias": await db.midias.find({}, {"_id": 0}).to_list(10000),
        "config": await db.config.find_one({"id": "config"}, {"_id": 0}),
        "exportadoEm": now_iso(),
    }


@api_router.post("/restore")
async def restore(data: dict):
    for col in ["clientes", "ordens", "agendamentos", "midias"]:
        items = data.get(col)
        if isinstance(items, list) and items:
            await db[col].delete_many({})
            for it in items:
                it.pop("_id", None)
            await db[col].insert_many(items)
    if data.get("config"):
        cfg = data["config"]
        cfg.pop("_id", None)
        cfg["id"] = "config"
        await db.config.update_one({"id": "config"}, {"$set": cfg}, upsert=True)
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"message": "MVL Fogões API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_storage():
    try:
        await run_in_threadpool(storage.init_storage)
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
