import uvicorn
import os

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=int(os.getenv("PROPERTY_MANAGER_PORT", "8001")), reload=True)

