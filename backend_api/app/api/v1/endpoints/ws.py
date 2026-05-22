from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.api.v1.ws_manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/notifications")
async def ws_notifications(websocket: WebSocket) -> None:
    """
    Real-time notification channel.
    Clients connect and receive JSON push messages:
      { "type": "hotspot_new",  "data": { id, device_id, confidence_score, detected_at, snapshot_url } }
      { "type": "ping",         "ts": <iso-string> }
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; client may send "ping" frames
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
