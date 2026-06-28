from __future__ import annotations

import os
import tempfile
from typing import List

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .parser_ifn import parse_ifn_pdf

app = FastAPI(title="HealthOps Parser API", version="7.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True, "service": "healthops-parser-api", "version": "7.0.0"}


@app.post("/parse-roster")
async def parse_roster(files: List[UploadFile] = File(...)):
    results = []
    for uploaded in files:
        suffix = os.path.splitext(uploaded.filename or "upload.pdf")[1] or ".pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await uploaded.read()
            tmp.write(content)
            tmp_path = tmp.name
        try:
            result = parse_ifn_pdf(tmp_path)
            result["filename"] = uploaded.filename
            results.append(result)
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass
    return {"files": results}
