from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from engine import RiskEngine

app = FastAPI(title="Credit Risk System API")

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Engine
risk_engine = RiskEngine()

@app.post("/api/predict")
async def predict_risk(request: Request):
    data = await request.json()
    result = risk_engine.predict_risk(data)
    return {"status": "success", "data": result}

@app.post("/api/simulate")
async def simulate_risk(request: Request):
    payload = await request.json()
    customer = payload.get("customer", {})
    modifications = payload.get("modifications", {})
    modified_customer = {**customer, **modifications}
    result = risk_engine.predict_risk(modified_customer)
    return {"status": "success", "data": result}

# Mount static files safely
base_dir = os.path.dirname(os.path.abspath(__file__))

app.mount("/js", StaticFiles(directory=os.path.join(base_dir, "js")), name="js")
app.mount("/css", StaticFiles(directory=os.path.join(base_dir, "css")), name="css")
app.mount("/img", StaticFiles(directory=os.path.join(base_dir, "img")), name="img")
app.mount("/data", StaticFiles(directory=os.path.join(base_dir, "data")), name="data")

@app.get("/{full_path:path}")
async def serve_index(full_path: str):
    # Serve the main SPA file
    return FileResponse(os.path.join(base_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
